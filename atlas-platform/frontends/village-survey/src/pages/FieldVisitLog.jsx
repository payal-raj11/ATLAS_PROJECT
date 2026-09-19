import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAtlas } from "../context/AtlasContext";

const getValue = (obj, keys, fallback = "") => {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null && obj?.[key] !== "") return obj[key];
  }
  return fallback;
};

const getVisitId = (v) => getValue(v, ["visitId", "id", "visitID"], "");
const getSurvey = (v) => String(getValue(v, ["surveyNo", "survey", "parcelNo"], ""));
const getOfficer = (v) => getValue(v, ["officerName", "surveyOfficer", "officer"], "Unassigned");
const getDate = (v) => getValue(v, ["date", "visitDate", "inspectionDate", "createdAt"], "");
const getStatus = (v) => getValue(v, ["status", "visitStatus"], "Pending");
const getActivity = (v) => getValue(v, ["activity", "purpose", "type"], "Field inspection");

const statusColor = (status, colors) => {
  const s = String(status).toLowerCase();
  if (s.includes("complete")) return colors.green;
  if (s.includes("progress")) return colors.orange;
  if (s.includes("cancel")) return colors.red;
  return colors.blue;
};

function FieldVisitLog({ isDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const atlas = useAtlas();

  const {
    fieldVisits: rawVisits = [],
    parcels = [],
    surveyOfficers = [],
    addActivity,
    addSyncItem,
    addFieldVisit,
    updateFieldVisit,
  } = atlas || {};

  const visits = useMemo(() => {
    if (rawVisits.length) return rawVisits;

    return [
      {
        visitId: "VIS-001",
        date: "2025-09-12",
        officer: "Ramesh Kumar",
        survey: "115",
        activity: "Boundary measurement",
        status: "Completed",
        remarks: "Boundary points matched the available field sketch.",
      },
      {
        visitId: "VIS-002",
        date: "2025-09-12",
        officer: "Savitri Devi",
        survey: "118",
        activity: "Owner verification",
        status: "Completed",
        remarks: "Landowner identity and parcel usage verified.",
      },
      {
        visitId: "VIS-003",
        date: "2025-09-12",
        officer: "Iqbal Khan",
        survey: "120",
        activity: "Land-use classification",
        status: "In Progress",
        remarks: "Residential use observed; supporting records pending.",
      },
      {
        visitId: "VIS-004",
        date: "2025-09-13",
        officer: "Ramesh Kumar",
        survey: "121",
        activity: "Field photography",
        status: "Pending",
        remarks: "Photographic evidence still required.",
      },
    ];
  }, [rawVisits]);

  const params = new URLSearchParams(location.search);
  const selectedVisitId = params.get("visit") || getVisitId(visits[0]) || "";
  const selectedVisit =
    visits.find((v) => getVisitId(v) === selectedVisitId) || visits[0];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSurvey, setSelectedSurvey] = useState(getSurvey(selectedVisit));
  const [selectedOfficer, setSelectedOfficer] = useState(getOfficer(selectedVisit));
  const [activity, setActivity] = useState(getActivity(selectedVisit));
  const [visitDate, setVisitDate] = useState(
    String(getDate(selectedVisit)).slice(0, 10) || new Date().toISOString().slice(0, 10)
  );
  const [visitStatus, setVisitStatus] = useState(getStatus(selectedVisit));
  const [remarks, setRemarks] = useState(selectedVisit?.remarks || "");
  const [findings, setFindings] = useState(selectedVisit?.findings || "");
  const [gpsStatus, setGpsStatus] = useState(selectedVisit?.gpsStatus || "Pending Capture");
  const [photoCount, setPhotoCount] = useState(Number(selectedVisit?.photoCount || 0));
  const [toast, setToast] = useState("");

  useEffect(() => {
    setSelectedSurvey(getSurvey(selectedVisit));
    setSelectedOfficer(getOfficer(selectedVisit));
    setActivity(getActivity(selectedVisit));
    setVisitDate(String(getDate(selectedVisit)).slice(0, 10) || new Date().toISOString().slice(0, 10));
    setVisitStatus(getStatus(selectedVisit));
    setRemarks(selectedVisit?.remarks || "");
    setFindings(selectedVisit?.findings || "");
    setGpsStatus(selectedVisit?.gpsStatus || "Pending Capture");
    setPhotoCount(Number(selectedVisit?.photoCount || 0));
  }, [selectedVisitId, selectedVisit]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const filteredVisits = visits.filter((visit) => {
    const haystack = [
      getVisitId(visit),
      getDate(visit),
      getOfficer(visit),
      getSurvey(visit),
      getActivity(visit),
      getStatus(visit),
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = haystack.includes(search.toLowerCase());
    const status = String(getStatus(visit)).toLowerCase();
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "completed" && status.includes("complete")) ||
      (statusFilter === "progress" && status.includes("progress")) ||
      (statusFilter === "pending" && status.includes("pending"));

    return matchesSearch && matchesStatus;
  });

  const completedCount = visits.filter((v) =>
    String(getStatus(v)).toLowerCase().includes("complete")
  ).length;
  const progressCount = visits.filter((v) =>
    String(getStatus(v)).toLowerCase().includes("progress")
  ).length;
  const pendingCount = visits.filter((v) =>
    String(getStatus(v)).toLowerCase().includes("pending")
  ).length;

  const selectedParcel =
    parcels.find((p) => String(p.surveyNo || p.survey || p.id) === selectedSurvey) || null;

  const selectedOfficerObject =
    surveyOfficers.find(
      (o) =>
        String(o.id || o.officerId || o.code) === String(selectedOfficer) ||
        String(o.name || o.officerName || o.fullName) === String(selectedOfficer)
    ) || null;

  const inputStyle = {
    width: "100%",
    height: "39px",
    padding: "0 12px",
    borderRadius: "8px",
    border: `1px solid ${isDarkMode ? "#30415c" : "#d2dbe8"}`,
    background: isDarkMode ? "#0b1426" : "#f8fafc",
    color: isDarkMode ? "#f8fafc" : "#10213d",
    outline: "none",
    fontSize: "12px",
    boxSizing: "border-box",
  };

  const colors = {
    card: isDarkMode ? "#1e2a3f" : "#ffffff",
    cardDark: isDarkMode ? "#172238" : "#f8fafc",
    input: isDarkMode ? "#0b1426" : "#f8fafc",
    border: isDarkMode ? "#30415c" : "#d2dbe8",
    text: isDarkMode ? "#f8fafc" : "#10213d",
    muted: isDarkMode ? "#7590b5" : "#64748b",
    blue: "#2563eb",
    blueSoft: "#3f8cff",
    cyan: "#08b6ee",
    green: "#10c98a",
    orange: "#ff9f0a",
    red: "#ff3b4d",
  };

  const card = {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: "15px",
    boxSizing: "border-box",
  };

  const primaryButton = {
    height: "39px",
    padding: "0 14px",
    border: 0,
    borderRadius: "8px",
    background: colors.blue,
    color: "#fff",
    fontSize: "11px",
    fontWeight: "800",
    cursor: "pointer",
  };

  const secondaryButton = {
    height: "39px",
    padding: "0 14px",
    border: `1px solid ${colors.border}`,
    borderRadius: "8px",
    background: colors.cardDark,
    color: colors.text,
    fontSize: "11px",
    fontWeight: "800",
    cursor: "pointer",
  };

  const goStep = (step, visitId = selectedVisitId) => {
    const query = visitId ? `?visit=${encodeURIComponent(visitId)}` : "";
    navigate(`/field-visits/${step}${query}`);
  };

  const selectVisit = (id, step = "visit-register") => {
    navigate(`/field-visits/${step}?visit=${encodeURIComponent(id)}`);
  };

  const notify = (message) => setToast(message);

  const buildPatch = () => ({
    date: visitDate,
    visitDate,
    officer: selectedOfficer,
    survey: selectedSurvey,
    surveyNo: selectedSurvey,
    activity,
    status: visitStatus,
    remarks,
    findings,
    gpsStatus,
    photoCount,
  });

  const saveVisit = () => {
    if (typeof updateFieldVisit === "function" && selectedVisit) {
      updateFieldVisit(selectedVisitId, buildPatch());
    }
    if (typeof addActivity === "function") {
      addActivity({
        type: "field-visit-update",
        message: `${getActivity({ activity })} updated for Survey ${selectedSurvey}`,
        surveyNo: selectedSurvey,
        visitId: selectedVisitId,
        timestamp: new Date().toISOString(),
      });
    }
    notify(`Visit ${selectedVisitId} saved`);
  };

  const markComplete = () => {
    setVisitStatus("Completed");
    const patch = { ...buildPatch(), status: "Completed" };
    if (typeof updateFieldVisit === "function" && selectedVisit) {
      updateFieldVisit(selectedVisitId, patch);
    }
    notify(`Visit ${selectedVisitId} marked Completed`);
  };

  const captureGps = () => {
    setGpsStatus("Captured");
    if (typeof updateFieldVisit === "function" && selectedVisit) {
      updateFieldVisit(selectedVisitId, { gpsStatus: "Captured" });
    }
    notify("GPS location captured");
  };

  const addPhotos = () => {
    const nextCount = photoCount + 1;
    setPhotoCount(nextCount);
    if (typeof updateFieldVisit === "function" && selectedVisit) {
      updateFieldVisit(selectedVisitId, { photoCount: nextCount });
    }
    notify(`Photo evidence count updated to ${nextCount}`);
  };

  const createVisit = () => {
    const visitId = `VIS-${Date.now().toString().slice(-6)}`;
    const payload = {
      visitId,
      date: visitDate,
      visitDate,
      officer: selectedOfficer,
      officerId: selectedOfficerObject?.id || selectedOfficerObject?.officerId || "",
      survey: selectedSurvey,
      surveyNo: selectedSurvey,
      activity,
      status: "Pending",
      remarks,
      findings,
      gpsStatus,
      photoCount,
      source: "Field Visit Log",
    };

    if (typeof addFieldVisit === "function") {
      addFieldVisit(payload);
    } else if (typeof addSyncItem === "function") {
      addSyncItem({
        type: "Field Visit",
        status: "Pending Sync",
        visitId,
        surveyNo: selectedSurvey,
        officer: selectedOfficer,
        createdAt: new Date().toISOString(),
        payload,
      });
    }

    if (typeof addActivity === "function") {
      addActivity({
        type: "field-visit-created",
        message: `${activity} visit created for Survey ${selectedSurvey}`,
        surveyNo: selectedSurvey,
        visitId,
        timestamp: new Date().toISOString(),
      });
    }

    notify(`New visit ${visitId} prepared`);
    navigate(`/field-visits/visit-details?visit=${encodeURIComponent(visitId)}`);
  };

  const exportLog = () => {
    const rows = filteredVisits.map((v) => ({
      visitId: getVisitId(v),
      date: getDate(v),
      officer: getOfficer(v),
      surveyNo: getSurvey(v),
      activity: getActivity(v),
      status: getStatus(v),
    }));

    const headers = ["visitId", "date", "officer", "surveyNo", "activity", "status"];
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers.map((h) => `"${String(row[h] ?? "").replaceAll('"', '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "field-visit-log.csv";
    a.click();
    URL.revokeObjectURL(url);
    notify("Field visit log exported");
  };

  const header = (eyebrow, title, subtitle, action) => (
    <div style={{ marginBottom: "22px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "20px" }}>
      <div>
        <div style={{ color: colors.muted, fontSize: "12px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "5px" }}>
          {eyebrow}
        </div>
        <h1 style={{ margin: 0, color: colors.text, fontSize: "30px", lineHeight: "1.15", fontWeight: "800", letterSpacing: "-0.5px" }}>
          {title}
        </h1>
        <p style={{ margin: "6px 0 0", color: colors.muted, fontSize: "14px" }}>{subtitle}</p>
      </div>
      {action}
    </div>
  );

  const stat = (label, value, sub, accent) => (
    <div style={{ ...card, padding: "18px 20px", minHeight: "125px", position: "relative" }}>
      <span style={{ position: "absolute", right: "12px", top: "12px", width: "10px", height: "10px", borderRadius: "50%", background: accent }} />
      <div style={{ color: colors.muted, fontSize: "11px", fontWeight: "800" }}>{label}</div>
      <div style={{ color: accent, fontSize: "34px", lineHeight: "1", fontWeight: "800", marginTop: "11px" }}>{value}</div>
      <div style={{ color: colors.muted, fontSize: "12px", marginTop: "7px" }}>{sub}</div>
    </div>
  );

  const section = (title, subtitle, children, right = null) => (
    <section style={{ ...card, overflow: "hidden" }}>
      <div style={{ padding: "18px 20px 15px", borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "19px", fontWeight: "800", color: colors.text }}>{title}</h2>
          <p style={{ margin: "4px 0 0", color: colors.muted, fontSize: "12px" }}>{subtitle}</p>
        </div>
        {right}
      </div>
      {children}
    </section>
  );

  const field = (label, children) => (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", color: colors.muted, fontSize: "10px", fontWeight: "800", textTransform: "uppercase", marginBottom: "6px" }}>
        {label}
      </span>
      {children}
    </label>
  );

  const renderRegister = () => (
    <>
      {header(
        "Field Operations",
        "Field Visit Log",
        "Complete history of field inspections in Malhaur",
        <div style={{ display: "flex", gap: "8px" }}>
          <button type="button" onClick={() => goStep("new-visit")} style={primaryButton}>+ New Visit</button>
          <button type="button" onClick={exportLog} style={secondaryButton}>Export Log</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: "16px", marginBottom: "20px" }}>
        {stat("TOTAL VISITS", visits.length, "All recorded inspections", colors.blue)}
        {stat("COMPLETED", completedCount, "Verified field records", colors.green)}
        {stat("IN PROGRESS", progressCount, "Visits currently active", colors.orange)}
        {stat("PENDING", pendingCount, "Visits requiring action", colors.cyan)}
      </div>

      {section(
        "🗂️ Visit Register",
        "Search and filter every field inspection",
        <>
          <div style={{ padding: "15px 20px", display: "grid", gridTemplateColumns: "minmax(0,1fr) 170px auto", gap: "9px" }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search visit ID, survey no. or officer..." style={inputStyle} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={inputStyle}>
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="progress">In Progress</option>
              <option value="pending">Pending</option>
            </select>
            <button type="button" onClick={() => { setSearch(""); setStatusFilter("all"); }} style={secondaryButton}>Reset</button>
          </div>

          <div style={{ padding: "0 20px 20px", overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: "850px", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr>
                  {["Visit ID", "Date", "Survey Officer", "Survey No.", "Activity", "Status", "Action"].map((h) => (
                    <th key={h} style={{ textAlign: "left", color: colors.muted, fontSize: "10px", fontWeight: "800", textTransform: "uppercase", padding: "0 10px 10px 0", borderBottom: `1px solid ${colors.border}` }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredVisits.map((visit) => {
                  const id = getVisitId(visit);
                  const accent = statusColor(getStatus(visit), colors);
                  return (
                    <tr key={id || `${getSurvey(visit)}-${getDate(visit)}`}>
                      <td style={{ padding: "13px 10px 13px 0", color: colors.cyan, fontWeight: "800", borderBottom: `1px solid ${colors.border}` }}>{id || "—"}</td>
                      <td style={{ padding: "13px 10px 13px 0", color: colors.muted, borderBottom: `1px solid ${colors.border}` }}>{getDate(visit) || "—"}</td>
                      <td style={{ padding: "13px 10px 13px 0", color: colors.text, fontWeight: "700", borderBottom: `1px solid ${colors.border}` }}>{getOfficer(visit)}</td>
                      <td style={{ padding: "13px 10px 13px 0", color: colors.cyan, fontWeight: "800", borderBottom: `1px solid ${colors.border}` }}>{getSurvey(visit) || "—"}</td>
                      <td style={{ padding: "13px 10px 13px 0", color: colors.text, borderBottom: `1px solid ${colors.border}` }}>{getActivity(visit)}</td>
                      <td style={{ padding: "13px 10px 13px 0", borderBottom: `1px solid ${colors.border}` }}>
                        <span style={{ color: accent, fontWeight: "800", fontSize: "10px" }}>● {getStatus(visit)}</span>
                      </td>
                      <td style={{ padding: "13px 0", borderBottom: `1px solid ${colors.border}` }}>
                        <button type="button" onClick={() => selectVisit(id, "visit-details")} style={{ border: 0, background: "transparent", color: colors.blueSoft, fontWeight: "800", fontSize: "10px", cursor: "pointer" }}>
                          Open →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!filteredVisits.length && (
              <div style={{ padding: "30px 0 10px", color: colors.muted, textAlign: "center", fontSize: "12px" }}>
                No field visits match the selected filters.
              </div>
            )}
          </div>
        </>
      )}
    </>
  );

  const renderDetails = () => (
    <>
      {header(
        "Field Inspection",
        "Visit Details",
        `${getVisitId(selectedVisit) || "New record"} · Survey ${selectedSurvey || "—"}`,
        <div style={{ display: "flex", gap: "8px" }}>
          <button type="button" onClick={() => goStep("visit-register")} style={secondaryButton}>← Visit Register</button>
          <button type="button" onClick={saveVisit} style={primaryButton}>Save Visit</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(0,.9fr)", gap: "20px" }}>
        {section(
          "Inspection Record",
          "Core field visit information",
          <div style={{ padding: "20px", display: "grid", gap: "15px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {field("Visit ID", <input value={getVisitId(selectedVisit)} readOnly style={inputStyle} />)}
              {field("Visit Date", <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} style={inputStyle} />)}
            </div>

            {field(
              "Survey Number",
              <select value={selectedSurvey} onChange={(e) => setSelectedSurvey(e.target.value)} style={inputStyle}>
                {parcels.length
                  ? parcels.map((p) => {
                      const no = String(p.surveyNo || p.survey || p.id);
                      return <option key={no} value={no}>{no} — {p.owner || "Land parcel"}</option>;
                    })
                  : <option value={selectedSurvey || "115"}>{selectedSurvey || "115"}</option>}
              </select>
            )}

            {field(
              "Survey Officer",
              <select value={selectedOfficer} onChange={(e) => setSelectedOfficer(e.target.value)} style={inputStyle}>
                {surveyOfficers.length
                  ? surveyOfficers.map((o) => {
                      const id = o.id || o.officerId || o.code;
                      const name = o.name || o.officerName || o.fullName || id;
                      return <option key={id || name} value={id || name}>{name}</option>;
                    })
                  : <option value={selectedOfficer}>{selectedOfficer}</option>}
              </select>
            )}

            {field(
              "Activity",
              <select value={activity} onChange={(e) => setActivity(e.target.value)} style={inputStyle}>
                <option>Field verification</option>
                <option>Boundary measurement</option>
                <option>Owner verification</option>
                <option>Land-use classification</option>
                <option>Field photography</option>
                <option>Document collection</option>
              </select>
            )}

            {field(
              "Visit Status",
              <select value={visitStatus} onChange={(e) => setVisitStatus(e.target.value)} style={inputStyle}>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
                <option>Cancelled</option>
              </select>
            )}

            {field(
              "Inspection Remarks",
              <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={6} style={{ ...inputStyle, height: "auto", minHeight: "130px", padding: "11px 12px", resize: "vertical", lineHeight: 1.55 }} />
            )}

            <div style={{ display: "flex", justifyContent: "space-between", gap: "9px" }}>
              <button type="button" onClick={() => goStep("evidence")} style={secondaryButton}>Next: Evidence →</button>
              <button type="button" onClick={saveVisit} style={primaryButton}>Save Record</button>
            </div>
          </div>
        )}

        {section(
          "Parcel Snapshot",
          selectedParcel ? `Current record for Survey ${selectedSurvey}` : "Selected survey details",
          <div style={{ padding: "20px" }}>
            {[
              ["LANDOWNER", selectedParcel?.owner || "Not available"],
              ["AREA", selectedParcel?.area ? `${selectedParcel.area} Ha` : "Not available"],
              ["CLASSIFICATION", selectedParcel?.classification || "Not available"],
              ["RECORD STATUS", selectedParcel?.recordStatus || "Not available"],
              ["SCRUTINY STATUS", selectedParcel?.scrutinyStatus || "Not available"],
            ].map(([label, value], i) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: "15px", padding: "12px 0", borderBottom: i === 4 ? 0 : `1px solid ${colors.border}` }}>
                <span style={{ color: colors.muted, fontSize: "10px", fontWeight: "800" }}>{label}</span>
                <span style={{ color: colors.text, fontSize: "11px", fontWeight: "700", textAlign: "right" }}>{value}</span>
              </div>
            ))}
            <div style={{ marginTop: "18px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button type="button" onClick={() => navigate(`/land-scrutiny?survey=${encodeURIComponent(selectedSurvey)}`)} style={secondaryButton}>Land Scrutiny</button>
              <button type="button" onClick={() => navigate(`/boundary-check?survey=${encodeURIComponent(selectedSurvey)}`)} style={secondaryButton}>Boundary Check</button>
            </div>
          </div>
        )}
      </div>
    </>
  );

  const renderEvidence = () => (
    <>
      {header(
        "Field Inspection",
        "Evidence & Findings",
        `Capture location, photos and inspection findings for ${getVisitId(selectedVisit)}`,
        <button type="button" onClick={() => goStep("visit-details")} style={secondaryButton}>← Visit Details</button>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {section(
          "📍 Location Evidence",
          "Record on-site positioning information",
          <div style={{ padding: "20px", display: "grid", gap: "15px" }}>
            <div style={{ padding: "15px", borderRadius: "9px", border: `1px solid ${colors.border}`, background: colors.input }}>
              <div style={{ color: colors.muted, fontSize: "10px", fontWeight: "800" }}>GPS STATUS</div>
              <div style={{ marginTop: "7px", color: gpsStatus === "Captured" ? colors.green : colors.orange, fontSize: "14px", fontWeight: "800" }}>
                ● {gpsStatus}
              </div>
            </div>

            <button type="button" onClick={captureGps} style={primaryButton}>Capture GPS Location</button>

            <div style={{ padding: "15px", borderRadius: "9px", border: `1px solid ${colors.border}`, background: colors.input }}>
              <div style={{ color: colors.muted, fontSize: "10px", fontWeight: "800" }}>PHOTO EVIDENCE</div>
              <div style={{ marginTop: "7px", color: colors.cyan, fontSize: "22px", fontWeight: "800" }}>{photoCount}</div>
              <div style={{ marginTop: "3px", color: colors.muted, fontSize: "11px" }}>field photographs recorded</div>
            </div>

            <button type="button" onClick={addPhotos} style={secondaryButton}>Add / Record Photo Evidence</button>

            <button type="button" onClick={() => goStep("findings")} style={{ ...primaryButton, marginTop: "3px" }}>Next: Findings →</button>
          </div>
        )}

        {section(
          "📷 Field Findings",
          "Observation notes captured during the visit",
          <div style={{ padding: "20px" }}>
            <textarea
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              rows={12}
              placeholder="Record boundary condition, land use, ownership observations, access issues and other field findings..."
              style={{ ...inputStyle, height: "260px", padding: "12px", resize: "vertical", lineHeight: 1.55 }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
              <button type="button" onClick={saveVisit} style={secondaryButton}>Save Evidence</button>
            </div>
          </div>
        )}
      </div>
    </>
  );

  const renderFindings = () => (
    <>
      {header(
        "Field Inspection",
        "Findings & Closure",
        "Finalize the inspection record and update its status",
        <button type="button" onClick={() => goStep("evidence")} style={secondaryButton}>← Evidence</button>
      )}

      {section(
        "Inspection Closure",
        `${getActivity(selectedVisit)} · Survey ${selectedSurvey}`,
        <div style={{ padding: "20px", display: "grid", gap: "18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: "12px" }}>
            {[
              ["GPS", gpsStatus, gpsStatus === "Captured" ? colors.green : colors.orange],
              ["Photos", photoCount, photoCount > 0 ? colors.green : colors.orange],
              ["Status", visitStatus, statusColor(visitStatus, colors)],
              ["Survey", selectedSurvey || "—", colors.cyan],
            ].map(([label, value, accent]) => (
              <div key={label} style={{ padding: "14px", background: colors.input, border: `1px solid ${colors.border}`, borderRadius: "9px" }}>
                <div style={{ color: colors.muted, fontSize: "10px", fontWeight: "800" }}>{label}</div>
                <div style={{ marginTop: "7px", color: accent, fontSize: "13px", fontWeight: "800" }}>{value}</div>
              </div>
            ))}
          </div>

          <div>
            <div style={{ color: colors.muted, fontSize: "10px", fontWeight: "800", textTransform: "uppercase", marginBottom: "6px" }}>Final Findings</div>
            <div style={{ padding: "15px", minHeight: "120px", borderRadius: "9px", border: `1px solid ${colors.border}`, background: colors.input, color: colors.text, fontSize: "12px", lineHeight: 1.6 }}>
              {findings || "No findings recorded yet."}
            </div>
          </div>

          <div>
            <div style={{ color: colors.muted, fontSize: "10px", fontWeight: "800", textTransform: "uppercase", marginBottom: "6px" }}>Inspection Remarks</div>
            <div style={{ padding: "15px", minHeight: "90px", borderRadius: "9px", border: `1px solid ${colors.border}`, background: colors.input, color: colors.text, fontSize: "12px", lineHeight: 1.6 }}>
              {remarks || "No remarks recorded yet."}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "9px", flexWrap: "wrap" }}>
            <button type="button" onClick={saveVisit} style={secondaryButton}>Save Draft</button>
            <button type="button" onClick={markComplete} style={{ ...primaryButton, background: colors.green }}>Mark Visit Complete</button>
            <button type="button" onClick={() => navigate(`/survey-officers/activity?officer=${encodeURIComponent(selectedOfficer)}`)} style={secondaryButton}>Open Officer Activity</button>
          </div>
        </div>
      )}
    </>
  );

  const renderNewVisit = () => (
    <>
      {header(
        "Field Operations",
        "New Field Visit",
        "Create and prepare a new inspection record",
        <button type="button" onClick={() => goStep("visit-register")} style={secondaryButton}>← Visit Register</button>
      )}

      {section(
        "Create Visit Assignment",
        "Select the parcel, officer, activity and date",
        <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {field(
            "Survey Number",
            <select value={selectedSurvey} onChange={(e) => setSelectedSurvey(e.target.value)} style={inputStyle}>
              {parcels.length
                ? parcels.map((p) => {
                    const no = String(p.surveyNo || p.survey || p.id);
                    return <option key={no} value={no}>{no} — {p.owner || "Land parcel"}</option>;
                  })
                : <option value={selectedSurvey || "115"}>{selectedSurvey || "115"}</option>}
            </select>
          )}

          {field(
            "Survey Officer",
            <select value={selectedOfficer} onChange={(e) => setSelectedOfficer(e.target.value)} style={inputStyle}>
              {surveyOfficers.length
                ? surveyOfficers.map((o) => {
                    const id = o.id || o.officerId || o.code;
                    const name = o.name || o.officerName || o.fullName || id;
                    return <option key={id || name} value={id || name}>{name}</option>;
                  })
                : <option value={selectedOfficer}>{selectedOfficer}</option>}
            </select>
          )}

          {field(
            "Field Activity",
            <select value={activity} onChange={(e) => setActivity(e.target.value)} style={inputStyle}>
              <option>Field verification</option>
              <option>Boundary measurement</option>
              <option>Owner verification</option>
              <option>Land-use classification</option>
              <option>Field photography</option>
              <option>Document collection</option>
            </select>
          )}

          {field(
            "Visit Date",
            <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} style={inputStyle} />
          )}

          {field(
            "Initial Status",
            <select value={visitStatus} onChange={(e) => setVisitStatus(e.target.value)} style={inputStyle}>
              <option>Pending</option>
              <option>In Progress</option>
            </select>
          )}

          <div />

          <div style={{ gridColumn: "1 / -1", padding: "15px", borderRadius: "9px", border: `1px solid ${colors.border}`, background: colors.input }}>
            <div style={{ color: colors.muted, fontSize: "10px", fontWeight: "800" }}>VISIT SUMMARY</div>
            <div style={{ marginTop: "7px", fontSize: "13px", fontWeight: "800" }}>
              {activity} · Survey {selectedSurvey || "—"} · {selectedOfficer || "Unassigned"}
            </div>
            <div style={{ marginTop: "4px", color: colors.muted, fontSize: "11px" }}>
              Scheduled for {visitDate || "date not selected"}
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "9px" }}>
            <button type="button" onClick={() => goStep("visit-register")} style={secondaryButton}>Cancel</button>
            <button type="button" onClick={createVisit} style={primaryButton}>Create Visit Record</button>
          </div>
        </div>
      )}
    </>
  );

  const path = location.pathname.replace(/\/+$/, "");
  let content = renderRegister();

  if (path.endsWith("/visit-details")) content = renderDetails();
  else if (path.endsWith("/evidence")) content = renderEvidence();
  else if (path.endsWith("/findings")) content = renderFindings();
  else if (path.endsWith("/new-visit")) content = renderNewVisit();

  return (
    <div style={{ width: "100%", color: colors.text, fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {content}

      <div style={{ marginTop: "20px", padding: "14px 16px", border: `1px solid ${colors.border}`, borderRadius: "10px", background: colors.cardDark, display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {[
          ["visit-register", "1. Register"],
          ["new-visit", "2. New Visit"],
          ["visit-details", "3. Visit Details"],
          ["evidence", "4. Evidence"],
          ["findings", "5. Findings & Closure"],
        ].map(([step, label]) => {
          const active = path.endsWith(`/${step}`) || (step === "visit-register" && path === "/field-visits");
          return (
            <button
              key={step}
              type="button"
              onClick={() => goStep(step)}
              style={{
                height: "32px",
                padding: "0 11px",
                borderRadius: "7px",
                border: `1px solid ${active ? colors.blue : colors.border}`,
                background: active ? `${colors.blue}18` : "transparent",
                color: active ? colors.blueSoft : colors.muted,
                fontSize: "10px",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {toast && (
        <div style={{ position: "fixed", right: "26px", bottom: "24px", zIndex: 1000, padding: "12px 15px", borderRadius: "9px", background: isDarkMode ? "#16233a" : "#ffffff", border: `1px solid ${colors.green}55`, boxShadow: "0 10px 30px rgba(0,0,0,.18)", color: colors.text, fontSize: "12px", fontWeight: "700" }}>
          ✓ {toast}
        </div>
      )}
    </div>
  );
}

export default FieldVisitLog;
