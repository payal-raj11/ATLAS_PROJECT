import { Routes, Route } from "react-router-dom";

import Dashboard from "../pages/Dashboard";
import Projects from "../pages/projects/Projects";
import ProjectDetails from "../pages/projects/ProjectDetails";
import Notifications from "../pages/notifications/Notifications";
import Reports from "../pages/reports/Reports";
import ProjectCompletion from "../pages/completion/ProjectCompletion";
import ProjectsToDistrict from "../pages/district/ProjectsToDistrict";
import Profile from "../pages/settings/Profile";
import Settings from "../pages/settings/Settings";
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />

      <Route path="/projects" element={<Projects />} />

      <Route
        path="/projects/:projectId"
        element={<ProjectDetails />}
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
        path="/completion"
        element={<ProjectCompletion />}
      />
      <Route
        path="/district-projects"
        element={<ProjectsToDistrict />}
      />
      <Route
        path="/profile"
        element={<Profile />}
      />
      <Route
        path="/settings"
        element={<Settings />}
      />
    </Routes>
  );
}