const express = require("express");
const { pool } = require("../db");
const { protect, requireRole } = require("../middleware/auth");
const { notify } = require("../utils/notify");

const router = express.Router();

/**
 * GET /api/survey/assignments
 * A survey officer's own queue: parcels assigned to them that still
 * need field verification (no completed field_visit yet).
 */
router.get("/assignments", protect, requireRole("survey"), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT p.*, pr.name AS project_name, pr.code AS project_code
     FROM parcels p
     JOIN projects pr ON pr.id = p.project_id
     WHERE p.survey_officer_id = $1
     ORDER BY p.created_at DESC`,
    [req.user.id]
  );
  return res.json({ parcels: rows });
});

/**
 * GET /api/survey/field-visits?parcel_id=
 */
router.get("/field-visits", protect, async (req, res) => {
  const { parcel_id } = req.query;
  const { rows } = await pool.query(
    parcel_id
      ? "SELECT * FROM field_visits WHERE parcel_id = $1 ORDER BY visit_date DESC"
      : "SELECT * FROM field_visits WHERE officer_id = $1 ORDER BY visit_date DESC",
    parcel_id ? [parcel_id] : [req.user.id]
  );
  return res.json({ fieldVisits: rows });
});

/**
 * POST /api/survey/field-visits
 * Survey officer logs a field visit (boundary measurement, owner
 * verification, land-use classification, photography, doc check).
 * Completing one is what feeds the parcel's record_status and, in
 * aggregate, the project's "pending_survey" -> "survey_completed"
 * transition (see PATCH /parcels/:id/record-status below).
 */
router.post("/field-visits", protect, requireRole("survey"), async (req, res) => {
  const { parcelId, activity, status, gpsCaptured, evidenceCount, visitDate } = req.body;
  if (!parcelId || !activity) {
    return res.status(400).json({ message: "parcelId and activity are required" });
  }

  const { rows } = await pool.query(
    `INSERT INTO field_visits (parcel_id, officer_id, activity, status, gps_captured, evidence_count, visit_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [parcelId, req.user.id, activity, status || "Completed", !!gpsCaptured, evidenceCount || 0, visitDate || new Date()]
  );

  if ((status || "Completed") === "Completed") {
    const parcelRes = await pool.query("SELECT * FROM parcels WHERE id = $1", [parcelId]);
    const parcel = parcelRes.rows[0];
    if (parcel) {
      // Notify the district that holds this parcel's project that a
      // field verification just landed — mirrors the same
      // notify-the-role-above pattern used by projects.js.
      await notify({
        role: "district",
        state: parcel.state,
        projectId: parcel.project_id,
        title: "Field visit completed",
        message: `${activity} completed for parcel ${parcel.parcel_uuid} (survey no. ${parcel.survey_number}).`,
        type: "info",
      });
    }
  }

  return res.status(201).json({ fieldVisit: rows[0] });
});

/**
 * PATCH /api/survey/parcels/:id/record-status
 * Survey officer updates a parcel's record status after field
 * verification (Verified / Disputed / Missing RoR / Pending Review).
 */
router.patch("/parcels/:id/record-status", protect, requireRole("survey"), async (req, res) => {
  const { recordStatus } = req.body;
  const { rows } = await pool.query(
    "UPDATE parcels SET record_status = $1 WHERE id = $2 AND survey_officer_id = $3 RETURNING *",
    [recordStatus, req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ message: "Parcel not found or not assigned to you" });
  return res.json({ parcel: rows[0] });
});

module.exports = router;
