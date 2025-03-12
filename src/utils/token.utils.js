import jwt from "jsonwebtoken";

// Helper function to parse time strings like "7d", "1h", "30m" into seconds
const parseTimeString = (timeString) => {
  const units = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
    w: 7 * 24 * 60 * 60,
  };

  const match = timeString.match(/^(\d+)([smhdw])$/);
  if (!match) {
    // Default fallback
    return 7 * 24 * 60 * 60; // 7 days in seconds
  }

  const [, value, unit] = match;
  return parseInt(value) * units[unit];
};

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
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
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
  if (slidingRefresh) {
    // Sliding refresh: create new refresh token with full expiry window
    refreshToken = jwt.sign(
      { ...payload, originalIat: Math.floor(Date.now() / 1000) },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
  } else {
    // Non-sliding refresh: maintain original window
    const maxRefreshLifetime = parseTimeString(
      process.env.REFRESH_TOKEN_EXPIRY
    );
    const tokenAge = Math.floor(Date.now() / 1000) - originalIat;
    const remainingTime = maxRefreshLifetime - tokenAge;

    if (remainingTime <= 0) {
      throw new Error("Refresh token maximum lifetime exceeded");
    }

    refreshToken = jwt.sign(
      { ...payload, originalIat },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: `${remainingTime}s` }
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
