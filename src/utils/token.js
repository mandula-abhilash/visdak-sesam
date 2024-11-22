import jwt from "jsonwebtoken";

/**
 * Factory function to create the token service.
 *
 * @param {Object} config - Configuration object for the token service.
 * @param {string} config.JWT_SECRET - Secret key for signing access tokens.
 * @param {string} config.REFRESH_TOKEN_SECRET - Secret key for signing refresh tokens.
 * @returns {Object} Token service with methods for generating and verifying tokens.
 */
export const createTokenService = (config) => {
  const ACCESS_TOKEN_EXPIRY = "15m";
  const REFRESH_TOKEN_EXPIRY = "7d";

  /**
   * Generates an access token.
   *
   * @param {Object} payload - Payload to include in the access token.
   * @returns {string} Signed access token.
   */
  const generateAccessToken = (payload) =>
    jwt.sign(payload, config.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });

  /**
   * Generates a refresh token.
   *
   * @param {Object} payload - Payload to include in the refresh token.
   * @returns {string} Signed refresh token.
   */
  const generateRefreshToken = (payload) =>
    jwt.sign(payload, config.REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });

  /**
   * Verifies a token.
   *
   * @param {string} token - The token to verify.
   * @param {string} secret - Secret key to use for verification.
   * @returns {Object} Decoded token payload.
   * @throws {Error} If the token is invalid or expired.
   */
  const verifyToken = (token, secret) => jwt.verify(token, secret);

  return {
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
  };
};
