const express = require("express");
const { pool } = require("../db");
const { protect, requireRole } = require("../middleware/auth");
const { notify } = require("../utils/notify");

const router = express.Router();

// Who does each role hand a project down to next, and what status
// does the project carry while it's sitting with them.
const NEXT_ROLE = { central: "state", state: "district", district: "village" };
const PENDING_STATUS_FOR = {
  state: "pending_state_review",
  district: "pending_district_assignment",
  village: "pending_survey",
};

function generateCode(seq) {
  return `ATLAS-PRJ-${String(seq).padStart(4, "0")}`;
}

/**
 * POST /api/projects
 * Central creates a project AND assigns it to a state in one step
 * (mirrors the "Add Proposal" form → immediately visible to the
 * target state as a pending item).
 */
router.post("/", protect, requireRole("central"), async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      name, projectType, description, state, districts, department,
      fundingSource, nodalOfficer, estimatedCostCr, landRequiredHa,
      risk, priority, issueDate, deadlineDate,
    } = req.body;

    if (!name || !projectType || !state) {
      return res.status(400).json({ message: "name, projectType and state are required" });
    }

    await client.query("BEGIN");

    const countResult = await client.query("SELECT COUNT(*) FROM projects");
    const code = generateCode(Number(countResult.rows[0].count) + 1);

    const { rows } = await client.query(
      `INSERT INTO projects
        (code, name, project_type, description, state, districts, department,
         funding_source, nodal_officer, estimated_cost_cr, land_required_ha,
         risk, priority, status, proposed_by, issue_date, deadline_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'pending_state_review',$14,$15,$16)
       RETURNING *`,
      [code, name, projectType, description || null, state, districts || [], department || null,
       fundingSource || null, nodalOfficer || null, estimatedCostCr || null, landRequiredHa || null,
       risk || "Medium", priority || "Medium", req.user.id, issueDate || null, deadlineDate || null]
    );
    const project = rows[0];

    await client.query(
      `INSERT INTO project_assignments (project_id, from_role, to_role, from_user, target_state, action, notes)
       VALUES ($1,'central','state',$2,$3,'assigned',$4)`,
      [project.id, req.user.id, state, `Assigned to ${state} for review`]
    );

    await client.query("COMMIT");

    // Notify every 'state' user scoped to that state.
    await notify({
      role: "state",
      state,
      projectId: project.id,
      title: "New project assigned by Central",
      message: `${project.name} (${project.code}) has been assigned to ${state} for review.`,
      type: "info",
    });

    return res.status(201).json({ project });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ message: "Failed to create project" });
  } finally {
    client.release();
  }
});

/**
 * GET /api/projects
 * Role-scoped list:
 *  - central sees everything
 *  - state sees projects where state = their state
 *  - district sees projects assigned down to their district
 *  - village/survey sees projects touching their village
 */
router.get("/", protect, async (req, res) => {
  const { role, state, district } = req.user;
  const { status } = req.query;

  let where = [];
  let params = [];

  if (role === "state") {
    params.push(state);
    where.push(`state = $${params.length}`);
  } else if (role === "district" || role === "village" || role === "survey") {
    params.push(state);
    where.push(`state = $${params.length}`);
    if (district) {
      params.push(district);
      where.push(`$${params.length} = ANY(districts)`);
    }
  }
  // central: no filter — sees all

  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }

  const sql = `SELECT * FROM projects ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY created_at DESC`;
  const { rows } = await pool.query(sql, params);
  return res.json({ projects: rows });
});

router.get("/:id", protect, async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM projects WHERE id = $1", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: "Project not found" });

  const history = await pool.query(
    `SELECT pa.*, u.full_name AS from_user_name
     FROM project_assignments pa LEFT JOIN users u ON u.id = pa.from_user
     WHERE project_id = $1 ORDER BY created_at ASC`,
    [req.params.id]
  );

  return res.json({ project: rows[0], history: history.rows });
});

/**
 * POST /api/projects/:id/accept
 * The role currently holding the project (state, district, ...)
 * accepts it. Advances status and notifies the assigner.
 */
router.post("/:id/accept", protect, requireRole("state", "district", "village"), async (req, res) => {
  const project = await getProjectOr404(req, res);
  if (!project) return;

  const expectedStatus = {
    state: "pending_state_review",
    district: "pending_district_assignment",
    village: "pending_survey",
  }[req.user.role];

  if (project.status !== expectedStatus) {
    return res.status(409).json({ message: `Project is not awaiting ${req.user.role} acceptance (current status: ${project.status})` });
  }

  const nextStatus = {
    state: "state_accepted",
    district: "pending_district_verification",
    village: "survey_completed",
  }[req.user.role];

  await pool.query("UPDATE projects SET status = $1 WHERE id = $2", [nextStatus, project.id]);
  await pool.query(
    `INSERT INTO project_assignments (project_id, from_role, to_role, to_user, action, notes)
     VALUES ($1,$2,$2,$3,'accepted',$4)`,
    [project.id, req.user.role, req.user.id, `Accepted by ${req.user.full_name} (${req.user.role})`]
  );

  await notifyUpTheChain(project, req.user, `${project.name} was accepted by ${req.user.role} (${req.user.state}).`);

  return res.json({ message: "Accepted", status: nextStatus });
});

