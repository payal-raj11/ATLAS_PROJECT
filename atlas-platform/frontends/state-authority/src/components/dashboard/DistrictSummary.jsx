import { ArrowUpRight } from "lucide-react";

const districts = [
  {
    name: "Ludhiana",
    projects: 25,
    active: 17,
    delayed: 4,
    completion: 68,
  },
  {
    name: "Patiala",
    projects: 18,
    active: 12,
    delayed: 2,
    completion: 72,
  },
  {
    name: "Amritsar",
    projects: 31,
    active: 21,
    delayed: 7,
    completion: 54,
  },
  {
    name: "Jalandhar",
    projects: 22,
    active: 16,
    delayed: 3,
    completion: 76,
  },
  {
    name: "Bathinda",
    projects: 15,
    active: 10,
    delayed: 1,
    completion: 81,
  },
];

export default function DistrictSummary() {
  return (
    <div className="dashboard-card district-card">
      <div className="card-header">
        <div>
          <h2>District Performance</h2>
          <p>
            State-wide project performance by district
          </p>
        </div>

        <button className="full-link">
          View district analysis
          <ArrowUpRight size={14} />
        </button>
      </div>

      <div className="district-table-wrapper">
        <table className="district-table">
          <thead>
            <tr>
              <th>District</th>
              <th>Projects</th>
              <th>Active</th>
              <th>Delayed</th>
              <th>Completion</th>
            </tr>
          </thead>

          <tbody>
            {districts.map((district) => (
              <tr key={district.name}>
                <td>
                  <div className="district-name">
                    <span className="district-marker"></span>
                    {district.name}
                  </div>
                </td>

                <td>{district.projects}</td>

                <td>
                  <span className="table-status active">
                    {district.active}
                  </span>
                </td>

                <td>
                  <span className="table-status delayed">
                    {district.delayed}
                  </span>
                </td>

                <td>
                  <div className="completion-cell">
                    <span>{district.completion}%</span>

                    <div className="mini-progress">
                      <span
                        style={{
                          width: `${district.completion}%`,
                        }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}