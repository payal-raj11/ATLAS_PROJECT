require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { pool } = require("../db");

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, "..", "schema.sql"), "utf-8");
  console.log("Applying schema.sql ...");
  await pool.query(sql);
  console.log("Schema applied successfully.");
  await pool.end();
}

main().catch((err) => {
  console.error("Failed to apply schema:", err.message);
  process.exit(1);
});
