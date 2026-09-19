import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import { bootstrapAuthFromUrl } from "./services/apiClient";

// Picks up the token handed off by the Login app (?token=...) before
// anything else renders.
bootstrapAuthFromUrl();


createRoot(
  document.getElementById("root")
).render(

  <StrictMode>

    <App />

  </StrictMode>

);