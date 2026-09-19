const express = require("express");
const { pool } = require("../db");
const { protect } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/parcels
 * ?project_id=  scope to one project (used by every project-details GIS tab)
 * Role scoping mirrors /api/projects.
 */
router.get("/", protect, async (req, res) => {
  const { role, state, district } = req.user;
  const { project_id } = req.query;

  let where = [];
  let params = [];

  if (role === "landowner") {
    params.push(req.user.id);
    where.push(`landowner_id = $${params.length}`);
  } else if (role === "state") {
    params.push(state);
    where.push(`state = $${params.length}`);
  } else if (["district", "village", "survey"].includes(role)) {
    params.push(state);
    where.push(`state = $${params.length}`);
    if (district) {
      params.push(district);
      where.push(`district = $${params.length}`);
    }
  }

  if (project_id) {
    params.push(project_id);
    where.push(`project_id = $${params.length}`);
  }

  const sql = `SELECT * FROM parcels ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY created_at DESC LIMIT 2000`;
  const { rows } = await pool.query(sql, params);
  return res.json({ parcels: rows });
});

router.get("/:id", protect, async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM parcels WHERE id = $1", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: "Parcel not found" });

  const installments = await pool.query(
    "SELECT * FROM compensation_installments WHERE parcel_id = $1 ORDER BY due_date ASC",
    [req.params.id]
  );

  return res.json({ parcel: rows[0], installments: installments.rows });
});

// GeoJSON FeatureCollection, ready to hand straight to a Leaflet layer.
router.get("/geojson/:projectId", protect, async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM parcels WHERE project_id = $1", [req.params.projectId]);
  const featureCollection = {
    type: "FeatureCollection",
    features: rows.map((p) => ({
      type: "Feature",
      geometry: p.geometry,
      properties: {
        parcel_uuid: p.parcel_uuid,
        project_id: p.project_id,
        state: p.state,
        district: p.district,
        village: p.village,
        survey_number: p.survey_number,
        official_owner: p.official_owner,
        land_classification: p.land_classification,
        record_status: p.record_status,
        total_compensation: p.total_compensation,
        compensation_percentage: p.compensation_percentage,
      },
    })),
  };
  return res.json(featureCollection);
});

module.exports = router;
