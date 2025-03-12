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
  const cookieConfig = getCookieConfig();

  // Parse the access token to get its expiry
  const accessExpiry = jwt.decode(accessToken).exp;
  const accessExpiryMs = accessExpiry * 1000 - Date.now();

  // For the refresh token, use the provided remainingTime if available
  const refreshExpiryMs =
    remainingTime !== null
      ? remainingTime * 1000 // Convert seconds to milliseconds
      : ms(process.env.REFRESH_TOKEN_EXPIRY);

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
