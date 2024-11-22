import { TokenService } from "../utils/token.js";
import { createErrorResponse } from "../utils/response.js";

/**
 * Middleware to protect routes and validate JWT tokens.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
export const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json(createErrorResponse(401, "Authentication required"));
    }

    const token = authHeader.split(" ")[1];
    const decoded = TokenService().verifyToken(token, process.env.JWT_SECRET);

    req.user = decoded; // Attach user data to the request object
    next();
  } catch (error) {
    return res
      .status(401)
      .json(createErrorResponse(401, "Invalid or expired token"));
  }
};

/**
 * Middleware to restrict access to admin-only routes.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
export const admin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res
      .status(403)
      .json(createErrorResponse(403, "Admin access required"));
  }
  next();
};
