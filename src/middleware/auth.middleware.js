import { createErrorResponse } from "../utils/response.js";

/**
 * Factory function to create the protect middleware.
 *
 * @param {Object} tokenService - Token service instance for token operations.
 * @returns {Function} Middleware function to protect routes.
 */
export const createProtectMiddleware = (tokenService) => (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json(createErrorResponse(401, "Authentication required"));
    }

    const token = authHeader.split(" ")[1];
    const decoded = tokenService.verifyToken(token, process.env.JWT_SECRET);

    req.user = decoded; // Attach user data to the request object
    next();
  } catch (error) {
    return res
      .status(401)
      .json(createErrorResponse(401, "Invalid or expired token"));
  }
};

/**
 * Factory function to create the admin middleware.
 *
 * @returns {Function} Middleware function to restrict access to admin-only routes.
 */
export const createAdminMiddleware = () => (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res
      .status(403)
      .json(createErrorResponse(403, "Admin access required"));
  }
  next();
};
