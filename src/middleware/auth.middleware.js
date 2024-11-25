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

    // Check if the authorization header is present and properly formatted
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json(createErrorResponse(401, "Authentication required"));
    }

    const token = authHeader.split(" ")[1];
    const decoded = tokenService.verifyToken(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res
        .status(401)
        .json(createErrorResponse(401, "Invalid or expired token"));
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("Protect Middleware Error:", error.message);
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
  try {
    // Check if the user role is 'admin'
    if (req.user?.role !== "admin") {
      return res
        .status(403)
        .json(createErrorResponse(403, "Admin access required"));
    }

    next();
  } catch (error) {
    console.error("Admin Middleware Error:", error.message);
    return res
      .status(500)
      .json(
        createErrorResponse(
          500,
          "An error occurred while checking admin access"
        )
      );
  }
};
