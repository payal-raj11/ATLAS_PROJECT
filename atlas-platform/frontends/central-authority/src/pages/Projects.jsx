import { useEffect, useMemo, useState } from "react";
import { stateDistricts } from "../data/stateDistricts";
import { Link, useSearchParams } from "react-router-dom";
import { getStatusBucket, getWorkflowStage } from "../data/statusHelpers";
import { api } from "../services/apiClient";

// Backend statuses are workflow-precise (pending_state_review,
// district_verified, ...); this page's filters/badges were built
// around the old mock string statuses. This maps live data into
// that same display vocabulary rather than rewriting every filter
// below. Extend this as more statuses go live.
const STATUS_DISPLAY = {
  pending_state_review: "Pending State Review",
  state_accepted: "Approved",
  state_rejected: "Returned for Correction",
  pending_district_assignment: "Pending District Review",
  pending_district_verification: "Pending District Review",
  district_verified: "Under Acquisition",
  district_rejected: "Returned for Correction",
  pending_survey: "Pending Village Verification",
  survey_completed: "Under Acquisition",
  land_acquisition: "Under Acquisition",
  compensation_in_progress: "Under Acquisition",
  possession: "Under Acquisition",
  completed: "Completed",
};

const PROGRESS_FOR_STATUS = {
  pending_state_review: 10,
  state_accepted: 25,
  pending_district_assignment: 30,
  pending_district_verification: 40,
  district_verified: 55,
  pending_survey: 45,
  survey_completed: 65,
  compensation_in_progress: 75,
  possession: 90,
  completed: 100,
};

