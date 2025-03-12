import ms from "ms";
import jwt from "jsonwebtoken";

/**
 * Cookie configuration for different environments
 */
export const getCookieConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    domain: isProduction ? process.env.COOKIE_DOMAIN : undefined,
    path: "/",
  };
};

/**
 * Sets authentication cookies in the response
 * @param {Object} res - Express response object
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 * @param {number|null} remainingTime - Remaining time in seconds for non-sliding refresh tokens
 */
export const setAuthCookies = (
  res,
  accessToken,
  refreshToken,
  remainingTime = null
) => {
  // Get base cookie config
  const cookieConfig = getCookieConfig();

  // For access token, use the expiry from environment variable directly
  // This is safer than trying to extract it from the token
  const accessExpiryMs = ms(process.env.ACCESS_TOKEN_EXPIRY);

  // For refresh token, use either the remaining time or the full expiry
  let refreshExpiryMs;
  if (remainingTime !== null && remainingTime > 0) {
    // Use the provided remaining time for non-sliding tokens
    refreshExpiryMs = remainingTime * 1000; // Convert seconds to milliseconds
  } else {
    // Use the full expiry for sliding tokens or if no remaining time is provided
    refreshExpiryMs = ms(process.env.REFRESH_TOKEN_EXPIRY);
  }

  // Ensure we never have negative expiry times
  if (accessExpiryMs <= 0) accessExpiryMs = 60 * 1000; // Default to 1 minute
  if (refreshExpiryMs <= 0) refreshExpiryMs = 24 * 60 * 60 * 1000; // Default to 1 day

  // Set cookies with the correct expiry times
  res.cookie("accessToken", accessToken, {
    ...cookieConfig,
    maxAge: accessExpiryMs,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieConfig,
    maxAge: refreshExpiryMs,
  });
};

/**
 * Clears authentication cookies
 * @param {Object} res - Express response object
 */
export const clearAuthCookies = (res) => {
  const cookieConfig = getCookieConfig();

  res.clearCookie("accessToken", cookieConfig);
  res.clearCookie("refreshToken", cookieConfig);
};
