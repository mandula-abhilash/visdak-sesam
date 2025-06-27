import dotenv from "dotenv";
dotenv.config();

import db from "./db/knex.js";
import { authRouter } from "./routes/auth.routes.js";
import { protect, admin } from "./middleware/auth.middleware.js";
import { emailService } from "./services/email.service.js";

/**
 * Validate required environment variables
 * @throws {Error} If any required variable is missing
 */
const validateEnvVariables = () => {
  const requiredVariables = [
    "PG_HOST",
    "PG_PORT",
    "PG_USER",
    "PG_PASSWORD",
    "PG_DATABASE",
    "JWT_SECRET",
    "REFRESH_TOKEN_SECRET",
    "ACCESS_TOKEN_EXPIRY",
    "REFRESH_TOKEN_EXPIRY",
    "USE_SLIDING_REFRESH",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "SES_EMAIL_FROM",
    "AWS_REGION",
    "APP_URL",
    "CLIENT_URL",
    "PORT",
    "NODE_ENV",
    "COOKIE_DOMAIN",
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
 * Connect to PostgreSQL and run migrations
 * @throws {Error} If PostgreSQL connection fails
 */
const connectToPostgreSQL = async () => {
  try {
    // Test the connection
    await db.raw("SELECT 1");
    console.log("SESAM : Connected to PostgreSQL successfully!");

    // Run pending migrations
    await db.migrate.latest();
    console.log("SESAM : Database migrations completed successfully!");
  } catch (error) {
    console.error(
      "SESAM : PostgreSQL connection or migration error:",
      error.message
    );
    process.exit(1);
  }
};

// Establish PostgreSQL connection and run migrations on module load
connectToPostgreSQL();

/**
 * Exports all the routes, middleware and configuration methods
 * @returns {Object} - Object containing router, middleware and configuration methods
 */
const visdakSesamModule = () => ({
  authRoutes: authRouter,
  middleware: { protect, admin },
  config: {
    setEmailTemplates: emailService.setTemplates,
  },
});

console.log(
  "SESAM : Environment variables and PostgreSQL connection initialized successfully!"
);

export default visdakSesamModule;

// Export user repository for external usage
export { UserRepository } from "./db/user.repository.js";
