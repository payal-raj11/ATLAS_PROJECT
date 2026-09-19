import { useState } from "react";

import {
  Sun,
  Moon,
  Bell,
  Search,
  ChevronDown,
} from "lucide-react";

export default function Header() {
  const [theme, setTheme] = useState(
    document.documentElement.getAttribute(
      "data-theme"
    ) || "light"
  );

  const toggleTheme = () => {
    const newTheme =
      theme === "dark"
        ? "light"
        : "dark";

    document.documentElement.setAttribute(
      "data-theme",
      newTheme
    );

    localStorage.setItem(
      "theme",
      newTheme
    );

    setTheme(newTheme);
  };

  return (
    <header className="header">

      {/* SEARCH */}

      <div className="header-search">
        <Search size={14} />

        <input
          type="text"
          placeholder="Search projects, land records..."
        />
      </div>

      {/* RIGHT SIDE */}

      <div className="header-actions">

        {/* THEME */}

        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          title={
            theme === "dark"
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
        >
          <span className="theme-toggle-dot"></span>

          {theme === "dark" ? (
            <>
              <Moon size={13} />
              <span>Dark</span>
            </>
          ) : (
            <>
              <Sun size={13} />
              <span>Light</span>
            </>
          )}
        </button>

        {/* NOTIFICATION */}

        <button
          type="button"
          className="header-icon-button"
          title="Notifications"
        >
          <Bell size={17} />

          <span className="header-notification-dot"></span>
        </button>

        {/* USER */}

        <div
  className="header-user"
  onClick={() => {
    window.location.href = "/profile";
  }}
  style={{ cursor: "pointer" }}
>
          <div className="header-avatar">
            CG
          </div>

          <div className="header-user-info">
  <strong>State Government</strong>
  <span>State Authority</span>
</div>

          <ChevronDown size={14} />

        </div>

      </div>
    </header>
  );
}