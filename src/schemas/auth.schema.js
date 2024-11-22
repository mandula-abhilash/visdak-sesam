import { z } from "zod";

/**
 * @schema registerSchema
 * @description Validates the request body for user registration.
 * @fields
 * - `name` (string): Must be at least 2 characters long.
 * - `email` (string): Must be a valid email address.
 * - `password` (string): Must be at least 8 characters long.
 */
export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters long."),
    email: z.string().email("Please provide a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters long."),
  }),
});

/**
 * @schema loginSchema
 * @description Validates the request body for user login.
 * @fields
 * - `email` (string): Must be a valid email address.
 * - `password` (string): Cannot be empty.
 */
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Please provide a valid email address."),
    password: z.string().min(1, "Password cannot be empty."),
  }),
});

/**
 * @schema forgotPasswordSchema
 * @description Validates the request body for forgot password.
 * @fields
 * - `email` (string): Must be a valid email address.
 */
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Please provide a valid email address."),
  }),
});

/**
 * @schema resetPasswordSchema
 * @description Validates the request body for resetting the user's password.
 * @fields
 * - `token` (string): Cannot be empty.
 * - `newPassword` (string): Must be at least 8 characters long.
 */
export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Reset token cannot be empty."),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long."),
  }),
});

/**
 * @schema refreshTokenSchema
 * @description Validates the request body for refreshing an access token.
 * @fields
 * - `refreshToken` (string): Cannot be empty.
 */
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token cannot be empty."),
  }),
});
