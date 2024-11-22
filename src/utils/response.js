/**
 * Creates a success response object.
 *
 * @param {any} [data=null] - The data to include in the response.
 * @param {string} [message=""] - A message describing the success.
 * @returns {Object} Success response object.
 */
export const createSuccessResponse = (data = null, message = "") => ({
  status: "success",
  data,
  message,
});

/**
 * Creates an error response object.
 *
 * @param {number} code - HTTP status code representing the error type.
 * @param {string} [details=""] - A message providing additional details about the error.
 * @returns {Object} Error response object.
 */
export const createErrorResponse = (code, details = "") => ({
  status: "error",
  error: {
    code,
    details,
  },
});
