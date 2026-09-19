import { useLandParcels, getDisputesSummary, getDisputeCases } from "../../data/landData";


function LandDisputes() {

  const parcels = useLandParcels();

  if (!parcels) {
    return <div className="land-loading">Loading land records…</div>;
  }

  const summary = getDisputesSummary(parcels);
  const cases = getDisputeCases(parcels);

  return (

    <>

      <div className="dashboard-panel">

        <div className="dashboard-panel-header">
          <h3>Issues & Disputes</h3>
          <span>Real counts from the GIS parcel dataset</span>
        </div>

        <div className="impact-grid impact-grid-3">
          <div className="impact-tile">
            <span className="impact-value">{summary.boundaryDisputes}</span>
            <span className="impact-label">Boundary Disputes</span>
          </div>
          <div className="impact-tile">
            <span className="impact-value">{summary.ownershipDisputes}</span>
            <span className="impact-label">Ownership Disputes</span>
          </div>
          <div className="impact-tile">
            <span className="impact-value">{summary.legalCases}</span>
            <span className="impact-label">Legal Cases</span>
          </div>
        </div>

      </div>


      <div className="dashboard-panel">

        <div className="dashboard-panel-header">
          <h3>Open Cases</h3>
          <span>Case IDs are illustrative — the issue type, parcel and status are real</span>
        </div>

        <div className="attention-table-wrap">

          <table className="attention-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Parcel</th>
                <th>Issue Type</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.caseId}>
                  <td>{c.caseId}</td>
                  <td>{c.parcelId}</td>
                  <td>{c.issueType}</td>
                  <td>{c.district}, {c.state}</td>
                  <td>
                    <span className={`risk-badge ${c.status === "In Progress" ? "medium" : "low"}`}>
                      <span />
                      {c.status}
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


export default LandDisputes;
