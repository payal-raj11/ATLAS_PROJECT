import { NavLink } from "react-router-dom";

function Sidebar() {

  const navigation = [
    {
      path: "/dashboard",
      icon: "▦",
      label: "Dashboard"
    },
    {
      path: "/projects",
      icon: "▣",
      label: "Projects"
    },
    {
      path: "/land",
      icon: "◇",
      label: "Land & Impact"
    },
    {
      path: "/funding",
      icon: "₹",
      label: "Funding"
    },
    {
      path: "/monitoring",
      icon: "◫",
      label: "Monitoring"
    },
    {
      path: "/notifications",
      icon: "♧",
      label: "Notifications"
    },
    {
      path: "/reports",
      icon: "▤",
      label: "Reports"
    }
  ];


  return (
    <aside className="authority-sidebar">

      <div className="sidebar-section-title">
        Main
      </div>


      <nav className="sidebar-nav">

        {navigation.map((item) => (

          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >

            <span className="sidebar-icon">
              {item.icon}
            </span>

            <span>
              {item.label}
            </span>

          </NavLink>

        ))}

      </nav>


      <div className="sidebar-bottom">

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="sidebar-icon">⚙</span>
          <span>Settings</span>
        </NavLink>


        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="sidebar-icon">◉</span>
          <span>Profile</span>
        </NavLink>

      </div>

    </aside>
  );
}

export default Sidebar;