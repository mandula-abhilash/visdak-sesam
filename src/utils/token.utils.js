import jwt from "jsonwebtoken";
import ms from "ms";

/**
 * Generates JWT tokens (access and refresh)
 * @param {Object} payload - Data to be encoded in the token
 * @returns {Object} Object containing both tokens
 */
export const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });

  // For initial login, create a refresh token with the full window and original issuance time
  const refreshToken = jwt.sign(
    {
      ...payload,
      originalIat: Math.floor(Date.now() / 1000),
      exp:
        Math.floor(Date.now() / 1000) +
        Math.floor(ms(process.env.REFRESH_TOKEN_EXPIRY) / 1000),
    },
    process.env.REFRESH_TOKEN_SECRET
  );

  return { accessToken, refreshToken };
};

/**
 * Generates a new refresh token based on the refresh mode
 * @param {Object} payload - Token payload
 * @param {number} originalIat - Original issuance time
 * @param {boolean} slidingRefresh - Whether to use sliding refresh
 * @returns {Object} New tokens
 */
export const regenerateTokens = (
  payload,
  originalIat,
  slidingRefresh = true
) => {
  const accessToken = jwt.sign(
    { userId: payload.userId, role: payload.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );

  let refreshToken;
  const maxRefreshLifetime = Math.floor(
    ms(process.env.REFRESH_TOKEN_EXPIRY) / 1000
  );

  if (slidingRefresh) {
    // Sliding refresh: create new refresh token with full expiry window
    refreshToken = jwt.sign(
      {
        ...payload,
        originalIat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + maxRefreshLifetime,
      },
      process.env.REFRESH_TOKEN_SECRET
    );
  } else {
    // Non-sliding refresh: maintain original window
    const tokenAge = Math.floor(Date.now() / 1000) - originalIat;
    const remainingTime = maxRefreshLifetime - tokenAge;

    if (remainingTime <= 0) {
      throw new Error("Refresh token maximum lifetime exceeded");
    }

    refreshToken = jwt.sign(
      {
        ...payload,
        originalIat,
        exp: originalIat + maxRefreshLifetime,
      },
      process.env.REFRESH_TOKEN_SECRET
    );
  }

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
  return req.cookies?.accessToken || null;
};
