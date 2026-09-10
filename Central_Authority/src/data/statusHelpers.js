/* =========================================================
   Shared status → bucket / stage mapping.

   Single source of truth used by the Dashboard (KPIs, donut,
   workflow strip, action center) AND the Projects page (query
   -param filtering), so a click from the Dashboard always lands
   on the same set of projects the Dashboard counted.
   ========================================================= */


// Simplified 4-state bucket used for KPI cards, the status donut,
// and GIS map markers.
export function getStatusBucket(status) {

  if (status === "Completed") {
    return "completed";
  }

  if (status.includes("Returned")) {
    return "delayed";
  }

  if (status.startsWith("Pending")) {
    return "pending";
  }

  // Under Review, Under Acquisition, Approved
  return "active";

}


export const STATUS_BUCKET_LABELS = {
  active: "Active",
  pending: "Pending",
  delayed: "Delayed",
  completed: "Completed",
};


export const STATUS_BUCKET_COLORS = {
  active: "var(--series-1)",
  pending: "var(--series-4)",
  delayed: "var(--series-5)",
  completed: "var(--series-6)",
};


// Workflow-pipeline stage used by the workflow strip and its
// click-through. Proposal / Monitoring are not represented by any
// status in data/projects.js yet (see dashboardData.js).
export function getWorkflowStage(status) {

  if (
    status === "Pending District Review" ||
    status === "Pending State Review" ||
    status.includes("Returned")
  ) {
    return "Verification";
  }

  if (
    status === "Pending Survey Verification" ||
    status === "Pending Village Verification"
  ) {
    return "Survey";
  }

  if (
    status === "Under Acquisition" ||
    status === "Pending Landowner Confirmation"
  ) {
    return "Acquisition";
  }

  if (status === "Under Review" || status === "Approved") {
    return "Approval";
  }

  if (status === "Completed") {
    return "Completed";
  }

  return null;

}
