import { useState, useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";
import { api, logout } from "./api";

// Import GeoJSON Dataset (used only as a fallback if the real API
// call fails -- e.g. no backend reachable -- so the app still shows
// something rather than a blank screen).
import rawDataset from "./parcels_2.json";

// Maps a real backend parcel (already scoped server-side to this
// survey officer via /api/survey/assignments) into the GeoJSON
// Feature shape this whole file was built around, so none of the
// existing map/table/chart code below needs to change.
const RECORD_TO_ACQUISITION_STATUS = {
  Verified: "Acquired",
  Active: "Compensation Pending",
  Disputed: "Notified",
};
function adaptParcelToFeature(p) {
  const compPct = Number(p.compensation_percentage) || 0;
  const acquisitionStatus =
    compPct >= 100 ? "Acquired" :
    compPct > 0 ? "Compensation Pending" :
    (RECORD_TO_ACQUISITION_STATUS[p.record_status] || "Proposed");

  return {
    type: "Feature",
    geometry: p.geometry || { type: "Point", coordinates: [0, 0] },
    properties: {
      parcel_uuid: p.parcel_uuid,
      parcel_id: p.parcel_uuid,
      village: p.village,
      district: p.district,
      survey_number: p.survey_number,
      official_owner: p.official_owner,
      land_classification: p.land_classification,
      area_acres: p.land_area_sqm ? Number(p.land_area_sqm) / 4046.86 : 0,
      official_area: p.land_area_sqm ? (Number(p.land_area_sqm) / 4046.86).toFixed(2) : "0",
      land_area_sqm: p.land_area_sqm,
      solatium_100_percent: p.solatium,
      total_compensation: p.total_compensation,
      estimated_value: p.total_compensation,
      compensation_percentage: compPct,
      acquisition_status: acquisitionStatus,
      delayed: p.delayed ? 1 : 0,
      delay_days: p.delay_days || 0,
      current_pending_tasks: 0,
      dbId: p.id, // real UUID, needed for POST /survey/field-visits
    },
  };
}

// ---------------------------------------------------------------------
// JURISDICTION AUTO-LOCK:
// Limits survey officer's scope to their assigned village/district
// ---------------------------------------------------------------------
const OFFICER_PROFILE_FALLBACK = {
  id: "SO-99214",
  name: "S. Raman",
  role: "Senior Cadastral Survey Officer",
  email: "s.raman.revenue@up.gov.in",
  phone: "+91 94150 78219",
  state: "Uttar Pradesh",
  district: "Lucknow",
  village: "Malhaur",
  division: "Zone-4 Field Cadastral Unit",
  villageOfficer: "Village Revenue Officer (Patwari / Lekhpal - Malhaur Circle)",
  assignedSince: "15-Jan-2024",
  badgeColor: "#0e9f7e",
};

const STATUS_STYLE = {
  Proposed: { color: "#2f6fed", tint: "#e4ecfd", text: "#1d4bab" },
  Notified: { color: "#eab308", tint: "#fbedc0", text: "#8a6403" },
  "Compensation Pending": { color: "#ea580c", tint: "#fde0cc", text: "#9a3c08" },
  Acquired: { color: "#16a34a", tint: "#d9f2e2", text: "#12703a" },
};
const STATUS_ORDER = ["Proposed", "Notified", "Compensation Pending", "Acquired"];

const BASEMAPS = {
  street: {
    label: "Street",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  },
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  },
};

function formatINR(value) {
  if (value === null || value === undefined) return "—";
  return `₹${Math.round(Number(value)).toLocaleString("en-IN")}`;
}

function statusStyleOf(status) {
  return STATUS_STYLE[status] || { color: "#6b7280", tint: "#e5e7eb", text: "#374151" };
}

