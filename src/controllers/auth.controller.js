import bcrypt from "bcryptjs";
import { UserModel } from "../models/user.model.js";
import { emailService } from "../services/email.service.js";
import { generateTokens, verifyToken } from "../utils/token.utils.js";
import { setAuthCookies, clearAuthCookies } from "../utils/cookie.utils.js";
import crypto from "crypto";

const VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const EMAIL_COOLDOWN = 15 * 60 * 1000; // 15 minutes

// Register controller
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await UserModel.findOne({ email });

    // If user exists but is not verified
    if (existingUser && !existingUser.isVerified) {
      // Check if we should send a new verification email
      const canSendNewEmail =
        !existingUser.lastVerificationEmailSent ||
        Date.now() - existingUser.lastVerificationEmailSent.getTime() >
          EMAIL_COOLDOWN;

      if (!canSendNewEmail) {
        const timeLeft = Math.ceil(
          (EMAIL_COOLDOWN -
            (Date.now() - existingUser.lastVerificationEmailSent.getTime())) /
            60000
        );
        const minuteText = timeLeft === 1 ? "minute" : "minutes";
        return res.status(400).json({
          status: "error",
          error: {
            code: 400,
            details: `Verification already initiated. Please check your email or try again in ${timeLeft} ${minuteText}.`,
          },
        });
      }

      const verificationToken = crypto.randomBytes(32).toString("hex");

      await UserModel.findByIdAndUpdate(existingUser._id, {
        name,
        password,
        verificationToken,
        verificationTokenExpires: new Date(
          Date.now() + VERIFICATION_TOKEN_EXPIRY
        ),
        lastVerificationEmailSent: new Date(),
      });

      await emailService.sendVerificationEmail(email, verificationToken, name);

      return res.status(200).json({
        status: "success",
        data: { email },
        message:
          "A new verification email has been sent. Please verify your email to continue.",
      });
    }

    // If user exists and is verified
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        status: "error",
        error: { code: 400, details: "Email already registered and verified" },
      });
    }

    // Create new user
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await UserModel.create({
      name,
      email,
      password,
      verificationToken,
      verificationTokenExpires: new Date(
        Date.now() + VERIFICATION_TOKEN_EXPIRY
      ),
      lastVerificationEmailSent: new Date(),
      isVerified: false,
      role: "user",
    });

    await emailService.sendVerificationEmail(email, verificationToken, name);

    res.status(201).json({
      status: "success",
      data: { email: user.email },
      message: "Registration successful. Please verify your email.",
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      error: { code: 400, details: error.message },
    });
  }
};

// Login controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        status: "error",
        error: { code: 401, details: "Invalid email or password" },
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        error: { code: 401, details: "Invalid email or password" },
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        status: "error",
        error: { code: 401, details: "Please verify your email first" },
      });
    }

    const tokenPayload = { userId: user._id, role: user.role };
    const { accessToken, refreshToken } = generateTokens(tokenPayload);

    // Set HTTP-only cookies
    setAuthCookies(res, accessToken, refreshToken);

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({
      status: "success",
      data: { user: userWithoutPassword },
    });
  } catch (error) {
    res.status(401).json({
      status: "error",
      error: { code: 401, details: error.message },
    });
  }
};

// Verify Email controller
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const user = await UserModel.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          details:
            "Invalid or expired verification token. Please request a new verification email.",
        },
      });
    }

    await UserModel.findByIdAndUpdate(user._id, {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
      lastVerificationEmailSent: null,
    });

    res.json({
      status: "success",
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      error: { code: 400, details: error.message },
    });
  }
};

// Forgot Password controller
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: "error",
        error: { code: 404, details: "No user found with this email" },
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    await UserModel.findByIdAndUpdate(user._id, {
      passwordResetToken: resetToken,
      passwordResetExpires: new Date(Date.now() + 3600000), // 1 hour
    });

    await emailService.sendPasswordResetEmail(email, resetToken);

    res.json({
      status: "success",
      message: "Password reset email sent",
    });
  } catch (error) {
    res.status(404).json({
      status: "error",
      error: { code: 404, details: error.message },
    });
  }
};

// Reset Password controller
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await UserModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        error: { code: 400, details: "Invalid or expired reset token" },
      });
    }

    await UserModel.findByIdAndUpdate(user._id, {
      password,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    res.json({
      status: "success",
      message: "Password reset successfully",
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      error: { code: 400, details: error.message },
    });
  }
};

// Refresh Token controller
export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({
        status: "error",
        error: { code: 401, details: "Refresh token not found" },
      });
    }

    const decoded = verifyToken(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await UserModel.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        status: "error",
        error: { code: 401, details: "User not found" },
      });
    }

    const tokenPayload = { userId: user._id, role: user.role };
    const { accessToken, refreshToken: newRefreshToken } =
      generateTokens(tokenPayload);

    // Set new HTTP-only cookies
    setAuthCookies(res, accessToken, newRefreshToken);

    res.json({
      status: "success",
      message: "Tokens refreshed successfully",
    });
  } catch (error) {
    res.status(401).json({
      status: "error",
      error: { code: 401, details: error.message },
    });
  }
};

// Logout controller
export const logout = async (req, res) => {
  clearAuthCookies(res);

  res.json({
    status: "success",
    message: "Logged out successfully",
  });
};

export const session = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        status: "error",
        error: { code: 404, details: "User not found" },
      });
    }

    res.json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: { code: 500, details: error.message },
    });
  }
};
