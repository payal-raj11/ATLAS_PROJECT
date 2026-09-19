import { useLandParcels, computeLandStats } from "../../data/landData";


function formatNumber(value) {
  return Math.round(value).toLocaleString("en-IN");
}


function SeverityBadge({ level }) {
  const cls = level.toLowerCase();
  return (
    <span className={`risk-badge ${cls}`}>
      <span />
      {level}
    </span>
  );
}


function LandImpactAssessment() {

  const features = useLandParcels();
  const stats = computeLandStats(features);

  if (!stats) {
    return <div className="land-loading">Loading assessment data…</div>;
  }

  const residential = stats.byClassification.Residential?.count || 0;
  const agriAcres =
    (stats.byClassification.Agricultural?.acres || 0) +
    (stats.byClassification["Multi-crop"]?.acres || 0);

  const rows = [
    {
      category: "Households",
      affected: `${formatNumber(stats.totalFamilies)} households`,
      severity: "High",
      risk: "Medium",
      status: "Reviewed",
      mitigation: "Rehabilitation & resettlement (R&R) package per policy",
      authority: "District R&R Authority",
    },
    {
      category: "Agricultural land",
      affected: `${formatNumber(agriAcres)} acres`,
      severity: "Medium",
      risk: "Medium",
      status: "Reviewed",
      mitigation: "Market-value compensation + livelihood restoration support",
      authority: "State Revenue Department",
    },
    {
      category: "Residential structures",
      affected: `${formatNumber(residential)} parcels`,
      severity: "High",
      risk: "Medium",
      status: "In Progress",
      mitigation: "Structure valuation + relocation assistance",
      authority: "District R&R Authority",
    },
    {
      category: "Legal disputes",
      affected: `${formatNumber(stats.legalCases)} parcels`,
      severity: "High",
      risk: "High",
      status: "Open",
      mitigation: "Fast-track tribunal review; hold disbursal pending resolution",
      authority: "Land Acquisition Tribunal",
    },
    {
      category: "Boundary disputes",
      affected: `${formatNumber(stats.boundaryDisputes)} parcels`,
      severity: "Medium",
      risk: "Medium",
      status: "In Progress",
      mitigation: "Joint resurvey with revenue & settlement officials",
      authority: "District Survey Office",
    },
    {
      category: "Ownership disputes",
      affected: `${formatNumber(stats.ownershipDisputes)} parcels`,
      severity: "Medium",
      risk: "High",
      status: "Open",
      mitigation: "Title verification & succession record reconciliation",
      authority: "District Revenue Office",
    },
    {
      category: "Missing documentation",
      affected: `${formatNumber(stats.missingDocuments)} parcels`,
      severity: "Low",
      risk: "Medium",
      status: "In Progress",
      mitigation: "Document collection drive before award finalization",
      authority: "Project Verification Cell",
    },
  ];

  return (

    <div className="land-impact-assessment">

      <div className="module-note">
        Affected quantities are computed from real parcel records.{" "}
        <strong>Severity, risk, status, mitigation and responsible authority
        are illustrative</strong> — a formal risk-scoring and
        mitigation-tracking workflow isn't integrated yet.
      </div>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Impact Category</th>
              <th>Affected</th>
              <th>Severity</th>
              <th>Risk</th>
              <th>Status</th>
              <th>Recommended Mitigation</th>
              <th>Responsible Authority</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.category}>
                <td>{row.category}</td>
                <td>{row.affected}</td>
                <td><SeverityBadge level={row.severity} /></td>
                <td><SeverityBadge level={row.risk} /></td>
                <td>{row.status}</td>
                <td>{row.mitigation}</td>
                <td>{row.authority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>

  );

}

export default LandImpactAssessment;
