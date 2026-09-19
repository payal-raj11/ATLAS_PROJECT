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
    const message = (data && data.error) || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  // Real login is two-step OTP now (matches every other role's auth
  // flow on the unified backend): request an OTP, then verify it.
  requestOtp: (identity, passcode) =>
    request("/auth/landowner/request-otp", { method: "POST", body: { identity, secret: passcode }, auth: false }),
  verifyOtp: (identity, otp) =>
    request("/auth/landowner/verify-otp", { method: "POST", body: { identity, otp }, auth: false }),

  getMe: () => request("/auth/me"),

  getParcels: () => request("/parcels"),

  getNotifications: () => request("/notifications"),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () => request("/notifications/read-all", { method: "PATCH" }),

  getComplaints: () => request("/complaints"),
  fileComplaint: (complaint) => request("/complaints", { method: "POST", body: complaint }),

  getDocuments: () => request("/documents"),
};
