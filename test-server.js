import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { authRouter } from "./src/routes/auth.routes.js";
import mongoose from "mongoose";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/auth", authRouter);

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Auth server is running!" });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log("\nTest endpoints:");
      console.log("1. Register: POST http://localhost:5000/auth/register");
      console.log(
        '   Body: { "name": "Test User", "email": "test@example.com", "password": "password123" }'
      );
      console.log("\n2. Login: POST http://localhost:5000/auth/login");
      console.log(
        '   Body: { "email": "test@example.com", "password": "password123" }'
      );
      console.log("\n3. Session Check: GET http://localhost:5000/auth/session");
      console.log("   (Requires auth cookies from login)");
      console.log(
        "\n4. Refresh Token: POST http://localhost:5000/auth/refresh-token"
      );
      console.log("   (Requires refresh token cookie)");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
