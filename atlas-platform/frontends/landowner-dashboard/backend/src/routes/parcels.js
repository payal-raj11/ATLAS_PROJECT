const express = require("express");
const { getDB } = require("../db");

const router = express.Router();

// GET /api/parcels
router.get("/", (req, res) => {
  const db = getDB();
  const parcels = db.parcels.filter((p) => p.landownerId === req.landownerId);
  res.json(parcels);
});

// GET /api/parcels/:id
router.get("/:id", (req, res) => {
  const db = getDB();
  const parcel = db.parcels.find(
    (p) => p.id === req.params.id && p.landownerId === req.landownerId
  );
  if (!parcel) return res.status(404).json({ error: "Parcel not found" });
  res.json(parcel);
});

module.exports = router;
