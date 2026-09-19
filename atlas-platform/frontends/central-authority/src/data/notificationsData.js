import { projects } from "./projects";
import { getFundingOverview } from "./dashboardData";


/* =========================================================
   NOTIFICATIONS — data layer

   Every notification here is derived from real state elsewhere in
   the app (project status, risk, document status, the funding
   overview) rather than a separately-maintained alerts table —
   so a notification never drifts out of sync with the record it's
   about. The one exception (deadline reminders) is explicitly
   labeled illustrative, same as the Dashboard's own Upcoming
   Deadlines panel.
   ========================================================= */

const DEADLINES = [
  { date: "11 Sep", label: "Correction resubmission due", project: "Coastal Highway Project" },
  { date: "14 Sep", label: "Survey review deadline", project: "Eastern Railway Expansion" },
  { date: "18 Sep", label: "Approval decision due", project: "Mumbai-Nagpur Expressway" },
];

export function getNotifications() {

  const items = [];

  projects.forEach((p) => {

    if (p.status === "Under Review") {
      items.push({
        id: `approval-${p.id}`,
        type: "Approval",
        title: `${p.name} is awaiting approval decision`,
        time: p.lastUpdated,
        projectId: p.id,
      });
    }

    if (p.risk === "High") {
      items.push({
        id: `risk-${p.id}`,
        type: "Risk",
        title: `${p.name} is flagged High risk`,
        time: p.lastUpdated,
        projectId: p.id,
      });
    }

    if (p.documentStatus !== "Verified") {
      items.push({
        id: `doc-${p.id}`,
        type: "Verification",
        title: `${p.name} — documents ${p.documentStatus.toLowerCase()}`,
        time: p.lastUpdated,
        projectId: p.id,
      });
    }

  });

  DEADLINES.forEach((d, i) => {
    items.push({
      id: `deadline-${i}`,
      type: "Deadline",
      title: `${d.label} — ${d.project}`,
      time: d.date,
      projectId: projects.find((p) => p.name === d.project)?.id || null,
      illustrative: true,
    });
  });

  const funding = getFundingOverview();
  if (funding.actionRequired > 0) {
    items.push({
      id: "funding-action",
      type: "Funding",
      title: `${funding.actionRequired} projects have funding action required`,
      time: "Today",
      link: "/funding",
    });
  }

  return items;

}


export const NOTIFICATION_TYPES = ["Approval", "Risk", "Verification", "Deadline", "Funding"];

export const TYPE_COLOR = {
  Approval: "var(--series-1)",
  Risk: "#ef4444",
  Verification: "var(--series-4)",
  Deadline: "var(--series-5)",
  Funding: "var(--accent-green)",
};
