import { useState } from "react";

const FILTERS = ["All", "Unread", "info", "success", "warning", "complaint"];
const FILTER_LABELS = {
  All: "All",
  Unread: "Unread",
  info: "Updates",
  success: "Payments",
  warning: "Action needed",
  complaint: "Complaints",
};

export default function Notifications({ notifications, onMarkRead, onMarkAllRead }) {
  const [filter, setFilter] = useState("All");

  const filtered = notifications.filter((n) => {
    if (filter === "All") return true;
    if (filter === "Unread") return !n.read;
    return n.type === filter;
  });

  return (
    <div className="page">
      <div className="page-header page-header-row">
        <div>
          <h1>Notifications</h1>
          <p>Payment credits, status changes, and action items for your acquisition case.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={onMarkAllRead}>
          Mark all as read
        </button>
      </div>

      <div className="tab-strip">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={`tab-chip ${filter === f ? "tab-chip-active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      <section className="card">
        {filtered.length === 0 ? (
          <p className="empty-state">No notifications in this view.</p>
        ) : (
          <ul className="notification-list">
            {filtered.map((n) => (
              <li
                key={n.id}
                className={`notification-item ${!n.read ? "notification-item-unread" : ""}`}
                onClick={() => onMarkRead(n.id)}
              >
                <span className={`dot dot-${n.type}`} />
                <div className="notification-body">
                  <div className="notification-top">
                    <strong>{n.title}</strong>
                    <span>{n.date}</span>
                  </div>
                  <p>{n.message}</p>
                </div>
                {!n.read && <span className="unread-pip" />}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
