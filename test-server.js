import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { authRouter } from "./src/routes/auth.routes.js";
import db from "./db/knex.js";

dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["X-Token-Expiry"], // Expose the custom header
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/auth", authRouter);

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Auth server is running with PostgreSQL!" });
});

// Connect to PostgreSQL and start server
const startServer = async () => {
  try {
    // Test the connection
    await db.raw("SELECT 1");
    console.log("Connected to PostgreSQL");

    // Run pending migrations
    await db.migrate.latest();
    console.log("Database migrations completed");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log("\nTest endpoints:");
      console.log("1. Register: POST http://localhost:5000/auth/register");
      console.log(
        '   Body: { "name": "Test User", "email": "test@example.com", "password": "password123", "additionalFields": { "company": "Test Corp", "phone": "+1234567890" } }'
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
      console.log(
        "\nDatabase: PostgreSQL with flexible additional_fields support"
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
