import { Link } from "react-router-dom";

import DashboardHeader from "../components/DashboardHeader";
import GISMap from "../components/GISMap";
import KpiCard from "../components/KpiCard";
import ActionCenter from "../components/ActionCenter";
import HorizontalBars from "../components/HorizontalBars";
import WorkflowChart from "../components/WorkflowChart";
import AcquisitionTrendChart from "../components/AcquisitionTrendChart";
import LandCompositionRing from "../components/LandCompositionRing";
import DocumentVerificationRings from "../components/DocumentVerificationRings";
import RiskBars from "../components/RiskBars";
import BulletChart from "../components/BulletChart";
import DotPlot from "../components/DotPlot";
import Timeline from "../components/Timeline";

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

  const landOwnership = land.ownership;

  const objectionsBars = objections.breakdown.map((segment) => ({
    ...segment,
    displayValue: formatNumber(segment.value),
  }));

  // Bullet chart: each metric's actual value against an illustrative
  // benchmark target for this point in the financial year — not the
  // full cost, or the target tick would always sit at the far edge
  // and carry no information. FY_TARGET_PCT stands in for a real
  // treasury/PFMS pacing target once that exists.
  const FY_TARGET_PCT = { Allocated: 0.85, Released: 0.65, Utilized: 0.5 };

  const fundingBars = [
    {
      label: "Allocated",
      value: funding.allocated,
      target: funding.totalCost * FY_TARGET_PCT.Allocated,
      max: funding.totalCost,
      displayValue: `₹ ${formatNumber(funding.allocated)} Cr`,
      color: "var(--info-blue-text)",
      detail: `${Math.round((funding.allocated / funding.totalCost) * 100)}% sanctioned — target for this stage of the FY is ${Math.round(FY_TARGET_PCT.Allocated * 100)}%`,
    },
    {
      label: "Released",
      value: funding.released,
      target: funding.totalCost * FY_TARGET_PCT.Released,
      max: funding.totalCost,
      displayValue: `₹ ${formatNumber(funding.released)} Cr`,
      color: "var(--series-4)",
      detail: `${Math.round((funding.released / funding.totalCost) * 100)}% disbursed — target for this stage of the FY is ${Math.round(FY_TARGET_PCT.Released * 100)}%`,
    },
    {
      label: "Utilized",
      value: funding.utilized,
      target: funding.totalCost * FY_TARGET_PCT.Utilized,
      max: funding.totalCost,
      displayValue: `₹ ${formatNumber(funding.utilized)} Cr`,
      color: "var(--accent-green)",
      detail: `${Math.round((funding.utilized / funding.totalCost) * 100)}% spent — target for this stage of the FY is ${Math.round(FY_TARGET_PCT.Utilized * 100)}%`,
    },
  ];

  const activityTimeline = activity.recent.map((item, index) => ({
    id: `activity-${index}`,
    when: item.time,
    title: item.project,
    subtitle: item.description,
    projectId: item.projectId,
    extra: item.projectId ? "Click to open this project →" : null,
  }));

  const deadlineTimeline = deadlines.map((item, index) => ({
    id: `deadline-${index}`,
    when: item.date,
    title: item.label,
    subtitle: item.project,
    projectId: item.projectId,
    extra: item.projectId ? "Click to open this project →" : null,
  }));

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
          label="Total Projects"
          value={formatNumber(overview.totalProjects)}
          note="All registered projects"
          to="/projects"
        />

        <KpiCard
          label="Active Projects"
          value={formatNumber(overview.activeProjects)}
          note="In acquisition / review"
          to="/projects?status=active"
        />

        <KpiCard
          label="Pending Actions"
          value={formatNumber(overview.pendingActions)}
          note="Awaiting review / verification"
          to="/projects?status=pending"
        />

        <KpiCard
          label="Delayed Projects"
          value={formatNumber(overview.delayedProjects)}
          note="Returned / behind schedule"
          tone="warning"
          to="/projects?status=delayed"
        />

        <KpiCard
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
              Authority Action Center
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
              Project Status
            </h3>

            <span>
              Hover or click a row to filter Projects
            </span>

          </div>

          <DotPlot
            data={projects.statusBreakdown}
            total={overview.totalProjects}
          />

        </div>

      </div>


      {/* ==========================================
          WORKFLOW
          ========================================== */}

      <div className="dashboard-panel">

        <div className="dashboard-panel-header">

          <h3>
            Project Workflow
          </h3>

          <span>
            Hover or tap a stage for detail
          </span>

        </div>

        <WorkflowChart stages={workflow.stages} />

      </div>


      {/* ==========================================
          PROJECTS REQUIRING ATTENTION (detail)
          ========================================== */}

      <div className="dashboard-panel">

        <div className="dashboard-panel-header">

          <h3>
            Projects Requiring Attention
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
              Acquisition Trend
            </h3>

            <span>
              Land acquired per month (ha) — illustrative
            </span>

          </div>

          <AcquisitionTrendChart
            data={trend}
            valueSuffix=" ha"
          />

        </div>


        <div className="dashboard-panel">

          <div className="dashboard-panel-header">

            <h3>
              Land Composition
            </h3>

            <span>
              Hover a segment for details
            </span>

          </div>

          <LandCompositionRing
            data={landOwnership}
            totalValue={land.totalLand}
            totalLabel="Under acquisition"
            unit="ha"
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
              Funding
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

          <BulletChart data={fundingBars} />

          <Link
            to="/funding?status=pending"
            className="funding-alert"
          >
            Funding requiring action:
            <strong>{funding.actionRequired} projects</strong>
          </Link>

        </div>


        <div className="dashboard-panel">

          <div className="dashboard-panel-header">

            <h3>
              Risk Breakdown
            </h3>

            <span>
              Click a risk level to filter Projects
            </span>

          </div>

          <RiskBars data={risk} />

        </div>

      </div>


      {/* ==========================================
          SOCIAL IMPACT
          ========================================== */}

      <div className="dashboard-panel">

        <div className="dashboard-panel-header">

          <h3>
            Social Impact
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
              Objections
            </h3>

            <span>
              Illustrative — grievance module not yet integrated
            </span>

          </div>

          <div className="panel-stat-callout">
            <span className="panel-stat-value">
              {formatNumber(objections.total)}
            </span>
            <span className="panel-stat-label">
              Total objections
            </span>
          </div>

          <HorizontalBars
            data={objectionsBars}
            valueSuffix=""
          />

        </div>


        <div className="dashboard-panel">

          <div className="dashboard-panel-header">

            <h3>
              Document Verification
            </h3>

            <span>
              Click a ring to filter Projects
            </span>

          </div>

          <DocumentVerificationRings
            rings={documentVerification.rings}
            centerValue={`${documentVerification.percentVerified}%`}
            centerLabel="Verified"
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
              Recent Activity
            </h3>

            <span>
              Live once the backend is connected
            </span>

          </div>

          <Timeline items={activityTimeline} />

        </div>


        <div className="dashboard-panel">

          <div className="dashboard-panel-header">

            <h3>
              Upcoming Deadlines
            </h3>

            <span>
              Illustrative — SLA tracking not yet integrated
            </span>

          </div>

          <Timeline items={deadlineTimeline} />

        </div>

      </div>


    </div>

  );

}


export default Dashboard;
