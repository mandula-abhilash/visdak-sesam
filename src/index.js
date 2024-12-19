import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { authRouter } from "./routes/auth.routes.js";
import { protect, admin } from "./middleware/auth.middleware.js";

/**
 * Validate required environment variables
 * @throws {Error} If any required variable is missing
 */
const validateEnvVariables = () => {
  const requiredVariables = [
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

  requiredVariables.forEach((variable) => {
    if (!process.env[variable]) {
      throw new Error(
        `SESAM : Missing required environment variable: ${variable}`
      );
    }
  });
};

// Validate environment variables on module load
validateEnvVariables();

/**
 * Connect to MongoDB
 * @throws {Error} If MongoDB connection fails
 */
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("SESAM : Connected to MongoDB successfully!");
  } catch (error) {
    console.error("SESAM : MongoDB connection error:", error.message);
    process.exit(1);
  }
};

// Establish MongoDB connection on module load
connectToMongoDB();

/**
 * Exports all the routes and middleware in one place
 * @returns {Object} - Object containing router and middleware
 */
const visdakSesamModule = () => ({
  authRoutes: authRouter,
  middleware: { protect, admin },
});

// Log success message for debugging (optional)
console.log(
  "SESAM : Environment variables and MongoDB connection initialized successfully!"
);

export default visdakSesamModule;

// Export user model for external usage
export * from "./models/user.model.js";
