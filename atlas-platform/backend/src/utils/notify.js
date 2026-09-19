const { pool } = require("../db");

/**
 * Creates a notification. Either targets one specific user_id, or
 * broadcasts to a whole role (optionally narrowed to one state) —
 * e.g. { role: "state", state: "Bihar" } reaches every state-level
 * user scoped to Bihar without needing to know their user IDs.
 */
async function notify({ userId, role, state, projectId, title, message, type = "info" }) {
  if (userId) {
    await pool.query(
      `INSERT INTO notifications (user_id, project_id, title, message, type)
       VALUES ($1,$2,$3,$4,$5)`,
      [userId, projectId || null, title, message, type]
    );
    return;
  }
  await pool.query(
    `INSERT INTO notifications (role, state, project_id, title, message, type)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [role, state || null, projectId || null, title, message, type]
  );
}

module.exports = { notify };
