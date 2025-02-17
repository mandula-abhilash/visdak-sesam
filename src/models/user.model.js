import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";

/**
 * Mongoose schema for the User collection.
 *
 * @property {String} name - The full name of the user (required).
 * @property {String} email - The email address of the user (required, unique).
 * @property {String} password - The hashed password of the user (required, not selected by default).
 * @property {String} role - The role of the user (default: "user").
 * @property {String} additionalFields - Allows storing any extra fields as an object
 * @property {Boolean} isVerified - Indicates if the user's email is verified (default: false).
 * @property {Boolean} hasReceivedWelcomeBonus - Indicates if the user has received their welcome bonus (default: false).
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
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false,
    },
    role: {
      type: String,
      default: "user",
    },
    additionalFields: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    hasReceivedWelcomeBonus: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    lastVerificationEmailSent: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
    collection: "vd_sesam_users",
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password; // Remove password field when converting to JSON
        delete ret.verificationToken; // Optionally remove sensitive fields
        delete ret.passwordResetToken;
        return ret;
      },
    },
  }
);

/**
 * Middleware to hash the password before saving the document.
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Only hash if password is modified
  this.password = await bcrypt.hash(this.password, 10); // Hash password
  next();
});

/**
 * Instance method to compare passwords.
 *
 * @param {String} candidatePassword - The plain text password to compare.
 * @returns {Promise<Boolean>} - True if passwords match, false otherwise.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Mongoose model for the User schema.
 */
export const UserModel = model("User", userSchema);
