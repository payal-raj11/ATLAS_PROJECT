import { projects } from "./projects";
import {
  getStatusBucket,
  getWorkflowStage,
  STATUS_BUCKET_LABELS,
  STATUS_BUCKET_COLORS,
} from "./statusHelpers";


/* =========================================================
   ONE DASHBOARD DATA MODEL
   =========================================================
   getDashboardData() is the single thing Dashboard.jsx reads.
   Today it's assembled from data/projects.js plus a handful of
   clearly-marked illustrative constants (land ownership, impact,
   funding split, recent activity — none of which exist as
   per-project fields yet). When the backend is ready this
   function's body becomes:

     const { data } = await api.get("/api/dashboard");
     return data;

   and nothing downstream (components, routes, click-through)
   has to change, because every component already reads from
   this shape, not from projects.js directly.
   ========================================================= */

export function getDashboardData() {

  return {
    overview: getOverview(),
    projects: {
      statusBreakdown: getStatusBreakdown(),
      progressList: getProgressList(),
    },
    workflow: { stages: getWorkflowStages() },
    map: { states: getStateSummary() },
    land: getLandSnapshot(),
    funding: getFundingOverview(),
    documents: getDocumentSnapshot(),
    activity: { recent: RECENT_ACTIVITY },
    attention: getAttentionList(),
    actionCenter: getActionCenter(),
    filters: getFilterOptions(),
    trend: getAcquisitionTrend(),
    risk: getRiskMatrix(),
    socialImpact: SOCIAL_IMPACT,
    objections: getObjections(),
    documentVerification: getDocumentVerificationRing(),
    deadlines: UPCOMING_DEADLINES,
  };

}


/* ---------- HEADER FILTER OPTIONS ---------- */

// UI-only for now (see DashboardHeader) — none of these actually
// narrow the dashboard's data yet. Wiring one in means threading
// its selected value into getDashboardData() and filtering
// `projects` at the top of this file before every function below
// runs off it.
function getFilterOptions() {

  return {
    states: [...new Set(projects.map((p) => p.state))].sort(),
    projectTypes: [...new Set(projects.map((p) => p.projectType))].sort(),
  };

}


/* ---------- OVERVIEW / KPIs ---------- */

function getOverview() {

  const totalProjects = projects.length;

  const buckets = { active: 0, pending: 0, delayed: 0, completed: 0 };

  projects.forEach((p) => {
    buckets[getStatusBucket(p.status)] += 1;
  });

  const landRequired = projects.reduce(
    (sum, p) => sum + p.landRequired,
    0
  );

  const totalCost = projects.reduce(
    (sum, p) => sum + Number(String(p.estimatedCost).replace(/,/g, "")),
    0
  );

  return {
    totalProjects,
    activeProjects: buckets.active,
    pendingActions: buckets.pending,
    delayedProjects: buckets.delayed,
    completedProjects: buckets.completed,
    landRequired,
    totalCost,
  };

}


/* ---------- PROJECT STATUS BREAKDOWN (donut) ---------- */

function getStatusBreakdown() {

  return Object.keys(STATUS_BUCKET_LABELS)
    .map((key) => ({
      key,
      label: STATUS_BUCKET_LABELS[key],
      color: STATUS_BUCKET_COLORS[key],
      value: projects.filter((p) => getStatusBucket(p.status) === key)
        .length,
      to: `/projects?status=${key}`,
    }))
    .filter((bucket) => bucket.value > 0);

}


/* ---------- PROJECT PROGRESS ---------- */

function getProgressList() {

  return [...projects]
    .sort((a, b) => b.progress - a.progress)
    .map((p) => ({
      id: p.id,
      label: p.name,
      value: p.progress,
    }));

}


/* ---------- PROJECTS REQUIRING ATTENTION ---------- */

const PRIORITY_BY_BUCKET = {
  delayed: "High",
  pending: "Medium",
  active: null,
  completed: null,
};

function getAttentionList() {

  return projects
    .map((p) => {

      const bucket = getStatusBucket(p.status);
      let priority = PRIORITY_BY_BUCKET[bucket];

      // Village / landowner verification reads lower urgency than
      // a district / state / survey review, even though both are
      // "pending" — keep that nuance for the table.
      if (
        bucket === "pending" &&
        (p.status.includes("Village") || p.status.includes("Landowner"))
      ) {
        priority = "Low";
      }

      return priority
        ? {
            id: p.id,
            project: p.name,
            issue: p.status,
            priority,
          }
        : null;

    })
    .filter(Boolean)
    .sort((a, b) => {
      const order = { High: 0, Medium: 1, Low: 2 };
      return order[a.priority] - order[b.priority];
    });

}


/* ---------- STATE SUMMARY (feeds the GIS map slot) ---------- */

