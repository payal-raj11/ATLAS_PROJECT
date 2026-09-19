import { getQuarterlyMonitoring } from "../../data/fundingData";


function fmt(v) {
  return `₹ ${Math.round(v).toLocaleString("en-IN")} Cr`;
}


function FundingMonitoring() {

  const quarters = getQuarterlyMonitoring();
  const maxValue = Math.max(...quarters.flatMap((q) => [q.allocated, q.utilized]), 1);

  return (

    <div className="funding-monitoring">

      <div className="module-note">
        <strong>Illustrative quarterly pacing</strong> — the current /
        remaining totals above are real; this quarter-by-quarter split is a
        stand-in for real PFMS reporting so bottlenecks can be spotted at a
        glance once that feed exists.
      </div>

      <div className="dashboard-panel">
        <div className="dashboard-panel-header">
          <h3>Budget vs Utilization</h3>
          <span>Allocated vs actually utilized, by quarter</span>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Period</th><th>Allocated</th><th>Utilized</th><th>Variance</th></tr>
            </thead>
            <tbody>
              {quarters.map((q) => (
                <tr key={q.quarter}>
                  <td>{q.quarter}</td>
                  <td>{fmt(q.allocated)}</td>
                  <td>{fmt(q.utilized)}</td>
                  <td>
                    <span className={`risk-badge ${q.variancePct >= -10 ? "low" : q.variancePct >= -30 ? "medium" : "high"}`}>
                      <span />
                      {q.variancePct > 0 ? "+" : ""}{q.variancePct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="funding-monitoring-bars">
          {quarters.map((q) => (
            <div key={q.quarter} className="fm-bar-group">
              <div className="fm-bar-pair">
                <div className="fm-bar" style={{ height: `${(q.allocated / maxValue) * 100}%`, backgroundColor: "var(--series-1)" }} title={`Allocated ${fmt(q.allocated)}`} />
                <div className="fm-bar" style={{ height: `${(q.utilized / maxValue) * 100}%`, backgroundColor: "var(--accent-green)" }} title={`Utilized ${fmt(q.utilized)}`} />
              </div>
              <span className="fm-bar-label">{q.quarter}</span>
            </div>
          ))}
        </div>

        <div className="prog-legend" style={{ marginTop: "0.5rem" }}>
          <span><span className="sw" style={{ background: "var(--series-1)", display: "inline-block", width: 8, height: 8, borderRadius: 2, marginRight: 5 }}></span>Allocated</span>
          <span><span className="sw" style={{ background: "var(--accent-green)", display: "inline-block", width: 8, height: 8, borderRadius: 2, marginRight: 5 }}></span>Utilized</span>
        </div>
      </div>

    </div>

  );

}

export default FundingMonitoring;
