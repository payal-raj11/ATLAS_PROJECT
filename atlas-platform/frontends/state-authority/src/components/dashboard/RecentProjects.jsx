import { ArrowUpRight, MoreHorizontal } from "lucide-react";

const projects = [
  {
    id: "LA001",
    name: "NH Expansion",
    district: "Ludhiana",
    status: "Active",
    progress: 72,
  },
  {
    id: "LA002",
    name: "Railway Project",
    district: "Patiala",
    status: "Delayed",
    progress: 41,
  },
  {
    id: "LA003",
    name: "Solar Park",
    district: "Amritsar",
    status: "Active",
    progress: 86,
  },
  {
    id: "LA004",
    name: "Industrial Corridor",
    district: "Jalandhar",
    status: "Pending",
    progress: 18,
  },
];

export default function RecentProjects() {
  return (
    <div className="dashboard-card recent-projects-card">
      <div className="card-header">
        <div>
          <h2>Recent Projects</h2>
          <p>Recently updated land acquisition projects</p>
        </div>

        <button className="icon-button">
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="project-list">
        {projects.map((project) => (
          <div className="project-row" key={project.id}>
            <div className="project-main">
              <div className="project-avatar">
                {project.name.charAt(0)}
              </div>

              <div>
                <div className="project-name">
                  {project.name}
                </div>

                <div className="project-meta">
                  {project.id} · {project.district}
                </div>
              </div>
            </div>

            <div className="project-progress">
              <div className="progress-header">
                <span>{project.progress}%</span>
              </div>

              <div className="progress-track">
                <span
                  style={{
                    width: `${project.progress}%`,
                  }}
                />
              </div>
            </div>

            <span
              className={`status-badge status-${project.status.toLowerCase()}`}
            >
              {project.status}
            </span>

            <button className="view-button">
              View
              <ArrowUpRight size={13} />
            </button>
          </div>
        ))}
      </div>

      <div className="card-footer">
        <button className="full-link">
          View all projects
          <ArrowUpRight size={14} />
        </button>
      </div>
    </div>
  );
}