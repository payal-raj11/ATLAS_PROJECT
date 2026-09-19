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

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("atlas_user") || "null");
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) localStorage.setItem("atlas_user", JSON.stringify(user));
  else localStorage.removeItem("atlas_user");
}

export function logout() {
  setToken(null);
  setStoredUser(null);
  window.location.href = `http://${HOST}:5173`;
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body (e.g. 204) — that's fine
  }

  if (!res.ok) {
    const message = (data && data.message) || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  getMe: () => request("/auth/me"),

  getMyAssignments: () => request("/survey/assignments"),

  getFieldVisits: (parcelId) =>
    request(`/survey/field-visits${parcelId ? `?parcel_id=${parcelId}` : ""}`),

  submitFieldVisit: (payload) =>
    request("/survey/field-visits", { method: "POST", body: payload }),

  updateParcelRecordStatus: (parcelId, recordStatus) =>
    request(`/survey/parcels/${parcelId}/record-status`, {
      method: "PATCH",
      body: { recordStatus },
    }),

  getNotifications: () => request("/notifications"),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () => request("/notifications/read-all", { method: "PATCH" }),
};