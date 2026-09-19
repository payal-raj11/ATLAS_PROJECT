// Shared API client for every ATLAS dashboard frontend (Central,
// State, District, Village/Survey, Landowner).
//
// Copy this file into each app's `src/services/apiClient.js`.
// Nothing here is app-specific — the role-scoping happens
// server-side based on the logged-in user's token.

// VITE_HOST lets the whole app run on your LAN instead of just your
// own machine -- set it once (per app) to your laptop's LAN IP and
// every cross-app URL below uses it automatically. Leave it unset
// for normal localhost-only development.
const HOST = import.meta.env.VITE_HOST || "localhost";
const API_BASE = import.meta.env.VITE_API_BASE || `http://${HOST}:5000/api`;
const TOKEN_KEY = "atlas_token";
const USER_KEY = "atlas_user";

// Call this once, before your app renders (see main.jsx patches).
// Picks up ?token=... from the URL when the Login page hands off to
// this app, stores it, and cleans the URL so a refresh doesn't
// resubmit it.
export function bootstrapAuthFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    params.delete("token");
    const clean = window.location.pathname + (params.toString() ? `?${params}` : "");
    window.history.replaceState({}, "", clean);
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = `http://${HOST}:5173`; // back to the login app
}

async function request(path, { method = "GET", body, headers = {} } = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    // Token missing/expired — bounce back to login rather than
    // rendering a broken dashboard.
    logout();
    return Promise.reject(new Error("Not authenticated"));
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

// -------------------- typed helpers --------------------

export const api = {
  me: () => request("/auth/me"),

  projects: {
    list: (status) => request(`/projects${status ? `?status=${status}` : ""}`),
    get: (id) => request(`/projects/${id}`),
    create: (payload) => request("/projects", { method: "POST", body: payload }),
    accept: (id) => request(`/projects/${id}/accept`, { method: "POST" }),
    reject: (id, reason) => request(`/projects/${id}/reject`, { method: "POST", body: { reason } }),
    assign: (id, payload) => request(`/projects/${id}/assign`, { method: "POST", body: payload }),
    verify: (id) => request(`/projects/${id}/verify`, { method: "POST" }),
  },

  parcels: {
    list: (projectId) => request(`/parcels${projectId ? `?project_id=${projectId}` : ""}`),
    get: (id) => request(`/parcels/${id}`),
    geojson: (projectId) => request(`/parcels/geojson/${projectId}`),
  },

  notifications: {
    list: () => request("/notifications"),
    markRead: (id) => request(`/notifications/${id}/read`, { method: "PATCH" }),
    markAllRead: () => request("/notifications/read-all", { method: "PATCH" }),
  },

  disputes: {
    list: (parcelId) => request(`/disputes${parcelId ? `?parcel_id=${parcelId}` : ""}`),
    create: (payload) => request("/disputes", { method: "POST", body: payload }),
  },
};
