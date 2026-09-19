const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "data", "db.json");

// Simple synchronous JSON-file store. Good enough for a demo / small
// deployment; swap this module for a real database (Postgres, Mongo, etc.)
// later without touching the route handlers — just keep the same
// getDB()/saveDB() shape.

function getDB() {
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

module.exports = { getDB, saveDB };
