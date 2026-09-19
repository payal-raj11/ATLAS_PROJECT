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
    activity: { recent: withProjectIds(RECENT_ACTIVITY) },
    attention: getAttentionList(),
    actionCenter: getActionCenter(),
    filters: getFilterOptions(),
    trend: getAcquisitionTrend(),
    risk: getRiskBreakdown(),
    socialImpact: SOCIAL_IMPACT,
    objections: getObjections(),
    documentVerification: getDocumentVerificationRing(),
    deadlines: withProjectIds(UPCOMING_DEADLINES),
  };

}


/* ---------- PROJECT NAME -> ID LOOKUP ---------- */

// Recent Activity and Upcoming Deadlines are illustrative lists that
// happen to reference real project names — this resolves each entry
// to its real project id so the (new) Timeline component can link
// straight to the project instead of just displaying text.
function withProjectIds(items) {

  return items.map((item) => {

    const match = projects.find((p) => p.name === item.project);

    return {
      ...item,
      projectId: match ? match.id : null,
    };

  });

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
// Explicit vibrant hex (not CSS vars) so this matches the same
// palette used by the Project Workflow chart and Reports' column
// chart — "Other" stays a neutral gray since it's a catch-all bucket,
// not a real category.
const LAND_OWNERSHIP = [
  { key: "private", label: "Private", value: 42, color: "#3987e5" },
  { key: "government", label: "Government", value: 28, color: "#f5921b" },
  { key: "forest", label: "Forest", value: 18, color: "#1baf7a" },
  { key: "other", label: "Other", value: 12, color: "#94a3b8" },
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

export function getFundingOverview() {

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
      label: "Delayed",
      count: overview.delayedProjects,
      to: "/projects?status=delayed",
    },
    {
      label: "Pending Approval",
      count: pendingApproval,
      to: "/projects?stage=Approval",
    },
    {
      label: "Verification Pending",
      count: pendingVerification,
      to: "/projects?stage=Survey",
    },
    {
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


/* ---------- RISK BREAKDOWN ---------- */

// Real, derived from data/projects.js: each row is a stated `risk`
// level (likelihood); within a row, projects are split by a
// cost-tier heuristic standing in for "impact" (bigger project,
// bigger impact if it goes wrong) since there's no separate impact
// field yet. Shape matches RiskBars.jsx directly — rendered as
// grouped bars (row length = count) with cost-tier as a lightness
// step within each bar, rather than a 3x3 numeric grid.
const RISK_LEVELS = ["Low", "Medium", "High"];

function costTier(estimatedCost) {

  const cost = Number(String(estimatedCost).replace(/,/g, ""));

  if (cost < 600) return "Low";
  if (cost < 1000) return "Medium";
  return "High";

}

function getRiskBreakdown() {

  const rows = RISK_LEVELS.map((risk) => {

    const matching = projects.filter((p) => p.risk === risk);

    const segments = RISK_LEVELS.map((tier) => ({
      tier,
      value: matching.filter((p) => costTier(p.estimatedCost) === tier).length,
    }));

    return {
      risk,
      total: matching.length,
      segments,
      to: `/projects?risk=${risk}`,
    };

  });

  return {
    costTiers: RISK_LEVELS,
    rows,
  };

}


/* ---------- SOCIAL IMPACT ---------- */

// Illustrative — no R&R module exists yet to source these from.
export const SOCIAL_IMPACT = [
  { label: "Families Affected", value: "18,420" },
  { label: "Villages Affected", value: "286" },
  { label: "Displacement", value: "3,840" },
  { label: "Compensation Pending", value: "2,860" },
  { label: "Rehabilitation In Progress", value: "1,240" },
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

// Real, derived from data/projects.js's documentStatus field. Shaped
// as three independent progress rings (a "stacked"/concentric donut)
// rather than collapsing Pending Review + Incomplete into one bucket
// — the real three-way split reads more clearly as three rings than
// it did as two pictogram colors.
function getDocumentVerificationRing() {

  const snapshot = getDocumentSnapshot();
  const total = snapshot.verified + snapshot.pendingReview + snapshot.incomplete;
  const pct = (n) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const percentVerified = pct(snapshot.verified);

  return {
    percentVerified,
    verified: snapshot.verified,
    pending: snapshot.pendingReview + snapshot.incomplete,
    rings: [
      {
        key: "verified",
        label: "Verified",
        sub: "Documents fully verified",
        count: snapshot.verified,
        pct: percentVerified,
        color: "#10b981",
        to: "/projects?documentStatus=verified",
      },
      {
        key: "pending",
        label: "Pending Review",
        sub: "Submitted, awaiting review",
        count: snapshot.pendingReview,
        pct: pct(snapshot.pendingReview),
        color: "#f5921b",
        to: "/projects?documentStatus=pending",
      },
      {
        key: "incomplete",
        label: "Incomplete",
        sub: "Missing required documents",
        count: snapshot.incomplete,
        pct: pct(snapshot.incomplete),
        color: "#ef4444",
        to: "/projects?documentStatus=incomplete",
      },
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
