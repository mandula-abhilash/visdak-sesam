import bcrypt from "bcryptjs";
import db from "../../db/knex.js";

const TABLE_NAME = "vd_sesam_users";

/**
 * User repository for PostgreSQL operations
 */
export class UserRepository {
  /**
   * Find user by email
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  static async findByEmail(email) {
    const user = await db(TABLE_NAME).where({ email }).first();
    return user || null;
  }

  /**
   * Find user by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const user = await db(TABLE_NAME).where({ id }).first();
    return user || null;
  }

  /**
   * Find user by email with password included
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  static async findByEmailWithPassword(email) {
    const user = await db(TABLE_NAME).where({ email }).first();
    return user || null;
  }

  /**
   * Find user by verification token
   * @param {string} token
   * @returns {Promise<Object|null>}
   */
  static async findByVerificationToken(token) {
    const user = await db(TABLE_NAME)
      .where({ verification_token: token })
      .where("verification_token_expires_at", ">", new Date())
      .first();
    return user || null;
  }

  /**
   * Find user by password reset token
   * @param {string} token
   * @returns {Promise<Object|null>}
   */
  static async findByPasswordResetToken(token) {
    const user = await db(TABLE_NAME)
      .where({ password_reset_token: token })
      .where("password_reset_expires_at", ">", new Date())
      .first();
    return user || null;
  }

  /**
   * Create a new user
   * @param {Object} userData
   * @returns {Promise<Object>}
   */
  static async create(userData) {
    const {
      name,
      email,
      password,
      role = "user",
      businessName,
      additionalFields = {},
      verificationToken,
      verificationTokenExpires,
      lastVerificationEmailSent,
      isVerified = false,
    } = userData;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const userToInsert = {
      name,
      email,
      password_hash: passwordHash,
      role,
      business_name: businessName,
      additional_fields: additionalFields,
      is_verified: isVerified,
      verification_token: verificationToken,
      verification_token_expires_at: verificationTokenExpires,
      last_verification_email_sent_at: lastVerificationEmailSent,
    };

    const [user] = await db(TABLE_NAME).insert(userToInsert).returning("*");
    return this.transformUser(user);
  }

  /**
   * Update user by ID
   * @param {string} id
   * @param {Object} updateData
   * @returns {Promise<Object>}
   */
  static async updateById(id, updateData) {
    const updateFields = {};

    // Map fields to database column names
    if (updateData.name !== undefined) updateFields.name = updateData.name;
    if (updateData.email !== undefined) updateFields.email = updateData.email;
    if (updateData.businessName !== undefined)
      updateFields.business_name = updateData.businessName;
    if (updateData.role !== undefined) updateFields.role = updateData.role;
    if (updateData.additionalFields !== undefined)
      updateFields.additional_fields = updateData.additionalFields;
    if (updateData.isVerified !== undefined)
      updateFields.is_verified = updateData.isVerified;
    if (updateData.hasReceivedWelcomeBonus !== undefined)
      updateFields.has_received_welcome_bonus =
        updateData.hasReceivedWelcomeBonus;
    if (updateData.verificationToken !== undefined)
      updateFields.verification_token = updateData.verificationToken;
    if (updateData.verificationTokenExpires !== undefined)
      updateFields.verification_token_expires_at =
        updateData.verificationTokenExpires;
    if (updateData.lastVerificationEmailSent !== undefined)
      updateFields.last_verification_email_sent_at =
        updateData.lastVerificationEmailSent;
    if (updateData.passwordResetToken !== undefined)
      updateFields.password_reset_token = updateData.passwordResetToken;
    if (updateData.passwordResetExpires !== undefined)
      updateFields.password_reset_expires_at = updateData.passwordResetExpires;

    // Handle password hashing
    if (updateData.password !== undefined) {
      updateFields.password_hash = await bcrypt.hash(updateData.password, 10);
    }

    updateFields.updated_at = new Date();

    const [user] = await db(TABLE_NAME)
      .where({ id })
      .update(updateFields)
      .returning("*");

    return user ? this.transformUser(user) : null;
  }

  /**
   * Compare password with hash
   * @param {string} password
   * @param {string} hash
   * @returns {Promise<boolean>}
   */
  static async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Transform database user object to application format
   * @param {Object} dbUser
   * @returns {Object}
   */
  static transformUser(dbUser) {
    if (!dbUser) return null;

    return {
      id: dbUser.id,
      _id: dbUser.id, // For backward compatibility
      name: dbUser.name,
      email: dbUser.email,
      businessName: dbUser.business_name,
      role: dbUser.role,
      additionalFields: dbUser.additional_fields || {},
      isVerified: dbUser.is_verified,
      hasReceivedWelcomeBonus: dbUser.has_received_welcome_bonus,
      verificationToken: dbUser.verification_token,
      verificationTokenExpires: dbUser.verification_token_expires_at,
      lastVerificationEmailSent: dbUser.last_verification_email_sent_at,
      passwordResetToken: dbUser.password_reset_token,
      passwordResetExpires: dbUser.password_reset_expires_at,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
      // Add comparePassword method for backward compatibility
      comparePassword: async function (candidatePassword) {
        return await UserRepository.comparePassword(
          candidatePassword,
          dbUser.password_hash
        );
      },
      // Add toObject method for backward compatibility
      toObject: function () {
        const { comparePassword, toObject, ...rest } = this;
        return rest;
      },
    };
  }
}
