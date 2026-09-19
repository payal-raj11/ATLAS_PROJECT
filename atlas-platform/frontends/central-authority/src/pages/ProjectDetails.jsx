import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { projects } from "../data/projects";
import GISMap from "../components/GISMap";

function ProjectDetails() {
  const { projectId } = useParams();

  const project = projects.find(
    (item) => item.id === projectId
  );

  const [activeTab, setActiveTab] =
    useState("Land Records");

  if (!project) {
    return (
      <div className="not-found-page">
        <div className="not-found-card">
          <span className="not-found-code">404</span>

          <h2>Project Not Found</h2>

          <p>
            The requested project does not exist
            in the current demo dataset.
          </p>

          <Link to="/projects">
            ← Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const progress = project.progress;

  /*
   * These are currently DEMO values.
   * Later they can come from the backend/API.
   */

  const landDistribution = [
    {
      label: "Private Land",
      value: 42,
    },
    {
      label: "Government Land",
      value: 28,
    },
    {
      label: "Forest / Protected",
      value: 18,
    },
    {
      label: "Other Land",
      value: 12,
    },
  ];

  const stages = [
    {
      title: "Project Proposal",
      state: "Completed",
    },
    {
      title: "Land Identification",
      state:
        progress >= 25
          ? "Completed"
          : "In Progress",
    },
    {
      title: "Survey & Verification",
      state:
        progress >= 50
          ? "Completed"
          : "In Progress",
    },
    {
      title: "Land Acquisition",
      state:
        progress >= 80
          ? "Completed"
          : "Pending",
    },
    {
      title: "Compensation",
      state:
        progress >= 90
          ? "Completed"
          : "Pending",
    },
  ];

  const tabs = [
    "Land Records",
    "Documents",
    "Survey Data",
    "Landowners",
    "Compensation",
    "Approvals",
    "Objections",
    "Funding",
  ];

  return (
    <div className="project-details-page">

      {/* =====================================================
          BREADCRUMB
      ===================================================== */}

      <div className="project-breadcrumb">
        <Link to="/projects">
          Projects
        </Link>

        <span>/</span>

        <span>
          {project.id}
        </span>
      </div>


      {/* =====================================================
          PROJECT HEADER
      ===================================================== */}

      <section className="project-title-card">

        <div className="project-title-main">

          <div className="project-icon-large">
            ◫
          </div>

          <div className="project-heading-content">

            <span className="project-id">
              {project.id}
            </span>

            <h2>
              {project.name}
            </h2>

            <p>
              {project.state}
              {" • "}
              {project.districts.join(", ")}
              {" • "}
              {project.projectType}
            </p>

          </div>

        </div>


        <div className="project-title-meta">

          <span
            className={`risk-badge ${project.risk.toLowerCase()}`}
          >
            {project.risk} Risk
          </span>

          <span className="status-badge large">
            {project.status}
          </span>

          <span className="last-updated">
            Last updated: {project.lastUpdated}
          </span>

        </div>

      </section>


      {/* =====================================================
          PROJECT OVERVIEW
      ===================================================== */}

      <section className="overview-grid">

        <div className="overview-card">

          <span>
            Land Required
          </span>

          <strong>
            {project.landRequired.toLocaleString()}
          </strong>

          <small>
            hectares
          </small>

        </div>


        <div className="overview-card">

          <span>
            Estimated Cost
          </span>

          <strong>
            ₹{project.estimatedCost}
          </strong>

          <small>
            crore
          </small>

        </div>


        <div className="overview-card">

          <span>
            Districts Covered
          </span>

          <strong>
            {project.districts.length}
          </strong>

          <small>
            districts
          </small>

        </div>


        <div className="overview-card">

          <span>
            Data Source
          </span>

          <strong className="overview-source">
            {project.source}
          </strong>

          <small>
            current record
          </small>

        </div>

      </section>


      {/* =====================================================
          ACQUISITION + MAP
      ===================================================== */}

      <section className="details-main-grid">


        {/* ===============================
            ACQUISITION PROGRESS
        =============================== */}

        <div className="details-card acquisition-card">

          <div className="section-heading">

            <div>
              <h3>
                Acquisition Progress
              </h3>

              <p>
                Current land acquisition status
              </p>
            </div>

            <span className="mini-label">
              Live Record
            </span>

          </div>


          <div className="progress-visual">

            <div
              className="acquisition-circle"
              style={{
                "--progress":
                  `${progress * 3.6}deg`,
              }}
            >

              <div className="acquisition-circle-inner">

                <strong>
                  {progress}%
                </strong>

                <span>
                  Acquired
                </span>

              </div>

            </div>


            <div className="progress-summary">

              <div>

                <span className="summary-dot completed" />

                <span>
                  Completed
                </span>

                <strong>
                  {progress}%
                </strong>

              </div>


              <div>

                <span className="summary-dot pending" />

                <span>
                  Remaining
                </span>

                <strong>
                  {100 - progress}%
                </strong>

              </div>

            </div>

          </div>


          <div className="progress-footer">

            <span>
              Overall project acquisition
            </span>

            <strong>
              {progress}% complete
            </strong>

          </div>

        </div>


        {/* ===============================
            MAP
        =============================== */}

        <div className="details-card">

          <div className="section-heading">

            <div>
              <h3>
                Land & Location
              </h3>

              <p>
                Project area overview
              </p>
            </div>

            <Link
              className="map-status"
              to={`/land?tab=gis&state=${encodeURIComponent(project.state)}`}
            >
              View Full Map →
            </Link>

          </div>


          <div className="project-map-locked">

            <GISMap
              compact
              hideHeader
              forcedState={project.state}
              forcedDistricts={project.districts}
              emptyMessage={`No parcel-level GIS records for ${project.districts.join(", ")} yet — the tracked dataset currently covers Tamil Nadu, Uttar Pradesh, Maharashtra and Bihar.`}
            />

            <span className="map-locked-tag">
              🔒 Locked to {project.state} — {project.districts.join(", ")}
            </span>

          </div>

        </div>

      </section>


      {/* =====================================================
          LAND DISTRIBUTION + VERIFICATION
      ===================================================== */}

      <section className="details-two-column">


        {/* ===============================
            LAND DISTRIBUTION
        =============================== */}

        <div className="details-card">

          <div className="section-heading">

            <div>
              <h3>
                Land Distribution
              </h3>

              <p>
                Indicative classification of project land
              </p>
            </div>

          </div>


          <div className="land-distribution">

            {landDistribution.map(
              (item) => (
                <div
                  className="land-row"
                  key={item.label}
                >

                  <div className="land-row-header">

                    <span>
                      {item.label}
                    </span>

                    <strong>
                      {item.value}%
                    </strong>

                  </div>


                  <div className="land-track">

                    <div
                      className="land-fill"
                      style={{
                        width:
                          `${item.value}%`,
                      }}
                    />

                  </div>

                </div>
              )
            )}

          </div>

        </div>


        {/* ===============================
            VERIFICATION
        =============================== */}

        <div className="details-card">

          <div className="section-heading">

            <div>
              <h3>
                Land Record Verification
              </h3>

              <p>
                Record-level verification status
              </p>
            </div>

          </div>


          <div className="verification-grid">

            <div>
              <strong>
                1,250
              </strong>

              <span>
                Total Parcels
              </span>
            </div>


            <div>
              <strong>
                842
              </strong>

              <span>
                Verified
              </span>
            </div>


            <div>
              <strong>
                286
              </strong>

              <span>
                Pending
              </span>
            </div>


            <div>
              <strong>
                122
              </strong>

              <span>
                Flagged
              </span>
            </div>

          </div>


          <div className="verification-progress">

            <div className="verification-progress-label">

              <span>
                Verification completion
              </span>

              <strong>
                67%
              </strong>

            </div>


            <div className="verification-track">

              <span
                style={{
                  width: "67%",
                }}
              />

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          ACQUISITION WORKFLOW
      ===================================================== */}

      <section className="details-card stages-card">

        <div className="section-heading">

          <div>
            <h3>
              Acquisition Workflow
            </h3>

            <p>
              Current stage of the acquisition process
            </p>
          </div>

        </div>


        <div className="workflow">

          {stages.map(
            (stage, index) => (

              <div
                className="workflow-step"
                key={stage.title}
              >

                <div
                  className={`workflow-circle ${
                    stage.state === "Completed"
                      ? "completed"
                      : stage.state === "In Progress"
                      ? "current"
                      : ""
                  }`}
                >

                  {stage.state ===
                  "Completed"
                    ? "✓"
                    : index + 1}

                </div>


                <div className="workflow-info">

                  <strong>
                    {stage.title}
                  </strong>

                  <span>
                    {stage.state}
                  </span>

                </div>


                {index <
                  stages.length - 1 && (
                    <div
                      className={`workflow-line ${
                        stage.state === "Completed"
                          ? "completed-line"
                          : ""
                      }`}
                    />
                )}

              </div>

            )
          )}

        </div>

      </section>


      {/* =====================================================
          PROJECT ACTIVITY
      ===================================================== */}

      <section className="details-card">

        <div className="section-heading">

          <div>
            <h3>
              Project Activity
            </h3>

            <p>
              Recent actions and updates
            </p>
          </div>

        </div>


        <div className="timeline">


          <div className="timeline-item">

            <div className="timeline-dot completed" />

            <div className="timeline-content">

              <strong>
                Project record submitted
              </strong>

              <span>
                State Authority • 08 Sep 2026
              </span>

            </div>

          </div>


          <div className="timeline-item">

            <div className="timeline-dot completed" />

            <div className="timeline-content">

              <strong>
                Land records received
              </strong>

              <span>
                Central Authority • 07 Sep 2026
              </span>

            </div>

          </div>


          <div className="timeline-item">

            <div className="timeline-dot" />

            <div className="timeline-content">

              <strong>
                Initial verification initiated
              </strong>

              <span>
                District Authority • 06 Sep 2026
              </span>

            </div>

          </div>


          <div className="timeline-item">

            <div className="timeline-dot" />

            <div className="timeline-content">

              <strong>
                Project entered acquisition workflow
              </strong>

              <span>
                Central Authority • 05 Sep 2026
              </span>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          PROJECT RECORD TABS
      ===================================================== */}

      <section className="details-card records-card">

        <div className="record-tabs">

          {tabs.map(
            (tab) => (

              <button
                key={tab}
                className={
                  activeTab === tab
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveTab(tab)
                }
              >
                {tab}
              </button>

            )
          )}

        </div>


        <div className="record-content">

          <div className="record-heading">

            <div>

              <span>
                Project Record
              </span>

              <h3>
                {activeTab}
              </h3>

            </div>

            <span className="demo-label">
              Demo Data
            </span>

          </div>


          <div className="record-placeholder-grid">

            <div>

              <span>
                Record Status
              </span>

              <strong>
                Available
              </strong>

            </div>


            <div>

              <span>
                Verification
              </span>

              <strong>
                In Progress
              </strong>

            </div>


            <div>

              <span>
                Last Updated
              </span>

              <strong>
                {project.lastUpdated}
              </strong>

            </div>

          </div>


          <div className="record-empty-message">

            <div className="record-empty-icon">
              ◇
            </div>

            <div>

              <strong>
                {activeTab} data
              </strong>

              <p>
                Detailed {activeTab.toLowerCase()}
                records will be populated when
                the backend data source is connected.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          AUTHORITY ACTIONS
      ===================================================== */}

      <section className="authority-actions">

        <button className="secondary-action">
          Request Verification
        </button>

        <button className="secondary-action">
          Return for Correction
        </button>

        <button className="primary-action">
          Open Official Record
        </button>

      </section>

    </div>
  );
}

export default ProjectDetails;