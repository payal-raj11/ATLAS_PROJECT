const express = require("express");
const { pool } = require("../db");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, requireRole("landowner"), async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM complaints WHERE landowner_id = $1 ORDER BY created_at DESC",
    [req.user.id]
  );
  return res.json({ complaints: rows });
});

router.post("/", protect, requireRole("landowner"), async (req, res) => {
  const { parcelId, category, subject, description, priority } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO complaints (landowner_id, parcel_id, category, subject, description, priority)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.id, parcelId || null, category, subject, description, priority || "Medium"]
  );
  return res.status(201).json({ complaint: rows[0] });
});

module.exports = router;
