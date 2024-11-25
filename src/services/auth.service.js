import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Factory function to create the authentication service.
 *
 * @param {Object} dbAdapter - Database adapter for user-related operations.
 * @param {Object} emailAdapter - Email adapter for sending emails.
 * @param {Object} tokenService - Token service instance for token operations.
 * @returns {Object} Authentication service with methods for various auth operations.
 */
export const createAuthService = (dbAdapter, emailAdapter, tokenService) => {
  const hashPassword = async (password) => bcrypt.hash(password, 10);
  const generateRandomToken = () => crypto.randomBytes(32).toString("hex");

  const register = async (name, email, password) => {
    const existingUser = await dbAdapter.findUserByEmail(email);
    if (existingUser) throw new Error("Email already registered.");

    const hashedPassword = await hashPassword(password);
    const verificationToken = generateRandomToken();

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

  const login = async (email, password) => {
    const user = await dbAdapter.findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error("Invalid email or password.");
    }
    if (!user.isVerified) throw new Error("Please verify your email first.");

    const tokenPayload = { userId: user.id, role: user.role };
    return {
      user,
      accessToken: tokenService.generateAccessToken(tokenPayload),
      refreshToken: tokenService.generateRefreshToken(tokenPayload),
    };
  };

  const verifyEmail = async (token) => {
    const user = await dbAdapter.findUserByVerificationToken(token);
    if (!user) throw new Error("Invalid or expired verification token.");

    await dbAdapter.updateUser(user.id, {
      isVerified: true,
      verificationToken: null,
    });
  };

  const forgotPassword = async (email) => {
    const user = await dbAdapter.findUserByEmail(email);
    if (!user) throw new Error("No user found with this email.");

    const resetToken = generateRandomToken();
    await dbAdapter.updateUser(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: new Date(Date.now() + 3600000), // 1 hour
    });

    await emailAdapter.sendPasswordResetEmail(email, resetToken);
  };

  const resetPassword = async (token, newPassword) => {
    const user = await dbAdapter.findUserByResetToken(token, new Date());
    if (!user) throw new Error("Invalid or expired reset token.");

    const hashedPassword = await hashPassword(newPassword);
    await dbAdapter.updateUser(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  };

  const refreshToken = async (refreshToken) => {
    const decoded = tokenService.verifyRefreshToken(refreshToken);
    const user = await dbAdapter.findUserById(decoded.userId);
    if (!user) throw new Error("User not found.");

    return tokenService.generateAccessToken({
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
