import { Router } from "express";
import { createAuthService } from "./services/auth.service.js";
import { createMongooseAdapter } from "./adapters/mongoose.adapter.js";
import { createSESAdapter } from "./adapters/ses.adapter.js";
import { createAuthController } from "./controllers/auth.controller.js";
import {
  createProtectMiddleware,
  createAdminMiddleware,
} from "./middleware/auth.middleware.js";
import { createTokenService } from "./utils/token.js";

/**
 * Initializes the authentication module.
 *
 * @param {Object} config - Configuration for the module.
 * @param {string} config.MONGODB_URI - MongoDB connection URI (required).
 * @param {string} config.JWT_SECRET - JWT Secret Key (required).
 * @param {string} config.REFRESH_TOKEN_SECRET - Refresh Token Secret Key (required).
 * @param {string} config.accessTokenExpiry - Access token expiration time (default: '15m').
 * @param {string} config.refreshTokenExpiry - Refresh token expiration time (default: '7d').
 * @param {Object} config.emailConfig - Email configuration (required).
 * @param {string} config.emailConfig.provider - Email provider (default: 'ses').
 * @param {string} config.emailConfig.from - Default "from" email address (required).
 * @param {Object} config.emailConfig.credentials - AWS SES credentials (required for SES).
 * @param {string} config.appUrl - Base URL for the application (required for email links).
 *
 * @returns {Object} - Returns the router, middleware, and auth service.
 */
export const createAuthModule = async (config) => {
  // Validate required configuration
  const requiredParams = [
    "MONGODB_URI",
    "JWT_SECRET",
    "REFRESH_TOKEN_SECRET",
    "emailConfig",
    "emailConfig.provider",
    "emailConfig.from",
    "appUrl",
  ];
  requiredParams.forEach((param) => {
    if (!param.split(".").reduce((obj, key) => obj && obj[key], config)) {
      throw new Error(`Missing required configuration parameter: ${param}`);
    }
  });

  // Initialize database adapter
  const dbAdapter = await createMongooseAdapter(config.MONGODB_URI);

  // Initialize email adapter
  let emailAdapter;
  switch (config.emailConfig.provider) {
    case "ses":
      emailAdapter = createSESAdapter(config);
      break;
    default:
      console.error(
        `Unsupported email provider: ${config.emailConfig.provider}`
      );
      throw new Error(
        `Unsupported email provider. Currently, only "ses" is supported.`
      );
  }

  // Initialize token service
  const tokenService = createTokenService(config);

  // Initialize core services and middleware
  const authService = createAuthService(dbAdapter, emailAdapter, tokenService);
  const authController = createAuthController(authService);
  const protect = createProtectMiddleware(tokenService);
  const admin = createAdminMiddleware();

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
