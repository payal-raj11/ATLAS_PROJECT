import { LIFECYCLE_STAGES } from "../data/mockData";
import StageTimeline from "./StageTimeline";
import StatusBadge from "./StatusBadge";
import { MapPinIcon } from "./Icons";

function formatINR(value) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function MyParcels({ parcels }) {
  return (
    <div className="page">
      <div className="page-header">
        <h1>My Land Parcels</h1>
        <p>All parcels registered against your Landowner ID across active acquisition projects.</p>
      </div>

      <div className="parcel-grid">
        {parcels.map((p) => (
          <div className="card parcel-card" key={p.id}>
            <div className="card-header">
              <div>
                <span className="parcel-card-eyebrow">
                  <MapPinIcon width={13} height={13} /> {p.projectType}
                </span>
                <h2>{p.project}</h2>
              </div>
              <StatusBadge status={LIFECYCLE_STAGES[p.currentStage]} tone="info" />
            </div>

            <dl className="detail-grid">
              <div>
                <dt>Parcel ID</dt>
                <dd>{p.id}</dd>
              </div>
              <div>
                <dt>Survey number</dt>
                <dd>{p.surveyNumber}</dd>
              </div>
              <div>
                <dt>Village</dt>
                <dd>{p.village}</dd>
              </div>
              <div>
                <dt>District / State</dt>
                <dd>
                  {p.district}, {p.state}
                </dd>
              </div>
              <div>
                <dt>Classification</dt>
                <dd>{p.classification}</dd>
              </div>
              <div>
                <dt>Area</dt>
                <dd>{p.areaAcres} acres</dd>
              </div>
              <div>
                <dt>Total compensation</dt>
                <dd>{formatINR(p.compensation.totalCompensation)}</dd>
              </div>
              <div>
                <dt>Possession status</dt>
                <dd>
                  <StatusBadge status={p.possessionStatus} />
                </dd>
              </div>
            </dl>

            <StageTimeline stages={LIFECYCLE_STAGES} currentStage={p.currentStage} compact />
          </div>
        ))}
      </div>
    </div>
  );
}
