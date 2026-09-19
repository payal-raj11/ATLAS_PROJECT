const express = require("express");
const { pool } = require("../db");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Landowners see documents tied to their own parcels; every other
// role sees documents scoped the same way projects/parcels already
// are for them (kept simple: filter by project_id/parcel_id query
// params for now, tighten with role-scoping as the Documents UI
// across the other apps gets wired up).
router.get("/", protect, async (req, res) => {
  const { project_id, parcel_id } = req.query;

  if (req.user.role === "landowner") {
    const { rows } = await pool.query(
      `SELECT d.* FROM documents d
       JOIN parcels p ON p.id = d.parcel_id
       WHERE p.landowner_id = $1`,
      [req.user.id]
    );
    return res.json({ documents: rows });
  }

  let where = [];
  let params = [];
  if (project_id) { params.push(project_id); where.push(`project_id = $${params.length}`); }
  if (parcel_id) { params.push(parcel_id); where.push(`parcel_id = $${params.length}`); }

  const { rows } = await pool.query(
    `SELECT * FROM documents ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY created_at DESC LIMIT 200`,
    params
  );
  return res.json({ documents: rows });
});

router.post("/", protect, async (req, res) => {
  const { projectId, parcelId, name, docType, fileUrl } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO documents (project_id, parcel_id, name, doc_type, file_url, uploaded_by)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [projectId || null, parcelId || null, name, docType || null, fileUrl || null, req.user.id]
  );
  return res.status(201).json({ document: rows[0] });
});

module.exports = router;
