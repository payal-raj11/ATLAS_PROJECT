-- ============================================================
-- ATLAS — Land Acquisition Management Platform
-- Unified PostgreSQL schema for Central / State / District /
-- Village-Survey / Landowner
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- ------------------------------------------------------------
-- ROLES & USERS
-- ------------------------------------------------------------
CREATE TYPE user_role AS ENUM (
  'central', 'state', 'district', 'village', 'survey', 'landowner', 'agency'
);

CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         TEXT NOT NULL,
  identity          TEXT NOT NULL UNIQUE,      -- gov email / login ID / phone
  phone             TEXT,
  password_hash     TEXT NOT NULL,
  role              user_role NOT NULL,
  state             TEXT,                      -- scoping: which state this user belongs to (null for central)
  district          TEXT,                      -- scoping: which district (state/district/village/survey roles)
  village           TEXT,                      -- scoping: which village (village/survey/landowner roles)
  is_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  approval_status   approval_status NOT NULL DEFAULT 'pending',
  otp_code          TEXT,
  otp_expires_at    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_state ON users(state);

-- ------------------------------------------------------------
-- PROJECTS
-- ------------------------------------------------------------
-- A project ALWAYS belongs to exactly one state (fixes the bug
-- found in the source CSV, where one project_id spanned 4 states).
-- It may span multiple districts within that state.

CREATE TYPE project_status AS ENUM (
  'draft',
  'pending_state_review',
  'state_accepted',
  'state_rejected',
  'pending_district_assignment',
  'pending_district_verification',
  'district_verified',
  'district_rejected',
  'pending_survey',
  'survey_completed',
  'land_acquisition',
  'compensation_in_progress',
  'possession',
  'completed'
);

