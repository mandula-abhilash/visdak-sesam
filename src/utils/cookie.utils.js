/**
 * Cookie configuration for different environments
 */
export const getCookieConfig = () => ({
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  path: "/",
});

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
    maxAge: parseInt(process.env.ACCESS_TOKEN_EXPIRY_MS || 15 * 60 * 1000), // 15 minutes in milliseconds
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieConfig,
    maxAge: parseInt(
      process.env.REFRESH_TOKEN_EXPIRY_MS || 7 * 24 * 60 * 60 * 1000
    ), // 7 days in milliseconds
  });
};

/**
 * Clears authentication cookies
 * @param {Object} res - Express response object
 */
export const clearAuthCookies = (res) => {
  const cookieConfig = getCookieConfig();

  res.cookie("accessToken", "", {
    ...cookieConfig,
    maxAge: 0,
  });

  res.cookie("refreshToken", "", {
    ...cookieConfig,
    maxAge: 0,
  });
};
