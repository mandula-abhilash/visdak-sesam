import mongoose from "mongoose";
import { authRouter } from "./routes/auth.routes.js";
import { protect, admin } from "./middleware/auth.middleware.js";

export const createAuthModule = async (config) => {
  // Validate config
  const requiredParams = [
    "MONGODB_URI",
    "JWT_SECRET",
    "REFRESH_TOKEN_SECRET",
    "ACCESS_TOKEN_EXPIRY",
    "REFRESH_TOKEN_EXPIRY",
    "emailConfig",
    "appUrl",
  ];
  requiredParams.forEach((param) => {
    if (!param.split(".").reduce((obj, key) => obj && obj[key], config)) {
      throw new Error(`Missing required configuration parameter: ${param}`);
    }
  });

  // Set environment variables from config
  process.env.MONGODB_URI = config.MONGODB_URI;

  process.env.JWT_SECRET = config.JWT_SECRET;
  process.env.REFRESH_TOKEN_SECRET = config.REFRESH_TOKEN_SECRET;
  process.env.ACCESS_TOKEN_EXPIRY = config.ACCESS_TOKEN_EXPIRY;
  process.env.REFRESH_TOKEN_EXPIRY = config.REFRESH_TOKEN_EXPIRY;

  process.env.AWS_REGION = config.emailConfig.region;
  process.env.AWS_ACCESS_KEY_ID = config.emailConfig.credentials.accessKeyId;
  process.env.AWS_SECRET_ACCESS_KEY =
    config.emailConfig.credentials.secretAccessKey;
  process.env.SES_EMAIL_FROM = config.emailConfig.from;

  process.env.APP_URL = config.appUrl;

  // Connect to MongoDB
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }

  return {
    router: authRouter,
    middleware: { protect, admin },
  };
};

export * from "./models/user.model.js";
