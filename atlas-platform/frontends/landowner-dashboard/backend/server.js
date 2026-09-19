import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { store, saveStore, initDatabase } from "./database.js";

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = "atlas_secret_key_2026";

app.use(cors());
app.use(express.json());

// Default documents matching original mock structure
const defaultDocuments = [
  {
    id: "DOC-101",
    title: "Section 11 Preliminary Notification",
    category: "Statutory Notice",
    date: "2026-01-15",
    fileSize: "2.4 MB",
    parcelId: "UP-LKO-2026-10000",
    downloadUrl: "#",
  },
  {
    id: "DOC-102",
    title: "Section 19 Declaration of Acquisition",
    category: "Declaration",
    date: "2026-02-02",
    fileSize: "1.8 MB",
    parcelId: "UP-LKO-2026-10000",
    downloadUrl: "#",
  },
  {
    id: "DOC-103",
    title: "Section 37 Award Notice & Valuation",
    category: "Award Notice",
    date: "2026-02-20",
    fileSize: "3.1 MB",
    parcelId: "UP-LKO-2026-10000",
    downloadUrl: "#",
  },
  {
    id: "DOC-104",
    title: "Record of Rights (Khatauni Extract)",
    category: "Land Record",
    date: "2025-11-10",
    fileSize: "890 KB",
    parcelId: "UP-LKO-2026-10000",
    downloadUrl: "#",
  },
];

function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    req.user = store.users[0];
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    req.user = err ? store.users[0] : user;
    next();
  });
}

// 1. Landowner Profile
app.get("/api/me", authenticate, (req, res) => {
  const user = store.users.find((u) => u.id === req.user.id) || store.users[0];
  res.json({
    ...user,
    photoInitials: user.photoInitials || "VV",
    role: user.role || "Official Landowner",
  });
});

app.patch("/api/me", authenticate, (req, res) => {
  const idx = store.users.findIndex((u) => u.id === req.user.id);
  if (idx !== -1) {
    store.users[idx] = { ...store.users[idx], ...req.body };
    saveStore();
    return res.json(store.users[idx]);
  }
  res.json(req.body);
});

// 2. Landowner Parcels (with stage workflows & timeline details)
app.get("/api/parcels", authenticate, (req, res) => {
  const stagesList = [
    { name: "Proposal", status: "completed" },
    { name: "Verification", status: "completed" },
    { name: "Approval", status: "completed" },
    { name: "Sec 11", status: "completed" },
    { name: "Award", status: "current" },
    { name: "Payment", status: "pending" },
    { name: "Possession", status: "pending" },
  ];

  const mapped = store.parcels.slice(0, 10).map((r, index) => ({
    id: r.parcel_uuid,
    parcelId: r.parcel_uuid,
    surveyNumber: r.survey_number,
    subDivision: r.sub_division_number,
    village: r.village,
    district: r.district,
    state: r.state,
    area: r.official_area,
    landAreaSqm: r.land_area_sqm,
    landClassification: r.land_classification,
    recordStatus: r.record_status || "Award Announced",
    status: r.record_status || "In Process",
    currentStage: "Award Declaration",
    stages: stagesList,
    totalCompensation: r.total_compensation,
    valuation: {
      baseMarketValue: r.base_market_value,
      multiplier: r.multiplier,
      assetValue: r.asset_value,
      solatium: r.solatium_100_percent,
      totalCompensation: r.total_compensation,
    },
    compensation: {
      totalCompensation: r.total_compensation,
      baseMarketValue: r.base_market_value,
      multiplier: r.multiplier,
      assetValue: r.asset_value,
      solatium: r.solatium_100_percent,
      disbursed: ((r.compensation_percentage || 0) / 100) * (r.total_compensation || 0),
      tranches: [
        {
          name: "Tranche 1 (Initial Release)",
          amount: ((r.total_compensation || 0) * 0.4),
          date: "2026-02-22",
          status: "Paid",
        },
        {
          name: "Tranche 2 (Final Settlement)",
          amount: ((r.total_compensation || 0) * 0.6),
          date: "2026-03-30",
          status: "Pending",
        },
      ],
    },
    progress: {
      compensationPercentage: r.compensation_percentage || 40,
      possessionPercentage: r.possession_percentage || 0,
      rrPercentage: r.rr_percentage || 50,
    },
    coordinates: { lat: r.latitude, lng: r.longitude },
  }));

  res.json(mapped);
});

// 3. Notifications
app.get("/api/notifications", authenticate, (req, res) => {
  res.json(store.notifications);
});

app.patch("/api/notifications/:id/read", authenticate, (req, res) => {
  store.notifications = store.notifications.map((n) =>
    n.id === req.params.id ? { ...n, read: true } : n
  );
  saveStore();
  res.json({ success: true });
});

app.patch("/api/notifications/read-all", authenticate, (req, res) => {
  store.notifications = store.notifications.map((n) => ({ ...n, read: true }));
  saveStore();
  res.json({ success: true });
});

// 4. Complaints
app.get("/api/complaints", authenticate, (req, res) => {
  res.json(store.complaints);
});

app.post("/api/complaints", authenticate, (req, res) => {
  const newComplaint = {
    id: `CMP-${Math.floor(1000 + Math.random() * 9000)}`,
    status: "Submitted",
    dateFiled: new Date().toISOString().slice(0, 10),
    lastUpdate: new Date().toISOString().slice(0, 10),
    ...req.body,
  };
  store.complaints.unshift(newComplaint);
  saveStore();
  res.status(201).json(newComplaint);
});

// 5. Documents (Returns populated list)
app.get("/api/documents", authenticate, (req, res) => {
  if (!store.documents || store.documents.length === 0) {
    store.documents = defaultDocuments;
    saveStore();
  }
  res.json(store.documents);
});

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
});