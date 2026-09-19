import GISMap from "../../components/project-details/GISMap";
import {
  ArrowLeft,
  MapPin,
  CheckCircle2,
  Clock3,
  FileText,
  Users,
  IndianRupee,
  Map,
  ClipboardCheck,
  Bell,
  Brain,
  CalendarDays,
  Building2,
  Ruler,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

import { useState } from "react";

const tabs = [
  {
    id: "overview",
    label: "Overview",
    icon: Building2,
  },
  {
    id: "land",
    label: "Land Details",
    icon: Ruler,
  },
  {
    id: "gis",
    label: "GIS Map",
    icon: Map,
  },
  {
    id: "landowners",
    label: "Landowners",
    icon: Users,
  },
  {
    id: "compensation",
    label: "Compensation",
    icon: IndianRupee,
  },
  {
    id: "progress",
    label: "Acquisition Progress",
    icon: TrendingUp,
  },
  {
    id: "survey",
    label: "Survey",
    icon: ClipboardCheck,
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
  },
  {
    id: "documents",
    label: "Documents",
    icon: FileText,
  },
  {
    id: "prediction",
    label: "ML Prediction",
    icon: Brain,
  },
  {
    id: "timeline",
    label: "Timeline",
    icon: CalendarDays,
  },
];

const overviewStats = [
  {
    label: "Total Land Required",
    value: "1,250 ha",
    icon: Ruler,
    type: "blue",
  },
  {
    label: "Land Acquired",
    value: "900 ha",
    icon: CheckCircle2,
    type: "green",
  },
  {
    label: "Landowners",
    value: "2,486",
    icon: Users,
    type: "teal",
  },
  {
    label: "Compensation",
    value: "₹482 Cr",
    icon: IndianRupee,
    type: "orange",
  },
];

function StatusBadge() {
  return (
    <span className="project-detail-active">
      <span className="project-detail-status-dot"></span>
      Active
    </span>
  );
}

function ProgressBadge() {
  return (
    <span className="project-detail-progress-badge">
      72% Complete
    </span>
  );
}

function Overview() {
  return (
    <div className="project-detail-content">

      <div className="project-detail-stats">

        {overviewStats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div className="project-detail-stat" key={stat.label}>

              <div className={`project-detail-stat-icon ${stat.type}`}>
                <Icon size={18} />
              </div>

              <div>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>

            </div>
          );
        })}

      </div>

      <div className="project-detail-two-column">

        <section className="project-detail-card">

          <div className="project-detail-card-header">
            <div>
              <h2>Project Information</h2>
              <p>Basic information about this project</p>
            </div>
          </div>

          <div className="project-info-grid">

            <div className="project-info-item">
              <span>Project ID</span>
              <strong>LA001</strong>
            </div>

            <div className="project-info-item">
              <span>Project Type</span>
              <strong>National Highway</strong>
            </div>

            <div className="project-info-item">
              <span>State</span>
              <strong>Punjab</strong>
            </div>

            <div className="project-info-item">
              <span>District</span>
              <strong>Ludhiana</strong>
            </div>

            <div className="project-info-item">
              <span>Estimated Cost</span>
              <strong>₹680 Cr</strong>
            </div>

            <div className="project-info-item">
              <span>Project Authority</span>
              <strong>State Highway Authority</strong>
            </div>

          </div>

        </section>


        <section className="project-detail-card">

          <div className="project-detail-card-header">

            <div>
              <h2>Acquisition Progress</h2>
              <p>Current project completion status</p>
            </div>

            <strong className="project-progress-number">
              72%
            </strong>

          </div>

          <div className="large-progress">

            <div className="large-progress-bar">
              <span style={{ width: "72%" }}></span>
            </div>

            <div className="large-progress-labels">
              <span>Acquisition Progress</span>
              <strong>72 of 100%</strong>
            </div>

          </div>

          <div className="progress-mini-list">

            <div>
              <span>Survey</span>
              <strong>92%</strong>
            </div>

            <div>
              <span>Land Acquisition</span>
              <strong>78%</strong>
            </div>

            <div>
              <span>Compensation</span>
              <strong>64%</strong>
            </div>

            <div>
              <span>Documentation</span>
              <strong>81%</strong>
            </div>

          </div>

        </section>

      </div>


      <div className="project-detail-two-column">

        <section className="project-detail-card">

          <div className="project-detail-card-header">

            <div>
              <h2>Location</h2>
              <p>Project geographic information</p>
            </div>

            <MapPin size={18} className="project-card-header-icon" />

          </div>

         <div className="location-box">
  <MapPin size={20} />

  <div>
    <strong>Ludhiana, Punjab</strong>

    <span>
      NH Highway Expansion Corridor
    </span>
  </div>
</div>

<div style={{ marginTop: "18px" }}>
  <GISMap
    state="Punjab"
    height="280px"
  />
