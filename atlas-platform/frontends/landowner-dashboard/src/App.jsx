import { useEffect, useState } from "react";
import "./App.css";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import DashboardOverview from "./components/DashboardOverview";
import CompensationTracker from "./components/CompensationTracker";
import MyParcels from "./components/MyParcels";
import Complaints from "./components/Complaints";
import Notifications from "./components/Notifications";
import Documents from "./components/Documents";
import Profile from "./components/Profile";

import {
  landowner as defaultLandowner,
  parcels as defaultParcels,
  initialNotifications,
  initialComplaints,
  documents as defaultDocuments,
} from "./data/mockData";
import { api } from "./api";

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  const [landowner, setLandowner] = useState(defaultLandowner || {});
  const [parcels, setParcels] = useState(defaultParcels || []);
  const [notifications, setNotifications] = useState(initialNotifications || []);
  const [complaints, setComplaints] = useState(initialComplaints || []);
  const [documents, setDocuments] = useState(defaultDocuments || []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Load from the unified ATLAS backend (real Postgres data, scoped
  // to whichever landowner is logged in via their JWT). Falls back
  // to local mock data if the token is missing/expired or the
  // request fails, so the UI stays usable in isolation too.
  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, pRes, nRes, cRes, dRes] = await Promise.allSettled([
          api.getMe(),
          api.getParcels(),
          api.getNotifications(),
          api.getComplaints(),
          api.getDocuments(),
        ]);

        if (meRes.status === "fulfilled" && meRes.value?.user) {
          const u = meRes.value.user;
          setLandowner((prev) => ({
            ...prev,
            id: u.id,
            name: u.full_name,
            phone: u.phone,
            photoInitials: (u.full_name || "").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "LO",
          }));
        }

        if (pRes.status === "fulfilled" && pRes.value?.parcels?.length) {
          setParcels(pRes.value.parcels);
        }

        if (nRes.status === "fulfilled" && nRes.value?.notifications?.length) {
          setNotifications(nRes.value.notifications);
        }

        if (cRes.status === "fulfilled" && cRes.value?.complaints?.length) {
          setComplaints(cRes.value.complaints);
        }

        if (dRes.status === "fulfilled" && dRes.value?.documents?.length) {
          setDocuments(dRes.value.documents);
        }
      } catch (err) {
        console.warn("Using local mock data:", err);
      }
    }

    loadData();
  }, []);

  function markNotificationRead(id) {
    setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
    api.markNotificationRead(id).catch(() => {});
  }

  function markAllNotificationsRead() {
    setNotifications((list) => list.map((n) => ({ ...n, read: true })));
    api.markAllNotificationsRead().catch(() => {});
  }

  function fileComplaint(draft) {
    const today = new Date().toISOString().slice(0, 10);
    const created = {
      id: `CMP-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "Submitted",
      dateFiled: today,
      lastUpdate: today,
      ...draft,
    };
    setComplaints((list) => [created, ...list]);

    api.fileComplaint(draft).catch(() => {});

    return created;
  }

  const unreadCount = (notifications || []).filter((n) => !n.read).length;
  const openComplaintCount = (complaints || []).filter((c) => c.status !== "Resolved").length;

  return (
    <div className={`app ${darkMode ? "dark" : ""}`}>
      <Header
        landowner={landowner}
        unreadCount={unreadCount}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        onOpenNotifications={() => setActiveSection("notifications")}
      />

      <div className="app-body">
        <Sidebar
          active={activeSection}
          onNavigate={setActiveSection}
          counts={{ notifications: unreadCount, complaints: openComplaintCount }}
        />

        <main className="app-content">
          {activeSection === "dashboard" && (
            <DashboardOverview
              landowner={landowner}
              parcels={parcels}
              notifications={notifications}
              complaints={complaints}
              onNavigate={setActiveSection}
            />
          )}

          {activeSection === "compensation" && <CompensationTracker parcels={parcels} />}
          {activeSection === "parcels" && <MyParcels parcels={parcels} />}
          {activeSection === "complaints" && (
            <Complaints
              complaints={complaints}
              parcels={parcels}
              onFileComplaint={fileComplaint}
            />
          )}
          {activeSection === "notifications" && (
            <Notifications
              notifications={notifications}
              onMarkRead={markNotificationRead}
              onMarkAllRead={markAllNotificationsRead}
            />
          )}
          {activeSection === "documents" && (
            <Documents documents={documents} parcels={parcels} />
          )}
          {activeSection === "profile" && (
            <Profile
              landowner={landowner}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode((d) => !d)}
              onSaveProfile={(patch) => {
                setLandowner((prev) => ({ ...prev, ...patch }));
                // NOTE: the unified backend doesn't have a profile-update
                // endpoint yet (PATCH /api/auth/me) -- this updates local
                // state only until that route is added.
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}