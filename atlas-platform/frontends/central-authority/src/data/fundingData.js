import { getFundingOverview } from "./dashboardData";


/* =========================================================
   FUNDING — data layer

   getFundingOverview() (Total Budget / Approved / Released /
   Utilized) is the SAME function the Dashboard's Funding panel
   uses — one source of truth, so a number never disagrees with
   itself across modules. Everything below derives from those
   four real numbers; percentage splits (sources, allocation
   categories, quarterly pacing) are illustrative until a real
   PFMS/treasury feed is integrated, and are labeled as such in
   the UI rather than presented as fact.
   ========================================================= */

export function getFundingSummary() {

  const overview = getFundingOverview();

  // "Remaining" = released funds not yet spent (the pipeline figure
  // the spec's own worked example uses), not the gap against the
  // whole project budget — that's what "Approved"/"Released" already
  // show relative to Total Budget above.
  const remaining = overview.released - overview.utilized;
  const utilizationRate = overview.released > 0
    ? Math.round((overview.utilized / overview.released) * 100)
    : 0;

  const fundingStatus =
    utilizationRate >= 80 ? "On Track" :
    utilizationRate >= 50 ? "Moderate" : "Needs Attention";

  return {
    ...overview,
    remaining,
    utilizationRate,
    fundingStatus,
    financialYear: "FY 2025–26",
  };

}


export function getFundingSources() {

  const { allocated } = getFundingOverview();

  const splits = [
    { key: "central", label: "Central Government", pct: 60, color: "var(--series-1)" },
    { key: "state", label: "State Government", pct: 30, color: "var(--series-4)" },
    { key: "scheme", label: "Other Approved Scheme", pct: 10, color: "var(--series-3)" },
  ];

  return splits.map((s) => ({
    ...s,
    amount: Math.round(allocated * (s.pct / 100)),
  }));

}


export function getFundAllocation() {

  const { allocated } = getFundingOverview();

  const categories = [
    { key: "land", label: "Land Acquisition", pct: 50, color: "var(--series-1)" },
    { key: "rehab", label: "Rehabilitation", pct: 15, color: "var(--series-5)" },
    { key: "infra", label: "Infrastructure Work", pct: 25, color: "var(--series-3)" },
    { key: "other", label: "Other Project Costs", pct: 10, color: "var(--series-4)" },
  ];

  return categories.map((c) => ({
    ...c,
    amount: Math.round(allocated * (c.pct / 100)),
  }));

}


export function getReleaseHistory() {

  const { released } = getFundingOverview();

  // Illustrative release tranches that sum to the real "released"
  // total — a stand-in for an actual PFMS release ledger.
  const shares = [0.35, 0.3, 0.2, 0.15];
  const labels = [
    { date: "Apr 2025", label: "1st Tranche Released", dept: "Ministry of Finance → State Treasury" },
    { date: "Jul 2025", label: "2nd Tranche Released", dept: "Ministry of Finance → State Treasury" },
    { date: "Oct 2025", label: "3rd Tranche Released", dept: "Ministry of Finance → State Treasury" },
    { date: "Jan 2026", label: "4th Tranche Released", dept: "Ministry of Finance → State Treasury" },
  ];

  return labels.map((l, i) => ({
    id: `release-${i}`,
    when: l.date,
    title: l.label,
    subtitle: `${l.dept} — ₹ ${Math.round(released * shares[i]).toLocaleString("en-IN")} Cr`,
  }));

}


export function getQuarterlyMonitoring() {

  const { allocated, utilized } = getFundingOverview();

  // Illustrative quarterly pacing that sums to the real allocated /
  // utilized totals — replace with actual PFMS quarterly reporting
  // once that feed exists.
  const allocatedShares = [0.22, 0.28, 0.26, 0.24];
  const utilizedShares = [0.30, 0.34, 0.28, 0.08];

  const quarters = ["Q1", "Q2", "Q3", "Q4"];

  return quarters.map((q, i) => {
    const alloc = Math.round(allocated * allocatedShares[i]);
    const used = Math.round(utilized * utilizedShares[i]);
    return {
      quarter: q,
      allocated: alloc,
      utilized: used,
      variancePct: alloc > 0 ? Math.round(((used - alloc) / alloc) * 100) : 0,
    };
  });

}
