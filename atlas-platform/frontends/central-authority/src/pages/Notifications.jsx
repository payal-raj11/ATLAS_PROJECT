import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getNotifications, NOTIFICATION_TYPES, TYPE_COLOR } from "../data/notificationsData";


function Notifications() {

  const navigate = useNavigate();
  const all = useMemo(() => getNotifications(), []);

  const [filter, setFilter] = useState("All");
  const [readIds, setReadIds] = useState(() => new Set());

  const visible = filter === "All" ? all : all.filter((n) => n.type === filter);

  const markRead = (id) => {
    setReadIds((prev) => new Set(prev).add(id));
  };

  const markAllRead = () => {
    setReadIds(new Set(all.map((n) => n.id)));
  };

  const unreadCount = all.filter((n) => !readIds.has(n.id)).length;

  const handleOpen = (n) => {
    markRead(n.id);
    if (n.projectId) navigate(`/projects/${n.projectId}`);
    else if (n.link) navigate(n.link);
  };

  return (

    <div className="central-dashboard tabbed-module">

      <div className="tabbed-module-header">
        <h2>Notifications</h2>
        <p>
          Approval, risk, verification and deadline alerts, generated from
          real project state — not a separately maintained list.
        </p>
      </div>

      <div className="module-tabs" style={{ justifyContent: "space-between", alignItems: "center" }}>

        <div style={{ display: "flex", gap: "0.35rem" }}>
          {["All", ...NOTIFICATION_TYPES].map((t) => (
            <button
              key={t}
              type="button"
              className={`module-tab ${filter === t ? "module-tab-active" : ""}`}
              onClick={() => setFilter(t)}
            >
              {t}{t !== "All" ? ` (${all.filter((n) => n.type === t).length})` : ""}
            </button>
          ))}
        </div>

        <button type="button" className="settings-btn" onClick={markAllRead} style={{ marginBottom: "0.6rem" }}>
          Mark all as read ({unreadCount} unread)
        </button>

      </div>

      <div className="dashboard-panel">

        {visible.length === 0 && (
          <p className="land-note">No notifications in this category.</p>
        )}

        <ul className="notif-list">

          {visible.map((n) => {
            const isRead = readIds.has(n.id);
            return (
              <li
                key={n.id}
                className={`notif-row ${isRead ? "notif-row-read" : ""} ${(n.projectId || n.link) ? "notif-row-clickable" : ""}`}
                onClick={() => handleOpen(n)}
              >
                <span className="notif-dot" style={{ backgroundColor: TYPE_COLOR[n.type] }} />
                <span className="notif-type" style={{ color: TYPE_COLOR[n.type] }}>{n.type}</span>
                <span className="notif-title">
                  {n.title}
                  {n.illustrative && <span className="notif-illustrative"> · illustrative</span>}
                </span>
                <span className="notif-time">{n.time}</span>
                {!isRead && <span className="notif-unread-dot" />}
              </li>
            );
          })}

        </ul>

      </div>

    </div>

  );

}

export default Notifications;
