require("dotenv").config();
const { Pool } = require("pg");

// A single shared pool for the whole process. Every route module
// requires this file and uses pool.query(...) — nobody opens their
// own connection, so this is the one place PG config lives.
const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error", err);
});

module.exports = { pool };
