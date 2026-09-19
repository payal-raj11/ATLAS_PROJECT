const express = require("express");
const jwt = require("jsonwebtoken");
const { getDB } = require("../db");
const { JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/login
// body: { landownerId: "LO-UP-2026-04821", passcode: "demo1234" }
router.post("/login", (req, res) => {
  const { landownerId, passcode } = req.body || {};

  if (!landownerId || !passcode) {
    return res.status(400).json({ error: "landownerId and passcode are required" });
  }

  const db = getDB();
  const landowner = db.landowners.find((l) => l.id === landownerId);

  if (!landowner || landowner.passcode !== passcode) {
    return res.status(401).json({ error: "Invalid landowner ID or passcode" });
  }

  const token = jwt.sign({ landownerId: landowner.id }, JWT_SECRET, { expiresIn: "12h" });

  const { passcode: _omit, ...safeLandowner } = landowner;
  res.json({ token, landowner: safeLandowner });
});

module.exports = router;
