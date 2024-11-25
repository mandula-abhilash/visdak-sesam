import { Router } from "express";
import {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  refreshToken,
} from "../controllers/auth.controller.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from "../schemas/auth.schema.js";

const router = Router();

/**
 * @route POST /auth/register
 * @description Registers a new user.
 * @access Public
 * @body {string} name - User's full name.
 * @body {string} email - User's email address.
 * @body {string} password - User's password.
 * @returns {object} 201 - User registered successfully.
 * @returns {object} 400 - Validation error.
 */
router.post("/register", validateRequest(registerSchema), register);

/**
 * @route POST /auth/login
 * @description Logs in a user and returns access and refresh tokens.
 * @access Public
 * @body {string} email - User's email address.
 * @body {string} password - User's password.
 * @returns {object} 200 - Access and refresh tokens.
 * @returns {object} 401 - Invalid credentials.
 */
router.post("/login", validateRequest(loginSchema), login);

/**
 * @route GET /auth/verify-email
 * @description Verifies a user's email using a verification token.
 * @access Public
 * @query {string} token - Email verification token.
 * @returns {object} 200 - Email verified successfully.
 * @returns {object} 400 - Invalid or expired token.
 */
router.get("/verify-email", verifyEmail);

/**
 * @route POST /auth/forgot-password
 * @description Sends a password reset email to the user.
 * @access Public
 * @body {string} email - User's email address.
 * @returns {object} 200 - Password reset email sent.
 * @returns {object} 404 - User not found.
 */
router.post(
  "/forgot-password",
  validateRequest(forgotPasswordSchema),
  forgotPassword
);

/**
 * @route POST /auth/reset-password
 * @description Resets the user's password using a reset token.
 * @access Public
 * @body {string} token - Password reset token.
 * @body {string} newPassword - New password for the user.
 * @returns {object} 200 - Password reset successfully.
 * @returns {object} 400 - Invalid or expired reset token.
 */
router.post(
  "/reset-password",
  validateRequest(resetPasswordSchema),
  resetPassword
);

/**
 * @route POST /auth/refresh-token
 * @description Refreshes an expired access token using a refresh token.
 * @access Public
 * @body {string} refreshToken - Refresh token.
 * @returns {object} 200 - New access token.
 * @returns {object} 401 - Invalid or expired refresh token.
 */
router.post(
  "/refresh-token",
  validateRequest(refreshTokenSchema),
  refreshToken
);

/**
 * Export the router for use in the main application.
 */
export const authRouter = router;
