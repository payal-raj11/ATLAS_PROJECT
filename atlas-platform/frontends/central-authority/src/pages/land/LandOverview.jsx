import { useNavigate } from "react-router-dom";

import KpiCard from "../../components/KpiCard";
import DonutChart from "../../components/DonutChart";
import HorizontalBars from "../../components/HorizontalBars";

import {
  useLandParcels,
  computeLandStats,
  CLASSIFICATION_COLOR,
  STATUS_COLOR,
} from "../../data/landData";


function formatNumber(value) {
  return Math.round(value).toLocaleString("en-IN");
}


function LandOverview({ onOpenTab }) {

  const navigate = useNavigate();
  const features = useLandParcels();
  const stats = computeLandStats(features);

  if (!stats) {
    return <div className="land-loading">Loading land records…</div>;
  }

  const classificationData = Object.entries(stats.byClassification).map(([label, v]) => ({
    label,
    value: v.count,
    color: CLASSIFICATION_COLOR[label] || "var(--text-muted)",
  }));

  const statusBars = Object.entries(stats.byStatus)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({
      label,
      value,
      color: STATUS_COLOR[label] || "var(--text-muted)",
      to: `/land?tab=gis&status=${encodeURIComponent(label)}`,
    }));

  const topStates = Object.entries(stats.byState)
    .sort((a, b) => b[1].acres - a[1].acres)
    .map(([label, v]) => ({
      label,
      value: Math.round(v.acres),
      displayValue: `${Math.round(v.acres).toLocaleString("en-IN")} ac`,
      to: `/land?tab=gis&state=${encodeURIComponent(label)}`,
    }));

  return (

    <div className="land-overview">

      {/* ---------- LAND ACQUISITION SUMMARY ---------- */}

      <div className="summary-strip">

        <div className="summary-group">
          <span className="summary-group-title">Land</span>
          <div className="summary-row"><span className="summary-row-label">Total land tracked</span><span className="summary-row-value">{formatNumber(stats.totalAreaAcres)} ac</span></div>
          <div className="summary-row"><span className="summary-row-label">Acquired</span><span className="summary-row-value">{formatNumber(stats.acquiredArea)} ac</span></div>
          <div className="summary-row"><span className="summary-row-label">Pending</span><span className="summary-row-value">{formatNumber(stats.pendingArea)} ac</span></div>
          <div className="summary-row"><span className="summary-row-label">Parcels</span><span className="summary-row-value">{formatNumber(stats.totalParcels)}</span></div>
        </div>

        <div className="summary-group">
          <span className="summary-group-title">People</span>
          <div className="summary-row"><span className="summary-row-label">Landowners affected</span><span className="summary-row-value">{formatNumber(stats.totalOwners)}</span></div>
          <div className="summary-row"><span className="summary-row-label">Households affected</span><span className="summary-row-value">{formatNumber(stats.totalFamilies)}</span></div>
          <div className="summary-row"><span className="summary-row-label">Districts / villages</span><span className="summary-row-value">{stats.districtCount} / {stats.villageCount}</span></div>
        </div>

        <div className="summary-group">
          <span className="summary-group-title">Impact flags</span>
          <div className="summary-row"><span className="summary-row-label">Legal cases open</span><span className="summary-row-value">{stats.legalCases}</span></div>
          <div className="summary-row"><span className="summary-row-label">Boundary disputes</span><span className="summary-row-value">{stats.boundaryDisputes}</span></div>
          <div className="summary-row"><span className="summary-row-label">Ownership disputes</span><span className="summary-row-value">{stats.ownershipDisputes}</span></div>
          <div
            className="summary-row"
            style={{ cursor: "pointer" }}
            onClick={() => onOpenTab && onOpenTab("assessment")}
          >
            <span className="summary-row-label" style={{ color: "var(--accent-green)" }}>See full impact assessment →</span>
          </div>
        </div>

      </div>


      {/* ---------- LAND DETAILS ---------- */}

      <div className="dashboard-lower-grid two-col">

        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h3>Land Type / Use</h3>
            <span>{stats.totalParcels.toLocaleString("en-IN")} parcels</span>
          </div>
          <DonutChart
            data={classificationData}
            centerLabel="parcels"
            centerValue={stats.totalParcels.toLocaleString("en-IN")}
          />
        </div>

        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h3>Acquisition Status</h3>
            <span>Click a status to open it on the map</span>
          </div>
          <HorizontalBars data={statusBars} valueSuffix="" />
        </div>

      </div>


      <div className="dashboard-lower-grid two-col" style={{ marginTop: "1rem" }}>

        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h3>Land by State</h3>
            <span>By area under acquisition</span>
          </div>
          <HorizontalBars data={topStates} valueSuffix="" />
        </div>

        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h3>Ownership Type</h3>
          </div>
          <p className="land-note">
            Parcel records currently capture an individual owner name for
            effectively every listed parcel (see Land Ownership tab), but a
            private / government / community ownership-type classification
            isn't tracked in the current dataset yet.
          </p>
        </div>

      </div>


      <div className="land-summary-links">

        <button type="button" className="settings-btn" onClick={() => onOpenTab && onOpenTab("gis")}>
          Open GIS Land Map →
        </button>

        <button type="button" className="settings-btn" onClick={() => onOpenTab && onOpenTab("ownership")}>
          View Ownership &amp; Affected Parties →
        </button>

        <button type="button" className="settings-btn" onClick={() => navigate("/projects")}>
          Linked Projects →
        </button>

      </div>

    </div>

  );

}

export default LandOverview;
