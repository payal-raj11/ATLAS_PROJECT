import { Link } from "react-router-dom";

import DashboardHeader from "../components/DashboardHeader";
import GISMap from "../components/GISMap";
import KpiCard from "../components/KpiCard";
import DonutChart from "../components/DonutChart";
import ActionCenter from "../components/ActionCenter";
import HorizontalBars from "../components/HorizontalBars";
import WorkflowStrip from "../components/WorkflowStrip";
import ActivityFeed from "../components/ActivityFeed";
import LineChart from "../components/LineChart";
import RiskMatrix from "../components/RiskMatrix";
import DeadlineList from "../components/DeadlineList";

import { getDashboardData } from "../data/dashboardData";


function formatNumber(value) {
  return value.toLocaleString("en-IN");
}


function Dashboard() {

  const dashboard = getDashboardData();

  const {
    overview,
    projects,
    workflow,
    land,
    funding,
    activity,
    attention,
    filters,
    trend,
    risk,
    socialImpact,
    objections,
    documentVerification,
    deadlines,
  } = dashboard;

  const progressList = projects.progressList.map((item) => ({
    ...item,
    to: `/projects/${item.id}`,
  }));

  const landOwnership = land.ownership.map((segment) => ({
    ...segment,
    to: `/land?type=${segment.key}`,
  }));

  const fundingBars = [
    { label: "Allocated", value: Math.round((funding.allocated / funding.totalCost) * 100), displayValue: `₹ ${formatNumber(funding.allocated)} Cr`, color: "var(--info-blue-text)" },
    { label: "Released", value: Math.round((funding.released / funding.totalCost) * 100), displayValue: `₹ ${formatNumber(funding.released)} Cr`, color: "var(--series-4)" },
    { label: "Utilized", value: Math.round((funding.utilized / funding.totalCost) * 100), displayValue: `₹ ${formatNumber(funding.utilized)} Cr`, color: "var(--accent-green)" },
  ];

  return (

    <div className="central-dashboard">

      <DashboardHeader
        states={filters.states}
        projectTypes={filters.projectTypes}
      />


      {/* ==========================================
          GIS MAP
          ========================================== */}

      <GISMap />


      {/* ==========================================
          KPI SUMMARY
          ========================================== */}

      <div className="dashboard-grid dashboard-grid-5">

        <KpiCard
          icon="🗂️"
          label="Total Projects"
          value={formatNumber(overview.totalProjects)}
          note="All registered projects"
          to="/projects"
        />

        <KpiCard
          icon="🔄"
          label="Active Projects"
          value={formatNumber(overview.activeProjects)}
          note="In acquisition / review"
          to="/projects?status=active"
        />

        <KpiCard
          icon="⏳"
          label="Pending Actions"
          value={formatNumber(overview.pendingActions)}
          note="Awaiting review / verification"
          to="/projects?status=pending"
        />

        <KpiCard
          icon="⚠️"
          label="Delayed Projects"
          value={formatNumber(overview.delayedProjects)}
          note="Returned / behind schedule"
          tone="warning"
          to="/projects?status=delayed"
        />

        <KpiCard
          icon="₹"
          label="Total Cost"
          value={`₹ ${formatNumber(overview.totalCost)} Cr`}
          note="Combined project cost"
          to="/funding"
        />

      </div>


      {/* ==========================================
          ACTION CENTER + PROJECT STATUS
          ========================================== */}

      <div className="dashboard-lower-grid two-col">

        <div className="dashboard-panel">

          <div className="dashboard-panel-header">

            <h3>
              🚨 Authority Action Center
            </h3>

            <span>
              What do I need to deal with today?
            </span>

          </div>

          <ActionCenter items={dashboard.actionCenter} />

        </div>


        <div className="dashboard-panel">

          <div className="dashboard-panel-header">

            <h3>
              🍩 Project Status
            </h3>

            <span>
              Click a slice to filter Projects
            </span>

          </div>

          <DonutChart
            data={projects.statusBreakdown}
            centerLabel="Total"
            centerValue={overview.totalProjects}
          />

        </div>

      </div>


      {/* ==========================================
          WORKFLOW
          ========================================== */}

      <div className="dashboard-panel">

        <div className="dashboard-panel-header">

          <h3>
            🔄 Project Workflow
          </h3>

          <span>
            Projects currently at each stage
          </span>

        </div>

        <WorkflowStrip stages={workflow.stages} />

      </div>


      {/* ==========================================
          PROJECTS REQUIRING ATTENTION (detail)
          ========================================== */}

      <div className="dashboard-panel">

        <div className="dashboard-panel-header">

          <h3>
            ⚠ Projects Requiring Attention
          </h3>

          <span>
            Detail behind the Action Center counts
          </span>

        </div>

        <div className="attention-table-wrap">

          <table className="attention-table">

            <thead>
              <tr>
                <th>Project</th>
                <th>Issue</th>
                <th>Priority</th>
                <th></th>
              </tr>
            </thead>

            <tbody>

              {attention.map((item) => (

                <tr key={item.id}>

                  <td>{item.project}</td>

                  <td>{item.issue}</td>

                  <td>
                    <span
                      className={`risk-badge ${item.priority.toLowerCase()}`}
                    >
                      <span />
                      {item.priority}
                    </span>
                  </td>

                  <td>
                    <Link
                      to={`/projects/${item.id}`}
                      className="attention-review-btn"
                    >
                      Review
                    </Link>
                  </td>

                </tr>

              ))}

              {attention.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="attention-empty"
                  >
                    No projects currently require attention.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ==========================================
          ACQUISITION TREND + LAND COMPOSITION
          ========================================== */}

      <div className="dashboard-lower-grid two-col">

        <div className="dashboard-panel">

          <div className="dashboard-panel-header">

            <h3>
              📈 Acquisition Trend
            </h3>

            <span>
              Land acquired per month (ha) — illustrative
            </span>

          </div>

          <LineChart
            data={trend}
            color="var(--info-blue-text)"
            valueSuffix=" ha"
          />

        </div>


        <div className="dashboard-panel">

          <div className="dashboard-panel-header">

            <h3>
              🥧 Land Composition
            </h3>

            <Link
              to="/land"
              className="panel-link"
            >
              View Land & Impact →
            </Link>

          </div>

          <DonutChart
            data={landOwnership}
            centerLabel="Under acquisition"
            centerValue={`${formatNumber(land.totalLand)} ha`}
          />

          <p className="land-ownership-note">
            Ownership split is aggregate, illustrative data —
            not yet tied to individual parcels.
          </p>

        </div>

      </div>


      {/* ==========================================
          FUNDING + RISK MATRIX
          ========================================== */}

      <div className="dashboard-lower-grid two-col">

        <div className="dashboard-panel">

          <div className="dashboard-panel-header">

            <h3>
              💰 Funding
            </h3>

            <Link
              to="/funding"
              className="panel-link"
            >
              View Funding →
            </Link>

          </div>

          <div className="funding-figures">

            <div className="funding-figure">
              <span className="funding-figure-label">Total Estimated Cost</span>
              <span className="funding-figure-value">₹ {formatNumber(funding.totalCost)} Cr</span>
            </div>

          </div>

          <HorizontalBars
            data={fundingBars}
            compact
          />

          <Link
            to="/funding?status=pending"
            className="funding-alert"
          >
            <span>⚠️</span>
            Funding requiring action:
            <strong>{funding.actionRequired} projects</strong>
          </Link>

        </div>


        <div className="dashboard-panel">

          <div className="dashboard-panel-header">

            <h3>
              🎯 Risk Matrix
            </h3>

            <span>
              Likelihood × cost-tier impact
            </span>

          </div>

          <RiskMatrix matrix={risk} />

        </div>

      </div>


      {/* ==========================================
          SOCIAL IMPACT
          ========================================== */}

      <div className="dashboard-panel">

        <div className="dashboard-panel-header">

          <h3>
            👥 Social Impact
          </h3>

          <span>
            Illustrative — R&R module not yet integrated
          </span>

        </div>

        <div className="impact-grid impact-grid-5">

          {socialImpact.map((stat) => (

            <div
              className="impact-tile"
              key={stat.label}
            >

              <span className="impact-icon">{stat.icon}</span>
              <span className="impact-value">{stat.value}</span>
              <span className="impact-label">{stat.label}</span>

            </div>

          ))}

        </div>

      </div>


      {/* ==========================================
          OBJECTIONS + DOCUMENT VERIFICATION
          ========================================== */}

      <div className="dashboard-lower-grid two-col">

        <div className="dashboard-panel">

          <div className="dashboard-panel-header">

            <h3>
              ⚖️ Objections
            </h3>

            <span>
              Illustrative — grievance module not yet integrated
            </span>

          </div>

          <DonutChart
            data={objections.breakdown}
            centerLabel="Total"
            centerValue={formatNumber(objections.total)}
          />

        </div>


        <div className="dashboard-panel">

          <div className="dashboard-panel-header">

            <h3>
              📑 Document Verification
            </h3>

            <span>
              Click a slice to filter Projects
            </span>

          </div>

          <DonutChart
            data={documentVerification.breakdown}
            centerLabel="Verified"
            centerValue={`${documentVerification.percentVerified}%`}
          />

        </div>

      </div>


      {/* ==========================================
          RECENT ACTIVITY + UPCOMING DEADLINES
          ========================================== */}

      <div className="dashboard-lower-grid two-col">

        <div className="dashboard-panel">

          <div className="dashboard-panel-header">

            <h3>
              🔔 Recent Activity
            </h3>

            <span>
              Live once the backend is connected
            </span>

          </div>

          <ActivityFeed items={activity.recent} />

        </div>


        <div className="dashboard-panel">

          <div className="dashboard-panel-header">

            <h3>
              📅 Upcoming Deadlines
            </h3>

            <span>
              Illustrative — SLA tracking not yet integrated
            </span>

          </div>

          <DeadlineList items={deadlines} />

        </div>

      </div>


    </div>

  );

}


export default Dashboard;
