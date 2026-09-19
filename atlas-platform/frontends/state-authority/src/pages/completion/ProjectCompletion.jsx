import {
  Plus,
  CheckCircle2,
  Clock3,
  AlertCircle,
  FolderCheck,
  FileCheck2,
  Search,
} from "lucide-react";


/* =====================================================
   PROJECT DATA
===================================================== */

const completionProjects = [
  {
    project: "Highway P-102",
    code: "ATLAS-PRJ-021",
    acquisition: "completed",
    compensation: "completed",
    survey: "completed",
  },
  {
    project: "Rail Corridor",
    code: "ATLAS-PRJ-022",
    acquisition: "completed",
    compensation: "completed",
    survey: "ongoing",
  },
  {
    project: "Solar Park",
    code: "ATLAS-PRJ-023",
    acquisition: "completed",
    compensation: "ongoing",
    survey: "completed",
  },
  {
    project: "Eastern Bypass",
    code: "ATLAS-PRJ-024",
    acquisition: "ongoing",
    compensation: "pending",
    survey: "completed",
  },
  {
    project: "Industrial Corridor",
    code: "ATLAS-PRJ-025",
    acquisition: "completed",
    compensation: "ongoing",
    survey: "ongoing",
  },
  {
    project: "Metro Extension",
    code: "ATLAS-PRJ-026",
    acquisition: "pending",
    compensation: "pending",
    survey: "ongoing",
  },
];


/* =====================================================
   STATUS COMPONENT
===================================================== */

function CompletionStatus({ status }) {
  if (status === "completed") {
    return (
      <span className="completion-status completed">
        <CheckCircle2 size={14} />
        Completed
      </span>
    );
  }

  if (status === "ongoing") {
    return (
      <span className="completion-status ongoing">
        <Clock3 size={14} />
        Ongoing
      </span>
    );
  }

  return (
    <span className="completion-status pending">
      <AlertCircle size={14} />
      Pending
    </span>
  );
}


/* =====================================================
   TRACKER STATUS
===================================================== */

function TrackerIcon({ status }) {
  if (status === "completed") {
    return (
      <span className="tracker-icon tracker-completed">
        <CheckCircle2 size={15} />
      </span>
    );
  }

  if (status === "ongoing") {
    return (
      <span className="tracker-icon tracker-ongoing">
        <Clock3 size={15} />
      </span>
    );
  }

  return (
    <span className="tracker-icon tracker-pending">
      <AlertCircle size={15} />
    </span>
  );
}


/* =====================================================
   STAT CARD
===================================================== */

function CompletionStat({
  title,
  value,
  percentage,
  icon: Icon,
  type,
}) {
  return (
    <div className="completion-stat-card">

      <div className="completion-stat-top">

        <div
          className={`completion-stat-icon completion-stat-${type}`}
        >
          <Icon size={18} />
        </div>

      </div>

      <div className="completion-stat-value">
        {value}
      </div>

      <div className="completion-stat-title">
        {title}
      </div>

      <div className="completion-stat-percentage">
        {percentage}
      </div>

    </div>
  );
}


/* =====================================================
   PROJECT COMPLETION PAGE
===================================================== */

