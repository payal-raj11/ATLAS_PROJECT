import {
  Plus,
  Search,
  ChevronDown,
  LayoutGrid,
  List,
  MoreHorizontal,
  ArrowUpDown,
} from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useEffect, useState } from "react";
import { api, getStoredUser } from "../../services/apiClient";

// Each label describes what has ACTUALLY happened, not what's
// merely queued to happen next -- a status that just means "waiting
// to be forwarded" must not read the same as one that means "the
// next party already has it and is acting on it".
const STATUS_DISPLAY = {
  pending_state_review: "Pending State Review",
  state_accepted: "Accepted — Not Yet Forwarded",
  state_rejected: "Rejected — Returned to Central",
  pending_district_assignment: "Forwarded to District",
  pending_district_verification: "District Reviewing",
  district_verified: "District Verified",
  district_rejected: "Rejected by District",
  pending_survey: "Survey Pending",
  survey_completed: "Survey Completed",
  compensation_in_progress: "Compensation in Progress",
  possession: "Possession",
  completed: "Completed",
};
const PROGRESS_FOR_STATUS = {
  pending_state_review: 10, state_accepted: 20, pending_district_assignment: 30,
  pending_district_verification: 45, district_verified: 55, pending_survey: 45,
  survey_completed: 65, compensation_in_progress: 75, possession: 90, completed: 100,
};