// Same shape the real GIS map will eventually consume — one row
// per state with its project count and dominant status bucket, so
// dropping in the real map component is a matter of reading
// dashboard.map.states instead of re-deriving this.
function getStateSummary() {

  const byState = {};

  projects.forEach((p) => {

    if (!byState[p.state]) {
      byState[p.state] = { state: p.state, count: 0, buckets: {} };
    }

    byState[p.state].count += 1;

    const bucket = getStatusBucket(p.status);
    byState[p.state].buckets[bucket] =
      (byState[p.state].buckets[bucket] || 0) + 1;

  });

  return Object.values(byState)
    .map((entry) => {

      const dominantBucket = Object.entries(entry.buckets).sort(
        (a, b) => b[1] - a[1]
      )[0][0];

      return {
        state: entry.state,
        count: entry.count,
        dominantBucket,
      };

    })
    .sort((a, b) => b.count - a.count);

}


/* ---------- LAND & IMPACT SNAPSHOT ---------- */

// Illustrative land-ownership split — no per-project land-type
// field exists yet, so this is aggregate demo data, not a
// per-project breakdown. Replace once GIS/land-records land the
// classification on each parcel.
// Only the first 3 categorical slots (blue/orange/aqua) validate
// against every pairing, not just neighbors — a 4th hue (yellow)
// would sit too close to orange. "Other" is a catch-all bucket
// anyway, so it gets a neutral gray instead of a 4th hue.
const LAND_OWNERSHIP = [
  { key: "private", label: "Private", value: 42, color: "var(--series-1)" },
  { key: "government", label: "Government", value: 28, color: "var(--series-2)" },
  { key: "forest", label: "Forest", value: 18, color: "var(--series-3)" },
  { key: "other", label: "Other", value: 12, color: "var(--text-muted)" },
];

function getLandSnapshot() {

  // Detailed impact figures (families, villages, displacement...)
  // live in SOCIAL_IMPACT below rather than duplicated here.
  return {
    totalLand: getOverview().landRequired,
    ownership: LAND_OWNERSHIP,
  };

}


/* ---------- FUNDING OVERVIEW ---------- */

function getFundingOverview() {

  const totalCost = getOverview().totalCost;

  // Illustrative allocation/release/utilisation split against the
  // real computed cost total — replace with PFMS/treasury
  // integration. Allocated >= Released >= Utilized, as a funding
  // pipeline (sanctioned -> disbursed -> spent).
  const allocated = Math.round(totalCost * 0.7);
  const released = Math.round(totalCost * 0.55);
  const utilized = Math.round(totalCost * 0.44);
  const remaining = totalCost - allocated;

  return {
    totalCost,
    allocated,
    released,
    utilized,
    remaining,
    actionRequired: 3,
  };

}


/* ---------- DOCUMENT VERIFICATION (feeds the Action Center) ---------- */

function getDocumentSnapshot() {

  const byStatus = { Verified: 0, "Pending Review": 0, Incomplete: 0 };

  projects.forEach((p) => {
    if (byStatus[p.documentStatus] !== undefined) {
      byStatus[p.documentStatus] += 1;
    }
  });

  return {
    verified: byStatus.Verified,
    pendingReview: byStatus["Pending Review"],
    incomplete: byStatus.Incomplete,
  };

}


/* ---------- AUTHORITY ACTION CENTER ---------- */

function getActionCenter() {

  const overview = getOverview();
  const funding = getFundingOverview();

  const pendingVerification = projects.filter(
    (p) => p.status.includes("Verification")
  ).length;

  const pendingApproval = projects.filter(
    (p) => p.status === "Under Review"
  ).length;

  return [
    {
      icon: "⚠",
      label: "Delayed",
      count: overview.delayedProjects,
      to: "/projects?status=delayed",
    },
    {
      icon: "📝",
      label: "Pending Approval",
      count: pendingApproval,
      to: "/projects?stage=Approval",
    },
    {
      icon: "⏳",
      label: "Verification Pending",
      count: pendingVerification,
      to: "/projects?stage=Survey",
    },
    {
      icon: "₹",
      label: "Funding Issues",
      count: funding.actionRequired,
      to: "/funding?status=pending",
    },
  ];

}


/* ---------- RECENT ACTIVITY ---------- */

// Illustrative activity feed — replace with an audit-log / events API.
const RECENT_ACTIVITY = [
  {
    time: "20 min ago",
    project: "Mumbai-Nagpur Expressway",
    description: "Survey verification updated",
  },
  {
    time: "2 hrs ago",
    project: "Coastal Highway Project",
    description: "Proposal returned for correction",
  },
  {
    time: "Yesterday",
    project: "Bengaluru Metro Extension",
    description: "Project marked as approved",
  },
  {
    time: "Yesterday",
    project: "Eastern Railway Expansion",
    description: "New survey documents uploaded",
  },
  {
    time: "2 days ago",
    project: "Rajasthan Solar Park",
    description: "Village verification scheduled",
  },
];


/* ---------- WORKFLOW / PIPELINE SUMMARY ---------- */

// Projects in data/projects.js only cover mid-pipeline stages.
// "Proposal" (new intake), "Compensation" (award/disbursement),
// "Funding" (release against an approved project) and "Monitoring"
// (post-approval implementation) are illustrative until those
// queues exist as real data.
const PIPELINE_EXTRA = {
  Proposal: 5,
  Compensation: 3,
  Funding: 4,
  Monitoring: 8,
};

