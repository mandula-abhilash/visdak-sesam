import { z } from "zod";

/**
 * Reusable validation rules for common fields.
 */
const emailValidation = z
  .string()
  .email("Please provide a valid email address.");
const passwordValidation = z
  .string()
  .min(8, "Password must be at least 8 characters long.");
const nonEmptyString = z.string().min(1, "This field cannot be empty.");

/**
 * @schema registerSchema
 * @description Validates the request body for user registration.
 * @body
 * - `name` (string): Must be at least 2 characters long.
 * - `email` (string): Must be a valid email address.
 * - `password` (string): Must be at least 8 characters long.
 */
export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters long."),
    email: emailValidation,
    password: passwordValidation,
  }),
});

/**
 * @schema loginSchema
 * @description Validates the request body for user login.
 * @body
 * - `email` (string): Must be a valid email address.
 * - `password` (string): Cannot be empty.
 */
export const loginSchema = z.object({
  body: z.object({
    email: emailValidation,
    password: nonEmptyString,
  }),
});

/**
 * @schema forgotPasswordSchema
 * @description Validates the request body for forgot password.
 * @body
 * - `email` (string): Must be a valid email address.
 */
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailValidation,
  }),
});

/**
 * @schema resetPasswordSchema
 * @description Validates the request body for resetting the user's password.
 * @body
 * - `token` (string): Cannot be empty.
 * - `newPassword` (string): Must be at least 8 characters long.
 */
export const resetPasswordSchema = z.object({
  body: z.object({
    token: nonEmptyString,
    newPassword: passwordValidation,
  }),
});

/**
 * @schema refreshTokenSchema
 * @description Validates the request body for refreshing an access token.
 * @body
 * - `refreshToken` (string): Cannot be empty.
 */
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: nonEmptyString,
  }),
});
