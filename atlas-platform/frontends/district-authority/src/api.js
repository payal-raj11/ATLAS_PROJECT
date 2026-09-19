const HOST = import.meta.env.VITE_HOST || "localhost";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${HOST}:5000/api`;
const TOKEN_KEY = "atlas_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}
export function logout() {
  setToken(null);
  window.location.href = `http://${HOST}:5173`; // back to the login app
}

async function request(path, { method = "GET", body } = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try { data = await res.json(); } catch { /* no body */ }

  if (!res.ok) throw new Error((data && data.message) || `Request failed (${res.status})`);
  return data;
}

export const api = {
  me: () => request("/auth/me"),

  projects: {
    list: () => request("/projects"),
    accept: (id) => request(`/projects/${id}/accept`, { method: "POST" }),
    reject: (id, reason) => request(`/projects/${id}/reject`, { method: "POST", body: { reason } }),
    verify: (id) => request(`/projects/${id}/verify`, { method: "POST" }),
  },

  parcels: {
    list: (projectId) => request(`/parcels${projectId ? `?project_id=${projectId}` : ""}`),
  },

  notifications: {
    list: () => request("/notifications"),
    markAllRead: () => request("/notifications/read-all", { method: "PATCH" }),
  },
};
