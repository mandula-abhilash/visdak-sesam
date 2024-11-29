import jwt from "jsonwebtoken";

/**
 * Generates JWT tokens (access and refresh)
 * @param {Object} payload - Data to be encoded in the token
 * @returns {Object} Object containing both tokens
 */
export const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m",
  });

  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d",
  });

  return { accessToken, refreshToken };
};

/**
 * Verifies a JWT token
 * @param {string} token - Token to verify
 * @param {string} secret - Secret key to use for verification
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

/**
 * Extracts token from cookie or authorization header
 * @param {Object} req - Express request object
 * @returns {string|null} Extracted token or null
 */
export const extractToken = (req) => {
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return null;
};
