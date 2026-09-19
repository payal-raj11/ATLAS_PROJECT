const express = require("express");
const cors = require("cors");

const { requireAuth } = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const meRoutes = require("./routes/me");
const parcelsRoutes = require("./routes/parcels");
const notificationsRoutes = require("./routes/notifications");
const complaintsRoutes = require("./routes/complaints");
const documentsRoutes = require("./routes/documents");

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Public
app.use("/api/auth", authRoutes);

// Everything below requires a valid Bearer token
app.use("/api/me", requireAuth, meRoutes);
app.use("/api/parcels", requireAuth, parcelsRoutes);
app.use("/api/notifications", requireAuth, notificationsRoutes);
app.use("/api/complaints", requireAuth, complaintsRoutes);
app.use("/api/documents", requireAuth, documentsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
