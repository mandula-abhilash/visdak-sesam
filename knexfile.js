import dotenv from "dotenv";
dotenv.config();

const config = {
  development: {
    client: "pg",
    connection: {
      host: process.env.PG_HOST || "localhost",
      port: process.env.PG_PORT || 5432,
      user: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
      database: process.env.PG_DATABASE,
    },
    migrations: {
      directory: "./src/db/migrations",
      tableName: "vd_sesam_landlogiq_knex_migrations",
    },
    seeds: {
      directory: "./src/db/seeds",
    },
  },

  production: {
    client: "pg",
    connection: {
      host: process.env.PG_HOST,
      port: process.env.PG_PORT || 5432,
      user: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
      database: process.env.PG_DATABASE,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    },
    migrations: {
      directory: "./src/db/migrations",
      tableName: "vd_sesam_landlogiq_knex_migrations",
    },
    seeds: {
      directory: "./src/db/seeds",
    },
  },
};

export default config;
