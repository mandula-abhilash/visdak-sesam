import jwt from "jsonwebtoken";

// Protect Middleware
export const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        error: { code: 401, details: "Authentication required" },
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
