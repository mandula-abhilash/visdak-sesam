import { Router } from "express";
import { validateRequest } from "../middleware/validation.middleware.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from "../schemas/auth.schema.js";
import {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  refreshToken,
} from "../controllers/auth.controller.js";

const router = Router();

// Auth routes
router.post("/register", validateRequest(registerSchema), register);
router.post("/login", validateRequest(loginSchema), login);
router.get("/verify-email", verifyEmail);
router.post(
  "/forgot-password",
  validateRequest(forgotPasswordSchema),
  forgotPassword
);
router.post(
  "/reset-password",
  validateRequest(resetPasswordSchema),
  resetPassword
);
router.post(
  "/refresh-token",
  validateRequest(refreshTokenSchema),
  refreshToken
);

export const authRouter = router;
