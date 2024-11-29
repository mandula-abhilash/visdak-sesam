import { verifyToken, extractToken } from "../utils/token.utils.js";

// Protect Middleware
export const protect = (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        status: "error",
        error: { code: 401, details: "Authentication required" },
      });
    }

    const decoded = verifyToken(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      status: "error",
      error: { code: 401, details: "Invalid or expired token" },
    });
  }
};

// Admin Middleware
export const admin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      status: "error",
      error: { code: 403, details: "Admin access required" },
    });
  }
  next();
};
