import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { authRouter } from "./routes/auth.routes.js";
import { protect, admin } from "./middleware/auth.middleware.js";

export const createAuthModule = async () => {
  // Validate required environment variables
  const requiredEnvVars = [
    "MONGODB_URI",
    "JWT_SECRET",
    "REFRESH_TOKEN_SECRET",
    "ACCESS_TOKEN_EXPIRY",
    "REFRESH_TOKEN_EXPIRY",
    "AWS_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "SES_EMAIL_FROM",
    "APP_URL",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );
  if (missingVars.length > 0) {
    throw new Error(
      `SESAM : Missing required environment variables: ${missingVars.join(
        ", "
      )}`
    );
  }

  console.log("SESAM : Environment variables loaded successfully!");

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