export default function ProjectCompletion() {

  return (
    <div className="completion-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="completion-page-header">

        <div>

          <div className="completion-breadcrumb">
            Project Completion
          </div>

          <h1>
            Project Completion
          </h1>

          <p>
            Monitor project completion milestones
            and overall acquisition progress.
          </p>

        </div>


        <button
          type="button"
          className="completion-new-button"
        >
          <Plus size={16} />

          <span>
            New Report
          </span>
        </button>

      </div>


      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <section className="completion-stats-grid">

        <CompletionStat
          title="Total Projects"
          value="67"
          percentage="100% of projects"
          icon={FolderCheck}
          type="blue"
        />

        <CompletionStat
          title="Completed"
          value="42"
          percentage="62.7%"
          icon={CheckCircle2}
          type="green"
        />

        <CompletionStat
          title="Ongoing"
          value="18"
          percentage="26.8%"
          icon={Clock3}
          type="orange"
        />

        <CompletionStat
          title="Pending"
          value="7"
          percentage="10.5%"
          icon={AlertCircle}
          type="red"
        />

      </section>


      {/* =================================================
          COMPLETION OVERVIEW
      ================================================= */}

      <section className="completion-overview-grid">


        {/* OVERALL COMPLETION */}

        <div className="completion-card overall-completion-card">

          <div className="completion-card-header">

            <div>

              <h2>
                Overall Completion
              </h2>

              <p>
                Current state-wide completion
              </p>

            </div>

            <div className="completion-card-icon blue">
              <FileCheck2 size={17} />
            </div>

          </div>


          <div className="overall-completion-content">

            <div className="completion-circle">

              <svg
                viewBox="0 0 120 120"
                className="completion-circle-svg"
              >

                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  className="completion-circle-bg"
                />

                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  className="completion-circle-progress"
                  strokeDasharray="301.59"
                  strokeDashoffset="66.35"
                />

              </svg>

              <div className="completion-circle-value">
                <strong>
                  78%
                </strong>

                <span>
                  Complete
                </span>
              </div>

            </div>


            <div className="overall-completion-details">

              <div className="completion-detail-row">
                <span>
                  Completed
                </span>

                <strong>
                  42
                </strong>
              </div>

              <div className="completion-detail-row">
                <span>
                  Ongoing
                </span>

                <strong>
                  18
                </strong>
              </div>

              <div className="completion-detail-row">
                <span>
                  Pending
                </span>

                <strong>
                  7
                </strong>
              </div>

            </div>

          </div>

        </div>


        {/* COMPLETION STATUS */}

        <div className="completion-card">

          <div className="completion-card-header">

            <div>

              <h2>
                Completion Status
              </h2>

              <p>
                Project status distribution
              </p>

            </div>

            <div className="completion-card-icon teal">
              <CheckCircle2 size={17} />
            </div>

          </div>


          <div className="completion-status-list">

            <div className="completion-status-row">

              <div className="completion-status-label">

                <span className="completion-dot green"></span>

                <span>
                  Completed
                </span>

              </div>

              <strong>
                42
              </strong>

              <span className="completion-status-percent">
                62.7%
              </span>

            </div>


            <div className="completion-status-progress">

              <span
                className="green"
                style={{ width: "62.7%" }}
              ></span>

            </div>


            <div className="completion-status-row">

              <div className="completion-status-label">

                <span className="completion-dot blue"></span>

                <span>
                  In Progress
                </span>

              </div>

              <strong>
                18
              </strong>

              <span className="completion-status-percent">
                26.8%
              </span>

            </div>


            <div className="completion-status-progress">

              <span
                className="blue"
                style={{ width: "26.8%" }}
              ></span>

            </div>


            <div className="completion-status-row">

              <div className="completion-status-label">

                <span className="completion-dot orange"></span>

                <span>
                  Pending
                </span>

              </div>

              <strong>
                7
              </strong>

              <span className="completion-status-percent">
                10.5%
              </span>

            </div>


            <div className="completion-status-progress">

              <span
                className="orange"
                style={{ width: "10.5%" }}
              ></span>

            </div>

          </div>

        </div>

      </section>


      {/* =================================================
          TRACKER HEADER
      ================================================= */}

      <div className="completion-tracker-heading">

        <div>

          <h2>
            Project Completion Tracker
          </h2>

          <p>
            Track acquisition milestones for
            individual projects.
          </p>

        </div>


        <div className="completion-search">

          <Search size={14} />

          <input
            type="text"
            placeholder="Search projects..."
          />

        </div>

      </div>


      {/* =================================================
          TRACKER TABLE
      ================================================= */}

      <section className="completion-table-card">

        <div className="completion-table-wrapper">

          <table className="completion-table">

            <thead>

              <tr>

                <th>
                  Project
                </th>

                <th>
                  Acquisition
                </th>

                <th>
                  Compensation
                </th>

                <th>
                  Survey
                </th>

                <th>
                  Status
                </th>

              </tr>

            </thead>


            <tbody>

              {completionProjects.map((project) => {

                const completedCount = [
                  project.acquisition,
                  project.compensation,
                  project.survey,
                ].filter(
                  (status) => status === "completed"
                ).length;

                const projectStatus =
                  completedCount === 3
                    ? "completed"
                    : completedCount > 0
                    ? "ongoing"
                    : "pending";

                return (
                  <tr key={project.code}>

                    <td>

                      <div className="completion-project-cell">

                        <div className="completion-project-icon">
                          <FolderCheck size={16} />
                        </div>

                        <div>

                          <strong>
                            {project.project}
                          </strong>

                          <span>
                            {project.code}
                          </span>

                        </div>

                      </div>

                    </td>


                    <td>
                      <TrackerIcon
                        status={project.acquisition}
                      />
                    </td>


                    <td>
                      <TrackerIcon
                        status={project.compensation}
                      />
                    </td>


                    <td>
                      <TrackerIcon
                        status={project.survey}
                      />
                    </td>


                    <td>
                      <CompletionStatus
                        status={projectStatus}
                      />
                    </td>

                  </tr>
                );
              })}

            </tbody>

          </table>

        </div>


        {/* LEGEND */}

        <div className="completion-table-footer">

          <div className="completion-legend">

            <span>
              <span className="legend-dot completed"></span>
              Completed
            </span>

            <span>
              <span className="legend-dot ongoing"></span>
              Ongoing
            </span>

            <span>
              <span className="legend-dot pending"></span>
              Pending
            </span>

          </div>

          <span className="completion-table-count">
            Showing {completionProjects.length} projects
          </span>

        </div>

      </section>

    </div>
  );
}