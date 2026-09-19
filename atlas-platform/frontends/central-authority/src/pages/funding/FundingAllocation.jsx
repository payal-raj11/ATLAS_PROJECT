import { getFundAllocation, getFundingSummary } from "../../data/fundingData";


function fmt(v) {
  return `₹ ${Math.round(v).toLocaleString("en-IN")} Cr`;
}


function FundingAllocation() {

  const categories = getFundAllocation();
  const { allocated } = getFundingSummary();

  return (

    <div className="funding-allocation">

      <div className="module-note">
        Where the approved ₹{Math.round(allocated).toLocaleString("en-IN")} Cr has
        been assigned. <strong>Category split is illustrative</strong> —
        land-acquisition allocation here is a planning figure, not the sum
        of individual compensation payments (those live in the
        Compensation module).
      </div>

      <div className="dashboard-panel">
        <div className="dashboard-panel-header">
          <h3>Fund Allocation</h3>
          <span>By work package</span>
        </div>

        <div className="source-list">
          {categories.map((c) => (
            <div key={c.key}>
              <div className="source-row-top">
                <span className="source-row-label">{c.label}</span>
                <span className="source-row-value">{fmt(c.amount)} · {c.pct}%</span>
              </div>
              <div className="source-track">
                <div className="source-fill" style={{ width: `${c.pct}%`, backgroundColor: c.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>

  );

}

export default FundingAllocation;
