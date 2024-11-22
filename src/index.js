import { Router } from "express";
import { createAuthService } from "./services/auth.service.js";
import { createMongooseAdapter } from "./adapters/mongoose.adapter.js";
import { createSESAdapter } from "./adapters/ses.adapter.js";
import { createAuthController } from "./controllers/auth.controller.js";
import { createAuthMiddleware } from "./middleware/auth.middleware.js";
import { createTokenService } from "./utils/token.js";

/**
 * Initializes the authentication module.
 *
 * @param {Object} config - Configuration for the module.
 * @param {string} config.MONGODB_URI - MongoDB connection URI.
 * @param {string} config.JWT_SECRET - JWT Secret Key.
 * @param {string} config.REFRESH_TOKEN_SECRET - Refresh Token Secret Key.
 * @param {string} config.accessTokenExpiry - Access token expiration time.
 * @param {string} config.refreshTokenExpiry - Refresh token expiration time.
 * @param {Object} config.emailConfig - Email configuration.
 * @param {string} config.emailConfig.provider - Email provider (currently supports 'ses').
 * @param {string} config.emailConfig.from - Default "from" email address.
 * @param {Object} config.emailConfig.credentials - AWS SES credentials.
 * @param {string} config.appUrl - Base URL for application (used in email links).
 *
 * @returns {Object} - Returns the router, middleware, and auth service.
 */
export const createAuthModule = (config) => {
  // Initialize database adapter
  const dbAdapter = createMongooseAdapter(config.MONGODB_URI);

  // Initialize email adapter
  if (config.emailConfig.provider !== "ses") {
    throw new Error(
      'Unsupported email provider. Only "ses" is currently supported.'
    );
  }
  const emailAdapter = createSESAdapter(config);

  // Initialize token service
  const tokenService = createTokenService(config);

  // Initialize core services
  const authService = createAuthService(dbAdapter, emailAdapter, tokenService);
  const authController = createAuthController(authService);
  const { protect, admin } = createAuthMiddleware(tokenService);

  // Define and set up routes
  const router = Router();
  router.post("/register", authController.register);
  router.post("/login", authController.login);
  router.get("/verify-email", authController.verifyEmail);
  router.post("/forgot-password", authController.forgotPassword);
  router.post("/reset-password", authController.resetPassword);
  router.post("/refresh-token", authController.refreshToken);

  return {
    router,
    middleware: {
      protect,
      admin,
    },
    service: authService,
  };
};

// Export adapters and other utilities for external use
export * from "./adapters/mongoose.adapter.js";
export * from "./adapters/ses.adapter.js";
