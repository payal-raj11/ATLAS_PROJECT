const express = require("express");
const { getDB, saveDB } = require("../db");

const router = express.Router();

const VALID_CATEGORIES = [
  "Compensation Discrepancy",
  "Survey / Boundary Error",
  "Possession Dispute",
  "Documentation Issue",
  "R&R Entitlement",
  "Delay in Process",
  "Other",
];

// GET /api/complaints
router.get("/", (req, res) => {
  const db = getDB();
  const complaints = db.complaints
    .filter((c) => c.landownerId === req.landownerId)
    .sort((a, b) => (a.dateFiled < b.dateFiled ? 1 : -1));
  res.json(complaints);
});

// POST /api/complaints
// body: { parcelId, category, subject, description, priority }
router.post("/", (req, res) => {
  const { parcelId, category, subject, description, priority } = req.body || {};

  if (!parcelId || !subject || !description) {
    return res.status(400).json({ error: "parcelId, subject and description are required" });
  }
  if (category && !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: "Invalid category" });
  }

  const db = getDB();

  const parcelBelongsToUser = db.parcels.some(
    (p) => p.id === parcelId && p.landownerId === req.landownerId
  );
  if (!parcelBelongsToUser) {
    return res.status(403).json({ error: "Parcel does not belong to this landowner" });
  }

  const today = new Date().toISOString().slice(0, 10);
  const newComplaint = {
    id: `CMP-${Math.floor(1000 + Math.random() * 9000)}`,
    landownerId: req.landownerId,
    category: category || "Other",
    parcelId,
    subject: subject.trim(),
    description: description.trim(),
    status: "Submitted",
    priority: priority || "Medium",
    dateFiled: today,
    lastUpdate: today,
  };

  db.complaints.unshift(newComplaint);
  saveDB(db);
  res.status(201).json(newComplaint);
});

module.exports = router;
