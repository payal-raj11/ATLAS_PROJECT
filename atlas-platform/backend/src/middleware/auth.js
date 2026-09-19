const { verifyToken } = require("../utils/jwt");
const { pool } = require("../db");

// Verifies the bearer token and attaches the current user (fresh
// from the DB, not just the JWT payload, so a revoked/edited
// account takes effect immediately) to req.user.
async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const payload = verifyToken(token);
    const { rows } = await pool.query(
      `SELECT id, full_name, identity, phone, role, state, district, village,
              is_verified, approval_status
       FROM users WHERE id = $1`,
      [payload.id]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ message: "User no longer exists" });
    if (user.approval_status !== "approved") {
      return res.status(403).json({ message: `Account is ${user.approval_status}` });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Usage: requireRole("central", "state")
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized for this action" });
    }
    next();
  };
}

module.exports = { protect, requireRole };
