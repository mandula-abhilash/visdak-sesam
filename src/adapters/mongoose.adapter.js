import mongoose from "mongoose";
import { UserModel } from "../models/user.model.js";

/**
 * Factory function to create a Mongoose adapter for database operations.
 *
 * @param {string} mongoUri - MongoDB connection URI.
 * @returns {Object} - Mongoose adapter with database functions.
 */
export const createMongooseAdapter = async (mongoUri) => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully.");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    throw new Error("Failed to connect to MongoDB");
  }

  /**
   * Finds a user by email.
   *
   * @param {string} email - User's email address.
   * @returns {Promise<Object|null>} - User object or null if not found.
   */
  const findUserByEmail = async (email) => {
    try {
      return await UserModel.findOne({ email }).select("+password");
    } catch (error) {
      console.error("Error finding user by email:", error.message);
      throw error;
    }
  };

  /**
   * Finds a user by ID.
   *
   * @param {string} id - User ID.
   * @returns {Promise<Object|null>} - User object or null if not found.
   */
  const findUserById = async (id) => {
    try {
      return await UserModel.findById(id);
    } catch (error) {
      console.error("Error finding user by ID:", error.message);
      throw error;
    }
  };

  /**
   * Creates a new user.
   *
   * @param {Object} userData - User data for creating a new user.
   * @returns {Promise<Object>} - Created user object.
   */
  const createUser = async (userData) => {
    try {
      return await UserModel.create(userData);
    } catch (error) {
      console.error("Error creating user:", error.message);
      throw error;
    }
  };

  /**
   * Updates an existing user by ID.
   *
   * @param {string} id - User ID.
   * @param {Object} updates - Update fields and values.
   * @returns {Promise<Object|null>} - Updated user object or null if not found.
   */
  const updateUser = async (id, updates) => {
    try {
      return await UserModel.findByIdAndUpdate(id, updates, { new: true });
    } catch (error) {
      console.error("Error updating user:", error.message);
      throw error;
    }
  };

  /**
   * Finds a user by verification token.
   *
   * @param {string} token - Verification token.
   * @returns {Promise<Object|null>} - User object or null if not found.
   */
  const findUserByVerificationToken = async (token) => {
    try {
      return await UserModel.findOne({ verificationToken: token });
    } catch (error) {
      console.error("Error finding user by verification token:", error.message);
      throw error;
    }
  };

  /**
   * Finds a user by reset token and checks if the token is not expired.
   *
   * @param {string} token - Reset token.
   * @param {Date} expiryDate - Current date for token expiration check.
   * @returns {Promise<Object|null>} - User object or null if not found.
   */
  const findUserByResetToken = async (token, expiryDate) => {
    try {
      return await UserModel.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: expiryDate },
      });
    } catch (error) {
      console.error("Error finding user by reset token:", error.message);
      throw error;
    }
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
