import KpiCard from "../../components/KpiCard";
import { getFundingSummary } from "../../data/fundingData";


function fmt(v) {
  return `₹ ${Math.round(v).toLocaleString("en-IN")} Cr`;
}


function FundingOverview() {

  const f = getFundingSummary();

  return (

    <div className="funding-overview">

      <div className="dashboard-grid dashboard-grid-5" style={{ marginBottom: "1.1rem" }}>
        <KpiCard label="Total Budget" value={fmt(f.totalCost)} note={f.financialYear} />
        <KpiCard label="Approved" value={fmt(f.allocated)} note={`${Math.round((f.allocated / f.totalCost) * 100)}% of budget`} />
        <KpiCard label="Released" value={fmt(f.released)} note={`${Math.round((f.released / f.allocated) * 100)}% of approved`} />
        <KpiCard label="Utilized" value={fmt(f.utilized)} note={`${f.utilizationRate}% of released`} />
        <KpiCard label="Remaining" value={fmt(f.remaining)} note="Released, not yet utilized" tone={f.fundingStatus === "Needs Attention" ? "warning" : "default"} />
      </div>

      <div className="dashboard-panel">
        <div className="dashboard-panel-header">
          <h3>Funding Status</h3>
          <span>Utilization rate against released funds</span>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Metric</th><th>Amount</th></tr>
            </thead>
            <tbody>
              <tr><td>Total Budget</td><td>{fmt(f.totalCost)}</td></tr>
              <tr><td>Approved</td><td>{fmt(f.allocated)}</td></tr>
              <tr><td>Released</td><td>{fmt(f.released)}</td></tr>
              <tr><td>Utilized</td><td>{fmt(f.utilized)}</td></tr>
              <tr><td>Remaining</td><td>{fmt(f.remaining)}</td></tr>
              <tr>
                <td>Status</td>
                <td>
                  <span className={`risk-badge ${f.fundingStatus === "On Track" ? "low" : f.fundingStatus === "Moderate" ? "medium" : "high"}`}>
                    <span />
                    {f.fundingStatus}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

  );

}

export default FundingOverview;