function squareIcon(color) {
  return L.divIcon({
    className: "parcel-marker",
    html: `<span style="background:${color}"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

const ICON_CACHE = Object.fromEntries(
  STATUS_ORDER.map((s) => [s, squareIcon(STATUS_STYLE[s].color)])
);

// Standalone Leaflet map component
function CadastralMap({ features, basemap, onSelectParcel }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [26.85, 80.95],
      zoom: 13,
      attributionControl: false,
    });

    const tile = L.tileLayer(BASEMAPS[basemap].url).addTo(map);
    const markersLayer = L.featureGroup().addTo(map);

    mapInstanceRef.current = map;
    tileLayerRef.current = tile;
    markersLayerRef.current = markersLayer;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (tileLayerRef.current && mapInstanceRef.current) {
      tileLayerRef.current.setUrl(BASEMAPS[basemap].url);
    }
  }, [basemap]);

  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    if (features && features.length > 0) {
      features.forEach((f) => {
        const coords = f.geometry.coordinates;
        const lat = coords[1];
        const lng = coords[0];
        const status = f.properties.acquisition_status || "Proposed";
        const icon = ICON_CACHE[status] || ICON_CACHE.Proposed;

        const marker = L.marker([lat, lng], { icon });
        marker.on("click", () => onSelectParcel(f));
        marker.addTo(markersLayerRef.current);
      });

      const bounds = markersLayerRef.current.getBounds();
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    }
  }, [features, onSelectParcel]);

  return <div ref={mapContainerRef} className="map" />;
}

export default function App() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [basemap, setBasemap] = useState("street");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedParcel, setSelectedParcel] = useState(null);

  // Real logged-in officer + real assigned parcels. Both start as
  // the hardcoded fallback data (so the UI has something to render
  // immediately) and get replaced once the API calls resolve.
  const [officerProfile, setOfficerProfile] = useState(OFFICER_PROFILE_FALLBACK);
  const [fetchedFeatures, setFetchedFeatures] = useState(null); // null = not loaded yet
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    api.getMe()
      .then((data) => {
        const u = data.user;
        setOfficerProfile({
          id: u.id,
          name: u.full_name,
          role: "Survey Officer",
          email: u.identity,
          phone: u.phone || "—",
          state: u.state || "—",
          district: u.district || "—",
          village: u.village || "—",
          division: `${u.district || ""} Field Cadastral Unit`,
          villageOfficer: "Village Revenue Officer (Patwari / Lekhpal)",
          assignedSince: "—",
          badgeColor: "#0e9f7e",
        });
      })
      .catch((err) => setDataError(err.message));

    api.getMyAssignments()
      .then((data) => {
        setFetchedFeatures((data.parcels || []).map(adaptParcelToFeature));
      })
      .catch((err) => setDataError(err.message));
  }, []);

  // Sign out Modal State
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // Field Verification & GPS state
  const [targetParcelId, setTargetParcelId] = useState("");
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [currentGps, setCurrentGps] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [pinnedCoordinates, setPinnedCoordinates] = useState([]);
  const [measuredAreaSqm, setMeasuredAreaSqm] = useState("");
  const [classification, setClassification] = useState("Commercial");
  const [fieldRemarks, setFieldRemarks] = useState("");
  const [submissionFeedback, setSubmissionFeedback] = useState("");

  // Settings State
  const [settings, setSettings] = useState({
    gpsHighAccuracy: true,
    autoSyncCadastre: true,
    soundAlerts: false,
    coordFormat: "DD",
    mapCacheOffline: true,
  });

  // Daily Tasks State
  const [dailyTasks, setDailyTasks] = useState([
    { id: 1, text: "Verify Survey #168/B hedge demarcation with Landowner", done: true, priority: "High" },
    { id: 2, text: "Attach updated Khatauni extract for Survey #19/A", done: false, priority: "Urgent" },
    { id: 3, text: "Inspect commercial tree counts on Survey #12/2A", done: false, priority: "Medium" },
    { id: 4, text: "Coordinate hearing attendance with Village Officer (Patwari)", done: true, priority: "Normal" },
  ]);

  // Landowner Documents Uploaded to Village Officer
  const [docCategory, setDocCategory] = useState("Record of Rights (Khatauni / RoR)");
  const [uploadedLandownerDocs, setUploadedLandownerDocs] = useState([
    {
      id: "LD-101",
      parcelId: "UP-LKO-2026-10001",
      owner: "Anjali Kumar",
      surveyNo: "19/A",
      docName: "Khatauni_Extract_Fasli_1431.pdf",
      category: "Record of Rights (Khatauni)",
      size: "1.8 MB",
      date: "2026-03-08",
      recipient: "Village Officer (Patwari)",
      status: "Forwarded to Village Officer",
    },
    {
      id: "LD-102",
      parcelId: "UP-LKO-2026-10004",
      owner: "Ramesh Verma",
      surveyNo: "25-Mar",
      docName: "Landowner_Aadhaar_Bank_Passbook.pdf",
      category: "KYC & Bank Verification",
      size: "2.3 MB",
      date: "2026-03-07",
      recipient: "Village Officer (Patwari)",
      status: "Forwarded to Village Officer",
    },
    {
      id: "LD-103",
      parcelId: "UP-LKO-2026-10006",
      owner: "Rahul Singh",
      surveyNo: "12/2A",
      docName: "Physical_Boundary_Field_Sketch_FMB.pdf",
      category: "Field Measurement Map",
      size: "3.4 MB",
      date: "2026-03-05",
      recipient: "Village Officer (Patwari)",
      status: "Forwarded to Village Officer",
    },
  ]);
  const [selectedUploadFile, setSelectedUploadFile] = useState(null);
  const [villageUploadStatus, setVillageUploadStatus] = useState("");

  // Notifications State
  const [notifications, setNotifications] = useState([
    {
      id: "NOTIF-1",
      sender: "Village Officer (Patwari - Malhaur)",
      recipient: "Survey Officer S. Raman",
      title: "Urgent: Physical Boundary Resurvey Requested",
      message: "Please re-verify hedge coordinates for Survey 168/B and upload authenticated Khatauni extract.",
      date: "2026-03-10",
      type: "urgent",
      read: false,
    },
    {
      id: "NOTIF-2",
      sender: "State GIS Cadastral Portal",
      recipient: "Survey Officer S. Raman",
      title: "GIS Layer Synced Successfully",
      message: "12 Geo-tagged boundary corner polygons for Malhaur village have been locked into the master database.",
      date: "2026-03-09",
      type: "success",
      read: false,
    },
    {
      id: "NOTIF-3",
      sender: "Survey Officer S. Raman",
      recipient: "All Recorded Landowners (Malhaur)",
      title: "Joint Field Inspection & Document Collection Drive",
      message: "Notice issued to landowners to present original revenue records and bank passbooks at village camp office.",
      date: "2026-03-04",
      type: "info",
      read: true,
    },
  ]);

  const [newNoticeTarget, setNewNoticeTarget] = useState("Landowner");
  const [newNoticeTitle, setNewNoticeTitle] = useState("");
  const [newNoticeMsg, setNewNoticeMsg] = useState("");
  const [noticeSentFeedback, setNoticeSentFeedback] = useState("");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const allFeatures = fetchedFeatures !== null ? fetchedFeatures : (rawDataset.features || []);

  // -------------------------------------------------------------------
  // AUTO-LOCKED JURISDICTION:
  // Filter records belonging strictly to Malhaur, Lucknow
  // -------------------------------------------------------------------
  const lockedFeatures = useMemo(() => {
    return allFeatures.filter((f) => {
      const p = f.properties;
      return (
        p.village?.toLowerCase() === officerProfile.village.toLowerCase() &&
        p.district?.toLowerCase() === officerProfile.district.toLowerCase()
      );
    });
  }, [allFeatures]);

  useEffect(() => {
    if (lockedFeatures.length > 0 && !targetParcelId) {
      setTargetParcelId(lockedFeatures[0].properties.parcel_uuid || lockedFeatures[0].properties.parcel_id);
    }
  }, [lockedFeatures, targetParcelId]);

  // Filtered parcels based on the selected Status
  const filteredFeatures = useMemo(() => {
    return lockedFeatures.filter((f) => {
      const p = f.properties;
      return statusFilter === "All" || p.acquisition_status === statusFilter;
    });
  }, [lockedFeatures, statusFilter]);

  // Keep selected plot valid when status filter changes
  useEffect(() => {
    if (selectedParcel) {
      const isStillVisible = filteredFeatures.some(
        (f) => (f.properties.parcel_uuid || f.properties.parcel_id) === (selectedParcel.properties.parcel_uuid || selectedParcel.properties.parcel_id)
      );
      if (!isStillVisible) {
        setSelectedParcel(null);
      }
    }
  }, [statusFilter, filteredFeatures, selectedParcel]);

  // Metrics
  const totalParcels = lockedFeatures.length;
  const totalAreaAcres = lockedFeatures.reduce((sum, f) => sum + (f.properties.area_acres || 0), 0);
  const acquiredCount = lockedFeatures.filter((f) => f.properties.acquisition_status === "Acquired").length;
  const compPendingCount = lockedFeatures.filter((f) => f.properties.acquisition_status === "Compensation Pending").length;
  const totalAwardValue = lockedFeatures.reduce((sum, f) => sum + (f.properties.estimated_value || f.properties.total_compensation || 0), 0);
  const totalDisbursedValue = lockedFeatures.reduce(
    (sum, f) => sum + ((f.properties.compensation_percentage || 0) / 100) * (f.properties.estimated_value || f.properties.total_compensation || 0),
    0
  );

  const urgentParcels = useMemo(() => {
    return lockedFeatures.filter((f) => f.properties.delayed === 1 || (f.properties.current_pending_tasks || 0) >= 5);
  }, [lockedFeatures]);

  const classificationCounts = useMemo(() => {
    const counts = { Residential: 0, Commercial: 0, Agricultural: 0, "Multi-crop": 0 };
    lockedFeatures.forEach((f) => {
      const c = f.properties.land_classification || "Agricultural";
      counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }, [lockedFeatures]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // GPS Pinning
  function toggleGps() {
    if (!isGpsActive) {
      if (!("geolocation" in navigator)) {
        alert("GPS geolocation is not supported on this browser.");
        return;
      }
      setIsGpsActive(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setAccuracy(Math.round(pos.coords.accuracy));
        },
        (err) => {
          alert(`GPS Signal Error: ${err.message}`);
          setIsGpsActive(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setIsGpsActive(false);
    }
  }

  function pinGpsPoint() {
    if (!currentGps) {
      alert("Turn on device GPS first.");
      return;
    }
    setPinnedCoordinates((prev) => [
      ...prev,
      {
        vertex: `Corner Point #${prev.length + 1}`,
        lat: currentGps.lat,
        lng: currentGps.lng,
        time: new Date().toLocaleTimeString(),
      },
    ]);
  }

  function handleSaveVerification(e) {
    e.preventDefault();

    const plot = lockedFeatures.find(
      (f) => (f.properties.parcel_uuid || f.properties.parcel_id) === targetParcelId
    );

    if (plot?.properties.dbId) {
      // Real submission -- this is what actually shows up for the
      // District Authority (and gets logged in field_visits) once
      // the backend has a real parcel id to attach it to.
      api.submitFieldVisit({
        parcelId: plot.properties.dbId,
        activity: `Ground Verification (${classification})`,
        status: "Completed",
        gpsCaptured: isGpsActive || pinnedCoordinates.length > 0,
        evidenceCount: pinnedCoordinates.length,
      })
        .then(() => {
          setSubmissionFeedback(`Ground survey and GPS corner coordinates recorded for ${targetParcelId}.`);
        })
        .catch((err) => {
          setSubmissionFeedback(`Could not save to server: ${err.message} (recorded locally only)`);
        })
        .finally(() => {
          setTimeout(() => setSubmissionFeedback(""), 4000);
        });
    } else {
      // No real backend id available (e.g. running on the bundled
      // fallback dataset) -- keep the original local-only behavior.
      setSubmissionFeedback(`Ground survey and GPS corner coordinates recorded for ${targetParcelId}.`);
      setTimeout(() => setSubmissionFeedback(""), 4000);
    }
  }

  function handleUploadToVillageOfficer(e) {
    e.preventDefault();
    if (!selectedUploadFile) {
      alert("Please choose a file to upload.");
      return;
    }

    const matchedPlot = lockedFeatures.find(
      (f) => (f.properties.parcel_uuid || f.properties.parcel_id) === targetParcelId
    );

    const newDoc = {
      id: `LD-${Date.now().toString().slice(-4)}`,
      parcelId: targetParcelId,
      owner: matchedPlot?.properties.official_owner || "Recorded Landowner",
      surveyNo: matchedPlot?.properties.survey_number || "N/A",
      docName: selectedUploadFile.name,
      category: docCategory,
      size: `${(selectedUploadFile.size / 1024).toFixed(1)} KB`,
      date: new Date().toISOString().slice(0, 10),
      recipient: "Village Officer (Patwari / Lekhpal)",
      status: "Forwarded to Village Officer",
    };

    setUploadedLandownerDocs((prev) => [newDoc, ...prev]);
    setSelectedUploadFile(null);
    setVillageUploadStatus(`Document "${newDoc.docName}" successfully uploaded and forwarded to ${officerProfile.villageOfficer}.`);
    setTimeout(() => setVillageUploadStatus(""), 4500);
  }

  function handleSendNotice(e) {
    e.preventDefault();
    if (!newNoticeTitle || !newNoticeMsg) return;

    const newNotif = {
      id: `NOTIF-${Date.now().toString().slice(-4)}`,
      sender: `${officerProfile.name} (${officerProfile.id})`,
      recipient: newNoticeTarget === "Landowner" ? `Landowner of ${targetParcelId}` : officerProfile.villageOfficer,
      title: newNoticeTitle,
      message: newNoticeMsg,
      date: new Date().toISOString().slice(0, 10),
      type: "urgent",
      read: true,
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setNewNoticeTitle("");
    setNewNoticeMsg("");
    setNoticeSentFeedback(`Official notice dispatched to ${newNotif.recipient}.`);
    setTimeout(() => setNoticeSentFeedback(""), 4000);
  }

  function markNotificationRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  function toggleTask(id) {
    setDailyTasks((list) => list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function confirmSignOut() {
    setShowSignOutModal(false);
    logout(); // clears the token and redirects to the login app
  }

  const selected = selectedParcel?.properties;
  const activePlot = lockedFeatures.find((f) => (f.properties.parcel_uuid || f.properties.parcel_id) === targetParcelId);

  return (
    <div className={`app ${darkMode ? "dark" : ""}`}>
      {/* TOPBAR */}
      <header className="header-bar">
        <div className="header-brand">
          <span className="atlas-badge">ATLAS FIELD</span>
          <div className="header-titles">
            <strong>Acquisition Tracking &amp; Land Analysis System</strong>
            <span>Survey Officer Field Operations • Ministry of Rural Development</span>
          </div>
        </div>

        <div className="header-actions">
          

          <button
            type="button"
            className="theme-toggle-btn"
            onClick={() => setDarkMode((d) => !d)}
          >
            {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>

          {/* Direct Bell Notification Symbol */}
          <button
            type="button"
            className="icon-notif-btn"
            title="Open Notifications"
            onClick={() => setActiveSection("notifications")}
          >
            🔔
            {unreadCount > 0 && <span className="notif-badge-bubble">{unreadCount}</span>}
          </button>

          {/* Officer Avatar & Signout */}
          <div className="user-profile-widget">
            <div className="avatar-circle">
              {(officerProfile.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div className="user-meta">
              <strong>{officerProfile.name}</strong>
              <span>{officerProfile.role}</span>
            </div>
            <button
              type="button"
              className="signout-btn"
              onClick={() => setShowSignOutModal(true)}
            >
              Sign Out ➜
            </button>
          </div>
        </div>
      </header>

      {/* BODY WITH SIDEBAR */}
      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-title">Main Navigation</div>

          <button
            className={`sidebar-btn ${activeSection === "dashboard" ? "sidebar-btn-active" : ""}`}
            onClick={() => setActiveSection("dashboard")}
          >
            <span>🏠 Dashboard Overview</span>
          </button>

          <button
            className={`sidebar-btn ${activeSection === "gis-map" ? "sidebar-btn-active" : ""}`}
            onClick={() => setActiveSection("gis-map")}
          >
            <span>🗺️ GIS Cadastral Map</span>
            <span className="sidebar-badge">{lockedFeatures.length}</span>
          </button>

          <button
            className={`sidebar-btn ${activeSection === "analytics" ? "sidebar-btn-active" : ""}`}
            onClick={() => setActiveSection("analytics")}
          >
            <span>📊 Progress Analytics</span>
          </button>

          <button
            className={`sidebar-btn ${activeSection === "compensation" ? "sidebar-btn-active" : ""}`}
            onClick={() => setActiveSection("compensation")}
          >
            <span>💳 Landowner Payouts</span>
            <span className="sidebar-badge">{compPendingCount} Pending</span>
          </button>

          <button
            className={`sidebar-btn ${activeSection === "urgent-projects" ? "sidebar-btn-active" : ""}`}
            onClick={() => setActiveSection("urgent-projects")}
          >
            <span>⚡ Urgent / Delayed</span>
            <span className="sidebar-badge sidebar-badge-urgent">{urgentParcels.length}</span>
          </button>

          <button
            className={`sidebar-btn ${activeSection === "field-gps" ? "sidebar-btn-active" : ""}`}
            onClick={() => setActiveSection("field-gps")}
          >
            <span>📍 GPS Ground Pinning</span>
          </button>

          <div className="sidebar-title" style={{ marginTop: 16 }}>Village Revenue &amp; Comms</div>

          <button
            className={`sidebar-btn ${activeSection === "landowner-docs" ? "sidebar-btn-active" : ""}`}
            onClick={() => setActiveSection("landowner-docs")}
          >
            <span>📂 Upload to Village Officer</span>
            <span className="sidebar-badge">{uploadedLandownerDocs.length}</span>
          </button>

          <button
            className={`sidebar-btn ${activeSection === "notifications" ? "sidebar-btn-active" : ""}`}
            onClick={() => setActiveSection("notifications")}
          >
            <span>🔔 Notifications &amp; Notices</span>
            {unreadCount > 0 && <span className="sidebar-badge sidebar-badge-urgent">{unreadCount}</span>}
          </button>

          <div className="sidebar-title" style={{ marginTop: 16 }}>Preferences &amp; User</div>

          <button
            className={`sidebar-btn ${activeSection === "profile" ? "sidebar-btn-active" : ""}`}
            onClick={() => setActiveSection("profile")}
          >
            <span>👤 Officer Profile</span>
          </button>

          <button
            className={`sidebar-btn ${activeSection === "settings" ? "sidebar-btn-active" : ""}`}
            onClick={() => setActiveSection("settings")}
          >
            <span>⚙️ System Settings</span>
          </button>
        </aside>

        <main className="app-main">
          {/* ========================================================= */}
          {/* SECTION 1: DASHBOARD OVERVIEW                             */}
          {/* ========================================================= */}
          {activeSection === "dashboard" && (
            <div>
              <div className="hero-banner">
                <div className="hero-content">
                  <h2>Welcome, {officerProfile.name} ({officerProfile.id})</h2>
                  <p>
                    Jurisdiction active in <strong>{officerProfile.village}, {officerProfile.district} ({officerProfile.state})</strong>. 
                    Assigned to {officerProfile.division}. Ready for on-site boundary verifications and revenue coordination.
                  </p>
                </div>
                <div className="hero-meta-badge">
                  <span>Village Officer Liaison</span>
                  <strong>Patwari / Lekhpal (Circle 4)</strong>
                </div>
              </div>

              {/* KPI STAT CARDS */}
              <section className="stat-cards">
                <div className="stat-card">
                  <span className="stat-card-label">Assigned Plots</span>
                  <strong className="stat-card-value">{totalParcels}</strong>
                  <span className="stat-subtext">Across {officerProfile.village} village[cite: 8]</span>
                </div>
                <div className="stat-card">
                  <span className="stat-card-label">Surveyed Area</span>
                  <strong className="stat-card-value">{totalAreaAcres.toFixed(2)} Acres</strong>
                  <span className="stat-subtext">Physical corridor</span>
                </div>
                <div className="stat-card">
                  <span className="stat-card-label">Acquired Plots</span>
                  <strong className="stat-card-value" style={{ color: "var(--success)" }}>{acquiredCount}</strong>
                  <span className="stat-subtext">Completed Awards</span>
                </div>
                <div className="stat-card">
                  <span className="stat-card-label">Payouts Pending</span>
                  <strong className="stat-card-value" style={{ color: "var(--warn)" }}>{compPendingCount}</strong>
                  <span className="stat-subtext">Under review</span>
                </div>
                <div className="stat-card">
                  <span className="stat-card-label">Total Assessed Value</span>
                  <strong className="stat-card-value">{formatINR(totalAwardValue)}</strong>
                  <span className="stat-subtext">Statutory budget</span>
                </div>
              </section>

              {/* Pipeline Roadmap */}
              <div className="card">
                <div className="card-header">
                  <h2>Statutory Land Acquisition Pipeline Roadmap</h2>
                  <span className="badge badge-info">LARR Act 2013 Workflow</span>
                </div>
                <div className="workflow-steps">
                  <div className="workflow-step step-done">
                    <div className="step-number">✓</div>
                    <strong>Sec 11 Notification</strong>
                    <span>Preliminary Survey Done</span>
                  </div>
                  <div className="workflow-step step-active">
                    <div className="step-number">2</div>
                    <strong>Ground Demarcation</strong>
                    <span>GPS Verification In Progress</span>
                  </div>
                  <div className="workflow-step">
                    <div className="step-number">3</div>
                    <strong>Sec 19 Declaration</strong>
                    <span>Publication Scheduled</span>
                  </div>
                  <div className="workflow-step">
                    <div className="step-number">4</div>
                    <strong>Award &amp; Solatium</strong>
                    <span>Valuation Appraisal</span>
                  </div>
                  <div className="workflow-step">
                    <div className="step-number">5</div>
                    <strong>Disbursement</strong>
                    <span>Bank Mandate Release</span>
                  </div>
                  <div className="workflow-step">
                    <div className="step-number">6</div>
                    <strong>Possession</strong>
                    <span>Handover to Authority</span>
                  </div>
                </div>
              </div>

              {/* Two Column Grid for Operations */}
              <div className="two-col">
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div className="card">
                    <div className="card-header">
                      <h2>Quick Command Actions</h2>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: "14px 10px", flexDirection: "column", height: "auto" }}
                        onClick={() => setActiveSection("gis-map")}
                      >
                        <span style={{ fontSize: 22 }}>🗺️</span>
                        <strong>GIS Map View</strong>
                        <span style={{ fontSize: 11, color: "var(--text-soft)" }}>View cadastral boundaries</span>
                      </button>

                      <button
                        className="btn-secondary"
                        style={{ padding: "14px 10px", flexDirection: "column", height: "auto" }}
                        onClick={() => setActiveSection("field-gps")}
                      >
                        <span style={{ fontSize: 22 }}>📍</span>
                        <strong>GPS Demarcation</strong>
                        <span style={{ fontSize: 11, color: "var(--text-soft)" }}>Pin plot corner points</span>
                      </button>

                      <button
                        className="btn-secondary"
                        style={{ padding: "14px 10px", flexDirection: "column", height: "auto" }}
                        onClick={() => setActiveSection("landowner-docs")}
                      >
                        <span style={{ fontSize: 22 }}>📂</span>
                        <strong>Forward Documents</strong>
                        <span style={{ fontSize: 11, color: "var(--text-soft)" }}>Send to Village Officer</span>
                      </button>

                      <button
                        className="btn-secondary"
                        style={{ padding: "14px 10px", flexDirection: "column", height: "auto" }}
                        onClick={() => setActiveSection("compensation")}
                      >
                        <span style={{ fontSize: 22 }}>💳</span>
                        <strong>Award Register</strong>
                        <span style={{ fontSize: 11, color: "var(--text-soft)" }}>View payout releases</span>
                      </button>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <h2>Today's Field Demarcation Tasks</h2>
                      <span className="badge badge-info">{dailyTasks.filter((t) => t.done).length}/{dailyTasks.length} Completed</span>
                    </div>
                    <ul className="task-list">
                      {dailyTasks.map((task) => (
                        <li key={task.id} className={`task-item ${task.done ? "task-done" : ""}`} onClick={() => toggleTask(task.id)}>
                          <input type="checkbox" checked={task.done} readOnly />
                          <span className="task-text">{task.text}</span>
                          <span className={`badge badge-${task.priority === "Urgent" ? "danger" : task.priority === "High" ? "warning" : "info"}`}>
                            {task.priority}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div className="card">
                    <div className="card-header">
                      <h2>Urgent &amp; High-Priority Action Plots</h2>
                      <span className="badge badge-danger">{urgentParcels.length} Flagged</span>
                    </div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                      {urgentParcels.slice(0, 3).map((f) => {
                        const p = f.properties;
                        return (
                          <li
                            key={p.parcel_uuid || p.parcel_id}
                            style={{
                              padding: 12,
                              background: "var(--surface-soft)",
                              borderRadius: 8,
                              borderLeft: "4px solid var(--warn)",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: 12.5,
                            }}
                          >
                            <div>
                              <strong>{p.official_owner} (Survey #{p.survey_number})[cite: 8]</strong>
                              <div style={{ color: "var(--text-soft)", fontSize: 11, marginTop: 2 }}>
                                Pending Tasks: {p.current_pending_tasks || 5} • Delay: +{p.delay_days || 0} days[cite: 8]
                              </div>
                            </div>
                            <button
                              className="btn-primary"
                              style={{ padding: "5px 12px", fontSize: 11 }}
                              onClick={() => {
                                setTargetParcelId(p.parcel_uuid || p.parcel_id);
                                setActiveSection("field-gps");
                              }}
                            >
                              Inspect ➜
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <h2>Recent Field Audit Log</h2>
                    </div>
                    <ul className="audit-timeline">
                      <li className="audit-item">
                        <div className="audit-dot audit-dot-success" />
                        <div className="audit-body">
                          <strong>Section 19 GPS vertices saved</strong>
                          <span>Plot UP-LKO-2026-10001 (Survey 19/A) boundary finalized[cite: 8].</span>
                          <small>Today at 11:30 AM</small>
                        </div>
                      </li>
                      <li className="audit-item">
                        <div className="audit-dot audit-dot-info" />
                        <div className="audit-body">
                          <strong>Document forwarded to Village Officer</strong>
                          <span>Khatauni extract uploaded for Landowner Ramesh Verma[cite: 8].</span>
                          <small>Yesterday at 04:15 PM</small>
                        </div>
                      </li>
                      <li className="audit-item">
                        <div className="audit-dot audit-dot-warn" />
                        <div className="audit-body">
                          <strong>Boundary dispute notice issued</strong>
                          <span>Hedge conflict reported between Survey 168/B and Survey 17/A[cite: 8].</span>
                          <small>08 March 2026</small>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 2: GIS CADASTRAL MAP (FILTER-LINKED DROPDOWNS)    */}
          {/* ========================================================= */}
          {activeSection === "gis-map" && (
            <div>
              <div className="page-header">
                <h1>Spatial Cadastral Map ({officerProfile.village}, {officerProfile.district})[cite: 8]</h1>
                <p>Interactive GIS view auto-locked to your division. Click on any plot marker for parcel particulars.</p>
              </div>

              {/* Attractive Controls Bar with Linked Dropdowns */}
              <div className="gis-controls-bar">
                <div className="gis-select-wrapper">
                  <label>Village Territory:</label>
                  <div className="custom-select-container">
                    <select disabled className="attractive-select locked-select">
                      <option>{officerProfile.village} Circle (Auto-Locked)[cite: 8]</option>
                    </select>
                  </div>
                </div>

                <div className="gis-select-wrapper">
                  <label>Acquisition Status:</label>
                  <div className="custom-select-container">
                    <select
                      className="attractive-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="All">All Acquisition Statuses</option>
                      {STATUS_ORDER.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* THIS DROPDOWN ONLY SHOWS PARCELS MATCHING THE SELECTED STATUS */}
                <div className="gis-select-wrapper">
                  <label>Jump to Plot ({filteredFeatures.length}):</label>
                  <div className="custom-select-container">
                    <select
                      className="attractive-select"
                      value={selectedParcel ? (selectedParcel.properties.parcel_uuid || selectedParcel.properties.parcel_id) : ""}
                      onChange={(e) => {
                        const found = filteredFeatures.find(
                          (f) => (f.properties.parcel_uuid || f.properties.parcel_id) === e.target.value
                        );
                        if (found) setSelectedParcel(found);
                      }}
                    >
                      <option value="">-- Select {statusFilter === "All" ? "Plot" : statusFilter + " Plot"} --</option>
                      {filteredFeatures.map((f) => (
                        <option key={f.properties.parcel_uuid || f.properties.parcel_id} value={f.properties.parcel_uuid || f.properties.parcel_id}>
                          Survey #{f.properties.survey_number} — {f.properties.official_owner} ({f.properties.acquisition_status})[cite: 8]
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
                  {STATUS_ORDER.map((s) => (
                    <span className="legend-item" key={s}>
                      <i style={{ background: STATUS_STYLE[s].color }} />
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="map-container">
                <CadastralMap
                  features={filteredFeatures}
                  basemap={basemap}
                  onSelectParcel={(f) => setSelectedParcel(f)}
                />

                <div className="basemap-toggle">
                  {Object.entries(BASEMAPS).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      className={`basemap-btn ${basemap === key ? "basemap-btn-active" : ""}`}
                      onClick={() => setBasemap(key)}
                    >
                      {key === "satellite" ? "🛰️ " : "🗺️ "}
                      {cfg.label}
                    </button>
                  ))}
                </div>

                {selected && (
                  <div className="parcel-panel">
                    <button className="parcel-panel-close" onClick={() => setSelectedParcel(null)}>✕</button>
                    <h2>Plot {selected.parcel_uuid || selected.parcel_id}[cite: 8]</h2>
                    <span
                      className="badge"
                      style={{
                        background: statusStyleOf(selected.acquisition_status).tint,
                        color: statusStyleOf(selected.acquisition_status).text,
                      }}
                    >
                      {selected.acquisition_status}[cite: 8]
                    </span>

                    <hr style={{ margin: "10px 0", border: "none", borderTop: "1px solid var(--border)" }} />

                    <dl style={{ margin: 0 }}>
                      <div className="panel-row">
                        <dt>Landowner:</dt>
                        <dd>{selected.official_owner}[cite: 8]</dd>
                      </div>
                      <div className="panel-row">
                        <dt>Survey #:</dt>
                        <dd>{selected.survey_number}[cite: 8]</dd>
                      </div>
                      <div className="panel-row">
                        <dt>Land Area:</dt>
                        <dd>{selected.area_acres || selected.official_area} ({selected.land_area_sqm} sqm)[cite: 8]</dd>
                      </div>
                      <div className="panel-row">
                        <dt>Assessed Solatium:</dt>
                        <dd>{formatINR(selected.solatium_100_percent)}[cite: 8]</dd>
                      </div>
                      <div className="panel-row">
                        <dt>Total Compensation:</dt>
                        <dd>{formatINR(selected.total_compensation || selected.estimated_value)}[cite: 8]</dd>
                      </div>
                      <div className="panel-row">
                        <dt>Disbursed %:</dt>
                        <dd>{selected.compensation_percentage}%[cite: 8]</dd>
                      </div>
                    </dl>

                    <button
                      className="btn-primary"
                      style={{ width: "100%", marginTop: 12 }}
                      onClick={() => {
                        setTargetParcelId(selected.parcel_uuid || selected.parcel_id);
                        setActiveSection("field-gps");
                      }}
                    >
                      Open Field GPS Survey ➜
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 3: PROJECT PROGRESS & GRAPHICAL ANALYTICS         */}
          {/* ========================================================= */}
          {activeSection === "analytics" && (
            <div>
              <div className="page-header">
                <h1>Acquisition Project Analytics &amp; Visual Intelligence</h1>
                <p>Interactive data distribution charts for land categories, statutory compensations, and delay indexes.</p>
              </div>

              <div className="two-col">
                <div className="card">
                  <div className="card-header">
                    <h2>Land Classification Distribution ({officerProfile.village})</h2>
                    <span className="badge badge-info">{totalParcels} Total Plots</span>
                  </div>

                  <div className="chart-donut-wrap">
                    <div className="donut-chart-box">
                      <svg width="150" height="150" viewBox="0 0 42 42" className="donut-svg">
                        <circle className="donut-hole" cx="21" cy="21" r="15.91549430918954" fill="transparent" />
                        <circle className="donut-ring" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="var(--border)" strokeWidth="4" />
                        
                        <circle
                          cx="21" cy="21" r="15.91549430918954" fill="transparent"
                          stroke="#3b82f6" strokeWidth="5"
                          strokeDasharray={`${(classificationCounts.Residential / totalParcels) * 100} ${100 - (classificationCounts.Residential / totalParcels) * 100}`}
                          strokeDashoffset="25"
                        />
                        <circle
                          cx="21" cy="21" r="15.91549430918954" fill="transparent"
                          stroke="#10b981" strokeWidth="5"
                          strokeDasharray={`${(classificationCounts.Commercial / totalParcels) * 100} ${100 - (classificationCounts.Commercial / totalParcels) * 100}`}
                          strokeDashoffset={`${25 - (classificationCounts.Residential / totalParcels) * 100}`}
                        />
                        <circle
                          cx="21" cy="21" r="15.91549430918954" fill="transparent"
                          stroke="#f59e0b" strokeWidth="5"
                          strokeDasharray={`${(classificationCounts.Agricultural / totalParcels) * 100} ${100 - (classificationCounts.Agricultural / totalParcels) * 100}`}
                          strokeDashoffset={`${25 - ((classificationCounts.Residential + classificationCounts.Commercial) / totalParcels) * 100}`}
                        />
                      </svg>
                      <div className="donut-center-label">
                        <strong>{totalParcels}</strong>
                        <span>Plots</span>
                      </div>
                    </div>

                    <div className="chart-legend-list">
                      <div className="chart-legend-row">
                        <span className="color-swatch" style={{ background: "#3b82f6" }} />
                        <span>Residential: <strong>{classificationCounts.Residential || 0}</strong></span>
                      </div>
                      <div className="chart-legend-row">
                        <span className="color-swatch" style={{ background: "#10b981" }} />
                        <span>Commercial: <strong>{classificationCounts.Commercial || 0}</strong></span>
                      </div>
                      <div className="chart-legend-row">
                        <span className="color-swatch" style={{ background: "#f59e0b" }} />
                        <span>Agricultural: <strong>{classificationCounts.Agricultural || 0}</strong></span>
                      </div>
                      <div className="chart-legend-row">
                        <span className="color-swatch" style={{ background: "#8b5cf6" }} />
                        <span>Multi-crop: <strong>{classificationCounts["Multi-crop"] || 0}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h2>Acquisition Stage Completion</h2>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600 }}>
                        <span>Section 11 Notification Issued</span>
                        <span>100%</span>
                      </div>
                      <div className="progress-bar-wrap">
                        <div className="progress-bar-fill" style={{ width: "100%" }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600 }}>
                        <span>Ground Verification &amp; GPS Demarcation</span>
                        <span>85%</span>
                      </div>
                      <div className="progress-bar-wrap">
                        <div className="progress-bar-fill" style={{ width: "85%" }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600 }}>
                        <span>Section 19 Declaration Finalized</span>
                        <span>70%</span>
                      </div>
                      <div className="progress-bar-wrap">
                        <div className="progress-bar-fill" style={{ width: "70%" }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600 }}>
                        <span>Compensation Disbursed (₹ Ratio)</span>
                        <span>{Math.round((totalDisbursedValue / (totalAwardValue || 1)) * 100)}%</span>
                      </div>
                      <div className="progress-bar-wrap">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${Math.round((totalDisbursedValue / (totalAwardValue || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginTop: 20 }}>
                <div className="card-header">
                  <h2>Financial Capital Escrow &amp; Payout Ratio</h2>
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
                  <div className="metric-pill">
                    <span>Total Assessed Budget</span>
                    <strong>{formatINR(totalAwardValue)}</strong>
                  </div>
                  <div className="metric-pill" style={{ borderColor: "var(--brand)" }}>
                    <span style={{ color: "var(--brand-dark)" }}>Disbursed into Landowner Accounts</span>
                    <strong style={{ color: "var(--brand-dark)" }}>{formatINR(totalDisbursedValue)}</strong>
                  </div>
                  <div className="metric-pill" style={{ borderColor: "var(--warn)" }}>
                    <span style={{ color: "var(--warn)" }}>Pending Under Section 38 Escrow</span>
                    <strong style={{ color: "var(--warn)" }}>{formatINR(Math.max(0, totalAwardValue - totalDisbursedValue))}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 4: LANDOWNER COMPENSATION & PAYOUT REGISTER       */}
          {/* ========================================================= */}
          {activeSection === "compensation" && (
            <div>
              <div className="page-header">
                <h1>Landowner Award &amp; Compensation Register ({officerProfile.village})[cite: 8]</h1>
                <p>Detailed disbursement records showing compensation awarded, % released, and pending tranches.</p>
              </div>

              <div className="card">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Survey No.</th>
                      <th>Landowner Name</th>
                      <th>Area (Acres)</th>
                      <th>Base Value</th>
                      <th>Solatium (100%)</th>
                      <th>Total Award</th>
                      <th>Disbursed %</th>
                      <th>Disbursement Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lockedFeatures.map((f) => {
                      const p = f.properties;
                      const isFull = p.compensation_percentage === 100;
                      return (
                        <tr key={p.parcel_uuid || p.parcel_id}>
                          <td><strong>Survey #{p.survey_number}[cite: 8]</strong></td>
                          <td>{p.official_owner}[cite: 8]</td>
                          <td>{p.area_acres || p.official_area}[cite: 8]</td>
                          <td>{formatINR(p.base_market_value)}[cite: 8]</td>
                          <td>{formatINR(p.solatium_100_percent)}[cite: 8]</td>
                          <td><strong>{formatINR(p.total_compensation || p.estimated_value)}[cite: 8]</strong></td>
                          <td><strong>{p.compensation_percentage}%[cite: 8]</strong></td>
                          <td>
                            <span className={`badge ${isFull ? "badge-success" : p.compensation_percentage > 0 ? "badge-info" : "badge-warning"}`}>
                              {isFull ? "Fully Disbursed" : p.compensation_percentage > 0 ? "Partially Disbursed" : "Payout Pending"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 5: URGENT & DELAYED PROJECTS                      */}
          {/* ========================================================= */}
          {activeSection === "urgent-projects" && (
            <div>
              <div className="page-header">
                <h1>Urgent &amp; High-Priority Action List</h1>
                <p>Plots with critical pending tasks, legal disputes, or target completion deadlines.</p>
              </div>

              <div className="card">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Parcel UUID</th>
                      <th>Survey #</th>
                      <th>Owner</th>
                      <th>Pending Tasks</th>
                      <th>Delay (Days)</th>
                      <th>Target Completion</th>
                      <th>Priority Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {urgentParcels.map((f) => {
                      const p = f.properties;
                      const isHighDelay = (p.delay_days || 0) > 100;
                      return (
                        <tr key={p.parcel_uuid || p.parcel_id}>
                          <td><strong>{p.parcel_uuid || p.parcel_id}[cite: 8]</strong></td>
                          <td>Survey {p.survey_number}[cite: 8]</td>
                          <td>{p.official_owner}[cite: 8]</td>
                          <td><span className="badge badge-warning">{p.current_pending_tasks || 5} Tasks Pending[cite: 8]</span></td>
                          <td><strong style={{ color: "var(--danger)" }}>+{p.delay_days || 0} Days[cite: 8]</strong></td>
                          <td>{p.target_completion_days || 280} Days Target[cite: 8]</td>
                          <td>
                            <span className={`badge ${isHighDelay ? "badge-danger" : "badge-warning"}`}>
                              {isHighDelay ? "CRITICAL" : "URGENT"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 6: FIELD GPS & GROUND MARKING                     */}
          {/* ========================================================= */}
          {activeSection === "field-gps" && (
            <div>
              <div className="page-header">
                <h1>GPS Cadastral Boundary Pinning</h1>
                <p>Walk the perimeter of the plot to capture corner boundary vertices and record physical ground observations.</p>
              </div>

              {submissionFeedback && <div className="alert-box alert-success">{submissionFeedback}</div>}

              <div className="two-col">
                <div className="card">
                  <div className="card-header">
                    <h2>Target Plot Demarcation</h2>
                  </div>

                  <div className="field">
                    <label>Select Plot in {officerProfile.village}</label>
                    <select
                      className="attractive-select"
                      value={targetParcelId}
                      onChange={(e) => setTargetParcelId(e.target.value)}
                    >
                      {lockedFeatures.map((f) => {
                        const p = f.properties;
                        return (
                          <option key={p.parcel_uuid || p.parcel_id} value={p.parcel_uuid || p.parcel_id}>
                            {p.parcel_uuid || p.parcel_id} — Survey #{p.survey_number} ({p.official_owner})[cite: 8]
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {activePlot && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12.5, margin: "12px 0" }}>
                      <div>
                        <span style={{ color: "var(--text-soft)", fontSize: 11 }}>Official Owner</span>
                        <div><strong>{activePlot.properties.official_owner}[cite: 8]</strong></div>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-soft)", fontSize: 11 }}>Official Area</span>
                        <div><strong>{activePlot.properties.area_acres || activePlot.properties.official_area}[cite: 8]</strong></div>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-soft)", fontSize: 11 }}>Survey Number</span>
                        <div><strong>Survey {activePlot.properties.survey_number}[cite: 8]</strong></div>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-soft)", fontSize: 11 }}>Award Valuation</span>
                        <div><strong>{formatINR(activePlot.properties.total_compensation || activePlot.properties.estimated_value)}[cite: 8]</strong></div>
                      </div>
                    </div>
                  )}

                  <hr style={{ margin: "14px 0", border: "none", borderTop: "1px solid var(--border)" }} />

                  <div className="card-header">
                    <h2>Live GPS Device Sensor</h2>
                    <span className={`badge ${isGpsActive ? "badge-success" : "badge-info"}`}>
                      {isGpsActive ? "GPS Lock Active" : "GPS Inactive"}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                    <button type="button" className={`btn-${isGpsActive ? "secondary" : "primary"}`} onClick={toggleGps}>
                      {isGpsActive ? "Stop GPS" : "Turn On Device GPS"}
                    </button>
                    <button type="button" className="btn-primary" onClick={pinGpsPoint} disabled={!currentGps}>
                      Pin Corner Vertex ({pinnedCoordinates.length})
                    </button>
                  </div>

                  {currentGps && (
                    <div className="alert-box alert-success" style={{ padding: "8px 12px", fontSize: 12 }}>
                      Lat: <strong>{currentGps.lat.toFixed(6)}</strong>, Lng: <strong>{currentGps.lng.toFixed(6)}</strong> (±{accuracy}m)
                    </div>
                  )}

                  {pinnedCoordinates.length > 0 ? (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Vertex</th>
                          <th>Latitude</th>
                          <th>Longitude</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pinnedCoordinates.map((pt, i) => (
                          <tr key={i}>
                            <td>{pt.vertex}</td>
                            <td>{pt.lat.toFixed(6)}</td>
                            <td>{pt.lng.toFixed(6)}</td>
                            <td>{pt.time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ color: "var(--text-soft)", fontSize: 12.5, textAlign: "center", padding: 12 }}>
                      No boundary vertices recorded yet.
                    </div>
                  )}
                </div>

                <div className="card">
                  <div className="card-header">
                    <h2>Field Observations &amp; Verification</h2>
                  </div>

                  <form onSubmit={handleSaveVerification}>
                    <div className="field">
                      <label>Actual Ground Classification</label>
                      <select
                        className="attractive-select"
                        value={classification}
                        onChange={(e) => setClassification(e.target.value)}
                      >
                        <option value="Agricultural">Agricultural</option>
                        <option value="Multi-crop">Multi-crop Irrigated</option>
                        <option value="Commercial">Commercial / Industrial</option>
                        <option value="Residential">Residential</option>
                      </select>
                    </div>

                    <div className="field">
                      <label>Surveyed Ground Area (sqm)</label>
                      <input
                        type="number"
                        placeholder="e.g. 6070.29"
                        value={measuredAreaSqm}
                        onChange={(e) => setMeasuredAreaSqm(e.target.value)}
                        required
                      />
                    </div>

                    <div className="field">
                      <label>Field Remarks (Structures, Trees, Borewells)</label>
                      <textarea
                        rows="4"
                        placeholder="Detail physical assets on site..."
                        value={fieldRemarks}
                        onChange={(e) => setFieldRemarks(e.target.value)}
                      />
                    </div>

                    <button type="submit" className="btn-primary" style={{ width: "100%" }}>
                      Save Ground Verification Record
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 7: UPLOAD LANDOWNER DOCS TO VILLAGE OFFICER       */}
          {/* ========================================================= */}
          {activeSection === "landowner-docs" && (
            <div>
              <div className="page-header">
                <h1>Landowner Document Submission to Village Officer</h1>
                <p>Upload authenticated landowner land titles, RoR extracts, identity cards, and field maps for Village Officer (Patwari / Lekhpal) review.</p>
              </div>

              {villageUploadStatus && <div className="alert-box alert-success">{villageUploadStatus}</div>}

              <div className="two-col">
                <div className="card">
                  <div className="card-header">
                    <h2>Upload &amp; Forward Document</h2>
                  </div>

                  <form onSubmit={handleUploadToVillageOfficer}>
                    <div className="field">
                      <label>Recipient Village Officer</label>
                      <input
                        type="text"
                        value={officerProfile.villageOfficer}
                        disabled
                        style={{ background: "var(--surface-soft)", fontWeight: 600 }}
                      />
                    </div>

                    <div className="field">
                      <label>Target Landowner &amp; Parcel</label>
                      <select
                        className="attractive-select"
                        value={targetParcelId}
                        onChange={(e) => setTargetParcelId(e.target.value)}
                      >
                        {lockedFeatures.map((f) => {
                          const p = f.properties;
                          return (
                            <option key={p.parcel_uuid || p.parcel_id} value={p.parcel_uuid || p.parcel_id}>
                              {p.official_owner} — Survey #{p.survey_number} ({p.parcel_uuid || p.parcel_id})[cite: 8]
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="field">
                      <label>Document Category</label>
                      <select
                        className="attractive-select"
                        value={docCategory}
                        onChange={(e) => setDocCategory(e.target.value)}
                      >
                        <option value="Record of Rights (Khatauni / RoR)">Record of Rights (Khatauni / RoR)</option>
                        <option value="Landowner Aadhaar & PAN Card">Landowner Aadhaar &amp; PAN Card</option>
                        <option value="Bank Account Passbook / Mandate">Bank Account Passbook / Mandate</option>
                        <option value="Sale Deed / Title Proof">Registered Sale Deed / Title Proof</option>
                        <option value="Field Measurement Book (FMB) Sketch">Field Measurement Book (FMB) Sketch</option>
                        <option value="Tree & Structure Valuation Schedule">Tree &amp; Structure Valuation Schedule</option>
                        <option value="Dispute Affidavit / Legal Notice">Dispute Affidavit / Legal Notice</option>
                      </select>
                    </div>

                    <div className="field">
                      <label>Select Landowner File (PDF / JPG / PNG / KML)</label>
                      <input
                        type="file"
                        onChange={(e) => setSelectedUploadFile(e.target.files[0])}
                        required
                      />
                    </div>

                    <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: 8 }}>
                      📤 Upload &amp; Transmit to Village Officer
                    </button>
                  </form>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h2>Transmitted Landowner Documents ({uploadedLandownerDocs.length})</h2>
                  </div>

                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                    {uploadedLandownerDocs.map((doc) => (
                      <li
                        key={doc.id}
                        style={{
                          padding: 12,
                          background: "var(--surface-soft)",
                          borderRadius: 8,
                          borderLeft: "4px solid var(--brand)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: 12.5,
                        }}
                      >
                        <div>
                          <strong>{doc.docName}</strong>
                          <div style={{ color: "var(--text-soft)", fontSize: 11, marginTop: 2 }}>
                            Owner: <strong>{doc.owner}</strong> (Survey #{doc.surveyNo}) • {doc.category}
                          </div>
                          <span style={{ fontSize: 10.5, color: "var(--text-faint)", marginTop: 2, display: "block" }}>
                            Forwarded on {doc.date} to {doc.recipient}
                          </span>
                        </div>
                        <span className="badge badge-success">Forwarded</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 8: NOTIFICATIONS & DISPATCH CENTER                */}
          {/* ========================================================= */}
          {activeSection === "notifications" && (
            <div>
              <div className="page-header">
                <h1>Official Notifications &amp; Notice Dispatch Center</h1>
                <p>Broadcast statutory notices to landowners and coordinate instructions with the Village Revenue Officer.</p>
              </div>

              {noticeSentFeedback && <div className="alert-box alert-success">{noticeSentFeedback}</div>}

              <div className="two-col">
                <div className="card">
                  <div className="card-header">
                    <h2>Notification Inbox &amp; Directives</h2>
                    <span className="badge badge-info">{notifications.length} Total</span>
                  </div>

                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                    {notifications.map((n) => (
                      <li
                        key={n.id}
                        style={{
                          padding: 12,
                          background: n.read ? "var(--surface-soft)" : "var(--brand-light)",
                          borderRadius: 8,
                          borderLeft: `4px solid ${n.type === "urgent" ? "var(--danger)" : "var(--brand)"}`,
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                          fontSize: 12.5,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong>{n.title}</strong>
                          {!n.read && (
                            <button
                              className="btn-secondary"
                              style={{ padding: "2px 8px", fontSize: 11 }}
                              onClick={() => markNotificationRead(n.id)}
                            >
                              Mark Read
                            </button>
                          )}
                        </div>
                        <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 12 }}>{n.message}</p>
                        <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginTop: 2, display: "flex", justifyContent: "space-between" }}>
                          <span>From: {n.sender} ➔ To: {n.recipient}</span>
                          <span>{n.date}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h2>Dispatch Necessary Notice / Alert</h2>
                  </div>

                  <form onSubmit={handleSendNotice}>
                    <div className="field">
                      <label>Recipient Authority / Entity</label>
                      <select
                        className="attractive-select"
                        value={newNoticeTarget}
                        onChange={(e) => setNewNoticeTarget(e.target.value)}
                      >
                        <option value="Landowner">Selected Landowner (in Malhaur)</option>
                        <option value="Village Officer">Village Officer (Patwari / Lekhpal)</option>
                        <option value="All Landowners">Broadcast to All Malhaur Landowners</option>
                      </select>
                    </div>

                    {newNoticeTarget === "Landowner" && (
                      <div className="field">
                        <label>Select Landowner Plot</label>
                        <select
                          className="attractive-select"
                          value={targetParcelId}
                          onChange={(e) => setTargetParcelId(e.target.value)}
                        >
                          {lockedFeatures.map((f) => {
                            const p = f.properties;
                            return (
                              <option key={p.parcel_uuid || p.parcel_id} value={p.parcel_uuid || p.parcel_id}>
                                {p.official_owner} — Survey #{p.survey_number}[cite: 8]
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}

                    <div className="field">
                      <label>Notice Subject</label>
                      <input
                        type="text"
                        placeholder="e.g. Schedule of Physical Land Demarcation"
                        value={newNoticeTitle}
                        onChange={(e) => setNewNoticeTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div className="field">
                      <label>Notice Details &amp; Directives</label>
                      <textarea
                        rows="4"
                        placeholder="State requirements, inspection timings, or documents to bring..."
                        value={newNoticeMsg}
                        onChange={(e) => setNewNoticeMsg(e.target.value)}
                        required
                      />
                    </div>

                    <button type="submit" className="btn-primary" style={{ width: "100%" }}>
                      📨 Send Official Notice
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 9: OFFICER PROFILE                                */}
          {/* ========================================================= */}
          {activeSection === "profile" && (
            <div>
              <div className="page-header">
                <h1>Survey Officer Official Profile</h1>
                <p>Credentials, government jurisdiction assignment, and field division authorization details.</p>
              </div>

              <div className="two-col">
                <div className="card">
                  <div className="profile-hero-badge">
                    <div className="profile-large-avatar">
                      {(officerProfile.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div>
                      <h2>{officerProfile.name}</h2>
                      <span className="badge badge-info">{officerProfile.role}</span>
                    </div>
                  </div>

                  <hr style={{ margin: "16px 0", border: "none", borderTop: "1px solid var(--border)" }} />

                  <div className="profile-details-grid">
                    <div>
                      <span className="profile-label">Officer ID</span>
                      <div className="profile-val">{officerProfile.id}</div>
                    </div>
                    <div>
                      <span className="profile-label">Authorized Division</span>
                      <div className="profile-val">{officerProfile.division}</div>
                    </div>
                    <div>
                      <span className="profile-label">Assigned Village Circle</span>
                      <div className="profile-val"><strong>{officerProfile.village}, {officerProfile.district} ({officerProfile.state})</strong></div>
                    </div>
                    <div>
                      <span className="profile-label">Official Email</span>
                      <div className="profile-val">{officerProfile.email}</div>
                    </div>
                    <div>
                      <span className="profile-label">Contact Mobile</span>
                      <div className="profile-val">{officerProfile.phone}</div>
                    </div>
                    <div>
                      <span className="profile-label">Posting Period</span>
                      <div className="profile-val">Since {officerProfile.assignedSince}</div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h2>Jurisdiction Security &amp; Clearance</h2>
                  </div>
                  <ul className="clearance-list">
                    <li>
                      <span className="clearance-icon">🛡️</span>
                      <div>
                        <strong>Cadastral Verification Level 3</strong>
                        <span>Authorized to pin statutory polygon vertices and submit survey reports.</span>
                      </div>
                    </li>
                    <li>
                      <span className="clearance-icon">📍</span>
                      <div>
                        <strong>Geofenced Authorization</strong>
                        <span>Auto-restricted strictly to Malhaur village cadastral database[cite: 8].</span>
                      </div>
                    </li>
                    <li>
                      <span className="clearance-icon">📑</span>
                      <div>
                        <strong>Revenue Linkage</strong>
                        <span>Direct encrypted transmission pipeline with Patwari circle office.</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 10: SYSTEM SETTINGS                               */}
          {/* ========================================================= */}
          {activeSection === "settings" && (
            <div>
              <div className="page-header">
                <h1>Field Portal System Settings</h1>
                <p>Manage hardware GPS accuracy, interface themes, map caching, and coordinate formats.</p>
              </div>

              <div className="two-col">
                <div className="card">
                  <div className="card-header">
                    <h2>Sensor &amp; Hardware Preferences</h2>
                  </div>

                  <div className="settings-toggle-list">
                    <label className="toggle-item">
                      <div>
                        <strong>High-Precision Device GPS (WGS84)</strong>
                        <span>Request sub-meter hardware assisted GPS coordinates on mobile sensors.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.gpsHighAccuracy}
                        onChange={(e) => setSettings({ ...settings, gpsHighAccuracy: e.target.checked })}
                      />
                    </label>

                    <label className="toggle-item">
                      <div>
                        <strong>Real-Time Cadastral Database Sync</strong>
                        <span>Automatically sync pinned corner coordinates with state revenue storage.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.autoSyncCadastre}
                        onChange={(e) => setSettings({ ...settings, autoSyncCadastre: e.target.checked })}
                      />
                    </label>

                    <label className="toggle-item">
                      <div>
                        <strong>Offline Map Tile Caching</strong>
                        <span>Cache OpenStreetMap tiles for physical field operations with low internet.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.mapCacheOffline}
                        onChange={(e) => setSettings({ ...settings, mapCacheOffline: e.target.checked })}
                      />
                    </label>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h2>Display &amp; Formatting Options</h2>
                  </div>

                  <div className="field">
                    <label>Coordinate Display Format</label>
                    <select
                      className="attractive-select"
                      value={settings.coordFormat}
                      onChange={(e) => setSettings({ ...settings, coordFormat: e.target.value })}
                    >
                      <option value="DD">Decimal Degrees (e.g. 26.851093, 80.940365)[cite: 8]</option>
                      <option value="DMS">Degrees Minutes Seconds (e.g. 26°51'03"N, 80°56'25"E)</option>
                    </select>
                  </div>

                  <div className="field">
                    <label>Basemap Default Style</label>
                    <select
                      className="attractive-select"
                      value={basemap}
                      onChange={(e) => setBasemap(e.target.value)}
                    >
                      <option value="street">OpenStreetMap Street Grid</option>
                      <option value="satellite">Esri World Satellite Imagery</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    className="btn-primary"
                    style={{ marginTop: 10 }}
                    onClick={() => alert("Settings saved successfully!")}
                  >
                    Save System Settings
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* SIGN OUT MODAL (MATCHING REFERENCE UI)                     */}
      {/* ========================================================= */}
      {showSignOutModal && (
        <div className="ref-modal-overlay">
          <div className="ref-modal-card">
            <div className="ref-modal-header">
              <h3>Sign out?</h3>
              <button
                type="button"
                className="ref-modal-close"
                onClick={() => setShowSignOutModal(false)}
              >
                ✕
              </button>
            </div>

            <p className="ref-modal-body">
              Are you sure you want to sign out of your account?
            </p>

            <div className="ref-modal-actions">
              <button
                type="button"
                className="ref-btn-cancel"
                onClick={() => setShowSignOutModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ref-btn-signout"
                onClick={confirmSignOut}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}