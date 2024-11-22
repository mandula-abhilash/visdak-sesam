import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
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
 */
router.post("/register", validateRequest(registerSchema), register);

/**
 * @route POST /auth/login
 * @description Logs in a user and returns access and refresh tokens.
 * @access Public
 */
router.post("/login", validateRequest(loginSchema), login);

/**
 * @route GET /auth/verify-email
 * @description Verifies a user's email using a verification token.
 * @access Public
 */
router.get("/verify-email", verifyEmail);

/**
 * @route POST /auth/forgot-password
 * @description Sends a password reset email to the user.
 * @access Public
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