</div>

        </section>


        <section className="project-detail-card">

          <div className="project-detail-card-header">

            <div>
              <h2>Recent Activity</h2>
              <p>Latest project updates</p>
            </div>

            <Clock3 size={18} className="project-card-header-icon" />

          </div>

          <div className="activity-list">

            <div className="activity-item">

              <span className="activity-dot blue"></span>

              <div>
                <strong>Land acquisition updated</strong>
                <span>Today, 09:20 AM</span>
              </div>

            </div>

            <div className="activity-item">

              <span className="activity-dot green"></span>

              <div>
                <strong>Survey verification completed</strong>
                <span>Yesterday, 04:15 PM</span>
              </div>

            </div>

            <div className="activity-item">

              <span className="activity-dot orange"></span>

              <div>
                <strong>Compensation records updated</strong>
                <span>08 Sep 2026</span>
              </div>

            </div>

          </div>

        </section>

      </div>

    </div>
  );
}


function LandDetails() {
  return (
    <div className="project-detail-content">

      <section className="project-detail-card">

        <div className="project-detail-card-header">
          <div>
            <h2>Land Details</h2>
            <p>Land requirement and acquisition information</p>
          </div>
        </div>

        <div className="project-info-grid">

          <div className="project-info-item">
            <span>Total Land Required</span>
            <strong>1,250 ha</strong>
          </div>

          <div className="project-info-item">
            <span>Land Acquired</span>
            <strong>900 ha</strong>
          </div>

          <div className="project-info-item">
            <span>Pending Land</span>
            <strong>350 ha</strong>
          </div>

          <div className="project-info-item">
            <span>Affected Villages</span>
            <strong>42</strong>
          </div>

          <div className="project-info-item">
            <span>Government Land</span>
            <strong>280 ha</strong>
          </div>

          <div className="project-info-item">
            <span>Private Land</span>
            <strong>970 ha</strong>
          </div>

        </div>

      </section>

    </div>
  );
}


function GenericSection({ title, description, icon: Icon }) {
  return (
    <div className="project-detail-content">

      <section className="project-detail-card project-empty-section">

        <div className="project-empty-icon">
          <Icon size={25} />
        </div>

        <h2>{title}</h2>

        <p>{description}</p>

        <button className="project-primary-button">
          View Details
        </button>

      </section>

    </div>
  );
}


export default function ProjectDetails() {

  const [activeTab, setActiveTab] = useState("overview");
const authorityState = "Punjab";
  const renderContent = () => {

    switch (activeTab) {

      case "overview":
        return <Overview />;

      case "land":
        return <LandDetails />;

      case "gis":
  return (
    <div className="project-detail-content">
      <section className="project-detail-card">
        <div className="project-detail-card-header">
          <div>
            <h2>GIS Mapping</h2>
            <p>
              View project parcels and geographic information
            </p>
          </div>

          <Map
            size={18}
            className="project-card-header-icon"
          />
        </div>

        <GISMap
        state={authorityState}
  height="600px" />
      </section>
    </div>
  );

      case "landowners":
        return (
          <GenericSection
            title="Landowners"
            description="View and manage landowner records associated with this project."
            icon={Users}
          />
        );

      case "compensation":
        return (
          <GenericSection
            title="Compensation"
            description="Track compensation assessment, approvals and payments."
            icon={IndianRupee}
          />
        );

      case "progress":
        return (
          <GenericSection
            title="Acquisition Progress"
            description="Track every stage of the land acquisition process."
            icon={TrendingUp}
          />
        );

      case "survey":
        return (
          <GenericSection
            title="Survey"
            description="Review survey records and verification status."
            icon={ClipboardCheck}
          />
        );

      case "notifications":
        return (
          <GenericSection
            title="Notifications"
            description="View notifications and project-related alerts."
            icon={Bell}
          />
        );

      case "documents":
        return (
          <GenericSection
            title="Documents"
            description="Access project documents, approvals and records."
            icon={FileText}
          />
        );

      case "prediction":
        return (
          <GenericSection
            title="ML Prediction"
            description="Review machine-learning based project risk and completion predictions."
            icon={Brain}
          />
        );

      case "timeline":
        return (
          <GenericSection
            title="Timeline"
            description="View important project milestones and activities."
            icon={CalendarDays}
          />
        );

      default:
        return <Overview />;
    }
  };


  return (
    <main className="project-details-page">

      {/* =====================================
          TOP PROJECT HEADER
      ===================================== */}

     <section className="project-detail-card">
  <div className="project-detail-card-header">
    <div>
      <h2>Location</h2>
      <p>Project geographic information</p>
    </div>

    <MapPin
      size={18}
      className="project-card-header-icon"
    />
  </div>

  <div className="location-heading">
    <div className="location-heading-icon">
      <MapPin size={17} />
    </div>

    <div>
      <strong>Ludhiana, Punjab</strong>

      <span>
        NH Highway Expansion Corridor
      </span>
    </div>
  </div>

  
</section>


      {/* =====================================
          TABS
      ===================================== */}

      <section className="project-detail-tabs-wrapper">

        <div className="project-detail-tabs">

          {tabs.map((tab) => {

            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                className={
                  activeTab === tab.id
                    ? "project-detail-tab active"
                    : "project-detail-tab"
                }
                onClick={() => setActiveTab(tab.id)}
              >

                <Icon size={15} />

                <span>{tab.label}</span>

              </button>
            );

          })}

        </div>

      </section>


      {/* =====================================
          TAB CONTENT
      ===================================== */}

      {renderContent()}

    </main>
  );
}