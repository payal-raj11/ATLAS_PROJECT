const express = require("express");
const { pool } = require("../db");
const { protect } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/notifications
 * Returns anything addressed directly to this user, PLUS anything
 * broadcast to their role (narrowed to their state where relevant).
 */
router.get("/", protect, async (req, res) => {
  const { id, role, state } = req.user;

  const { rows } = await pool.query(
    `SELECT * FROM notifications
     WHERE user_id = $1
        OR (role = $2 AND (state IS NULL OR state = $3))
     ORDER BY created_at DESC
     LIMIT 100`,
    [id, role, state]
  );

  return res.json({ notifications: rows, unreadCount: rows.filter((n) => !n.read).length });
});

router.patch("/:id/read", protect, async (req, res) => {
  await pool.query("UPDATE notifications SET read = TRUE WHERE id = $1", [req.params.id]);
  return res.json({ message: "Marked as read" });
});

router.patch("/read-all", protect, async (req, res) => {
  const { id, role, state } = req.user;
  await pool.query(
    `UPDATE notifications SET read = TRUE
     WHERE (user_id = $1 OR (role = $2 AND (state IS NULL OR state = $3))) AND read = FALSE`,
    [id, role, state]
  );
  return res.json({ message: "All marked as read" });
});

module.exports = router;
