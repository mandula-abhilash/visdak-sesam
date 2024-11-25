import express from "express";
import dotenv from "dotenv";
import { createAuthModule } from "./src/index.js";
import morgan from "morgan";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  "MONGODB_URI",
  "JWT_SECRET",
  "REFRESH_TOKEN_SECRET",
  "SES_EMAIL_FROM",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "APP_URL",
];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

const app = express();
app.use(express.json());

// Logging requests
app.use(morgan("dev"));

// Configuration for the authentication module
const authConfig = {
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  accessTokenExpiry: "15m",
  refreshTokenExpiry: "7d",
  emailConfig: {
    provider: "ses",
    from: process.env.SES_EMAIL_FROM,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  },
  appUrl: process.env.APP_URL, // Base URL for email links
};

// Initialize the auth module
const initAuthModule = async () => {
  try {
    const { router: authRouter, middleware } = await createAuthModule(
      authConfig
    );

    // Use the auth router
    app.use("/auth", authRouter);

    // Example of a protected route
    app.get("/protected", middleware.protect, (req, res) => {
      res.json({ message: "This is a protected route.", user: req.user });
    });

    // Example of an admin-only route
    app.get("/admin", middleware.protect, middleware.admin, (req, res) => {
      res.json({ message: "This is an admin-only route.", user: req.user });
    });

    console.log("Authentication module initialized.");
  } catch (error) {
    console.error("Error initializing authentication module:", error.message);
    process.exit(1);
  }
};

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

// Start the server
const startServer = async () => {
  await initAuthModule();

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
