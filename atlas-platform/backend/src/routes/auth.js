const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../db");
const { signToken } = require("../utils/jwt");
const { protect } = require("../middleware/auth");

const router = express.Router();

const VALID_ROLES = ["central", "state", "district", "village", "survey", "landowner", "agency"];

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// In dev, OTPs just print to the server console instead of hitting
// a real SMS gateway. Swap this for an actual provider before
// going anywhere near production.
async function sendOtpSms(phone, otp) {
  console.log(`[DEV OTP] Sending ${otp} to ${phone}`);
  return true;
}

/**
 * POST /api/auth/register
 * Every role except landowner (landowners are issued a Login ID
 * by their District office — see /api/users/provision below).
 */
router.post("/register", async (req, res) => {
  try {
    const { fullName, identity, phone, secret, confirmSecret, role, state, district, village } = req.body;

    if (role === "landowner") {
      return res.status(400).json({ message: "Landowners cannot self-register. Contact your District Authority for a Login ID." });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    if (!fullName || !identity || !secret || !confirmSecret) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (secret !== confirmSecret) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    if (secret.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const existing = await pool.query("SELECT id FROM users WHERE identity = $1", [identity.toLowerCase()]);
    if (existing.rows.length) {
      return res.status(409).json({ message: "An account with this ID/email already exists" });
    }

    const passwordHash = await bcrypt.hash(secret, 10);
    // Central is auto-approved (there's no one above it to approve it);
    // everyone else queues for approval by the role above them.
    const approvalStatus = role === "central" ? "approved" : "pending";

    const { rows } = await pool.query(
      `INSERT INTO users (full_name, identity, phone, password_hash, role, state, district, village, approval_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, full_name, identity, phone, role, state, district, village, approval_status, created_at`,
      [fullName, identity.toLowerCase(), phone, passwordHash, role, state || null, district || null, village || null, approvalStatus]
    );

    return res.status(201).json({
      message: approvalStatus === "pending"
        ? "Enrollment request submitted. Awaiting approval from a higher authority."
        : "Registration successful.",
      user: rows[0],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error during registration" });
  }
});

/**
 * POST /api/auth/login
 * central / state / district / village / survey / agency.
 * Landowners use the OTP flow below instead.
 */
router.post("/login", async (req, res) => {
  try {
    const { identity, secret, role } = req.body;
    if (!identity || !secret || !role) {
      return res.status(400).json({ message: "Identity, password and role are required" });
    }
    if (role === "landowner") {
      return res.status(400).json({ message: "Landowners must sign in via OTP verification" });
    }

    const { rows } = await pool.query(
      "SELECT * FROM users WHERE identity = $1 AND role = $2",
      [identity.toLowerCase(), role]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ message: "Invalid credentials or role mismatch" });

    const match = await bcrypt.compare(secret, user.password_hash);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    if (user.approval_status !== "approved") {
      return res.status(403).json({ message: `Account is ${user.approval_status}. Contact your administrator.` });
    }

    const token = signToken(user);
    delete user.password_hash;
    return res.json({ message: "Authentication successful", token, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error during login" });
  }
});

/** POST /api/auth/landowner/request-otp — step 1 */
router.post("/landowner/request-otp", async (req, res) => {
  try {
    const { identity, secret } = req.body;
    if (!identity || !secret) {
      return res.status(400).json({ message: "Login ID and password are required" });
    }

    const { rows } = await pool.query(
      "SELECT * FROM users WHERE identity = $1 AND role = 'landowner'",
      [identity.toLowerCase()]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ message: "Invalid Login ID or password" });

    const match = await bcrypt.compare(secret, user.password_hash);
    if (!match) return res.status(401).json({ message: "Invalid Login ID or password" });
    if (!user.phone) {
      return res.status(400).json({ message: "No mobile number linked to this dossier. Contact your District Authority." });
    }

    const otp = generateOtp();
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || "5", 10);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await pool.query("UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE id = $3", [otp, expiresAt, user.id]);
    await sendOtpSms(user.phone, otp);

    // DEMO_MODE echoes the OTP straight back in the response so it can
    // be shown on screen -- no real SMS gateway, no terminal-watching
    // needed. Turn this off (or unset DEMO_MODE) before this is ever
    // exposed somewhere real, since it defeats the point of an OTP.
    const demoMode = process.env.DEMO_MODE === "true";

    return res.json({
      message: `OTP sent to mobile number linked to this dossier. Valid for ${expiryMinutes} minutes.`,
      ...(demoMode ? { devOtp: otp } : {}),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error while sending OTP" });
  }
});

/** POST /api/auth/landowner/verify-otp — step 2 */
router.post("/landowner/verify-otp", async (req, res) => {
  try {
    const { identity, otp } = req.body;
    if (!identity || !otp) {
      return res.status(400).json({ message: "Login ID and OTP are required" });
    }

    const { rows } = await pool.query(
      "SELECT * FROM users WHERE identity = $1 AND role = 'landowner'",
      [identity.toLowerCase()]
    );
    const user = rows[0];
    if (!user || !user.otp_code || !user.otp_expires_at) {
      return res.status(400).json({ message: "No pending OTP request for this account" });
    }
    if (new Date(user.otp_expires_at) < new Date()) {
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }
    if (user.otp_code !== otp) {
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    await pool.query(
      "UPDATE users SET otp_code = NULL, otp_expires_at = NULL, is_verified = TRUE WHERE id = $1",
      [user.id]
    );

    const token = signToken(user);
    delete user.password_hash;
    user.otp_code = undefined;
    return res.json({ message: "OTP verified. Access granted to landowner dossier.", token, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error during OTP verification" });
  }
});

/** GET /api/auth/me */
router.get("/me", protect, async (req, res) => {
  return res.json({ user: req.user });
});

/**
 * GET /api/auth/pending-approvals
 * A role's queue of accounts it needs to approve
 * (central approves state, state approves district, district approves village/survey/agency).
 */
const APPROVER_OF = { state: "central", district: "state", village: "district", survey: "district", agency: "district" };

router.get("/pending-approvals", protect, async (req, res) => {
  const rolesIApprove = Object.entries(APPROVER_OF)
    .filter(([, approver]) => approver === req.user.role)
    .map(([role]) => role);

  if (!rolesIApprove.length) return res.json({ pending: [] });

  const { rows } = await pool.query(
    `SELECT id, full_name, identity, phone, role, state, district, village, created_at
     FROM users WHERE role = ANY($1) AND approval_status = 'pending'
     ${req.user.role !== "central" ? "AND state = $2" : ""}
     ORDER BY created_at ASC`,
    req.user.role !== "central" ? [rolesIApprove, req.user.state] : [rolesIApprove]
  );
  return res.json({ pending: rows });
});

router.post("/approve/:userId", protect, async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [req.params.userId]);
  const target = rows[0];
  if (!target) return res.status(404).json({ message: "User not found" });
  if (APPROVER_OF[target.role] !== req.user.role) {
    return res.status(403).json({ message: "You cannot approve this role" });
  }

  const { decision } = req.body; // 'approved' | 'rejected'
  await pool.query("UPDATE users SET approval_status = $1 WHERE id = $2", [decision, target.id]);
  return res.json({ message: `User ${decision}` });
});

module.exports = router;
