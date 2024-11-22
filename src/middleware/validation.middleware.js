import { createErrorResponse } from "../utils/response.js";

/**
 * Middleware to validate requests using Zod schemas.
 *
 * @param {Object} schema - Zod schema for validation.
 * @returns {Function} Middleware function for request validation.
 */
export const validateRequest = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    return res
      .status(400)
      .json(
        createErrorResponse(
          400,
          error.errors[0]?.message || "Validation failed"
        )
      );
  }
};
