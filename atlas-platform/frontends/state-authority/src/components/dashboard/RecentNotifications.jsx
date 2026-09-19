import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  FileText,
} from "lucide-react";

const notifications = [
  {
    title: "Critical Delay Alert",
    description: "Railway Project LA102 · Delay predicted: 73 days",
    time: "2 hours ago",
    type: "danger",
    icon: AlertTriangle,
  },
  {
    title: "District Approval Required",
    description: "NH Expansion LA087 · Submitted by Ludhiana District",
    time: "5 hours ago",
    type: "warning",
    icon: FileText,
  },
  {
    title: "New Central Notification",
    description: "Compensation guideline updated",
    time: "Yesterday",
    type: "info",
    icon: Bell,
  },
  {
    title: "Project Milestone Completed",
    description: "Solar Park LA003 · Survey completed",
    time: "Yesterday",
    type: "success",
    icon: CheckCircle2,
  },
];

export default function RecentNotifications() {
  return (
    <div className="dashboard-card notifications-card">
      <div className="card-header">
        <div>
          <h2>Recent Notifications</h2>
          <p>Latest updates requiring attention</p>
        </div>

        <div className="notification-count">
          4 New
        </div>
      </div>

      <div className="notification-list">
        {notifications.map((notification, index) => {
          const Icon = notification.icon;

          return (
            <button
              className="notification-row"
              key={index}
            >
              <div
                className={`notification-icon notification-${notification.type}`}
              >
                <Icon size={16} />
              </div>

              <div className="notification-content">
                <div className="notification-title">
                  {notification.title}
                </div>

                <div className="notification-description">
                  {notification.description}
                </div>

                <div className="notification-time">
                  {notification.time}
                </div>
              </div>

              <ChevronRight
                size={15}
                className="notification-arrow"
              />
            </button>
          );
        })}
      </div>

      <div className="card-footer">
        <button className="full-link">
          View all notifications
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}