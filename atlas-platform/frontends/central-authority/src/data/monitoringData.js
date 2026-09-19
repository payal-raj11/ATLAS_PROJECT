import { projects } from "./projects";
import { getWorkflowStage } from "./statusHelpers";


/* =========================================================
   MONITORING — data layer

   Real per-project execution data (progress %, risk, status,
   documentStatus, lastUpdated) straight from data/projects.js —
   the same source Projects and the Dashboard use. This module's
   job is the drill-down the Dashboard doesn't show: every
   project's physical progress and field-verification standing in
   one table, not just the ones currently needing attention.
   ========================================================= */

export function getProgressTracker() {

  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    state: p.state,
    stage: getWorkflowStage(p.status) || "Proposal",
    progress: p.progress,
    risk: p.risk,
    status: p.status,
    documentStatus: p.documentStatus,
    lastUpdated: p.lastUpdated,
  }));

}


export function getMonitoringSummary() {

  const tracker = getProgressTracker();

  const avgProgress = Math.round(
    tracker.reduce((s, p) => s + p.progress, 0) / tracker.length
  );

  const delayed = tracker.filter((p) => p.status.includes("Returned")).length;
  const atRisk = tracker.filter((p) => p.risk === "High").length;
  const onTrack = tracker.filter(
    (p) => p.risk !== "High" && !p.status.includes("Returned") && p.progress >= 40
  ).length;
  const earlyStage = tracker.length - delayed - atRisk - onTrack;

  return {
    avgProgress,
    onTrack,
    atRisk,
    delayed,
    earlyStage: Math.max(earlyStage, 0),
    totalProjects: tracker.length,
  };

}
