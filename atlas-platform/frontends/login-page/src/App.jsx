import React, { useState, useEffect } from "react";
import "./App.css";

// Central place to change the backend URL and where each role lands
// after a successful login. In dev, each frontend runs on its own
// Vite port — update these once you know your real ports/domains.
const HOST = import.meta.env.VITE_HOST || "localhost";
const API_BASE = `http://${HOST}:5000/api`;

const ROLE_DASHBOARD_URL = {
  central: `http://${HOST}:5174`,
  state: `http://${HOST}:5175`,
  district: `http://${HOST}:5179`, // now has its own dedicated app
  village: `http://${HOST}:5176`,
  survey: `http://${HOST}:5178`, // now has its own dedicated app
  landowner: `http://${HOST}:5177`,
  agency: `http://${HOST}:5174`,
};

const rolesData = {
  central: {
    badge: "Central Authority",
    desc: "Central Authority: Apex clearance, national land requisition & rural corridor alignment",
    idLabel: "Official Email / Gov ID",
    idPlaceholder: "officer.nodal@rural.gov.in",
    secretLabel: "Authentication Password",
    isLandowner: false,
    isAgency: false
  },
  state: {
    badge: "State Authority",
    desc: "State Authority: Sec 19 state gazette notifications & inter-district approvals",
    idLabel: "Official Email / Gov ID",
    idPlaceholder: "secretary.revenue@state.gov.in",
    secretLabel: "Authentication Password",
    isLandowner: false,
    isAgency: false
  },
  district: {
    badge: "District Authority",
    desc: "District Authority: Competent Authority (CALA / LAC desk) & compensation awards",
    idLabel: "Official Email / Gov ID",
    idPlaceholder: "dm.collector@district.gov.in",
    secretLabel: "Authentication Password",
    isLandowner: false,
    isAgency: false
  },
  village: {
    badge: "Village Authority",
    desc: "Village Authority: Ground level verification, Patwari synchronization & field records",
    idLabel: "Official Email / Patwari Gov ID",
    idPlaceholder: "officer.patwari@revenue.gov.in",
    secretLabel: "Authentication Password",
    isLandowner: false,
    isAgency: false
  },
  survey: {
    badge: "Survey Officer",
    desc: "Survey Officer: Cadastral verification and drone boundary demarcation desk",
    idLabel: "Surveyor Registration ID / Email",
    idPlaceholder: "surveyor.field@surveyofindia.gov.in",
    secretLabel: "Surveyor Passcode / Token",
    isLandowner: false,
    isAgency: false
  },
  landowner: {
    badge: "Landowner Desk",
    desc: "Landowner Desk: Enter your government-issued Portal Login ID and verify via OTP to inspect compensation dossier.",
    idLabel: "Government Issued Landowner Login ID",
    idPlaceholder: "e.g., LO-DL-2026-98144",
    secretLabel: "Dossier Access Password",
    isLandowner: true,
    isAgency: false
  },
  agency: {
    badge: "Project Agency",
    desc: "Project Agency: Concessionaires, EPC contractors, DPR consultants & rural works requisition",
    idLabel: "Corporate Email / Nodal Officer ID",
    idPlaceholder: "nodal.officer@infrastructure.com",
    secretLabel: "Agency Corporate Passcode",
    isLandowner: false,
    isAgency: true
  }
};

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("atlas_theme") || "dark");
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'register'
  const [selectedRole, setSelectedRole] = useState("");
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    identity: "",
    phone: "",
    secret: "",
    confirmSecret: "",
    otp: "",
    ssoEnabled: true
  });

  useEffect(() => {
    document.body.className = theme === "light" ? "light-theme" : "";
    localStorage.setItem("atlas_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleModeSwitch = (mode) => {
    setAuthMode(mode);
    setStatusMsg({ type: "", text: "" });
    if (mode === "register" && selectedRole === "landowner") {
      setSelectedRole("");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const currentRoleConfig = rolesData[selectedRole] || null;

  const getSubmitButtonText = () => {
    if (loading) return "Processing Request...";
    if (!selectedRole) return "Select Role / Authority Above";
    if (authMode === "register") {
      return selectedRole === "agency"
        ? "Register Project Agency"
        : "Submit Official Enrollment Request";
    }
    if (selectedRole === "landowner") return "Verify OTP & Access Landowner Dossier";
    if (selectedRole === "agency") return "Access Agency Workspace";
    return "Authenticate & Access Portal";
  };

  const getSsoLabel = () => {
    if (currentRoleConfig?.isLandowner) return "Two-Factor OTP Authentication Mandatory";
    if (currentRoleConfig?.isAgency) return "Verify via MCA / Corporate Sign-in";
    return "Enable MeriPehchaan (National SSO)";
  };

  const handleGetOtp = async () => {
    if (!formData.identity || !formData.secret) {
      alert("Enter your Login ID and password first, then request an OTP.");
      return;
    }
    try {
      // Step 1 of the landowner flow: verifying identity+password is
      // what actually triggers the OTP send server-side.
      const res = await fetch(`${API_BASE}/auth/landowner/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: formData.identity, secret: formData.secret })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      if (data.devOtp) {
        // Demo mode: show the OTP directly, no terminal needed.
        alert(`Your OTP is: ${data.devOtp}\n\n(Demo mode — in production this would be sent by SMS instead.)`);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: "", text: "" });

    if (!selectedRole) {
      setStatusMsg({ type: "error", text: "Please select an Authority / Role first." });
      return;
    }

    if (authMode === "register" && formData.secret !== formData.confirmSecret) {
      setStatusMsg({ type: "error", text: "Passwords do not match." });
      return;
    }

    setLoading(true);

    // Landowners never hit /login directly — their password only
    // gets them an OTP (handleGetOtp above); submitting this form
    // completes the flow by verifying that OTP.
    const isLandownerLogin = authMode === "login" && selectedRole === "landowner";

    const endpoint = isLandownerLogin
      ? `${API_BASE}/auth/landowner/verify-otp`
      : authMode === "register"
      ? `${API_BASE}/auth/register`
      : `${API_BASE}/auth/login`;

    const body = isLandownerLogin
      ? { identity: formData.identity, otp: formData.otp }
      : { role: selectedRole, ...formData };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      if (authMode === "register") {
        setStatusMsg({ type: "success", text: data.message });
        setLoading(false);
        return;
      }

      // Login (or OTP verify) succeeded — we have a real token now.
      localStorage.setItem("atlas_token", data.token);
      localStorage.setItem("atlas_user", JSON.stringify(data.user));
      setStatusMsg({ type: "success", text: `Welcome, ${data.user.full_name}.` });

      const target = ROLE_DASHBOARD_URL[data.user.role];
      if (target) {
        // Hand the token to the destination app via the URL so it
        // can pick it up and store it in its own localStorage —
        // these are separate origins during local dev, so
        // localStorage here doesn't carry over on its own.
        window.location.href = `${target}/?token=${encodeURIComponent(data.token)}`;
      }
    } catch (err) {
      setStatusMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="atlas-app">
      {/* Top Navbar */}
      <header className="atlas-header">
        <div className="brand-section">
          <span className="atlas-logo-badge">ATLAS</span>
          <div className="brand-titles">
            <h1>Acquisition Tracking &amp; Land Analysis System</h1>
            <p>Ministry of Rural Development · Government of India</p>
          </div>
        </div>

        <div className="header-meta">
          <nav className="nav-links">
            <a href="#roadmap">Statutory Roadmap</a>
            <a href="#notices">Public Notices (Sec 11)</a>
            <a href="#gis">GIS Bhulekh Sync</a>
          </nav>

          <div className="ssl-badge">
            <i className="fa-solid fa-shield-halved"></i>
            <span>NIC 256-Bit SSL</span>
          </div>

          <button className="theme-btn" type="button" onClick={toggleTheme}>
            <span className="dot"></span>
            <span>{theme === "light" ? "Light Mode" : "Dark Mode"}</span>
          </button>
        </div>
      </header>

      {/* Main Card */}
      <main className="main-content">
        <div className="auth-card">
          {/* Switcher Tabs */}
          <div className="auth-mode-switch">
            <button
              type="button"
              className={`mode-btn ${authMode === "login" ? "active" : ""}`}
              onClick={() => handleModeSwitch("login")}
            >
              <i className="fa-solid fa-right-to-bracket"></i> Sign In
            </button>
            <button
              type="button"
              className={`mode-btn ${authMode === "register" ? "active" : ""}`}
              onClick={() => handleModeSwitch("register")}
            >
              <i className="fa-solid fa-user-plus"></i> Register
            </button>
          </div>

          {/* Heading */}
          <div className="card-heading">
            <h2>
              {authMode === "login"
                ? "AUTHORITY & STAKEHOLDER LOGIN"
                : "AUTHORITY ONBOARDING & ENROLLMENT"}
            </h2>
            <span className="role-pill">
              {currentRoleConfig ? currentRoleConfig.badge : "Awaiting Selection"}
            </span>
          </div>
          <p className="card-subtext">
            {authMode === "login"
              ? "Select your jurisdiction or stakeholder role to access land requisition & scrutiny desk"
              : "Register your nodal officer or agency credentials to access ATLAS"}
          </p>

          {/* Role Dropdown */}
          <div className="form-group">
            <label htmlFor="roleSelect">Select Stakeholder Role / Authority</label>
            <select
              id="roleSelect"
              className="role-select-box"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="" disabled>
                -- Click here to select Role / Authority --
              </option>
              <option value="central">Central Authority (Apex / Ministry)</option>
              <option value="state">State Authority (Revenue Department)</option>
              <option value="district">District Authority (Magistrate / LAC)</option>
              <option value="village">Village Authority (Patwari / Field Desk)</option>
              <option value="survey">Survey Officer (Cadastral / Drone)</option>
              {authMode === "login" && (
                <option value="landowner">Landowner (Govt Issued Dossier ID)</option>
              )}
              <option value="agency">Project Agency (Concessionaire / EPC / DPR)</option>
            </select>
          </div>

          {/* Dynamic Info Banner */}
          <div className="info-box">
            <i className="fa-solid fa-circle-info" style={{ marginTop: "2px" }}></i>
            <span>
              {currentRoleConfig
                ? currentRoleConfig.desc
                : "Please select your jurisdiction level or stakeholder role from the dropdown above to proceed."}
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* REGISTER ONLY: Name */}
            {authMode === "register" && (
              <div className="form-group">
                <label htmlFor="fullNameInput">Full Name / Authorized Representative</label>
                <div className="input-wrapper">
                  <i className="fa-solid fa-signature input-icon"></i>
                  <input
                    type="text"
                    id="fullNameInput"
                    name="fullName"
                    placeholder="Er. Rajesh Kumar / Officer In-Charge"
                    value={formData.fullName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}

            {/* Identity Field */}
            <div className="form-group">
              <label htmlFor="identityInput">
                {currentRoleConfig ? currentRoleConfig.idLabel : "Official ID / Login Identity"}
              </label>
              <div className="input-wrapper">
                <i className="fa-solid fa-id-card-clip input-icon"></i>
                <input
                  type="text"
                  id="identityInput"
                  name="identity"
                  placeholder={
                    currentRoleConfig
                      ? currentRoleConfig.idPlaceholder
                      : "Please select role first..."
                  }
                  required
                  autoComplete="off"
                  value={formData.identity}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* REGISTER ONLY: Phone */}
            {authMode === "register" && (
              <div className="form-group">
                <label htmlFor="phoneInput">Official Mobile Number (OTP Verified)</label>
                <div className="input-wrapper">
                  <i className="fa-solid fa-mobile-screen-button input-icon"></i>
                  <input
                    type="tel"
                    id="phoneInput"
                    name="phone"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}

            {/* Secret Field */}
            <div className="form-group">
              <label htmlFor="secretInput">
                {currentRoleConfig ? currentRoleConfig.secretLabel : "Password"}
              </label>
              <div className="input-wrapper">
                <i className="fa-solid fa-lock input-icon"></i>
                <input
                  type="password"
                  id="secretInput"
                  name="secret"
                  placeholder="••••••••••••"
                  required
                  value={formData.secret}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* LANDOWNER ONLY: Verification Block (Sign In only) */}
            {authMode === "login" && currentRoleConfig?.isLandowner && (
              <div className="form-group">
                <label htmlFor="otpInput">Identity Verification OTP</label>
                <div className="input-wrapper">
                  <i className="fa-solid fa-shield-check input-icon"></i>
                  <input
                    type="text"
                    id="otpInput"
                    name="otp"
                    placeholder="Enter 6-digit OTP sent to linked mobile"
                    maxLength={6}
                    value={formData.otp}
                    onChange={handleInputChange}
                  />
                  <button type="button" className="btn-otp" onClick={handleGetOtp}>
                    Get OTP
                  </button>
                </div>
              </div>
            )}

            {/* REGISTER ONLY: Confirm Password */}
            {authMode === "register" && (
              <div className="form-group">
                <label htmlFor="confirmSecretInput">Confirm Password</label>
                <div className="input-wrapper">
                  <i className="fa-solid fa-shield-halved input-icon"></i>
                  <input
                    type="password"
                    id="confirmSecretInput"
                    name="confirmSecret"
                    placeholder="••••••••••••"
                    value={formData.confirmSecret}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}

            {/* Form Options */}
            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="ssoEnabled"
                  checked={formData.ssoEnabled}
                  onChange={handleInputChange}
                />
                <span>{getSsoLabel()}</span>
              </label>
              {authMode === "login" && (
                <a href="#forgot" className="forgot-link">
                  Forgot Password?
                </a>
              )}
            </div>

            {/* Status Message Display */}
            {statusMsg.text && (
              <p
                style={{
                  color: statusMsg.type === "error" ? "#ef4444" : "#10b981",
                  fontSize: "0.8rem",
                  marginBottom: "0.75rem",
                  textAlign: "center"
                }}
              >
                {statusMsg.text}
              </p>
            )}

            {/* Submit Button */}
            <button type="submit" className="btn-primary" disabled={loading}>
              <span>{getSubmitButtonText()}</span>
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}