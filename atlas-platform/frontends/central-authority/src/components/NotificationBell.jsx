import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getNotifications, NOTIFICATION_TYPES, TYPE_COLOR } from "../data/notificationsData";


// Header bell: shows the same real, derived notification feed as the
// full /notifications page, grouped ("segregated") by type, capped to
// a handful per group so the dropdown stays scannable. No separate
// read/unread store is kept here — the badge counts everything the
// feed currently surfaces, the same number the sidebar/full page uses.
function NotificationBell() {

  const [open, setOpen] = useState(null);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  const notifications = getNotifications();

  const grouped = NOTIFICATION_TYPES
    .map((type) => ({
      type,
      color: TYPE_COLOR[type],
      items: notifications.filter((n) => n.type === type).slice(0, 3),
      count: notifications.filter((n) => n.type === type).length,
    }))
    .filter((g) => g.count > 0);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleOpenItem = (n) => {
    setOpen(false);
    if (n.projectId) {
      navigate(`/projects/${n.projectId}`);
    } else if (n.link) {
      navigate(n.link);
    } else {
      navigate("/notifications");
    }
  };

  return (

    <div className="notif-bell" ref={wrapRef}>

      <button
        type="button"
        className="notif-bell-btn"
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
      >
        🔔
        {notifications.length > 0 && (
          <span className="notif-bell-badge">
            {notifications.length > 99 ? "99+" : notifications.length}
          </span>
        )}
      </button>

      {open && (

        <div className="notif-dropdown">

          <div className="notif-dropdown-header">
            <strong>Notifications</strong>
            <span>{notifications.length} active</span>
          </div>

          <div className="notif-dropdown-body">

            {grouped.length === 0 && (
              <div className="notif-dropdown-empty">Nothing to review right now.</div>
            )}

            {grouped.map((g) => (

              <div key={g.type} className="notif-dropdown-section">

                <div className="notif-dropdown-section-title">
                  <span className="notif-dot" style={{ backgroundColor: g.color }} />
                  {g.type}
                  <span className="notif-dropdown-count">{g.count}</span>
                </div>

                {g.items.map((n) => (
                  <button
                    type="button"
                    key={n.id}
                    className="notif-dropdown-item"
                    onClick={() => handleOpenItem(n)}
                  >
                    <span className="notif-dropdown-item-title">{n.title}</span>
                    <span className="notif-dropdown-item-time">
                      {n.time}{n.illustrative ? " · illustrative" : ""}
                    </span>
                  </button>
                ))}

              </div>

            ))}

          </div>

          <button
            type="button"
            className="notif-dropdown-footer"
            onClick={() => { setOpen(false); navigate("/notifications"); }}
          >
            View all notifications →
          </button>

        </div>

      )}

    </div>

  );

}


export default NotificationBell;