function adaptProject(p, currentRole) {
  return {
    dbId: p.id,
    id: p.code,
    name: p.name,
    state: p.state,
    district: (p.districts || []).join(", "),
    land: p.land_required_ha ? `${p.land_required_ha}` : "—",
    cost: p.estimated_cost_cr ? `${p.estimated_cost_cr}` : "—",
    risk: p.risk,
    status: STATUS_DISPLAY[p.status] || p.status,
    rawStatus: p.status,
    progress: PROGRESS_FOR_STATUS[p.status] ?? 0,
    updated: new Date(p.updated_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    // State-role actions
    canAccept: currentRole === "state" && p.status === "pending_state_review",
    canForwardToDistrict: currentRole === "state" && p.status === "state_accepted",
    // District-role actions (district users land on this same app/page today)
    canDistrictAccept: currentRole === "district" && p.status === "pending_district_assignment",
    canDistrictVerify: currentRole === "district" && p.status === "pending_district_verification",
  };
}

/* =========================================
   PROJECT DISTRIBUTION DATA
========================================= */

const distribution = [
  { state: "Bihar", count: 1 },
  { state: "Odisha", count: 1 },
  { state: "Uttar Pradesh", count: 1 },
  { state: "Maharashtra", count: 1 },
  { state: "Tamil Nadu", count: 1 },
  { state: "Karnataka", count: 1 },
  { state: "Gujarat", count: 1 },
  { state: "Rajasthan", count: 1 },
  { state: "Madhya Pradesh", count: 1 },
  { state: "Assam", count: 1 },
];

/* =========================================
   PROJECT DATA
========================================= */

// (live data now fetched inside the component below)

/* =========================================
   PIE CHART DATA
========================================= */

const pieData = [
  { name: "Bihar", value: 1 },
  { name: "Odisha", value: 1 },
  { name: "Uttar Pradesh", value: 1 },
  { name: "Maharashtra", value: 1 },
  { name: "Tamil Nadu", value: 1 },
  { name: "Karnataka", value: 1 },
  { name: "Gujarat", value: 1 },
  { name: "Rajasthan", value: 1 },
  { name: "Madhya Pradesh", value: 1 },
  { name: "Assam", value: 1 },
];

/* =========================================
   LINE CHART DATA
========================================= */

const lineData = [
  { name: "Jan", projects: 3 },
  { name: "Feb", projects: 4 },
  { name: "Mar", projects: 5 },
  { name: "Apr", projects: 6 },
  { name: "May", projects: 7 },
  { name: "Jun", projects: 8 },
  { name: "Jul", projects: 10 },
];

/* =========================================
   BAR CHART DATA
========================================= */

const barData = [
  { name: "Bihar", projects: 5 },
  { name: "Odisha", projects: 7 },
  { name: "U.P.", projects: 9 },
  { name: "Maharashtra", projects: 6 },
  { name: "Tamil Nadu", projects: 8 },
  { name: "Karnataka", projects: 5 },
];

/* =========================================
   PIE COLORS
========================================= */

const pieColors = [
  "#1683e8",
  "#14b8a6",
  "#20b981",
  "#f5a623",
  "#8b5cf6",
  "#ef5b5b",
  "#06b6d4",
  "#f97316",
  "#6366f1",
  "#84cc16",
];

/* =========================================
   RISK BADGE
========================================= */

function RiskBadge({ risk }) {
  return (
    <span className={`risk-badge risk-${risk.toLowerCase()}`}>
      <span className="risk-dot"></span>
      {risk}
    </span>
  );
}

/* =========================================
   STATUS BADGE
========================================= */

function StatusBadge({ status }) {
  let className = "status-pending";

  if (
    status.includes("Completed") ||
    status.includes("Documentation")
  ) {
    className = "status-completed";
  }

  if (
    status.includes("Compensation") ||
    status.includes("Acquisition")
  ) {
    className = "status-progress";
  }

  return (
    <span className={`project-status ${className}`}>
      {status}
    </span>
  );
}

/* =========================================
   PROJECTS PAGE
========================================= */

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");

  const currentUser = getStoredUser();
  const currentRole = currentUser?.role;

  const loadProjects = () => {
    api.projects.list()
      .then((data) => setProjects(data.projects.map((p) => adaptProject(p, currentRole))))
      .catch((err) => setActionError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProjects(); }, []);

  const handleAccept = async (dbId) => {
    setActionError("");
    try {
      await api.projects.accept(dbId);
      loadProjects();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleReject = async (dbId) => {
    const reason = window.prompt("Reason for returning this project to Central:");
    if (reason === null) return;
    setActionError("");
    try {
      await api.projects.reject(dbId, reason);
      loadProjects();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // State -> District: forward an accepted project down to a
  // specific district. The district name must match an onboarded
  // District Authority account for this state, or that district
  // will never be able to log in and see it.
  const handleForwardToDistrict = async (dbId) => {
    const district = window.prompt(
      "Which district should this project be forwarded to?\n\n" +
      "(Must match an existing District Authority account exactly, e.g. \"Patna\", \"Coonor\")"
    );
    if (!district) return;
    setActionError("");
    try {
      await api.projects.assign(dbId, { district: district.trim() });
      loadProjects();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // District-role actions -- district users currently sign into this
  // same app, so this page doubles as their queue too.
  const handleDistrictAccept = async (dbId) => {
    setActionError("");
    try {
      await api.projects.accept(dbId);
      loadProjects();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleDistrictVerify = async (dbId) => {
    setActionError("");
    try {
      await api.projects.verify(dbId);
      loadProjects();
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <main className="projects-page">

      {/* =====================================
          PAGE HEADER
      ===================================== */}

      <section className="projects-page-header">

        <div className="projects-header-left">

          <div className="projects-breadcrumb">
            <span>Projects</span>
            <span className="breadcrumb-arrow">›</span>
            <span>All Projects</span>
          </div>

          <h1>All Projects</h1>

          <p>
            View and manage all land acquisition projects across India.
            Use different views to explore projects by state, district,
            alphabetical or risk level.
          </p>

        </div>

        <button className="propose-project-button">
          <Plus size={17} />
          <span>Propose New Project</span>
        </button>

      </section>


      {/* =====================================
          PROJECT DISTRIBUTION
          THREE CHARTS IN ONE ROW
      ===================================== */}

      <section className="project-distribution-section">

        {/* Distribution Header */}

        <div className="distribution-main-header">

          <div>
            <h2>Project Distribution</h2>

            <p>
              Overview of ongoing land acquisition projects across states.
            </p>
          </div>

          <span className="ongoing-badge">
            10 Ongoing Projects
          </span>

        </div>


        {/* THREE CHARTS */}

        <div className="three-charts-row">


          {/* =================================
              PIE CHART
          ================================= */}

          <div className="chart-card">

            <div className="chart-card-header">

              <div>
                <h3>Project Share</h3>
                <p>Distribution by state</p>
              </div>

            </div>

            <div className="pie-chart-container">

              <ResponsiveContainer width="100%" height={230}>

                <PieChart>

                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={82}
                    paddingAngle={2}
                    dataKey="value"
                  >

                    {pieData.map((entry, index) => (
                      <Cell
                        key={`pie-cell-${index}`}
                        fill={pieColors[index]}
                      />
                    ))}

                  </Pie>

                  <Tooltip />

                </PieChart>

              </ResponsiveContainer>

            </div>

            <div className="chart-total">

              <strong>10</strong>

              <span>
                Total Projects
              </span>

            </div>

          </div>


          {/* =================================
              LINE CHART
          ================================= */}

          <div className="chart-card">

            <div className="chart-card-header">

              <div>
                <h3>Project Trend</h3>
                <p>Projects over time</p>
              </div>

            </div>

            <div className="line-chart-container">

              <ResponsiveContainer width="100%" height={230}>

                <LineChart data={lineData}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                  />

                  <XAxis
                    dataKey="name"
                    tick={{
                      fill: "var(--text-secondary)",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{
                      fill: "var(--text-secondary)",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="projects"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "var(--primary)",
                    }}
                    activeDot={{
                      r: 6,
                    }}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </div>


          {/* =================================
              BAR CHART
          ================================= */}

          <div className="chart-card">

            <div className="chart-card-header">

              <div>
                <h3>State Comparison</h3>
                <p>Projects by state</p>
              </div>

            </div>

            <div className="bar-chart-container">

              <ResponsiveContainer width="100%" height={230}>

                <BarChart data={barData}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                  />

                  <XAxis
                    dataKey="name"
                    tick={{
                      fill: "var(--text-secondary)",
                      fontSize: 9,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{
                      fill: "var(--text-secondary)",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="projects"
                    fill="var(--primary)"
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================
          FILTER BAR
      ===================================== */}

      <section className="projects-filter-bar">


        {/* SEARCH */}

        <div className="project-search-box">

          <Search size={15} />

          <input
            type="text"
            placeholder="Search projects by name, ID or keywords..."
          />

          <Search size={14} />

        </div>


        {/* STATE */}

        <button className="project-filter-select">

          <span>All States</span>

          <ChevronDown size={15} />

        </button>


        {/* DISTRICT */}

        <button className="project-filter-select">

          <span>All Districts</span>

          <ChevronDown size={15} />

        </button>


        {/* TYPE */}

        <button className="project-filter-select">

          <span>All Types</span>

          <ChevronDown size={15} />

        </button>


        {/* STATUS */}

        <button className="project-filter-select status-filter">

          <span>All Status</span>

          <ChevronDown size={15} />

        </button>


        {/* SOURCES */}

        <button className="project-filter-select source-filter">

          <span>All Sources</span>

          <ChevronDown size={15} />

        </button>


        {/* CLEAR */}

        <button className="clear-filters-button">
          Clear Filters
        </button>

      </section>


      {/* =====================================
          PROJECT TABLE
      ===================================== */}

      <section className="projects-table-card">


        {/* TABLE TOOLBAR */}

        <div className="projects-table-toolbar">

          <div className="projects-count">
            <strong>10 Projects</strong>
          </div>


          <div className="projects-toolbar-right">


            {/* SORT */}

            <div className="sort-control">

              <span>Sort by:</span>

              <button>

                <span>
                  Last Updated (Newest)
                </span>

                <ChevronDown size={14} />

              </button>

            </div>


            {/* GRID VIEW */}

            <button className="view-button active">
              <LayoutGrid size={15} />
            </button>


            {/* LIST VIEW */}

            <button className="view-button">
              <List size={15} />
            </button>

          </div>

        </div>


        {/* =================================
            TABLE
        ================================= */}

        <div className="projects-table-wrapper">

          <table className="projects-table">


            {/* TABLE HEAD */}

            <thead>

              <tr>

                <th className="checkbox-column">
                  <input type="checkbox" />
                </th>

                <th>
                  Project ID
                </th>

                <th>
                  Project Name
                  <ArrowUpDown size={11} />
                </th>

                <th>
                  State
                  <ArrowUpDown size={11} />
                </th>

                <th>
                  District(s)
                  <ArrowUpDown size={11} />
                </th>

                <th>
                  Land Required
                  <span>(ha)</span>
                  <ArrowUpDown size={11} />
                </th>

                <th>
                  Estimated Cost
                  <span>(₹ Cr)</span>
                  <ArrowUpDown size={11} />
                </th>

                <th>
                  Risk Level
                  <ArrowUpDown size={11} />
                </th>

                <th>
                  Status
                  <ArrowUpDown size={11} />
                </th>

                <th>
                  Progress
                  <ArrowUpDown size={11} />
                </th>

                <th>
                  Last Updated
                  <ArrowUpDown size={11} />
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>


            {/* TABLE BODY */}

            <tbody>

              {projects.map((project) => (

                <tr key={project.id}>


                  {/* CHECKBOX */}

                  <td className="checkbox-column">

                    <input type="checkbox" />

                  </td>


                  {/* PROJECT ID */}

                  <td>

                    <span className="project-id">
                      {project.id}
                    </span>

                  </td>


                  {/* PROJECT NAME */}

                  <td>

                    <div className="project-name">
                      {project.name}
                    </div>

                  </td>


                  {/* STATE */}

                  <td>
                    {project.state}
                  </td>


                  {/* DISTRICT */}

                  <td>
                    {project.district}
                  </td>


                  {/* LAND */}

                  <td>
                    {project.land}
                  </td>


                  {/* COST */}

                  <td>
                    {project.cost}
                  </td>


                  {/* RISK */}

                  <td>

                    <RiskBadge
                      risk={project.risk}
                    />

                  </td>


                  {/* STATUS */}

                  <td>

                    <StatusBadge
                      status={project.status}
                    />

                  </td>


                  {/* PROGRESS */}

                  <td>

                    <div className="progress-cell">

                      <span>
                        {project.progress}%
                      </span>

                      <div className="table-progress">

                        <div
                          style={{
                            width: `${project.progress}%`,
                          }}
                        />

                      </div>

                    </div>

                  </td>


                  {/* UPDATED */}

                  <td>
                    {project.updated}
                  </td>


                  {/* ACTIONS */}

                  <td>

                    <div className="action-cell">

                     <button
  className="view-details-button"
  onClick={() => {
    window.location.href = `/projects/${project.id}`;
  }}
>
  View Details
</button>
                      {project.canAccept && (
                        <>
                          <button
                            className="view-details-button"
                            style={{ background: "#16a34a", color: "#fff" }}
                            onClick={() => handleAccept(project.dbId)}
                          >
                            Accept
                          </button>
                          <button
                            className="view-details-button"
                            style={{ background: "#dc2626", color: "#fff" }}
                            onClick={() => handleReject(project.dbId)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {project.canForwardToDistrict && (
                        <button
                          className="view-details-button"
                          style={{ background: "#2563eb", color: "#fff" }}
                          onClick={() => handleForwardToDistrict(project.dbId)}
                        >
                          Forward to District
                        </button>
                      )}
                      {project.canDistrictAccept && (
                        <button
                          className="view-details-button"
                          style={{ background: "#16a34a", color: "#fff" }}
                          onClick={() => handleDistrictAccept(project.dbId)}
                        >
                          Accept (District)
                        </button>
                      )}
                      {project.canDistrictVerify && (
                        <button
                          className="view-details-button"
                          style={{ background: "#7c3aed", color: "#fff" }}
                          onClick={() => handleDistrictVerify(project.dbId)}
                        >
                          Verify (District)
                        </button>
                      )}
                      <button className="more-button">
                        <MoreHorizontal size={17} />
                      </button>

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </section>

    </main>
  );
}