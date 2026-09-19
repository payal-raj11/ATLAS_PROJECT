const express = require("express");
const { getDB } = require("../db");

const router = express.Router();

// GET /api/documents
router.get("/", (req, res) => {
  const db = getDB();
  const documents = db.documents.filter((d) => d.landownerId === req.landownerId);
  res.json(documents);
});

module.exports = router;
