import { getFundingSources, getFundingSummary } from "../../data/fundingData";


function fmt(v) {
  return `₹ ${Math.round(v).toLocaleString("en-IN")} Cr`;
}


function FundingSources() {

  const sources = getFundingSources();
  const { allocated } = getFundingSummary();

  return (

    <div className="funding-sources">

      <div className="module-note">
        Where the approved ₹{Math.round(allocated).toLocaleString("en-IN")} Cr comes from.{" "}
        <strong>Split by source is illustrative</strong> — replace with real
        scheme-level contribution data once that feed is connected.
      </div>

      <div className="dashboard-panel">
        <div className="dashboard-panel-header">
          <h3>Funding Sources</h3>
          <span>Share of total approved funds</span>
        </div>

        <div className="source-list">
          {sources.map((s) => (
            <div key={s.key}>
              <div className="source-row-top">
                <span className="source-row-label">{s.label}</span>
                <span className="source-row-value">{fmt(s.amount)} · {s.pct}%</span>
              </div>
              <div className="source-track">
                <div className="source-fill" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>

  );

}

export default FundingSources;
