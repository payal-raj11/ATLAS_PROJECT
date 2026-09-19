require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const notificationRoutes = require("./routes/notifications");
const parcelRoutes = require("./routes/parcels");
const disputeRoutes = require("./routes/disputes");
const surveyRoutes = require("./routes/survey");
const complaintRoutes = require("./routes/complaints");
const documentRoutes = require("./routes/documents");

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true, credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "ATLAS backend" }));

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/parcels", parcelRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/survey", surveyRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/documents", documentRoutes);

app.use((req, res) => res.status(404).json({ message: "Route not found" }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Unexpected server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`ATLAS backend running on port ${PORT}`));
