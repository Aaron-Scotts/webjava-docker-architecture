const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "postgres",
  user: process.env.POSTGRES_USER || "appuser",
  password: process.env.POSTGRES_PASSWORD || "example",
  database: process.env.POSTGRES_DB || "appdb",
  port: process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : 5432,
});

module.exports = pool;
