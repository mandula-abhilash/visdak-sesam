/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async (knex) => {
  return knex.schema.createTable("vd_sesam_users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("name").notNullable();
    table.string("email").notNullable().unique();
    table.string("business_name");
    table.string("password_hash").notNullable();
    table.string("role").defaultTo("user");
    table.jsonb("additional_fields").defaultTo("{}");
    table.boolean("is_verified").defaultTo(false);
    table.boolean("has_received_welcome_bonus").defaultTo(false);
    table.string("verification_token");
    table.timestamp("verification_token_expires_at");
    table.timestamp("last_verification_email_sent_at");
    table.string("password_reset_token");
    table.timestamp("password_reset_expires_at");
    table.timestamps(true, true);

    // Indexes
    table.index("email");
    table.index("verification_token");
    table.index("password_reset_token");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async (knex) => {
  return knex.schema.dropTable("vd_sesam_users");
};