const STAGE_ORDER = [
  "Proposal",
  "Verification",
  "Survey",
  "Acquisition",
  "Compensation",
  "Approval",
  "Funding",
  "Monitoring",
];

function getWorkflowStages() {

  const counts = Object.fromEntries(
    STAGE_ORDER.map((stage) => [stage, PIPELINE_EXTRA[stage] || 0])
  );

  projects.forEach((p) => {
    const stage = getWorkflowStage(p.status);
    // "Completed" is a real stage (see statusHelpers.js) but isn't
    // shown on this strip — the Project Status donut and KPI row
    // already cover it.
    if (stage && counts[stage] !== undefined) {
      counts[stage] += 1;
    }
  });

  return STAGE_ORDER.map((stage) => ({
    label: stage,
    count: counts[stage],
  }));

}


/* ---------- ACQUISITION TREND ---------- */

// Illustrative monthly trend — data/projects.js only carries each
// project's current snapshot (one `progress` value, one
// `lastUpdated` date), not a history of area acquired over time.
// Replace with a real time-series once acquisition events are
// logged. Shape matches what a line chart needs directly: an
// ordered list of {label, value}.
function getAcquisitionTrend() {

  return [
    { label: "Apr", value: 1200 },
    { label: "May", value: 1850 },
    { label: "Jun", value: 2100 },
    { label: "Jul", value: 1700 },
    { label: "Aug", value: 2600 },
    { label: "Sep", value: 3050 },
  ];

}


/* ---------- RISK MATRIX ---------- */

// Real, derived from data/projects.js: rows are each project's
// stated `risk` (likelihood), columns are a cost-tier heuristic
// standing in for "impact" (bigger project, bigger impact if it
// goes wrong) since there's no separate impact field yet.
const RISK_LEVELS = ["Low", "Medium", "High"];

function costTier(estimatedCost) {

  const cost = Number(String(estimatedCost).replace(/,/g, ""));

  if (cost < 600) return "Low";
  if (cost < 1000) return "Medium";
  return "High";

}

function getRiskMatrix() {

  const grid = RISK_LEVELS.map(() => RISK_LEVELS.map(() => 0));

  projects.forEach((p) => {

    const rowIndex = RISK_LEVELS.indexOf(p.risk);
    const colIndex = RISK_LEVELS.indexOf(costTier(p.estimatedCost));

    if (rowIndex !== -1 && colIndex !== -1) {
      grid[rowIndex][colIndex] += 1;
    }

  });

  return {
    rows: RISK_LEVELS,
    cols: RISK_LEVELS,
    rowLabel: "Likelihood (stated risk)",
    colLabel: "Impact (cost tier)",
    grid,
  };

}


/* ---------- SOCIAL IMPACT ---------- */

// Illustrative — no R&R module exists yet to source these from.
export const SOCIAL_IMPACT = [
  { icon: "👥", label: "Families Affected", value: "18,420" },
  { icon: "🏘️", label: "Villages Affected", value: "286" },
  { icon: "🚚", label: "Displacement", value: "3,840" },
  { icon: "💰", label: "Compensation Pending", value: "2,860" },
  { icon: "🏗️", label: "Rehabilitation In Progress", value: "1,240" },
];


/* ---------- OBJECTIONS ---------- */

// Illustrative — no objections/grievance module exists yet.
function getObjections() {

  const breakdown = [
    { key: "resolved", label: "Resolved", value: 2940, color: "var(--series-6)" },
    { key: "pending", label: "Pending", value: 1120, color: "var(--series-4)" },
    { key: "escalated", label: "Escalated", value: 220, color: "var(--series-5)" },
  ];

  return {
    total: breakdown.reduce((sum, b) => sum + b.value, 0),
    breakdown,
  };

}


/* ---------- DOCUMENT VERIFICATION RING ---------- */

// Real, derived from data/projects.js's documentStatus field.
function getDocumentVerificationRing() {

  const snapshot = getDocumentSnapshot();
  const total = snapshot.verified + snapshot.pendingReview + snapshot.incomplete;
  const percentVerified = total > 0 ? Math.round((snapshot.verified / total) * 100) : 0;

  return {
    percentVerified,
    verified: snapshot.verified,
    pending: snapshot.pendingReview + snapshot.incomplete,
    breakdown: [
      { key: "verified", label: "Verified", value: snapshot.verified, color: "var(--series-6)", to: "/projects?documentStatus=verified" },
      { key: "pending", label: "Pending / Incomplete", value: snapshot.pendingReview + snapshot.incomplete, color: "var(--series-4)", to: "/projects?documentStatus=pending" },
    ],
  };

}


/* ---------- UPCOMING DEADLINES ---------- */

// Illustrative — no deadline/SLA tracking exists yet per project.
export const UPCOMING_DEADLINES = [
  { date: "11 Sep", label: "Correction resubmission due", project: "Coastal Highway Project" },
  { date: "14 Sep", label: "Survey review deadline", project: "Eastern Railway Expansion" },
  { date: "18 Sep", label: "Approval decision due", project: "Mumbai-Nagpur Expressway" },
];
