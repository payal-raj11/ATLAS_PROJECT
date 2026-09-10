import { useState } from "react";


const FINANCIAL_YEARS = [
  "FY 2026-27",
  "FY 2025-26",
  "FY 2024-25",
];

const DATE_RANGES = [
  "Last 30 Days",
  "Last 90 Days",
  "This Financial Year",
  "All Time",
];


// None of these filters narrow the dashboard's data yet — see the
// note in dashboardData.js's getFilterOptions(). They're wired up
// as controlled UI so hooking them into getDashboardData() later
// is a matter of lifting this state up and passing the selected
// values in, not rebuilding the filter bar.
function DashboardHeader({ states = [], projectTypes = [] }) {

  const [financialYear, setFinancialYear] = useState(FINANCIAL_YEARS[0]);
  const [state, setState] = useState("All States");
  const [projectType, setProjectType] = useState("All Project Types");
  const [dateRange, setDateRange] = useState(DATE_RANGES[2]);

  return (

    <div className="dashboard-header-bar">

      <div>

        <div className="page-breadcrumb">

          <span>Central Authority</span>
          <span>›</span>
          <span className="current">Dashboard</span>

        </div>

        <h2>
          ATLAS Central Authority
        </h2>

        <p>
          National project acquisition overview.
        </p>

      </div>


      <div className="dashboard-header-filters">

        <select
          value={state}
          onChange={(event) => setState(event.target.value)}
          className="fy-select"
        >
          <option>All States</option>
          {states.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>

        <select
          value={projectType}
          onChange={(event) => setProjectType(event.target.value)}
          className="fy-select"
        >
          <option>All Project Types</option>
          {projectTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>

        <select
          value={financialYear}
          onChange={(event) => setFinancialYear(event.target.value)}
          className="fy-select"
        >
          {FINANCIAL_YEARS.map((year) => (
            <option key={year}>{year}</option>
          ))}
        </select>

        <select
          value={dateRange}
          onChange={(event) => setDateRange(event.target.value)}
          className="fy-select"
        >
          {DATE_RANGES.map((range) => (
            <option key={range}>{range}</option>
          ))}
        </select>

      </div>

    </div>

  );

}


export default DashboardHeader;
