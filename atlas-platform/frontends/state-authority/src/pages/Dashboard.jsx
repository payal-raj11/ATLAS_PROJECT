import {
  ArrowUpRight,
  Bell,
  CheckCircle2,
  Clock3,
  FolderKanban,
  MapPin,
  AlertTriangle,
  ChevronRight,
  Activity,
} from "lucide-react";

import StatCard from "../components/dashboard/StatCard";
import RecentProjects from "../components/dashboard/RecentProjects";
import RecentNotifications from "../components/dashboard/RecentNotifications";
import DistrictSummary from "../components/dashboard/DistrictSummary";
import AnalyticsChart from "../components/dashboard/AnalyticsChart";

const stats = [
  {
    title: "Total Projects",
    value: "124",
    change: "+8.4%",
    description: "from last month",
    icon: FolderKanban,
    type: "blue",
  },
  {
    title: "Active Projects",
    value: "37",
    change: "+5.2%",
    description: "currently active",
    icon: Activity,
    type: "teal",
  },
  {
    title: "Delayed Projects",
    value: "18",
    change: "-2.1%",
    description: "from last month",
    icon: AlertTriangle,
    type: "orange",
  },
  {
    title: "Completed Projects",
    value: "69",
    change: "+12.6%",
    description: "completed this year",
    icon: CheckCircle2,
    type: "green",
  },
];

export default function Dashboard() {
  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <div className="dashboard-heading">
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span>
          </div>

          <h1>Welcome, State Authority</h1>

          <p>
            Here's what's happening across your state
          </p>
        </div>

        <div className="dashboard-heading-actions">
          <button className="dashboard-date-button">
            <Clock3 size={15} />
            <span>Last updated: Today, 09:42 AM</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      <section className="stats-grid">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            description={stat.description}
            icon={stat.icon}
            type={stat.type}
          />
        ))}
      </section>

      {/* Main Analytics */}
      <section className="dashboard-grid-main">
        <AnalyticsChart />

        <div className="dashboard-card state-overview-card">
          <div className="card-header">
            <div>
              <h2>State Overview</h2>
              <p>Current acquisition status</p>
            </div>

            <div className="card-icon blue-icon">
              <MapPin size={17} />
            </div>
          </div>

          <div className="overview-list">
            <div className="overview-item">
              <div className="overview-label">
                <span className="status-dot blue-dot"></span>
                Land Acquisition
              </div>

              <strong>74%</strong>
            </div>

            <div className="overview-progress">
              <span style={{ width: "74%" }}></span>
            </div>

            <div className="overview-item">
              <div className="overview-label">
                <span className="status-dot teal-dot"></span>
                Survey Completed
              </div>

              <strong>81%</strong>
            </div>

            <div className="overview-progress">
              <span style={{ width: "81%" }}></span>
            </div>

            <div className="overview-item">
              <div className="overview-label">
                <span className="status-dot green-dot"></span>
                Compensation
              </div>

              <strong>68%</strong>
            </div>

            <div className="overview-progress">
              <span style={{ width: "68%" }}></span>
            </div>

            <div className="overview-item">
              <div className="overview-label">
                <span className="status-dot orange-dot"></span>
                Documentation
              </div>

              <strong>59%</strong>
            </div>

            <div className="overview-progress">
              <span style={{ width: "59%" }}></span>
            </div>
          </div>

          <button className="text-link">
            View detailed analysis
            <ArrowUpRight size={14} />
          </button>
        </div>
      </section>

      {/* Recent Projects + Notifications */}
      <section className="dashboard-grid-secondary">
        <RecentProjects />
        <RecentNotifications />
      </section>

      {/* District Performance */}
      <section>
        <DistrictSummary />
      </section>
    </div>
  );
}