import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { setToken } from './api'

// Picks up the token handed off by the Login app (?token=...).
const params = new URLSearchParams(window.location.search);
const tokenFromUrl = params.get("token");
if (tokenFromUrl) {
  setToken(tokenFromUrl);
  params.delete("token");
  const clean = window.location.pathname + (params.toString() ? `?${params}` : "");
  window.history.replaceState({}, "", clean);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
