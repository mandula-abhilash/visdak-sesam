import {
  createSuccessResponse,
  createErrorResponse,
} from "../utils/response.js";

/**
 * Factory function to create the authentication controller.
 *
 * @param {Object} authService - Authentication service instance.
 * @returns {Object} Authentication controller with route handlers.
 */
export const createAuthController = (authService) => {
  const register = async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const user = await authService.register(name, email, password);
      res
        .status(201)
        .json(
          createSuccessResponse(
            { email: user.email },
            "User registered successfully."
          )
        );
    } catch (error) {
      res.status(400).json(createErrorResponse(400, error.message));
    }
  };

  const login = async (req, res) => {
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await authService.login(
        email,
        password
      );
      const { password: _, ...userWithoutPassword } = user.toObject();

      res.json(
        createSuccessResponse({
          user: userWithoutPassword,
          accessToken,
          refreshToken,
        })
      );
    } catch (error) {
      res.status(401).json(createErrorResponse(401, error.message));
    }
  };

  const verifyEmail = async (req, res) => {
    try {
      const { token } = req.query;
      await authService.verifyEmail(token);
      res.json(createSuccessResponse(null, "Email verified successfully."));
    } catch (error) {
      res.status(400).json(createErrorResponse(400, error.message));
    }
  };

  const forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;
      await authService.forgotPassword(email);
      res.json(createSuccessResponse(null, "Password reset email sent."));
    } catch (error) {
      res.status(404).json(createErrorResponse(404, error.message));
    }
  };

  const resetPassword = async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      await authService.resetPassword(token, newPassword);
      res.json(createSuccessResponse(null, "Password reset successfully."));
    } catch (error) {
      res.status(400).json(createErrorResponse(400, error.message));
    }
  };

  const refreshToken = async (req, res) => {
    try {
      const { refreshToken } = req.body;
      const newAccessToken = await authService.refreshToken(refreshToken);
      res.json(createSuccessResponse({ accessToken: newAccessToken }));
    } catch (error) {
      res.status(401).json(createErrorResponse(401, error.message));
    }
  };

  return {
    register,
    login,
    verifyEmail,
    forgotPassword,
    resetPassword,
    refreshToken,
  };
};
