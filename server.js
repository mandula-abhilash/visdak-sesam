import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import { createAuthModule } from "./src/index.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(morgan("dev"));

// Auth module configuration
const authConfig = {
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  emailConfig: {
    provider: "ses",
    from: process.env.SES_EMAIL_FROM,
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  },
  appUrl: process.env.APP_URL,
};

// Initialize auth module
const initServer = async () => {
  try {
    const { router: authRouter, middleware } = await createAuthModule(
      authConfig
    );

    // Mount auth routes
    app.use("/auth", authRouter);

    // Test protected route
    app.get("/protected", middleware.protect, (req, res) => {
      res.json({
        status: "success",
        message: "Protected route accessed successfully",
        user: req.user,
      });
    });

    // Test admin route
    app.get("/admin", middleware.protect, middleware.admin, (req, res) => {
      res.json({
        status: "success",
        message: "Admin route accessed successfully",
        user: req.user,
      });
    });

    // Global error handler
    app.use((err, req, res, next) => {
      console.error("Error:", err);
      res.status(err.status || 500).json({
        status: "error",
        error: {
          code: err.status || 500,
          details: err.message || "Internal server error",
        },
      });
    });

    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log("Available routes:");
      console.log("  POST   /auth/register");
      console.log("  POST   /auth/login");
      console.log("  GET    /auth/verify-email");
      console.log("  POST   /auth/forgot-password");
      console.log("  POST   /auth/reset-password");
      console.log("  POST   /auth/refresh-token");
      console.log("  GET    /protected");
      console.log("  GET    /admin");
    });
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
};

initServer();
