import { projects } from "./projects";
import { getFundingOverview } from "./dashboardData";
import { getFundAllocation, getQuarterlyMonitoring } from "./fundingData";


/* =========================================================
   REPORTS — data layer

   Report card subtitles pull a real live count/total so the
   catalog page isn't just static text. Actual report generation
   (PDF/CSV export) isn't wired to a backend yet — the "Generate"
   buttons and the recent-reports list are illustrative, and the
   UI says so rather than pretending a download will work.
   ========================================================= */

export function getReportCatalog() {

  const funding = getFundingOverview();
  const highRisk = projects.filter((p) => p.risk === "High").length;

  return [
    {
      key: "project-status",
      label: "Project Status Report",
      description: `Status, progress and risk for all ${projects.length} projects`,
      icon: "▣",
    },
    {
      key: "land-acquisition",
      label: "Land Acquisition Report",
      description: "Parcel-level acquisition status across all tracked states",
      icon: "⛰",
    },
    {
      key: "funding-utilization",
      label: "Funding Utilization Report",
      description: `₹ ${funding.utilized.toLocaleString("en-IN")} Cr utilized of ₹ ${funding.totalCost.toLocaleString("en-IN")} Cr budget`,
      icon: "₹",
    },
    {
      key: "impact-assessment",
      label: "Impact Assessment Report",
      description: "Social, economic, environmental & infrastructure impact summary",
      icon: "📈",
    },
    {
      key: "risk-compliance",
      label: "Risk & Compliance Report",
      description: `${highRisk} project${highRisk === 1 ? "" : "s"} currently flagged high risk`,
      icon: "⚠",
    },
  ];

}


// Real project risk mix — feeds the Reports page's risk donut so the
// "charts" on this page are drawn from the same live data as the
// catalog subtitles above, not separately invented numbers.
export function getRiskBreakdown() {

  const counts = { Low: 0, Medium: 0, High: 0 };
  projects.forEach((p) => {
    if (counts[p.risk] !== undefined) counts[p.risk] += 1;
  });

  return [
    { label: "Low", value: counts.Low, color: "#1baf7a" },
    { label: "Medium", value: counts.Medium, color: "#f5921b" },
    { label: "High", value: counts.High, color: "#ef4444" },
  ];

}


// Re-exported so Reports.jsx has one import surface for its chart
// row — both already power the Funding module and stay in sync with
// it automatically.
export function getFundingChartData() {
  return {
    allocation: getFundAllocation(),
    quarterly: getQuarterlyMonitoring(),
  };
}


export const RECENT_REPORTS = [
  { id: "r1", name: "Project Status Report — August 2026", type: "Project Status", generatedOn: "01 Sep 2026", generatedBy: "Rajesh Kumar", format: "PDF" },
  { id: "r2", name: "Funding Utilization Report — Q1 FY26", type: "Funding", generatedOn: "15 Aug 2026", generatedBy: "State Treasury Cell", format: "XLSX" },
  { id: "r3", name: "Land Acquisition Report — Tamil Nadu", type: "Land Acquisition", generatedOn: "02 Aug 2026", generatedBy: "District Survey Office", format: "PDF" },
  { id: "r4", name: "Risk & Compliance Report — July 2026", type: "Risk & Compliance", generatedOn: "31 Jul 2026", generatedBy: "Rajesh Kumar", format: "PDF" },
];
