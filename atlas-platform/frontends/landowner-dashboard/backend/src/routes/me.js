const express = require("express");
const { getDB, saveDB } = require("../db");

const router = express.Router();

// GET /api/me
router.get("/", (req, res) => {
  const db = getDB();
  const landowner = db.landowners.find((l) => l.id === req.landownerId);

  if (!landowner) return res.status(404).json({ error: "Landowner not found" });

  const { passcode, ...safeLandowner } = landowner;
  res.json(safeLandowner);
});

// PATCH /api/me  — update phone/email
router.patch("/", (req, res) => {
  const db = getDB();
  const landowner = db.landowners.find((l) => l.id === req.landownerId);
  if (!landowner) return res.status(404).json({ error: "Landowner not found" });

  const { phone, email } = req.body || {};
  if (phone) landowner.phone = phone;
  if (email) landowner.email = email;
  saveDB(db);

  const { passcode, ...safeLandowner } = landowner;
  res.json(safeLandowner);
});

module.exports = router;
