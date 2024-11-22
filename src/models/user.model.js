import { Schema, model } from "mongoose";

/**
 * Mongoose schema for the User collection.
 *
 * @property {String} name - The full name of the user (required).
 * @property {String} email - The email address of the user (required, unique).
 * @property {String} password - The hashed password of the user (required, not selected by default).
 * @property {String} role - The role of the user, either "user" or "admin" (default: "user").
 * @property {Boolean} isVerified - Indicates if the user's email is verified (default: false).
 * @property {String} verificationToken - Token for email verification.
 * @property {String} passwordResetToken - Token for resetting the password.
 * @property {Date} passwordResetExpires - Expiry time for the password reset token.
 * @property {Date} createdAt - Timestamp for when the user was created.
 * @property {Date} updatedAt - Timestamp for when the user was last updated.
 */
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "users", // Name of the MongoDB collection
  }
);

/**
 * Mongoose model for the User schema.
 */
export const UserModel = model("User", userSchema);
