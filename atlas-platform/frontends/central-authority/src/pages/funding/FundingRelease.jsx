import Timeline from "../../components/Timeline";
import { getFundingSummary, getReleaseHistory } from "../../data/fundingData";


function fmt(v) {
  return `₹ ${Math.round(v).toLocaleString("en-IN")} Cr`;
}


function FundingRelease() {

  const f = getFundingSummary();
  const history = getReleaseHistory();

  return (

    <div className="funding-release">

      <div className="dashboard-panel" style={{ marginBottom: "1rem" }}>
        <div className="dashboard-panel-header">
          <h3>Fund Release &amp; Utilization</h3>
          <span>Allocated → Released → Utilized → Remaining</span>
        </div>

        <div className="funding-flow">
          <div className="funding-flow-step">
            <span className="funding-flow-step-label">Allocated</span>
            <span className="funding-flow-step-value">{fmt(f.allocated)}</span>
          </div>
          <span className="funding-flow-arrow">→</span>
          <div className="funding-flow-step">
            <span className="funding-flow-step-label">Released</span>
            <span className="funding-flow-step-value">{fmt(f.released)}</span>
          </div>
          <span className="funding-flow-arrow">→</span>
          <div className="funding-flow-step">
            <span className="funding-flow-step-label">Utilized</span>
            <span className="funding-flow-step-value">{fmt(f.utilized)}</span>
          </div>
          <span className="funding-flow-arrow">→</span>
          <div className="funding-flow-step">
            <span className="funding-flow-step-label">Remaining</span>
            <span className="funding-flow-step-value">{fmt(f.remaining)}</span>
          </div>
        </div>

        <p className="land-note" style={{ marginTop: "0.85rem" }}>
          Utilization rate: <strong style={{ color: "var(--text-primary)" }}>{f.utilizationRate}%</strong> of released funds spent so far.
        </p>
      </div>

      <div className="dashboard-panel">
        <div className="dashboard-panel-header">
          <h3>Release History</h3>
          <span>Illustrative tranche schedule — real PFMS feed not yet integrated</span>
        </div>
        <Timeline items={history} />
      </div>

    </div>

  );

}

export default FundingRelease;
