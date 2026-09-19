import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { setToken } from "./api";

// Picks up the token handed off by the Login app (?token=...).
// NOTE: App.jsx itself still renders from src/data/mockData.js on
// every page — this only gets the token stored. Wiring each page
// (DashboardOverview, MyParcels, CompensationTracker, etc.) to call
// the real api.* methods above instead of the mock data is the
// remaining work for this app, same pattern as Central/State.
const params = new URLSearchParams(window.location.search);
const tokenFromUrl = params.get("token");
if (tokenFromUrl) {
  setToken(tokenFromUrl);
  params.delete("token");
  const clean = window.location.pathname + (params.toString() ? `?${params}` : "");
  window.history.replaceState({}, "", clean);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
