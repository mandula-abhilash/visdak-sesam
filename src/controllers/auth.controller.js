import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  createSuccessResponse,
  createErrorResponse,
} from "../utils/response.js";

/**
 * Creates the Auth Controller.
 *
 * @param {Object} dependencies - The dependencies for the controller.
 * @param {Object} dependencies.dbAdapter - Database adapter for user operations.
 * @param {Object} dependencies.emailAdapter - Email adapter for sending emails.
 * @param {Object} dependencies.tokenService - Token service for handling tokens.
 * @returns {Object} - The Auth Controller with all route handlers.
 */
export const createAuthController = ({
  dbAdapter,
  emailAdapter,
  tokenService,
}) => {
  /**
   * Handles user registration.
   *
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  const register = async (req, res) => {
    try {
      const { name, email, password } = req.body;

      const existingUser = await dbAdapter.findUserByEmail(email);
      if (existingUser) {
        return res
          .status(400)
          .json(createErrorResponse(400, "Email already registered"));
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationToken = crypto.randomBytes(32).toString("hex");

      const user = await dbAdapter.createUser({
        name,
        email,
        password: hashedPassword,
        verificationToken,
      });

      await emailAdapter.sendVerificationEmail(email, verificationToken);

      return res
        .status(201)
        .json(
          createSuccessResponse(
            { email: user.email },
            "Registration successful. Please verify your email."
          )
        );
    } catch (error) {
      console.error("Registration Error:", error);
      return res
        .status(500)
        .json(createErrorResponse(500, "Registration failed"));
    }
  };

  /**
   * Handles user login.
   *
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  const login = async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await dbAdapter.findUserByEmail(email);
      if (!user) {
        return res
          .status(401)
          .json(createErrorResponse(401, "Invalid credentials"));
      }

      if (!user.isVerified) {
        return res
          .status(401)
          .json(createErrorResponse(401, "Please verify your email."));
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res
          .status(401)
          .json(createErrorResponse(401, "Invalid credentials"));
      }

      const tokenPayload = { userId: user.id, role: user.role };
      const accessToken = tokenService.generateAccessToken(tokenPayload);
      const refreshToken = tokenService.generateRefreshToken(tokenPayload);

      const { password: _, ...userWithoutPassword } = user;

      return res.json(
        createSuccessResponse({
          accessToken,
          refreshToken,
          user: userWithoutPassword,
        })
      );
    } catch (error) {
      console.error("Login Error:", error);
      return res.status(500).json(createErrorResponse(500, "Login failed"));
    }
  };

  /**
   * Verifies the user's email.
   *
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  const verifyEmail = async (req, res) => {
    try {
      const { token } = req.query;

      const user = await dbAdapter.findUserByVerificationToken(token);
      if (!user) {
        return res
          .status(400)
          .json(createErrorResponse(400, "Invalid verification token"));
      }

      await dbAdapter.updateUser(user.id, {
        isVerified: true,
        verificationToken: undefined,
      });

      return res.json(
        createSuccessResponse(null, "Email verified successfully")
      );
    } catch (error) {
      console.error("Verify Email Error:", error);
      return res
        .status(500)
        .json(createErrorResponse(500, "Email verification failed"));
    }
  };

  /**
   * Handles forgot password requests.
   *
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  const forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;

      const user = await dbAdapter.findUserByEmail(email);
      if (!user) {
        return res.status(404).json(createErrorResponse(404, "User not found"));
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
      await dbAdapter.updateUser(user.id, user);

      await emailAdapter.sendPasswordResetEmail(email, resetToken);

      return res.json(createSuccessResponse(null, "Password reset email sent"));
    } catch (error) {
      console.error("Forgot Password Error:", error);
      return res
        .status(500)
        .json(createErrorResponse(500, "Failed to send password reset email"));
    }
  };

  /**
   * Handles password reset requests.
   *
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  const resetPassword = async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      const user = await dbAdapter.findUserByResetToken(token, new Date());
      if (!user) {
        return res
          .status(400)
          .json(createErrorResponse(400, "Invalid or expired reset token"));
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await dbAdapter.updateUser(user.id, user);

      return res.json(createSuccessResponse(null, "Password reset successful"));
    } catch (error) {
      console.error("Reset Password Error:", error);
      return res
        .status(500)
        .json(createErrorResponse(500, "Password reset failed"));
    }
  };

  /**
   * Refreshes the user's access token.
   *
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  const refreshToken = async (req, res) => {
    try {
      const { refreshToken } = req.body;

      const decoded = tokenService.verifyRefreshToken(refreshToken);

      const user = await dbAdapter.findUserById(decoded.userId);
      if (!user) {
        return res.status(404).json(createErrorResponse(404, "User not found"));
      }

      const tokenPayload = { userId: user.id, role: user.role };
      const accessToken = tokenService.generateAccessToken(tokenPayload);

      return res.json(createSuccessResponse({ accessToken }));
    } catch (error) {
      console.error("Refresh Token Error:", error);
      return res
        .status(401)
        .json(createErrorResponse(401, "Invalid refresh token"));
    }
  };

  return {
    register,
    login,
    verifyEmail,
    forgotPassword,
    resetPassword,
    refreshToken,
  };
};
