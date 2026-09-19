import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import KpiCard from "../components/KpiCard";
import { getProgressTracker, getMonitoringSummary } from "../data/monitoringData";
import { useLandParcels } from "../data/landData";


function RiskBadge({ level }) {
  return (
    <span className={`risk-badge ${level.toLowerCase()}`}>
      <span />
      {level}
    </span>
  );
}


function ProgressCell({ value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div className="bar-row-track" style={{ width: 90 }}>
        <div
          className="bar-row-fill"
          style={{
            width: `${value}%`,
            backgroundColor: value >= 70 ? "var(--accent-green)" : value >= 35 ? "#f59e0b" : "#ef4444",
          }}
        />
      </div>
      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{value}%</span>
    </div>
  );
}


function Monitoring() {

  const navigate = useNavigate();
  const tracker = getProgressTracker();
  const summary = getMonitoringSummary();
  const features = useLandParcels();

  const fieldByState = useMemo(() => {

    if (!features) return null;

    const byState = {};

    features.forEach((f) => {
      const p = f.properties;
      if (!byState[p.state]) {
        byState[p.state] = { possessionSum: 0, compensationSum: 0, count: 0 };
      }
      byState[p.state].possessionSum += p.possession_percentage;
      byState[p.state].compensationSum += p.compensation_percentage;
      byState[p.state].count += 1;
    });

    return Object.entries(byState)
      .map(([state, v]) => ({
        state,
        avgPossession: Math.round(v.possessionSum / v.count),
        avgCompensation: Math.round(v.compensationSum / v.count),
      }))
      .sort((a, b) => b.avgPossession - a.avgPossession);

  }, [features]);

  return (

    <div className="central-dashboard tabbed-module">

      <div className="tabbed-module-header">
        <h2>Monitoring</h2>
        <p>
          Physical execution progress and field-verification standing for
          every project — the drill-down behind the Dashboard's summary
          cards, not a second copy of them.
        </p>
      </div>

      <div className="dashboard-grid dashboard-grid-5" style={{ marginBottom: "1.1rem" }}>
        <KpiCard label="Avg. Progress" value={`${summary.avgProgress}%`} note={`${summary.totalProjects} projects tracked`} />
        <KpiCard label="On Track" value={summary.onTrack} note="Progress ≥ 40%, not high-risk" />
        <KpiCard label="At Risk" value={summary.atRisk} note="High risk rating" tone={summary.atRisk > 0 ? "warning" : "default"} to="/projects?risk=High" />
        <KpiCard label="Delayed" value={summary.delayed} note="Returned for correction" tone={summary.delayed > 0 ? "warning" : "default"} to="/projects?status=delayed" />
        <KpiCard label="Early Stage" value={summary.earlyStage} note="Progress below 40%" />
      </div>

      <div className="dashboard-panel" style={{ marginBottom: "1.1rem" }}>
        <div className="dashboard-panel-header">
          <h3>Project Progress Tracker</h3>
          <span>Click a row to open the project</span>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>State</th>
                <th>Stage</th>
                <th>Progress</th>
                <th>Risk</th>
                <th>Documents</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {tracker.map((p) => (
                <tr
                  key={p.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/projects/${p.id}`)}
                >
                  <td>{p.name}</td>
                  <td>{p.state}</td>
                  <td>{p.stage}</td>
                  <td><ProgressCell value={p.progress} /></td>
                  <td><RiskBadge level={p.risk} /></td>
                  <td>{p.documentStatus}</td>
                  <td>{p.lastUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-panel">
        <div className="dashboard-panel-header">
          <h3>Field Verification — Possession &amp; Compensation</h3>
          <span>Average % across tracked parcels, by state</span>
        </div>

        {!fieldByState ? (
          <div className="land-loading">Loading field data…</div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>State</th>
                  <th>Avg. Possession Taken</th>
                  <th>Avg. Compensation Paid</th>
                </tr>
              </thead>
              <tbody>
                {fieldByState.map((row) => (
                  <tr key={row.state}>
                    <td>{row.state}</td>
                    <td><ProgressCell value={row.avgPossession} /></td>
                    <td><ProgressCell value={row.avgCompensation} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>

  );

}

export default Monitoring;
