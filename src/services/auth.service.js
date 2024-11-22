import bcrypt from "bcryptjs";
import crypto from "crypto";
import { TokenService } from "../utils/token.js";

/**
 * Factory function to create the authentication service.
 *
 * @param {Object} dbAdapter - Database adapter for user-related operations.
 * @param {Object} emailAdapter - Email adapter for sending emails.
 * @param {Object} config - Configuration object for the service.
 * @param {string} config.jwtSecret - Secret key for signing JWT access tokens.
 * @param {string} config.refreshTokenSecret - Secret key for signing refresh tokens.
 * @param {string} config.accessTokenExpiry - Access token expiration time.
 * @param {string} config.refreshTokenExpiry - Refresh token expiration time.
 * @param {Object} config.emailConfig - Configuration for email service.
 * @returns {Object} Authentication service with methods for various auth operations.
 */
export const createAuthService = (dbAdapter, emailAdapter, config) => {
  /**
   * Registers a new user and sends a verification email.
   *
   * @param {string} name - Name of the user.
   * @param {string} email - Email of the user.
   * @param {string} password - Plaintext password of the user.
   * @returns {Object} The newly created user object.
   * @throws {Error} If the email is already registered.
   */
  const register = async (name, email, password) => {
    const existingUser = await dbAdapter.findUserByEmail(email);
    if (existingUser) throw new Error("Email already registered");

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await dbAdapter.createUser({
      name,
      email,
      password: hashedPassword,
      verificationToken,
      isVerified: false,
      role: "user",
    });

    await emailAdapter.sendVerificationEmail(email, verificationToken);
    return user;
  };

  /**
   * Authenticates a user and generates tokens.
   *
   * @param {string} email - Email of the user.
   * @param {string} password - Plaintext password of the user.
   * @returns {Object} Object containing user details, access token, and refresh token.
   * @throws {Error} If the credentials are invalid or the user is not verified.
   */
  const login = async (email, password) => {
    const user = await dbAdapter.findUserByEmail(email);
    if (!user) throw new Error("Invalid credentials");
    if (!user.isVerified)
      throw new Error("Please verify your email before logging in");

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new Error("Invalid credentials");

    const tokenPayload = { userId: user.id, role: user.role };
    const tokenService = TokenService(config);

    return {
      user: { ...user, password: undefined },
      accessToken: tokenService.generateAccessToken(tokenPayload),
      refreshToken: tokenService.generateRefreshToken(tokenPayload),
    };
  };

  /**
   * Verifies a user's email using a token.
   *
   * @param {string} token - Email verification token.
   * @throws {Error} If the token is invalid.
   */
  const verifyEmail = async (token) => {
    const user = await dbAdapter.findUserByVerificationToken(token);
    if (!user) throw new Error("Invalid verification token");

    await dbAdapter.updateUser(user.id, {
      isVerified: true,
      verificationToken: undefined,
    });
  };

  /**
   * Initiates a password reset by sending a reset email.
   *
   * @param {string} email - Email of the user.
   * @throws {Error} If the user is not found.
   */
  const forgotPassword = async (email) => {
    const user = await dbAdapter.findUserByEmail(email);
    if (!user) throw new Error("User not found");

    const resetToken = crypto.randomBytes(32).toString("hex");
    await dbAdapter.updateUser(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: new Date(Date.now() + 3600000), // 1 hour
    });

    await emailAdapter.sendPasswordResetEmail(email, resetToken);
  };

  /**
   * Resets a user's password using a reset token.
   *
   * @param {string} token - Password reset token.
   * @param {string} newPassword - New plaintext password for the user.
   * @throws {Error} If the token is invalid or expired.
   */
  const resetPassword = async (token, newPassword) => {
    const user = await dbAdapter.findUserByResetToken(token, new Date());
    if (!user) throw new Error("Invalid or expired reset token");

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await dbAdapter.updateUser(user.id, {
      password: hashedPassword,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    });
  };

  /**
   * Refreshes the access token using a refresh token.
   *
   * @param {string} refreshToken - Refresh token.
   * @returns {string} New access token.
   * @throws {Error} If the token is invalid or the user does not exist.
   */
  const refreshToken = async (refreshToken) => {
    const decoded = TokenService(config).verifyRefreshToken(refreshToken);
    const user = await dbAdapter.findUserById(decoded.userId);
    if (!user) throw new Error("User not found");

    return TokenService(config).generateAccessToken({
      userId: user.id,
      role: user.role,
    });
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
