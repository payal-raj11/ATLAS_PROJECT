import HorizontalBars from "../../components/HorizontalBars";

import {
  useLandParcels,
  getCompensationSummary,
  getCompensationRows,
} from "../../data/landData";


function formatNumber(value) {
  return value.toLocaleString("en-IN");
}


function LandCompensation() {

  const parcels = useLandParcels();

  if (!parcels) {
    return <div className="land-loading">Loading land records…</div>;
  }

  const summary = getCompensationSummary(parcels);
  const rows = getCompensationRows(parcels);

  const progressBars = [
    { label: "Compensation Disbursed", value: summary.avgCompensationPct, displayValue: `${summary.avgCompensationPct}%`, color: "var(--info-blue-text)" },
    { label: "Possession Taken", value: summary.avgPossessionPct, displayValue: `${summary.avgPossessionPct}%`, color: "var(--series-4)" },
    { label: "Rehabilitation & Resettlement", value: summary.avgRrPct, displayValue: `${summary.avgRrPct}%`, color: "var(--accent-green)" },
  ];

  return (

    <>

      <div className="dashboard-panel">

        <div className="dashboard-panel-header">
          <h3>Compensation & Rehabilitation</h3>
          <span>Averaged across all mapped parcels</span>
        </div>

        <div className="panel-stat-callout">
          <span className="panel-stat-value">₹ {formatNumber(summary.totalCompensationCr)} Cr</span>
          <span className="panel-stat-label">Total compensation across mapped parcels</span>
        </div>

        <HorizontalBars data={progressBars} compact />

      </div>


      <div className="dashboard-panel">

        <div className="dashboard-panel-header">
          <h3>Parcel Compensation</h3>
          <span>Highest-value parcels, real data from the GIS dataset</span>
        </div>

        <div className="attention-table-wrap">

          <table className="attention-table">
            <thead>
              <tr>
                <th>Parcel ID</th>
                <th>Owner</th>
                <th>Land Area (ac)</th>
                <th>Compensation</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.parcelId}>
                  <td>{row.parcelId}</td>
                  <td>{row.owner}</td>
                  <td>{row.areaAcres}</td>
                  <td>₹ {formatNumber(Math.round(row.compensation / 1e5))} L</td>
                  <td>
                    <span className={`status-badge ${row.status.toLowerCase()}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>

      </div>

    </>

  );

}


export default LandCompensation;