CREATE TABLE projects (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                TEXT NOT NULL UNIQUE,        -- human-facing e.g. ATLAS-PRJ-0001
  name                TEXT NOT NULL,
  project_type        TEXT NOT NULL,                -- Highway / Railway / Transmission / Metro / ...
  description         TEXT,
  state               TEXT NOT NULL,
  districts           TEXT[] NOT NULL DEFAULT '{}',
  department          TEXT,
  funding_source       TEXT,
  nodal_officer       TEXT,
  estimated_cost_cr   NUMERIC(14,2),
  land_required_ha    NUMERIC(12,2),
  risk                TEXT CHECK (risk IN ('Low','Medium','High')),
  priority            TEXT CHECK (priority IN ('Low','Medium','High')) DEFAULT 'Medium',
  status              project_status NOT NULL DEFAULT 'draft',
  proposed_by         UUID REFERENCES users(id),
  issue_date          DATE,
  deadline_date        DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_state ON projects(state);
CREATE INDEX idx_projects_status ON projects(status);

-- ------------------------------------------------------------
-- PROJECT ASSIGNMENTS  (the actual "central assigns -> state
-- accepts -> verified -> central notified" audit trail)
-- ------------------------------------------------------------
-- Generic enough to represent ANY hop in the chain:
--   central -> state, state -> district, district -> village
-- One row per action taken. Current state of a project is
-- derived by reading the latest row per (project_id, to_role).

CREATE TYPE assignment_action AS ENUM (
  'assigned', 'accepted', 'rejected', 'verified', 'returned'
);

CREATE TABLE project_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_role       user_role NOT NULL,
  to_role         user_role NOT NULL,
  from_user       UUID REFERENCES users(id),
  to_user         UUID REFERENCES users(id),          -- nullable until someone picks it up
  target_state    TEXT,
  target_district TEXT,
  action          assignment_action NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assignments_project ON project_assignments(project_id);
CREATE INDEX idx_assignments_to_role ON project_assignments(to_role, target_state);

-- ------------------------------------------------------------
-- PARCELS
-- ------------------------------------------------------------
CREATE TABLE parcels (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_uuid               TEXT NOT NULL UNIQUE,     -- e.g. TN-COO-2026-00001
  project_id                UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  state                     TEXT NOT NULL,
  district                  TEXT NOT NULL,
  village                   TEXT NOT NULL,
  survey_number             TEXT,
  sub_division_number       TEXT,
  landowner_id              UUID REFERENCES users(id),
  official_owner            TEXT,
  land_classification       TEXT,                      -- Agricultural / Residential / Commercial / Multi-crop
  record_status             TEXT,                       -- Verified / Disputed / Pending Review / Active
  land_area_sqm             NUMERIC(12,2),
  location_type             TEXT CHECK (location_type IN ('RURAL','URBAN')),
  geometry                  JSONB NOT NULL,             -- GeoJSON Polygon (falls back to Point if unavailable)
  base_market_value         NUMERIC(14,2),
  multiplier                NUMERIC(6,2),
  asset_value                NUMERIC(14,2),
  solatium                  NUMERIC(14,2),
  total_compensation         NUMERIC(14,2),
  compensation_percentage    NUMERIC(5,2) DEFAULT 0,
  possession_percentage      NUMERIC(5,2) DEFAULT 0,
  rr_percentage              NUMERIC(5,2) DEFAULT 0,
  delayed                   BOOLEAN DEFAULT FALSE,
  delay_days                INTEGER DEFAULT 0,
  survey_officer_id         UUID REFERENCES users(id),
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_parcels_project ON parcels(project_id);
CREATE INDEX idx_parcels_landowner ON parcels(landowner_id);
CREATE INDEX idx_parcels_state_district ON parcels(state, district);

-- ------------------------------------------------------------
-- COMPENSATION INSTALLMENTS
-- ------------------------------------------------------------
CREATE TABLE compensation_installments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id   UUID NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
  amount      NUMERIC(14,2) NOT NULL,
  due_date    DATE,
  paid_date   DATE,
  status      TEXT CHECK (status IN ('Pending','Paid','Failed')) DEFAULT 'Pending',
  mode        TEXT DEFAULT 'DBT',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_installments_parcel ON compensation_installments(parcel_id);

-- ------------------------------------------------------------
-- DISPUTES / OBJECTIONS
-- ------------------------------------------------------------
CREATE TABLE disputes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id     UUID NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
  raised_by     UUID REFERENCES users(id),
  type          TEXT,                     -- Boundary Clash / Ownership Claim / Access Dispute / Compensation
  priority      TEXT CHECK (priority IN ('Low','Medium','High')) DEFAULT 'Medium',
  escalated_to  TEXT,                     -- SDM Office / Tehsil Revenue / Patwari / Revenue Inspector
  status        TEXT CHECK (status IN ('Open','Under Review','Forwarded','Resolved','Closed')) DEFAULT 'Open',
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_disputes_parcel ON disputes(parcel_id);

-- ------------------------------------------------------------
-- DOCUMENTS
-- ------------------------------------------------------------
CREATE TABLE documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  parcel_id   UUID REFERENCES parcels(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  doc_type    TEXT,                       -- Khasra / RoR / Field Evidence / DPR / Environmental Clearance
  file_url    TEXT,
  status      TEXT CHECK (status IN ('Available','Missing','Pending Review')) DEFAULT 'Available',
  uploaded_by UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- NOTIFICATIONS  (this is what fires when state verifies and
-- central needs to know)
-- ------------------------------------------------------------
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE, -- specific recipient, if known
  role        user_role,                                    -- OR broadcast to a whole role (e.g. all 'central')
  state       TEXT,                                          -- narrow a role-broadcast to one state's users
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT CHECK (type IN ('info','success','warning','error')) DEFAULT 'info',
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read);
CREATE INDEX idx_notifications_role ON notifications(role, state, read);

-- ------------------------------------------------------------
-- SURVEY / FIELD OPS  (Village-Survey level)
-- ------------------------------------------------------------
CREATE TABLE field_visits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id       UUID NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
  officer_id      UUID REFERENCES users(id),
  activity        TEXT,       -- Boundary Measurement / Owner Verification / Land-use Classification / ...
  status          TEXT CHECK (status IN ('Pending','In Progress','Completed')) DEFAULT 'Pending',
  gps_captured    BOOLEAN DEFAULT FALSE,
  evidence_count  INTEGER DEFAULT 0,
  visit_date      DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE gram_sabha_meetings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village       TEXT NOT NULL,
  district      TEXT NOT NULL,
  state         TEXT NOT NULL,
  meeting_date  DATE,
  venue         TEXT,
  chairperson   TEXT,
  attendance    INTEGER,
  minutes       TEXT,
  noc_status    TEXT CHECK (noc_status IN ('Pending','Approved','Rejected')) DEFAULT 'Pending',
  noc_deadline  DATE
);

-- ------------------------------------------------------------
-- COMPLAINTS  (landowner-raised, distinct from disputes)
-- ------------------------------------------------------------
CREATE TABLE complaints (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landowner_id UUID NOT NULL REFERENCES users(id),
  parcel_id    UUID REFERENCES parcels(id),
  category     TEXT,
  subject      TEXT,
  description  TEXT,
  status       TEXT CHECK (status IN ('Open','In Review','Resolved')) DEFAULT 'Open',
  priority     TEXT CHECK (priority IN ('Low','Medium','High')) DEFAULT 'Medium',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- updated_at triggers
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_parcels_updated BEFORE UPDATE ON parcels
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_disputes_updated BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
