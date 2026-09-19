import { useState } from "react";

import DonutChart from "../../components/DonutChart";
import HorizontalBars from "../../components/HorizontalBars";

import {
  useLandParcels,
  getClassificationBreakdown,
  getOwnershipBreakdown,
  getAcquisitionStatusBreakdown,
  withStatusLinks,
} from "../../data/landData";


const SUB_TABS = ["Land Type", "Ownership Details", "Acquisition Status"];


function formatNumber(value) {
  return value.toLocaleString("en-IN");
}


function LandDetails() {

  const parcels = useLandParcels();
  const [activeTab, setActiveTab] = useState(SUB_TABS[0]);

  if (!parcels) {
    return <div className="land-loading">Loading land records…</div>;
  }

  const classification = getClassificationBreakdown(parcels);
  const ownership = getOwnershipBreakdown(parcels);
  const status = withStatusLinks(getAcquisitionStatusBreakdown(parcels));

  const totalArea = classification.reduce((sum, c) => sum + c.value, 0);

  return (

    <div className="dashboard-panel">

      <div className="dashboard-panel-header">
        <h3>Land Details</h3>
      </div>

      <nav className="record-tabs land-details-tabs">
        {SUB_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === "Land Type" && (
        <div className="land-details-split">

          <DonutChart
            data={classification}
            centerLabel="Total Area"
            centerValue={`${formatNumber(totalArea)} ac`}
          />

          <ul className="land-details-list">
            {classification.map((c) => (
              <li key={c.label}>
                <span className="land-details-dot" style={{ backgroundColor: c.color }} />
                <span className="land-details-list-label">{c.label}</span>
                <span className="land-details-list-value">{formatNumber(c.value)} ac</span>
                <span className="land-details-list-pct">{c.percent}%</span>
              </li>
            ))}
          </ul>

        </div>
      )}

      {activeTab === "Ownership Details" && (
        <HorizontalBars data={ownership} valueSuffix="" />
      )}

      {activeTab === "Acquisition Status" && (
        <HorizontalBars data={status} valueSuffix="" />
      )}

    </div>

  );

}


export default LandDetails;
