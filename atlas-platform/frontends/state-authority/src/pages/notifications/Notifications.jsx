import { useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  FileText,
  MapPin,
  Search,
  Check,
  MoreHorizontal,
} from "lucide-react";

const initialNotifications = [
  {
    id: 1,
    type: "alert",
    title: "Project review pending",
    message:
      "Patna-Gaya Highway Expansion is waiting for district review.",
    time: "10 minutes ago",
    date: "10 Sep 2026",
    read: false,
    project: "ATLAS-PRJ-001",
  },
  {
    id: 2,
    type: "success",
    title: "Survey verification completed",
    message:
      "Survey verification for Eastern Railway Expansion has been completed successfully.",
    time: "1 hour ago",
    date: "10 Sep 2026",
    read: false,
    project: "ATLAS-PRJ-002",
  },
  {
    id: 3,
    type: "warning",
    title: "Project delay detected",
    message:
      "National Highway Corridor has been flagged for a potential acquisition delay.",
    time: "3 hours ago",
    date: "10 Sep 2026",
    read: false,
    project: "ATLAS-PRJ-003",
  },
  {
    id: 4,
    type: "document",
    title: "Documents uploaded",
    message:
      "New acquisition documents have been uploaded for Mumbai-Pune Infrastructure.",
    time: "5 hours ago",
    date: "10 Sep 2026",
    read: true,
    project: "ATLAS-PRJ-004",
  },
  {
    id: 5,
    type: "location",
    title: "District allocation updated",
    message:
      "District allocation information has been updated for Chennai Outer Ring Road.",
    time: "Yesterday",
    date: "09 Sep 2026",
    read: true,
    project: "ATLAS-PRJ-005",
  },
  {
    id: 6,
    type: "success",
    title: "Compensation milestone completed",
    message:
      "A compensation milestone has been completed for Bengaluru Metro Extension.",
    time: "Yesterday",
    date: "09 Sep 2026",
    read: true,
    project: "ATLAS-PRJ-006",
  },
  {
    id: 7,
    type: "alert",
    title: "Documentation requires attention",
    message:
      "Documentation for Gujarat Freight Corridor requires authority review.",
    time: "2 days ago",
    date: "08 Sep 2026",
    read: true,
    project: "ATLAS-PRJ-007",
  },
];

const typeConfig = {
  alert: {
    icon: AlertTriangle,
    className: "notification-icon-alert",
  },
  warning: {
    icon: Clock3,
    className: "notification-icon-warning",
  },
  success: {
    icon: CheckCircle2,
    className: "notification-icon-success",
  },
  document: {
    icon: FileText,
    className: "notification-icon-document",
  },
  location: {
    icon: MapPin,
    className: "notification-icon-location",
  },
};

export default function Notifications() {
  const [notifications, setNotifications] =
    useState(initialNotifications);

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && !notification.read) ||
        (filter === "read" && notification.read);

      const searchText =
        `${notification.title} ${notification.message} ${notification.project}`
          .toLowerCase();

      const matchesSearch = searchText.includes(
        search.toLowerCase()
      );

      return matchesFilter && matchesSearch;
    });
  }, [notifications, filter, search]);

  const markAsRead = (id) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  };

  return (
    <div className="notifications-page">

      {/* PAGE HEADER */}
      <div className="notifications-heading">

        <div>
          <div className="notifications-breadcrumb">
            <span>Notifications</span>
          </div>

          <h1>Notifications</h1>

          <p>
            Stay updated with project activities,
            reviews and acquisition milestones.
          </p>
        </div>

        <div className="notifications-heading-actions">

          <div className="notification-count-card">
            <Bell size={16} />

            <div>
              <strong>{unreadCount}</strong>
              <span>Unread</span>
            </div>
          </div>

          <button
            className="mark-all-button"
            onClick={markAllAsRead}
            type="button"
          >
            <Check size={15} />
            Mark all as read
          </button>

        </div>
      </div>


      {/* FILTER BAR */}
      <div className="notifications-toolbar">

        <div className="notification-filters">

          <button
            type="button"
            className={
              filter === "all"
                ? "notification-filter active"
                : "notification-filter"
            }
            onClick={() => setFilter("all")}
          >
            All
            <span>{notifications.length}</span>
          </button>

          <button
            type="button"
            className={
              filter === "unread"
                ? "notification-filter active"
                : "notification-filter"
            }
            onClick={() => setFilter("unread")}
          >
            Unread
            <span>{unreadCount}</span>
          </button>

          <button
            type="button"
            className={
              filter === "read"
                ? "notification-filter active"
                : "notification-filter"
            }
            onClick={() => setFilter("read")}
          >
            Read
            <span>
              {notifications.length - unreadCount}
            </span>
          </button>

        </div>


        <div className="notifications-search">
          <Search size={15} />

          <input
            type="text"
            placeholder="Search notifications..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

      </div>


      {/* NOTIFICATION LIST */}
      <div className="notifications-list">

        {filteredNotifications.length === 0 ? (
          <div className="notifications-empty">
            <Bell size={28} />

            <h3>No notifications found</h3>

            <p>
              There are no notifications matching
              your current filter.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const config =
              typeConfig[notification.type];

            const Icon = config.icon;

            return (
              <div
                key={notification.id}
                className={`notification-item ${
                  !notification.read
                    ? "notification-unread"
                    : ""
                }`}
              >

                {/* ICON */}
                <div
                  className={`notification-type-icon ${config.className}`}
                >
                  <Icon size={18} />
                </div>


                {/* CONTENT */}
                <div className="notification-content">

                  <div className="notification-title-row">

                    <h3>
                      {notification.title}
                    </h3>

                    {!notification.read && (
                      <span className="unread-dot"></span>
                    )}

                  </div>

                  <p>
                    {notification.message}
                  </p>

                  <div className="notification-meta">

                    <span>
                      <Clock3 size={12} />
                      {notification.time}
                    </span>

                    <span>
                      {notification.project}
                    </span>

                  </div>

                </div>


                {/* ACTIONS */}
                <div className="notification-actions">

                  {!notification.read && (
                    <button
                      type="button"
                      className="notification-read-button"
                      onClick={() =>
                        markAsRead(notification.id)
                      }
                      title="Mark as read"
                    >
                      <Check size={15} />
                    </button>
                  )}

                  <button
                    type="button"
                    className="notification-more-button"
                  >
                    <MoreHorizontal size={17} />
                  </button>

                </div>

              </div>
            );
          })
        )}

      </div>

    </div>
  );
}