const express = require("express");
const { getDB, saveDB } = require("../db");

const router = express.Router();

// GET /api/notifications
router.get("/", (req, res) => {
  const db = getDB();
  const notifications = db.notifications
    .filter((n) => n.landownerId === req.landownerId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  res.json(notifications);
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", (req, res) => {
  const db = getDB();
  const n = db.notifications.find(
    (n) => n.id === req.params.id && n.landownerId === req.landownerId
  );
  if (!n) return res.status(404).json({ error: "Notification not found" });

  n.read = true;
  saveDB(db);
  res.json(n);
});

// PATCH /api/notifications/read-all
router.patch("/read-all", (req, res) => {
  const db = getDB();
  db.notifications.forEach((n) => {
    if (n.landownerId === req.landownerId) n.read = true;
  });
  saveDB(db);
  res.json({ ok: true });
});

module.exports = router;
