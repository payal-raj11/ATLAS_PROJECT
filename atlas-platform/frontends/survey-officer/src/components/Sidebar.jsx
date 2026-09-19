import {
  HomeIcon,
  WalletIcon,
  MapPinIcon,
  FlagIcon,
  BellIcon,
  FileIcon,
  UserIcon,
} from "./Icons";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: HomeIcon },
  { id: "compensation", label: "My Compensation", icon: WalletIcon },
  { id: "parcels", label: "My Land Parcels", icon: MapPinIcon },
  { id: "complaints", label: "Complaints", icon: FlagIcon },
  { id: "notifications", label: "Notifications", icon: BellIcon },
  { id: "documents", label: "Documents", icon: FileIcon },
  { id: "profile", label: "Profile", icon: UserIcon },
];

export default function Sidebar({ active, onNavigate, counts }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-role-badge">LANDOWNER PORTAL</div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const count = counts?.[id];
          return (
            <button
              key={id}
              type="button"
              className={`sidebar-link ${active === id ? "sidebar-link-active" : ""}`}
              onClick={() => onNavigate(id)}
            >
              <Icon width={17} height={17} />
              <span>{label}</span>
              {count > 0 && <span className="sidebar-count">{count}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <p>Need help with your case?</p>
        <a href="#grievance">Contact District Grievance Cell →</a>
      </div>
    </aside>
  );
}
