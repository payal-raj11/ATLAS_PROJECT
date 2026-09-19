const express = require("express");
const { pool } = require("../db");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, async (req, res) => {
  const { parcel_id } = req.query;
  const { rows } = await pool.query(
    parcel_id
      ? "SELECT * FROM disputes WHERE parcel_id = $1 ORDER BY created_at DESC"
      : "SELECT * FROM disputes ORDER BY created_at DESC LIMIT 500",
    parcel_id ? [parcel_id] : []
  );
  return res.json({ disputes: rows });
});

router.post("/", protect, async (req, res) => {
  const { parcelId, type, priority, escalatedTo, description } = req.body;
  if (!parcelId || !type) return res.status(400).json({ message: "parcelId and type are required" });

  const { rows } = await pool.query(
    `INSERT INTO disputes (parcel_id, raised_by, type, priority, escalated_to, description)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [parcelId, req.user.id, type, priority || "Medium", escalatedTo || null, description || null]
  );
  return res.status(201).json({ dispute: rows[0] });
});

router.patch("/:id", protect, async (req, res) => {
  const { status } = req.body;
  const { rows } = await pool.query(
    "UPDATE disputes SET status = $1 WHERE id = $2 RETURNING *",
    [status, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ message: "Dispute not found" });
  return res.json({ dispute: rows[0] });
});

module.exports = router;