/**
 * POST /api/projects/:id/reject
 */
router.post("/:id/reject", protect, requireRole("state", "district"), async (req, res) => {
  const project = await getProjectOr404(req, res);
  if (!project) return;

  const nextStatus = req.user.role === "state" ? "state_rejected" : "district_rejected";
  await pool.query("UPDATE projects SET status = $1 WHERE id = $2", [nextStatus, project.id]);
  await pool.query(
    `INSERT INTO project_assignments (project_id, from_role, to_role, to_user, action, notes)
     VALUES ($1,$2,$2,$3,'rejected',$4)`,
    [project.id, req.user.role, req.user.id, req.body.reason || `Rejected by ${req.user.full_name}`]
  );

  await notifyUpTheChain(project, req.user, `${project.name} was REJECTED by ${req.user.role} (${req.user.state}). Reason: ${req.body.reason || "not specified"}`, "warning");

  return res.json({ message: "Rejected", status: nextStatus });
});

/**
 * POST /api/projects/:id/assign
 * Forward an accepted project down to the next role
 * (state -> district, district -> village). Body: { district, village? }
 */
router.post("/:id/assign", protect, requireRole("state", "district"), async (req, res) => {
  const project = await getProjectOr404(req, res);
  if (!project) return;

  const toRole = NEXT_ROLE[req.user.role];
  const pendingStatus = PENDING_STATUS_FOR[toRole];
  const { district, village } = req.body;

  if (req.user.role === "state" && !district) {
    return res.status(400).json({ message: "district is required when assigning to District Authority" });
  }

  await pool.query("UPDATE projects SET status = $1, districts = CASE WHEN $2::text IS NOT NULL AND NOT ($2 = ANY(districts)) THEN array_append(districts, $2) ELSE districts END WHERE id = $3", [pendingStatus, district || null, project.id]);
  await pool.query(
    `INSERT INTO project_assignments (project_id, from_role, to_role, from_user, target_state, target_district, action, notes)
     VALUES ($1,$2,$3,$4,$5,$6,'assigned',$7)`,
    [project.id, req.user.role, toRole, req.user.id, project.state, district || village || null, `Assigned to ${toRole} by ${req.user.full_name}`]
  );

  await notify({
    role: toRole,
    state: project.state,
    projectId: project.id,
    title: `New project assigned by ${req.user.role}`,
    message: `${project.name} (${project.code}) has been assigned to your ${toRole === "district" ? "district" : "office"}.`,
    type: "info",
  });

  return res.json({ message: `Assigned to ${toRole}`, status: pendingStatus });
});

/**
 * POST /api/projects/:id/verify
 * Marks verification complete at the current level and — this is
 * the specific behavior asked for — pushes the update back up to
 * Central with a notification, regardless of how many hops deep
 * the project currently is.
 */
router.post("/:id/verify", protect, requireRole("state", "district", "village"), async (req, res) => {
  const project = await getProjectOr404(req, res);
  if (!project) return;

  const nextStatus = {
    state: "state_accepted",
    district: "district_verified",
    village: "survey_completed",
  }[req.user.role];

  await pool.query("UPDATE projects SET status = $1 WHERE id = $2", [nextStatus, project.id]);
  await pool.query(
    `INSERT INTO project_assignments (project_id, from_role, to_role, to_user, action, notes)
     VALUES ($1,$2,$2,$3,'verified',$4)`,
    [project.id, req.user.role, req.user.id, `Verified by ${req.user.full_name} (${req.user.role})`]
  );

  // Always notify Central directly on a verification event, in
  // addition to notifying whoever is immediately above this role.
  await notify({
    role: "central",
    projectId: project.id,
    title: "Project verified",
    message: `${project.name} (${project.code}) was verified by ${req.user.role} in ${project.state}${req.user.district ? " / " + req.user.district : ""}.`,
    type: "success",
  });
  await notifyUpTheChain(project, req.user, `${project.name} was verified by ${req.user.role}.`, "success");

  return res.json({ message: "Verified", status: nextStatus });
});

// ------------------------------------------------------------
// helpers
// ------------------------------------------------------------
async function getProjectOr404(req, res) {
  const { rows } = await pool.query("SELECT * FROM projects WHERE id = $1", [req.params.id]);
  if (!rows[0]) {
    res.status(404).json({ message: "Project not found" });
    return null;
  }
  return rows[0];
}

const ROLE_ABOVE = { state: "central", district: "state", village: "district" };

async function notifyUpTheChain(project, actingUser, message, type = "info") {
  const parentRole = ROLE_ABOVE[actingUser.role];
  if (!parentRole) return;
  await notify({
    role: parentRole,
    state: parentRole === "central" ? undefined : project.state,
    projectId: project.id,
    title: `Update on ${project.name}`,
    message,
    type,
  });
}

module.exports = router;