function adaptProject(p) {
  return {
    id: p.code,
    dbId: p.id,
    name: p.name,
    state: p.state,
    districts: p.districts || [],
    projectType: p.project_type,
    landRequired: p.land_required_ha,
    estimatedCost: p.estimated_cost_cr,
    risk: p.risk,
    status: STATUS_DISPLAY[p.status] || p.status,
    rawStatus: p.status,
    progress: PROGRESS_FOR_STATUS[p.status] ?? 0,
    source: "Central Authority", // all projects in this app were proposed via AddProposal
    lastUpdated: new Date(p.updated_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    documentStatus: "Pending Review",
  };
}

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api.projects.list()
      .then((data) => {
        if (!cancelled) setProjects(data.projects.map(adaptProject));
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  /*
     URL-DRIVEN FILTERS

     Links from the Dashboard (KPI cards, status donut, workflow
     strip, Action Center) land here as query params rather than
     exact-match status strings, since the Dashboard groups
     projects into buckets/stages that don't map 1:1 to a single
     status value. These are read once and layered on top of the
     regular dropdown filters below.
  */

  const [searchParams, setSearchParams] = useSearchParams();

  const statusBucketParam = searchParams.get("status");
  const stageParam = searchParams.get("stage");
  const documentStatusParam = searchParams.get("documentStatus");
  const stateParam = searchParams.get("state");
  const riskParam = searchParams.get("risk");

  const hasUrlFilter = Boolean(
    statusBucketParam || stageParam || documentStatusParam || stateParam || riskParam
  );

  const clearUrlFilters = () => {
    setSearchParams({});
  };

  const [search, setSearch] = useState("");

  const [stateFilter, setStateFilter] = useState("All States");
  const [districtFilter, setDistrictFilter] = useState("All Districts");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [sourceFilter, setSourceFilter] = useState("All Sources");

  const [sortBy, setSortBy] = useState("Last Updated (Newest)");
  const [currentPage, setCurrentPage] = useState(1);

  const projectsPerPage = 10;


  /* ----------------------------------
     FILTER OPTIONS
  ---------------------------------- */

  const states = useMemo(
    () => [
      "All States",
      ...new Set(projects.map((project) => project.state)),
    ],
    []
  );


  /*
     DISTRICTS ARE NOW DEPENDENT ON STATE

     If no state is selected:
     District dropdown is disabled.

     If a state is selected:
     Only districts belonging to that state
     are shown.
  */

  const districts = useMemo(() => {

    if (stateFilter === "All States") {
      return ["All Districts"];
    }

    return [
      "All Districts",
      ...(stateDistricts[stateFilter] || []),
    ];

  }, [stateFilter]);


  /*
     WHEN STATE CHANGES:
     Reset district back to All Districts.
  */

  const handleStateChange = (event) => {

    const newState = event.target.value;

    setStateFilter(newState);

    setDistrictFilter("All Districts");

    setCurrentPage(1);
  };


  const projectTypes = useMemo(
    () => [
      "All Types",
      ...new Set(projects.map((project) => project.projectType)),
    ],
    []
  );


  const statuses = useMemo(
    () => [
      "All Status",
      ...new Set(projects.map((project) => project.status)),
    ],
    []
  );


  const sources = useMemo(
    () => [
      "All Sources",
      ...new Set(projects.map((project) => project.source)),
    ],
    []
  );


  /* ----------------------------------
     FILTERING
  ---------------------------------- */

  const filteredProjects = useMemo(() => {

    let result = [...projects];

    const query = search.toLowerCase().trim();


    /* SEARCH */

    if (query) {

      result = result.filter((project) => {

        return (
          project.id.toLowerCase().includes(query) ||
          project.name.toLowerCase().includes(query) ||
          project.state.toLowerCase().includes(query) ||
          project.districts
            .join(" ")
            .toLowerCase()
            .includes(query)
        );

      });

    }


    /* STATE */

    if (stateFilter !== "All States") {

      result = result.filter(
        (project) =>
          project.state === stateFilter
      );

    }


    /* DISTRICT */

    if (districtFilter !== "All Districts") {

      result = result.filter((project) =>
        project.districts.includes(
          districtFilter
        )
      );

    }


    /* PROJECT TYPE */

    if (typeFilter !== "All Types") {

      result = result.filter(
        (project) =>
          project.projectType === typeFilter
      );

    }


    /* STATUS */

    if (statusFilter !== "All Status") {

      result = result.filter(
        (project) =>
          project.status === statusFilter
      );

    }


    /* SOURCE */

    if (sourceFilter !== "All Sources") {

      result = result.filter(
        (project) =>
          project.source === sourceFilter
      );

    }


    /* URL-DRIVEN FILTERS (from Dashboard click-through) */

    if (statusBucketParam) {

      result = result.filter(
        (project) =>
          getStatusBucket(project.status) ===
          statusBucketParam.toLowerCase()
      );

    }

    if (stageParam) {

      result = result.filter(
        (project) =>
          getWorkflowStage(project.status) === stageParam
      );

    }

    if (documentStatusParam) {

      result = result.filter((project) =>
        (project.documentStatus || "")
          .toLowerCase()
          .includes(documentStatusParam.toLowerCase())
      );

    }

    if (stateParam) {

      result = result.filter(
        (project) => project.state === stateParam
      );

    }

    if (riskParam) {

      result = result.filter(
        (project) => project.risk === riskParam
      );

    }


    /* ----------------------------------
       SORTING
    ---------------------------------- */

    if (sortBy === "Project Name (A-Z)") {

      result.sort((a, b) =>
        a.name.localeCompare(b.name)
      );

    }


    if (sortBy === "Project Name (Z-A)") {

      result.sort((a, b) =>
        b.name.localeCompare(a.name)
      );

    }


    if (sortBy === "Progress (High-Low)") {

      result.sort((a, b) =>
        b.progress - a.progress
      );

    }


    if (sortBy === "Progress (Low-High)") {

      result.sort((a, b) =>
        a.progress - b.progress
      );

    }


    if (sortBy === "Risk (High-Low)") {

      const risk = {
        High: 3,
        Medium: 2,
        Low: 1,
      };

      result.sort(
        (a, b) =>
          risk[b.risk] - risk[a.risk]
      );

    }


    return result;

  }, [
    projects,
    search,
    stateFilter,
    districtFilter,
    typeFilter,
    statusFilter,
    sourceFilter,
    statusBucketParam,
    stageParam,
    documentStatusParam,
    stateParam,
    riskParam,
    sortBy,
  ]);


  /* =====================================================
     STATE-WISE PROJECT COUNT
  ===================================================== */

  const stateProjectCounts = useMemo(() => {

    const stateMap = {};


    filteredProjects.forEach((project) => {

      if (!stateMap[project.state]) {
        stateMap[project.state] = 0;
      }

      stateMap[project.state]++;

    });


    const total = filteredProjects.length;


    return Object.entries(stateMap)
      .map(([state, count]) => ({

        state,

        count,

        percentage:
          total > 0
            ? (count / total) * 100
            : 0,

      }))
      .sort(
        (a, b) =>
          b.count - a.count
      );

  }, [filteredProjects]);


  /* ----------------------------------
     PAGINATION
  ---------------------------------- */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredProjects.length /
        projectsPerPage
    )
  );


  const startIndex =
    (currentPage - 1) *
    projectsPerPage;


  const displayedProjects =
    filteredProjects.slice(
      startIndex,
      startIndex + projectsPerPage
    );


  /* ----------------------------------
     CLEAR FILTERS
  ---------------------------------- */

  const clearFilters = () => {

    setSearch("");

    setStateFilter(
      "All States"
    );

    setDistrictFilter(
      "All Districts"
    );

    setTypeFilter(
      "All Types"
    );

    setStatusFilter(
      "All Status"
    );

    setSourceFilter(
      "All Sources"
    );

    setCurrentPage(1);

    clearUrlFilters();

  };


  return (

    <div className="projects-page">


      {/* =========================================
          BREADCRUMB
      ========================================= */}

      <div className="projects-breadcrumb">

        <span>
          Projects
        </span>

        <span className="breadcrumb-arrow">
          ›
        </span>

        <span className="breadcrumb-current">
          All Projects
        </span>

      </div>


      {/* =========================================
          PAGE HEADER
      ========================================= */}

      <div className="projects-heading">

        <div>

          <h1>
            All Projects
          </h1>

          <p>
            View and manage all land acquisition
            projects across India. Use different
            views to explore projects by state,
            district, alphabetical or risk level.
          </p>

        </div>


       <Link
  to="/proposals/new"
  className="propose-project-btn"
>
  <span>＋</span>
  Propose New Project
</Link>

      </div>


      {/* =========================================
          ACTIVE URL FILTER (arrived via Dashboard link)
      ========================================= */}

      {hasUrlFilter && (

        <div className="url-filter-banner">

          <span>
            Filtered from Dashboard:
            {statusBucketParam && ` status = ${statusBucketParam}`}
            {stageParam && ` stage = ${stageParam}`}
            {documentStatusParam && ` documentStatus = ${documentStatusParam}`}
            {stateParam && ` state = ${stateParam}`}
            {riskParam && ` risk = ${riskParam}`}
          </span>

          <button
            onClick={clearUrlFilters}
            className="url-filter-clear"
          >
            Clear ✕
          </button>

        </div>

      )}


      {/* =========================================
          PROJECT ANALYTICS
      ========================================= */}

      <div className="project-analytics">

        <div className="analytics-header">

          <div>

            <h3>
              Project Distribution
            </h3>

            <p>
              Overview of ongoing land acquisition
              projects across states.
            </p>

          </div>


          <span className="analytics-total">

            {stateProjectCounts.reduce(
              (total, item) =>
                total + item.count,
              0
            )}

            {" "}Ongoing Projects

          </span>

        </div>


        <div className="state-chart">

          {stateProjectCounts.map((item) => (

            <div
              className="state-chart-row"
              key={item.state}
            >

              <div className="state-name">
                {item.state}
              </div>


              <div className="state-bar-container">

                <div
                  className="state-bar"
                  style={{
                    width:
                      `${item.percentage}%`,
                  }}
                />

              </div>


              <div className="state-count">
                {item.count}
              </div>

            </div>

          ))}

        </div>

      </div>


      {/* =========================================
          FILTER BAR
      ========================================= */}

      <div className="projects-filter-bar">


        {/* SEARCH */}

        <div className="projects-search">

          <span className="search-icon">
            ⌕
          </span>

          <input
            type="text"
            placeholder="Search projects by name, ID or keywords..."
            value={search}
            onChange={(event) => {

              setSearch(
                event.target.value
              );

              setCurrentPage(1);

            }}
          />

          <span className="search-icon-right">
            ⌕
          </span>

        </div>


        {/* STATE */}

        <select
          value={stateFilter}
          onChange={handleStateChange}
        >

          {states.map((state) => (

            <option key={state}>
              {state}
            </option>

          ))}

        </select>


        {/* DISTRICT */}

        <select
          value={districtFilter}
          onChange={(event) => {

            setDistrictFilter(
              event.target.value
            );

            setCurrentPage(1);

          }}
          disabled={
            stateFilter === "All States"
          }
        >

          {districts.map((district) => (

            <option key={district}>
              {district}
            </option>

          ))}

        </select>


        {/* PROJECT TYPE */}

        <select
          value={typeFilter}
          onChange={(event) => {

            setTypeFilter(
              event.target.value
            );

            setCurrentPage(1);

          }}
        >

          {projectTypes.map((type) => (

            <option key={type}>
              {type}
            </option>

          ))}

        </select>


        {/* STATUS */}

        <select
          value={statusFilter}
          onChange={(event) => {

            setStatusFilter(
              event.target.value
            );

            setCurrentPage(1);

          }}
        >

          {statuses.map((status) => (

            <option key={status}>
              {status}
            </option>

          ))}

        </select>


        {/* SOURCE */}

        <select
          value={sourceFilter}
          onChange={(event) => {

            setSourceFilter(
              event.target.value
            );

            setCurrentPage(1);

          }}
        >

          {sources.map((source) => (

            <option key={source}>
              {source}
            </option>

          ))}

        </select>


        {/* CLEAR */}

        <button
          className="clear-filters"
          onClick={clearFilters}
        >
          Clear Filters
        </button>

      </div>


      {/* =========================================
          PROJECT TABLE CARD
      ========================================= */}

      <section className="projects-table-card">


        {/* TABLE TOP */}

        <div className="projects-table-top">

          <h2>
            {filteredProjects.length} Projects
          </h2>


          <div className="table-controls">

            <span>
              Sort by:
            </span>


            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(
                  event.target.value
                )
              }
            >

              <option>
                Last Updated (Newest)
              </option>

              <option>
                Project Name (A-Z)
              </option>

              <option>
                Project Name (Z-A)
              </option>

              <option>
                Progress (High-Low)
              </option>

              <option>
                Progress (Low-High)
              </option>

              <option>
                Risk (High-Low)
              </option>

            </select>


            <button className="table-icon active">
              ▤
            </button>

            <button className="table-icon">
              ☷
            </button>

          </div>

        </div>


        {/* =========================================
            TABLE
        ========================================= */}

        <div className="projects-table-container">

          <table>

            <thead>

              <tr>

                <th className="check-column">
                  <input type="checkbox" />
                </th>

                <th>
                  Project ID
                </th>

                <th>
                  Project Name ↕
                </th>

                <th>
                  State ↕
                </th>

                <th>
                  District(s) ↕
                </th>

                <th>
                  Land Required
                  <small>(ha) ↕</small>
                </th>

                <th>
                  Estimated Cost
                  <small>(₹ Cr) ↕</small>
                </th>

                <th>
                  Risk Level ↕
                </th>

                <th>
                  Status ↕
                </th>

                <th>
                  Progress ↕
                </th>

                <th>
                  Last Updated ↕
                </th>

                <th className="actions-column">
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {displayedProjects.map((project) => (

                <tr key={project.id}>


                  {/* CHECKBOX */}

                  <td>
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

                    <span className="project-name">
                      {project.name}
                    </span>

                  </td>


                  {/* STATE */}

                  <td>
                    {project.state}
                  </td>


                  {/* DISTRICTS */}

                  <td>
                    {project.districts.join(", ")}
                  </td>


                  {/* LAND */}

                  <td>
                    {project.landRequired.toLocaleString()}
                  </td>


                  {/* COST */}

                  <td>
                    {project.estimatedCost}
                  </td>


                  {/* RISK */}

                  <td>

                    <span
                      className={`risk-badge ${
                        project.risk.toLowerCase()
                      }`}
                    >

                      <span />

                      {project.risk}

                    </span>

                  </td>


                  {/* STATUS */}

                  <td>

                    <span
                      className={`status-badge ${
                        getStatusClass(
                          project.status
                        )
                      }`}
                    >

                      {project.status}

                    </span>

                  </td>


                  {/* PROGRESS */}

                  <td>

                    <div className="progress-cell">

                      <span>
                        {project.progress}%
                      </span>


                      <div className="progress-track">

                        <div
                          className={`progress-value ${
                            project.progress === 100
                              ? "complete"
                              : ""
                          }`}
                          style={{
                            width:
                              `${project.progress}%`,
                          }}
                        />

                      </div>

                    </div>

                  </td>


                  {/* LAST UPDATED */}

                  <td>
                    {project.lastUpdated}
                  </td>


                  {/* =================================
                      ACTIONS
                  ================================= */}

                  <td className="actions-column">

                    <div className="action-cell">

                      <Link
                        to={`/projects/${project.id}`}
                        className="details-btn"
                      >
                        View Details
                      </Link>


                      <button
                        className="more-btn"
                        onClick={() =>
                          console.log(
                            "More actions:",
                            project.id
                          )
                        }
                        aria-label={`More actions for ${project.name}`}
                      >
                        •••
                      </button>

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>


        {/* =========================================
            FOOTER
        ========================================= */}

        <div className="projects-table-footer">


          <span>

            Showing{" "}

            {filteredProjects.length === 0
              ? 0
              : startIndex + 1}

            {" – "}

            {Math.min(
              startIndex + projectsPerPage,
              filteredProjects.length
            )}

            {" "}of{" "}

            {filteredProjects.length}

            {" "}projects

          </span>


          <div className="pagination">


            {/* PREVIOUS */}

            <button
              disabled={
                currentPage === 1
              }
              onClick={() =>
                setCurrentPage(
                  Math.max(
                    1,
                    currentPage - 1
                  )
                )
              }
            >
              ‹
            </button>


            {/* PAGE NUMBERS */}

            {Array.from(
              {
                length: totalPages,
              },
              (_, index) =>
                index + 1
            ).map((page) => (

              <button
                key={page}
                className={
                  page === currentPage
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setCurrentPage(page)
                }
              >
                {page}
              </button>

            ))}


            {/* NEXT */}

            <button
              disabled={
                currentPage === totalPages
              }
              onClick={() =>
                setCurrentPage(
                  Math.min(
                    totalPages,
                    currentPage + 1
                  )
                )
              }
            >
              ›
            </button>

          </div>

        </div>

      </section>

    </div>
  );
}


/* ----------------------------------
   STATUS CLASS
---------------------------------- */

function getStatusClass(status) {

  if (status === "Approved") {
    return "approved";
  }

  if (status === "Completed") {
    return "completed";
  }

  if (status === "Under Review") {
    return "review";
  }

  if (status === "Returned for Correction") {
    return "correction";
  }

  if (status === "Under Acquisition") {
    return "acquisition";
  }

  if (status.includes("Landowner")) {
    return "landowner";
  }

  if (status.includes("Survey")) {
    return "survey";
  }

  if (status.includes("Village")) {
    return "village";
  }

  return "pending";
}


export default Projects;