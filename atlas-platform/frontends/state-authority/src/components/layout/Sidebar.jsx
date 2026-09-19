import { useState } from "react";
import { NavLink } from "react-router-dom";
import { logout } from "../../services/apiClient";

import {
  LayoutDashboard,
  FolderKanban,
  Bell,
  BarChart3,
  ClipboardCheck,
  MapPin,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

export default function Sidebar({ collapsed, onToggle }) {
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const navItems = [
    {
      label: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Projects",
      path: "/projects",
      icon: FolderKanban,
      exact: false,
    },
    {
      label: "Notifications",
      path: "/notifications",
      icon: Bell,
      exact: false,
      badge: 4,
    },
    {
      label: "Reports & Analytics",
      path: "/reports",
      icon: BarChart3,
      exact: false,
    },
    {
      label: "Project Completion",
      path: "/completion",
      icon: ClipboardCheck,
      exact: false,
    },
    {
      label: "District Projects",
      path: "/district-projects",
      icon: MapPin,
      exact: false,
    },
  ];

  const handleSignOut = () => {
    setShowSignOutModal(false);
    logout(); // clears the token and redirects to the login app
  };

  return (
    <>
      <aside
        className={`sidebar ${
          collapsed ? "sidebar-collapsed" : ""
        }`}
      >
        <div className="sidebar-brand">
          <div className="sidebar-logo">AT</div>

          {!collapsed && (
            <div className="sidebar-brand-text">
              <h2>ATLAS</h2>
              <p>
                Acquisition Tracking & Land Analysis System
              </p>
            </div>
          )}
        </div>

        <div className="sidebar-brand-divider" />

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">MAIN</div>

          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <Icon size={20} className="sidebar-icon" />

                {!collapsed && (
                  <span className="sidebar-link-text">
                    {item.label}
                  </span>
                )}

                {!collapsed && item.badge && (
                  <span className="sidebar-badge">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-divider" />

          <div className="sidebar-section-title">
            {!collapsed && "ACCOUNT"}
          </div>

          <NavLink
            to="/profile"
            end
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <User size={20} className="sidebar-icon" />

            {!collapsed && (
              <span className="sidebar-link-text">
                Profile
              </span>
            )}
          </NavLink>

          <NavLink
            to="/settings"
            end
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <Settings size={20} className="sidebar-icon" />

            {!collapsed && (
              <span className="sidebar-link-text">
                Settings
              </span>
            )}
          </NavLink>

          {/* SIGN OUT BUTTON */}
          <button
            type="button"
            className="sidebar-link sidebar-logout"
            onClick={() => setShowSignOutModal(true)}
          >
            <LogOut size={20} className="sidebar-icon" />

            {!collapsed && (
              <span className="sidebar-link-text">
                Sign Out
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          className="sidebar-collapse"
          onClick={onToggle}
        >
          {collapsed ? (
            <ChevronRight size={17} />
          ) : (
            <ChevronLeft size={17} />
          )}
        </button>
      </aside>

      {/* SIGN OUT MODAL */}
      {showSignOutModal && (
        <div
          className="signout-overlay"
          onClick={() => setShowSignOutModal(false)}
        >
          <div
            className="signout-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="signout-modal-header">
              <h3>Sign out?</h3>

              <button
                type="button"
                className="signout-close"
                onClick={() => setShowSignOutModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p>
              Are you sure you want to sign out of your
              account?
            </p>

            <div className="signout-modal-actions">
              <button
                type="button"
                className="signout-cancel"
                onClick={() => setShowSignOutModal(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="signout-confirm"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}