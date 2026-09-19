import KpiCard from "../../components/KpiCard";
import HorizontalBars from "../../components/HorizontalBars";

import {
  useLandParcels,
  computeLandStats,
  RECORD_STATUS_COLOR,
} from "../../data/landData";


function formatNumber(value) {
  return Math.round(value).toLocaleString("en-IN");
}


function LandOwnership() {

  const features = useLandParcels();
  const stats = computeLandStats(features);

  if (!stats) {
    return <div className="land-loading">Loading ownership records…</div>;
  }

  const recordStatusBars = Object.entries(stats.byRecordStatus)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({
      label,
      value,
      color: RECORD_STATUS_COLOR[label] || "var(--text-muted)",
    }));

  const soleOwnership = stats.totalParcels - stats.jointOwnershipParcels;

  return (

    <div className="land-ownership">

      <div className="module-note">
        <strong>Aggregated view.</strong> The numbers below are computed
        across all {formatNumber(stats.totalParcels)} tracked parcels.
        Individual owner names and per-parcel detail are available to
        authorized users through the GIS Land Map — click any parcel to
        open its record.
      </div>

      <div className="dashboard-grid dashboard-grid-5" style={{ marginBottom: "1.1rem" }}>

        <KpiCard label="Landowners Affected" value={formatNumber(stats.totalOwners)} note="Across all tracked parcels" />
        <KpiCard label="Households Affected" value={formatNumber(stats.totalFamilies)} note="Per parcel records" />
        <KpiCard label="Parcels" value={formatNumber(stats.totalParcels)} note={`${stats.districtCount} districts`} />
        <KpiCard label="Joint Ownership" value={formatNumber(stats.jointOwnershipParcels)} note="Parcels with >1 owner" />
        <KpiCard label="Sole Ownership" value={formatNumber(soleOwnership)} note="Single-owner parcels" />

      </div>

      <div className="dashboard-lower-grid two-col">

        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h3>Ownership Record Status</h3>
            <span>Verification state of the ownership record itself</span>
          </div>
          <HorizontalBars data={recordStatusBars} valueSuffix="" />
        </div>

        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h3>Government / Community / Private Split</h3>
          </div>
          <p className="land-note">
            Not yet tracked — parcel records store an individual owner name
            but no ownership-type field, so a private / government /
            community breakdown can't be computed accurately from current
            data. This would need a schema change upstream (land records
            department) rather than a dashboard-side estimate.
          </p>
        </div>

      </div>

    </div>

  );

}

export default LandOwnership;
