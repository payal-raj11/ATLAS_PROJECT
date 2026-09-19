import { BellIcon } from "./Icons";

export default function Header({
  landowner,
  unreadCount,
  darkMode,
  onToggleDarkMode,
  onOpenNotifications,
}) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="atlas-mark">ATLAS</span>
        <div className="topbar-titles">
          <strong>Acquisition Tracking &amp; Land Analysis System</strong>
          <span>Ministry of Rural Development · Government of India</span>
        </div>
      </div>

      <div className="topbar-actions">
        <button
          className="mode-toggle-pill"
          type="button"
          onClick={onToggleDarkMode}
          aria-label="Toggle dark mode"
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span className="mode-toggle-dot" />
          {darkMode ? "Dark Mode" : "Light Mode"}
        </button>

        <button
          className="icon-btn icon-btn-bell"
          type="button"
          onClick={onOpenNotifications}
          aria-label="Open notifications"
          title="Notifications"
        >
          <BellIcon />
          {unreadCount > 0 && <span className="bell-dot">{unreadCount}</span>}
        </button>

        <div className="topbar-user">
          <span className="user-avatar">
            {landowner?.photoInitials || landowner?.name?.slice(0, 2)?.toUpperCase() || "VV"}
          </span>
          <div className="topbar-user-meta">
            <strong>{landowner?.name || "Landowner"}</strong>
            <span>{landowner?.role || "Official Landowner"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
