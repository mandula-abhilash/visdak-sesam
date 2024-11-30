/**
 * Cookie configuration for different environments
 */
export const getCookieConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    domain: isProduction ? ".visdak.com" : undefined,
    path: "/",
  };
};

/**
 * Sets authentication cookies in the response
 * @param {Object} res - Express response object
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 */
export const setAuthCookies = (res, accessToken, refreshToken) => {
  const cookieConfig = getCookieConfig();

  res.cookie("accessToken", accessToken, {
    ...cookieConfig,
    maxAge: parseInt(process.env.ACCESS_TOKEN_EXPIRY * 1000), // 15 minutes in milliseconds
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieConfig,
    maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRY * 1000), // 7 days in milliseconds
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
