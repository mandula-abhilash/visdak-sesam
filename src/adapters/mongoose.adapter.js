import mongoose from "mongoose";
import { UserModel } from "../models/user.model.js";

/**
 * Factory function to create a Mongoose adapter for database operations.
 *
 * @param {string} mongoUri - MongoDB connection URI.
 * @returns {Object} - Mongoose adapter with database functions.
 */
export const createMongooseAdapter = (mongoUri) => {
  // Connect to MongoDB
  mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  /**
   * Finds a user by email.
   *
   * @param {string} email - User's email address.
   * @returns {Promise<Object|null>} - User object or null if not found.
   */
  const findUserByEmail = async (email) => {
    return UserModel.findOne({ email }).select("+password");
  };

  /**
   * Finds a user by ID.
   *
   * @param {string} id - User ID.
   * @returns {Promise<Object|null>} - User object or null if not found.
   */
  const findUserById = async (id) => {
    return UserModel.findById(id);
  };

  /**
   * Creates a new user.
   *
   * @param {Object} userData - User data for creating a new user.
   * @returns {Promise<Object>} - Created user object.
   */
  const createUser = async (userData) => {
    return UserModel.create(userData);
  };

  /**
   * Updates an existing user by ID.
   *
   * @param {string} id - User ID.
   * @param {Object} updates - Update fields and values.
   * @returns {Promise<Object|null>} - Updated user object or null if not found.
   */
  const updateUser = async (id, updates) => {
    return UserModel.findByIdAndUpdate(id, updates, { new: true });
  };

  /**
   * Finds a user by verification token.
   *
   * @param {string} token - Verification token.
   * @returns {Promise<Object|null>} - User object or null if not found.
   */
  const findUserByVerificationToken = async (token) => {
    return UserModel.findOne({ verificationToken: token });
  };

  /**
   * Finds a user by reset token and checks if the token is not expired.
   *
   * @param {string} token - Reset token.
   * @param {Date} expiryDate - Current date for token expiration check.
   * @returns {Promise<Object|null>} - User object or null if not found.
   */
  const findUserByResetToken = async (token, expiryDate) => {
    return UserModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: expiryDate },
    });
  };

  return {
    findUserByEmail,
    findUserById,
    createUser,
    updateUser,
    findUserByVerificationToken,
    findUserByResetToken,
  };
};
