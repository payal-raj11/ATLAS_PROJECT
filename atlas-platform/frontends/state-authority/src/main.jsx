import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";
import { bootstrapAuthFromUrl } from "./services/apiClient";

bootstrapAuthFromUrl();

const savedTheme =
  localStorage.getItem("theme") || "light";

document.documentElement.setAttribute(
  "data-theme",
  savedTheme
);

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);  