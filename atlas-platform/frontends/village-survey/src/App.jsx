import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
} from "react-router-dom";

import "./style.css";

import Dashboard from "./pages/Dashboard";
import LandScrutiny from "./pages/LandScrutiny";
import CadastralCheck from "./pages/CadastralCheck";
import Notifications from "./pages/Notifications";
import DisputeEscalation from "./pages/DisputeEscalation";
import FieldHandover from "./pages/FieldHandover";
import SurveyOfficers from "./pages/SurveyOfficers";
import FieldVisitLog from "./pages/FieldVisitLog";
import OfflineSync from "./pages/OfflineSync";
import { AtlasProvider, useAtlas } from "./context/AtlasContext";
import { logout, getStoredUser } from "./services/apiClient";
import GISMap from "./components/GISMap";


function AppShell() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedGISParcel, setSelectedGISParcel] = useState(null);
  const { online, objections } = useAtlas();

  /*
    The uploaded style.css uses:

    :root                 -> Dark theme
    body.light-theme      -> Light theme

    So we toggle the class on the BODY itself.
  */
  useEffect(() => {
    document.body.classList.toggle("light-theme", !isDarkMode);

    return () => {
      document.body.classList.remove("light-theme");
    };
  }, [isDarkMode]);


  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };


  return (
    <BrowserRouter>

      <div
        className="atlas-app"
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >

        {/* =================================================
            HEADER — FULL WIDTH
        ================================================== */}

        <header
          className="atlas-header"
          style={{
            width: "100%",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "24px",
          }}
        >

          {/* ATLAS BRAND */}

          <div
            className="atlas-brand"
            style={{
              minWidth: "330px",
              flexShrink: 0,
            }}
          >

            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--accent-green-bg)",
                border: "1px solid var(--accent-green-border)",
                color: "var(--accent-green)",
                fontWeight: 800,
                fontSize: "14px",
              }}
            >
              AT
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="atlas-brand-name">
                ATLAS
              </span>

              <span
                style={{
                  color: "var(--text-muted)",
                  fontSize: "10px",
                  lineHeight: "1.2",
                  marginTop: "-2px",
                  whiteSpace: "nowrap",
                }}
              >
                Acquisition Tracking & Land Analysis System
              </span>
            </div>

          </div>


          {/* SEARCH BAR — SHIFTED RIGHT */}

          <div
            style={{
              flex: 1,
              maxWidth: "430px",
              minWidth: "180px",
              position: "relative",
              marginLeft: "70px",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: "13px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                fontSize: "13px",
                pointerEvents: "none",
              }}
            >
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search projects, land records..."
              aria-label="Search projects and land records"
              style={{
                width: "100%",
                height: "36px",
                padding: "0 14px 0 34px",
                borderRadius: "7px",
                border: "1px solid var(--border-color)",
                background: "var(--bg-input)",
                color: "var(--text-primary)",
                outline: "none",
                fontSize: "12px",
              }}
            />
          </div>


          {/* HEADER META */}

          <div
            className="header-meta"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              flexShrink: 0,
            }}
          >

            <span className="atlas-alerts">
              🔔 Alerts ({objections.filter((item) => item.status === "Pending" || item.status === "Under Review").length})
            </span>


            <button
              className="theme-btn"
              onClick={toggleTheme}
              type="button"
            >

              <span className="dot"></span>

              {isDarkMode ? "Light" : "Dark"}

            </button>


            {/* VILLAGE CLERK */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
                paddingLeft: "4px",
                borderLeft: "1px solid var(--border-color)",
              }}
            >

              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(37, 99, 235, 0.16)",
                  border: "1px solid rgba(37, 99, 235, 0.35)",
                  color: "#60a5fa",
                  fontSize: "11px",
                  fontWeight: 800,
                }}
              >
                VC
              </div>

              <div>
                <div
                  style={{
                    color: "var(--text-primary)",
                    fontSize: "12px",
                    fontWeight: 700,
                    lineHeight: "1.2",
                  }}
                >
                  Village Clerk
                </div>

                <div
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "9px",
                    marginTop: "2px",
                  }}
                >
                  Village Authority
                </div>
              </div>

            </div>

          </div>

        </header>

        {/* =====================================================
            SIDEBAR + MAIN APPLICATION
        ====================================================== */}

        <div
          style={{
            display: "flex",
            flex: 1,
            minHeight: 0,
            width: "100%",
          }}
        >

        <aside className="atlas-sidebar">

          {/* PROFILE */}

          <div className="atlas-profile">

            <div className="atlas-avatar">
              {(getStoredUser()?.full_name || "?")
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>

            <div>
              <div className="atlas-profile-name">
                {getStoredUser()?.full_name || "Not signed in"}
              </div>

              <div className="atlas-profile-village">
                {getStoredUser()?.village || getStoredUser()?.district || getStoredUser()?.state || ""}
              </div>
            </div>

          </div>

          <button
            onClick={logout}
            style={{
              margin: "0 16px 16px",
              padding: "8px 12px",
              background: "transparent",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
              color: "#374151",
              width: "calc(100% - 32px)",
            }}
          >
            Sign Out
          </button>


          {/* NAVIGATION */}

          <nav className="atlas-navigation">

            <NavLink
              to="/"
              end
            >
              Dashboard
            </NavLink>


            <NavLink to="/land-scrutiny">
              Land Scrutiny
            </NavLink>


            <NavLink to="/boundary-check">
              Boundary Check
            </NavLink>


            <NavLink to="/notifications">
              Notifications & Objections
            </NavLink>


            <NavLink to="/disputes">
              Dispute Escalation
            </NavLink>


            {/* FIELD HANDOVER — NOT POSSESSION */}

            <NavLink to="/field-handover">
              Field Handover 
            </NavLink>


            <NavLink to="/survey-officers">
              Survey Officers
            </NavLink>


            <NavLink to="/field-visits">
              Field Visit Log
            </NavLink>


            <NavLink to="/sync">
              Offline / Sync
            </NavLink>

          </nav>


          {/* SYNC STATUS */}

          <div className="atlas-sync">
            Sync Status:
            <span>{online ? " 🟢 Online" : " 🔴 Offline"}</span>
          </div>

        </aside>


        {/* =====================================================
            MAIN APPLICATION
        ====================================================== */}

        <div className="atlas-main">


          {/* =================================================
              PAGE CONTENT
          ================================================== */}

          <main className="atlas-workbench">

            <Routes>

              {/* DASHBOARD */}

              <Route
                path="/"
                element={
                  <Dashboard
                    isDarkMode={isDarkMode}
                    GISMap={GISMap}
                    selectedGISParcel={selectedGISParcel}
                    onGISParcelSelect={setSelectedGISParcel}
                  />
                }
              />
              <Route
                path="/dashboard/*"
                element={
                  <Dashboard
                    isDarkMode={isDarkMode}
                    GISMap={GISMap}
                    selectedGISParcel={selectedGISParcel}
                    onGISParcelSelect={setSelectedGISParcel}
                  />
                }
              />

              {/* LAND SCRUTINY */}

              <Route
                path="/land-scrutiny/*"
                element={
                  <LandScrutiny
                    isDarkMode={isDarkMode}
                  />
                }
              />


              {/* BOUNDARY CHECK */}

              <Route
                path="/boundary-check"
                element={
                  <CadastralCheck
                    isDarkMode={isDarkMode}
                  />
                }
              />


              <Route
                path="/boundary-check/*"
                element={<CadastralCheck isDarkMode={isDarkMode} />}
              />


              {/* NOTIFICATIONS */}

              <Route
                path="/notifications/*"
                element={<Notifications isDarkMode={isDarkMode} />}
              />


              {/* DISPUTE ESCALATION */}

              <Route
                path="/disputes/*"
                element={<DisputeEscalation isDarkMode={isDarkMode} />}
              />


              {/* FIELD HANDOVER */}

              <Route
                path="/field-handover/*"
                element={<FieldHandover isDarkMode={isDarkMode} />}
              />

              {/* SURVEY OFFICERS */}

              <Route
                path="/survey-officers/*"
                element={<SurveyOfficers isDarkMode={isDarkMode} />}
              />


              {/* FIELD VISIT LOG */}

              <Route
                path="/field-visits/*"
                element={<FieldVisitLog isDarkMode={isDarkMode} />}
              />


              {/* OFFLINE / SYNC */}

              <Route
                path="/sync/*"
                element={<OfflineSync isDarkMode={isDarkMode} />}
              />
            </Routes>

          </main>

        </div>

        </div>

      </div>

    </BrowserRouter>
  );
}


function App() {
  return (
    <AtlasProvider>
      <AppShell />
    </AtlasProvider>
  );
}

export default App;
