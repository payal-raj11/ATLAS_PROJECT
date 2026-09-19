
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import SignOutModal from "./components/SignOutModal";
import { logout } from "./services/apiClient";

import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import AddProposal from "./pages/AddProposal";
import LandLayout from "./pages/land/LandLayout";
import Funding from "./pages/Funding";
import Monitoring from "./pages/Monitoring";
import Notifications from "./pages/Notifications";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import SignedOut from "./pages/SignedOut";

import "./styles/atlas.css";
import "./styles/layout.css";
import "./styles/projects.css";
import "./styles/project-details.css";
import "./styles/dashboard.css";
import "./styles/modules.css";


function App() {

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("atlas-theme") !== "light";
  });

  const [signedOut, setSignedOut] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const handleConfirmSignOut = () => {
    setShowSignOutModal(false);
    logout(); // clears the token and redirects to the login app
  };


  /*
    Apply ATLAS theme to the entire application.
  */
  useEffect(() => {

    if (darkMode) {

      document.body.classList.remove("light-theme");

      localStorage.setItem(
        "atlas-theme",
        "dark"
      );

    } else {

      document.body.classList.add("light-theme");

      localStorage.setItem(
        "atlas-theme",
        "light"
      );

    }

  }, [darkMode]);


  if (signedOut) {

    return (

      <SignedOut onSignBackIn={() => setSignedOut(false)} />

    );

  }

  return (

    <BrowserRouter>

      <div className="authority-app">

        <Header
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />


        <SignOutModal
          open={showSignOutModal}
          onCancel={() => setShowSignOutModal(false)}
          onConfirm={handleConfirmSignOut}
        />


        <div className="authority-body">

          <Sidebar onRequestSignOut={() => setShowSignOutModal(true)} />


          <main className="authority-page">

            <Routes>

              {/* Dashboard */}
              <Route
                path="/"
                element={<Dashboard />}
              />

              <Route
                path="/dashboard"
                element={<Dashboard />}
              />


              {/* All Projects */}
              <Route
                path="/projects"
                element={<Projects />}
              />


              {/* Individual Project */}
              <Route
                path="/projects/:projectId"
                element={<ProjectDetails />}
              />

              {/* Add New Proposal */}
<Route
  path="/proposals/new"
  element={<AddProposal />}
/>

              {/* Land & Impact */}
              <Route
                path="/land"
                element={<LandLayout />}
              />

              {/* Other sections */}
              <Route
                path="/funding"
                element={<Funding />}
              />

              <Route
                path="/monitoring"
                element={<Monitoring />}
              />

              <Route
                path="/notifications"
                element={<Notifications />}
              />

              <Route
                path="/reports"
                element={<Reports />}
              />

              <Route
                path="/settings"
                element={<Settings />}
              />

              <Route
                path="/profile"
                element={<Profile />}
              />

            </Routes>

          </main>

        </div>

      </div>

    </BrowserRouter>

  );
}


export default App;