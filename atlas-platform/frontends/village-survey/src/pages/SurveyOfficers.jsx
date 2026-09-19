import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAtlas } from "../context/AtlasContext";

const normalizeStatus = (status) => {
  const value = String(status || "").toLowerCase();
  if (value.includes("field")) return "Field Visit";
  if (value.includes("inactive") || value.includes("leave")) return "Inactive";
  return "Active";
};

const colorForStatus = (status, colors) => {
  const s = normalizeStatus(status);
  if (s === "Active") return colors.green;
  if (s === "Field Visit") return colors.orange;
  return colors.red;
};

const getOfficerId = (o) => o?.id || o?.officerId || o?.code || "";
const getOfficerName = (o) => o?.name || o?.officerName || o?.fullName || "Survey Officer";

const getOfficerProgress = (o, visits = []) => {
  const assigned = Number(o?.assigned ?? o?.assignedParcels ?? o?.totalAssigned ?? 0) || 0;
  const completed = Number(o?.completed ?? o?.completedSurveys ?? 0) || 0;
  if (typeof o?.progress === "number") return Math.max(0, Math.min(100, o.progress));
  if (assigned > 0) return Math.round((completed / assigned) * 100);
  const id = getOfficerId(o);
  const officerVisits = visits.filter(
    (v) => (v.officerId || v.surveyOfficerId || v.officer) === id || getOfficerName(v) === getOfficerName(o)
  );
  if (!officerVisits.length) return 0;
  const done = officerVisits.filter((v) =>
    String(v.status || "").toLowerCase().includes("complete")
  ).length;
  return Math.round((done / officerVisits.length) * 100);
};

const getAssigned = (o, visits = []) => {
  const value = Number(o?.assigned ?? o?.assignedParcels ?? o?.totalAssigned);
  if (Number.isFinite(value)) return value;
  return visits.filter(
    (v) =>
      (v.officerId || v.surveyOfficerId || v.officer) === getOfficerId(o) ||
      getOfficerName(v) === getOfficerName(o)
  ).length;
};

const getCompleted = (o, visits = []) => {
  const value = Number(o?.completed ?? o?.completedSurveys);
  if (Number.isFinite(value)) return value;
  return visits.filter(
    (v) =>
      ((v.officerId || v.surveyOfficerId || v.officer) === getOfficerId(o) ||
        getOfficerName(v) === getOfficerName(o)) &&
      String(v.status || "").toLowerCase().includes("complete")
  ).length;
};

function SurveyOfficers({ isDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const atlas = useAtlas();

  const {
    surveyOfficers: rawOfficers = [],
    fieldVisits = [],
    parcels = [],
    addActivity,
    addSyncItem,
    addFieldVisit,
    updateSurveyOfficer,
  } = atlas || {};

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

  const officers = useMemo(() => {
    if (rawOfficers.length) return rawOfficers;
    return [
      {
        name: "Ramesh Kumar",
        id: "SO-001",
        role: "Senior Survey Officer",
        assigned: 25,
        completed: 20,
        progress: 80,
        status: "Active",
        phone: "+91 98765 43210",
        lastVisit: "12 Sep 2025",
      },
      {
        name: "Savitri Devi",
        id: "SO-002",
        role: "Survey Officer",
        assigned: 20,
        completed: 12,
        progress: 60,
        status: "Active",
        phone: "+91 98765 12345",
        lastVisit: "11 Sep 2025",
      },
      {
        name: "Iqbal Khan",
        id: "SO-003",
        role: "Survey Officer",
        assigned: 20,
        completed: 10,
        progress: 50,
        status: "Field Visit",
        phone: "+91 98765 67890",
        lastVisit: "12 Sep 2025",
      },
    ];
  }, [rawOfficers]);

  const params = new URLSearchParams(location.search);
  const selectedId = params.get("officer") || getOfficerId(officers[0]);
  const selectedOfficer =
    officers.find((o) => getOfficerId(o) === selectedId) || officers[0];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedParcel, setSelectedParcel] = useState(
    String(parcels[0]?.surveyNo || parcels[0]?.survey || "115")
  );
  const [assignmentActivity, setAssignmentActivity] = useState("Field verification");
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [profile, setProfile] = useState({
    phone: selectedOfficer?.phone || "",
    role: selectedOfficer?.role || "Survey Officer",
    status: normalizeStatus(selectedOfficer?.status),
    notes: selectedOfficer?.notes || "",
  });
  const [toast, setToast] = useState("");

  useEffect(() => {
    setProfile({
      phone: selectedOfficer?.phone || "",
      role: selectedOfficer?.role || "Survey Officer",
      status: normalizeStatus(selectedOfficer?.status),
      notes: selectedOfficer?.notes || "",
    });
  }, [selectedId, selectedOfficer?.phone, selectedOfficer?.role, selectedOfficer?.status, selectedOfficer?.notes]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  const filteredOfficers = officers.filter((o) => {
    const text = `${getOfficerName(o)} ${getOfficerId(o)} ${o.role || ""}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      normalizeStatus(o.status).toLowerCase().replace(/\s/g, "-") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const assignedCount = getAssigned(selectedOfficer, fieldVisits);
  const completedCount = getCompleted(selectedOfficer, fieldVisits);
  const progress = getOfficerProgress(selectedOfficer, fieldVisits);

  const activeCount = officers.filter((o) => normalizeStatus(o.status) !== "Inactive").length;
  const totalAssigned = officers.reduce((sum, o) => sum + getAssigned(o, fieldVisits), 0);
  const totalCompleted = officers.reduce((sum, o) => sum + getCompleted(o, fieldVisits), 0);
  const todayVisits = fieldVisits.filter((v) => {
    const raw = v.date || v.visitDate || v.createdAt || "";
    const d = String(raw).slice(0, 10);
    return d === new Date().toISOString().slice(0, 10);
  }).length;

  const officerVisits = fieldVisits.filter(
    (v) =>
      (v.officerId || v.surveyOfficerId || v.officer) === selectedId ||
      String(getOfficerName(v)).toLowerCase() === String(getOfficerName(selectedOfficer)).toLowerCase()
  );

  const goStep = (step, officerId = selectedId) =>
    navigate(`/survey-officers/${step}?officer=${encodeURIComponent(officerId)}`);

  const selectOfficer = (id, step = "officer-register") => {
    navigate(`/survey-officers/${step}?officer=${encodeURIComponent(id)}`);
  };

  const notify = (message) => setToast(message);

  const persistOfficer = (patch) => {
    if (typeof updateSurveyOfficer === "function") {
      updateSurveyOfficer(selectedId, patch);
    }
  };

  const saveProfile = () => {
    persistOfficer(profile);
    notify(`Profile updated for ${getOfficerName(selectedOfficer)}`);
  };

  const changeStatus = (nextStatus) => {
    setProfile((p) => ({ ...p, status: nextStatus }));
    persistOfficer({ status: nextStatus });
    notify(`Officer status set to ${nextStatus}`);
  };

  const assignVisit = () => {
    const parcel = parcels.find(
      (p) => String(p.surveyNo || p.survey || p.id) === String(selectedParcel)
    );
    const payload = {
      visitId: `VIS-${Date.now().toString().slice(-6)}`,
      date: visitDate,
      visitDate,
      officerId: selectedId,
      surveyOfficerId: selectedId,
      officer: getOfficerName(selectedOfficer),
      survey: selectedParcel,
      surveyNo: selectedParcel,
      activity: assignmentActivity,
      status: "Pending",
      owner: parcel?.owner || "",
      source: "Survey Officers",
    };

    if (typeof addActivity === "function") {
      addActivity({
        type: "field-visit-assignment",
        message: `${assignmentActivity} assigned to ${getOfficerName(selectedOfficer)} for Survey ${selectedParcel}`,
        surveyNo: selectedParcel,
        officerId: selectedId,
        timestamp: new Date().toISOString(),
      });
    }

    if (typeof addFieldVisit === "function") {
      addFieldVisit(payload);
    } else if (typeof addSyncItem === "function") {
      addSyncItem({
        type: "Field Visit Assignment",
        status: "Pending Sync",
        surveyNo: selectedParcel,
        officerId: selectedId,
        createdAt: new Date().toISOString(),
        payload,
      });
    }

    persistOfficer({
      status: "Field Visit",
      assigned: assignedCount + 1,
      totalAssigned: assignedCount + 1,
    });

    notify(`Field visit assigned to ${getOfficerName(selectedOfficer)} · Survey ${selectedParcel}`);
    goStep("activity");
  };

  const exportRegister = () => {
    const rows = filteredOfficers.map((o) => ({
      officerId: getOfficerId(o),
      officer: getOfficerName(o),
      role: o.role || "",
      status: normalizeStatus(o.status),
      assigned: getAssigned(o, fieldVisits),
      completed: getCompleted(o, fieldVisits),
      progress: `${getOfficerProgress(o, fieldVisits)}%`,
    }));
    const csv = [
      Object.keys(rows[0] || {
        officerId: "",
        officer: "",
        role: "",
        status: "",
        assigned: "",
        completed: "",
        progress: "",
      }).join(","),
      ...rows.map((r) =>
        Object.values(r)
          .map((v) => `"${String(v).replaceAll('"', '""')}"`)
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "survey-officer-register.csv";
    a.click();
    URL.revokeObjectURL(url);
    notify("Officer register exported");
  };

  const renderHeader = (eyebrow, title, subtitle, action = null) => (
    <div
      style={{
        marginBottom: "22px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: "20px",
      }}
    >
      <div>
        <div
          style={{
            color: colors.muted,
            fontSize: "12px",
            fontWeight: "700",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "5px",
          }}
        >
          {eyebrow}
        </div>
        <h1
          style={{
            margin: 0,
            color: colors.text,
            fontSize: "30px",
            lineHeight: "1.15",
            fontWeight: "800",
            letterSpacing: "-0.5px",
          }}
        >
          {title}
        </h1>
        <p style={{ margin: "6px 0 0", color: colors.muted, fontSize: "14px" }}>
          {subtitle}
        </p>
      </div>
      {action}
    </div>
  );

  const Stat = ({ label, value, sub, accent }) => (
    <div style={{ ...card, padding: "18px 20px", minHeight: "125px", position: "relative" }}>
      <span
        style={{
          position: "absolute",
          right: "12px",
          top: "12px",
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          background: accent,
        }}
      />
      <div style={{ color: colors.muted, fontSize: "11px", fontWeight: "800" }}>{label}</div>
      <div style={{ color: accent, fontSize: "34px", lineHeight: "1", fontWeight: "800", marginTop: "11px" }}>
        {value}
      </div>
      <div style={{ color: colors.muted, fontSize: "12px", marginTop: "7px" }}>{sub}</div>
    </div>
  );

  const Section = ({ title, subtitle, children, right }) => (
    <section style={{ ...card, overflow: "hidden" }}>
      <div
        style={{
          padding: "18px 20px 15px",
          borderBottom: `1px solid ${colors.border}`,
          display: "flex",
          justifyContent: "space-between",
          gap: "20px",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "19px", fontWeight: "800", color: colors.text }}>{title}</h2>
          {subtitle && (
            <p style={{ margin: "4px 0 0", color: colors.muted, fontSize: "12px" }}>{subtitle}</p>
          )}
        </div>
        {right}
      </div>
      {children}
    </section>
  );

  const Field = ({ label, children }) => (
    <label style={{ display: "block" }}>
      <span
        style={{
          display: "block",
          color: colors.muted,
          fontSize: "10px",
          fontWeight: "800",
          textTransform: "uppercase",
          marginBottom: "6px",
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );

  const inputStyle = {
    width: "100%",
    height: "39px",
    padding: "0 12px",
    borderRadius: "8px",
    border: `1px solid ${colors.border}`,
    background: colors.input,
    color: colors.text,
    outline: "none",
    fontSize: "12px",
    boxSizing: "border-box",
  };

  const selectStyle = { ...inputStyle };

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

  const renderRegister = () => (
    <>
      {renderHeader(
        "Field Operations",
        "Survey Officers",
        "Monitor field assignments, survey progress and officer activity",
        <button type="button" onClick={exportRegister} style={secondaryButton}>Export Register</button>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: "16px", marginBottom: "20px" }}>
        <Stat label="TOTAL OFFICERS" value={officers.length} sub="Assigned to Malhaur" accent={colors.blue} />
        <Stat label="PARCELS ASSIGNED" value={totalAssigned} sub="Across active officers" accent={colors.cyan} />
        <Stat label="SURVEYS COMPLETED" value={totalCompleted} sub="Completed field work" accent={colors.green} />
        <Stat label="FIELD VISITS TODAY" value={todayVisits} sub="Scheduled / logged today" accent={colors.orange} />
      </div>

      <Section
        title="👥 Officer Workload"
        subtitle="Current parcel assignment and completion progress"
        right={
          <button
            type="button"
            onClick={() => goStep("assignment")}
            style={{ border: 0, background: "transparent", color: colors.blueSoft, fontSize: "12px", fontWeight: "800", cursor: "pointer" }}
          >
            New Assignment →
          </button>
        }
      >
        <div style={{ padding: "17px 20px 20px", display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "14px" }}>
          {filteredOfficers.map((officer) => {
            const id = getOfficerId(officer);
            const progressValue = getOfficerProgress(officer, fieldVisits);
            const assigned = getAssigned(officer, fieldVisits);
            const completed = getCompleted(officer, fieldVisits);
            const accent = colorForStatus(officer.status, colors);
            return (
              <div key={id} style={{ padding: "16px", borderRadius: "10px", border: `1px solid ${colors.border}`, background: colors.input }}>
                <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: `${accent}20`, border: `1px solid ${accent}45`, color: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "800" }}>
                    {getOfficerName(officer).split(" ").map((word) => word[0]).join("").slice(0, 3)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: colors.text, fontSize: "13px", fontWeight: "800" }}>{getOfficerName(officer)}</div>
                    <div style={{ color: colors.muted, fontSize: "10px", marginTop: "2px" }}>{id} · {officer.role || "Survey Officer"}</div>
                  </div>
                  <span style={{ marginLeft: "auto", color: accent, fontSize: "10px", fontWeight: "800" }}>● {normalizeStatus(officer.status)}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "18px", marginBottom: "7px" }}>
                  <span style={{ color: colors.muted, fontSize: "10px", fontWeight: "700" }}>SURVEY PROGRESS</span>
                  <span style={{ color: accent, fontSize: "11px", fontWeight: "800" }}>{progressValue}%</span>
                </div>
                <div style={{ height: "8px", background: isDarkMode ? "#33445e" : "#dbe3ed", borderRadius: "20px", overflow: "hidden" }}>
                  <div style={{ width: `${progressValue}%`, height: "100%", background: accent, borderRadius: "20px" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "9px", color: colors.muted, fontSize: "10px" }}>
                  <span>{completed} completed / {assigned} assigned</span>
                  <span>{officer.lastVisit || "No visit logged"}</span>
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                  <button type="button" onClick={() => selectOfficer(id, "profile")} style={{ ...secondaryButton, flex: 1, height: "34px" }}>View Profile</button>
                  <button type="button" onClick={() => selectOfficer(id, "assignment")} style={{ ...primaryButton, flex: 1, height: "34px" }}>Assign</button>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "0 20px 20px", display: "grid", gridTemplateColumns: "minmax(0,1fr) 180px", gap: "9px" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search officer, ID or role..." style={inputStyle} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="field-visit">Field Visit</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </Section>
    </>
  );

  const renderProfile = () => (
    <>
      {renderHeader(
        "Officer Management",
        "Officer Profile",
        `${getOfficerName(selectedOfficer)} · ${selectedId}`,
        <button type="button" onClick={() => goStep("officer-register")} style={secondaryButton}>← Officer Register</button>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, .9fr) minmax(0, 1.1fr)", gap: "20px" }}>
        <Section title="Officer Summary" subtitle="Current posting and workload snapshot">
          <div style={{ padding: "22px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "22px" }}>
              <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: `${colorForStatus(profile.status, colors)}20`, border: `1px solid ${colorForStatus(profile.status, colors)}45`, color: colorForStatus(profile.status, colors), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "19px", fontWeight: "800" }}>
                {getOfficerName(selectedOfficer).split(" ").map((word) => word[0]).join("").slice(0, 3)}
              </div>
              <div>
                <div style={{ fontSize: "19px", fontWeight: "800" }}>{getOfficerName(selectedOfficer)}</div>
                <div style={{ color: colors.muted, fontSize: "11px", marginTop: "3px" }}>{selectedId} · {profile.role}</div>
              </div>
            </div>

            {[
              ["ASSIGNED PARCELS", assignedCount, colors.cyan],
              ["COMPLETED SURVEYS", completedCount, colors.green],
              ["PROGRESS", `${progress}%`, colors.blue],
              ["RECENT VISITS", officerVisits.length, colors.orange],
            ].map(([label, value, accent]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${colors.border}` }}>
                <span style={{ color: colors.muted, fontSize: "10px", fontWeight: "800" }}>{label}</span>
                <span style={{ color: accent, fontSize: "12px", fontWeight: "800" }}>{value}</span>
              </div>
            ))}

            <div style={{ marginTop: "16px" }}>
              <div style={{ color: colors.muted, fontSize: "10px", fontWeight: "800", marginBottom: "7px" }}>STATUS</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["Active", "Field Visit", "Inactive"].map((status) => (
                  <button key={status} type="button" onClick={() => changeStatus(status)} style={{ ...secondaryButton, height: "34px", borderColor: profile.status === status ? colorForStatus(status, colors) : colors.border, color: profile.status === status ? colorForStatus(status, colors) : colors.text }}>
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section title="Edit Officer Details" subtitle="Update the operational profile used by field workflows">
          <div style={{ padding: "20px", display: "grid", gap: "15px" }}>
            <Field label="Officer Name">
              <input value={getOfficerName(selectedOfficer)} readOnly style={inputStyle} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Field label="Role">
                <input value={profile.role} onChange={(e) => setProfile((p) => ({ ...p, role: e.target.value }))} style={inputStyle} />
              </Field>
              <Field label="Phone">
                <input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} style={inputStyle} />
              </Field>
            </div>
            <Field label="Operational Notes">
              <textarea value={profile.notes} onChange={(e) => setProfile((p) => ({ ...p, notes: e.target.value }))} rows={7} style={{ ...inputStyle, height: "auto", minHeight: "150px", padding: "11px 12px", resize: "vertical", lineHeight: 1.5 }} />
            </Field>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
              <button type="button" onClick={() => goStep("activity")} style={secondaryButton}>View Activity →</button>
              <button type="button" onClick={saveProfile} style={primaryButton}>Save Profile</button>
            </div>
          </div>
        </Section>
      </div>
    </>
  );

  const renderAssignment = () => (
    <>
      {renderHeader(
        "Field Operations",
        "Officer Assignment",
        `Create a field-visit assignment for ${getOfficerName(selectedOfficer)}`,
        <button type="button" onClick={() => goStep("officer-register")} style={secondaryButton}>← Officer Register</button>
      )}

      <Section title="📌 Assign Field Activity" subtitle="Allocate a parcel, activity and visit date">
        <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: "20px" }}>
          <div style={{ display: "grid", gap: "15px" }}>
            <div style={{ padding: "15px", borderRadius: "9px", background: colors.input, border: `1px solid ${colors.border}` }}>
              <div style={{ color: colors.muted, fontSize: "10px", fontWeight: "800", marginBottom: "5px" }}>ASSIGNED OFFICER</div>
              <div style={{ fontSize: "15px", fontWeight: "800" }}>{getOfficerName(selectedOfficer)}</div>
              <div style={{ color: colors.muted, fontSize: "11px", marginTop: "3px" }}>{selectedId} · {selectedOfficer?.role || "Survey Officer"}</div>
            </div>

            <Field label="Survey Number">
              <select value={selectedParcel} onChange={(e) => setSelectedParcel(e.target.value)} style={selectStyle}>
                {parcels.length
                  ? parcels.map((p) => {
                      const no = String(p.surveyNo || p.survey || p.id);
                      return <option key={no} value={no}>{no} — {p.owner || "Land parcel"}</option>;
                    })
                  : <option value="115">115 — Ramesh Yadav</option>}
              </select>
            </Field>

            <Field label="Field Activity">
              <select value={assignmentActivity} onChange={(e) => setAssignmentActivity(e.target.value)} style={selectStyle}>
                <option>Field verification</option>
                <option>Boundary measurement</option>
                <option>Owner verification</option>
                <option>Land-use classification</option>
                <option>Field photography</option>
                <option>Document collection</option>
              </select>
            </Field>

            <Field label="Visit Date">
              <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} style={inputStyle} />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "9px" }}>
              <button type="button" onClick={() => goStep("profile")} style={secondaryButton}>Officer Profile</button>
              <button type="button" onClick={assignVisit} style={primaryButton}>Assign Field Visit</button>
            </div>
          </div>

          <div style={{ ...card, background: colors.input, padding: "17px" }}>
            <div style={{ color: colors.muted, fontSize: "10px", fontWeight: "800", marginBottom: "12px" }}>ASSIGNMENT IMPACT</div>
            {[
              ["Current assigned", assignedCount, colors.cyan],
              ["After assignment", assignedCount + 1, colors.blue],
              ["Current completed", completedCount, colors.green],
              ["Estimated progress", `${assignedCount + 1 ? Math.round((completedCount / (assignedCount + 1)) * 100) : 0}%`, colors.orange],
            ].map(([label, value, accent]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: `1px solid ${colors.border}` }}>
                <span style={{ color: colors.muted, fontSize: "10px" }}>{label}</span>
                <span style={{ color: accent, fontWeight: "800", fontSize: "12px" }}>{value}</span>
              </div>
            ))}
            <div style={{ marginTop: "15px", color: colors.muted, fontSize: "11px", lineHeight: 1.6 }}>
              Assignment is added to the frontend activity/sync workflow and changes the officer status to Field Visit.
            </div>
          </div>
        </div>
      </Section>
    </>
  );

  const renderActivity = () => (
    <>
      {renderHeader(
        "Field Operations",
        "Officer Activity",
        `Recent work and field visits for ${getOfficerName(selectedOfficer)}`,
        <button type="button" onClick={() => goStep("assignment")} style={primaryButton}>+ Assign Visit</button>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "16px", marginBottom: "20px" }}>
        <Stat label="ASSIGNED" value={assignedCount} sub="Current workload" accent={colors.cyan} />
        <Stat label="COMPLETED" value={completedCount} sub="Survey tasks completed" accent={colors.green} />
        <Stat label="PROGRESS" value={`${progress}%`} sub="Overall field progress" accent={colors.blue} />
      </div>

      <Section
        title="🕘 Recent Officer Activity"
        subtitle="Latest field operations associated with this officer"
        right={<button type="button" onClick={() => navigate("/field-visits")} style={{ ...secondaryButton, height: "34px" }}>Open Field Visit Log</button>}
      >
        <div style={{ padding: "0 20px 10px" }}>
          {officerVisits.length ? officerVisits.slice(0, 10).map((visit, index) => {
            const status = visit.status || "Pending";
            const accent = String(status).toLowerCase().includes("complete") ? colors.green : String(status).toLowerCase().includes("progress") ? colors.orange : colors.blue;
            const survey = visit.surveyNo || visit.survey || "—";
            return (
              <button
                key={`${visit.visitId || visit.id || "visit"}-${index}`}
                type="button"
                onClick={() => navigate(`/field-visits?visit=${encodeURIComponent(visit.visitId || visit.id || "")}`)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: "13px", padding: "14px 0", border: 0, borderBottom: `1px solid ${colors.border}`, background: "transparent", color: colors.text, textAlign: "left", cursor: "pointer" }}
              >
                <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: accent, flexShrink: 0 }} />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: "block", fontSize: "12px", fontWeight: "800" }}>{visit.activity || "Field visit"}</span>
                  <span style={{ display: "block", color: colors.muted, fontSize: "11px", marginTop: "3px" }}>Survey {survey} · {visit.date || visit.visitDate || "Date not recorded"}</span>
                </span>
                <span style={{ color: accent, fontSize: "10px", fontWeight: "800", flexShrink: 0 }}>{status}</span>
              </button>
            );
          }) : (
            <div style={{ padding: "30px 0", color: colors.muted, textAlign: "center", fontSize: "12px" }}>
              No activity is linked to this officer yet. Create a field assignment to start the workflow.
            </div>
          )}
        </div>
      </Section>
    </>
  );

  const path = location.pathname.replace(/\/+$/, "");

  let content = renderRegister();
  if (path.endsWith("/profile")) content = renderProfile();
  else if (path.endsWith("/assignment")) content = renderAssignment();
  else if (path.endsWith("/activity")) content = renderActivity();

  return (
    <div style={{ width: "100%", color: colors.text, fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {content}

      <div
        style={{
          marginTop: "20px",
          padding: "14px 16px",
          border: `1px solid ${colors.border}`,
          borderRadius: "10px",
          background: colors.cardDark,
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        {[
          ["officer-register", "1. Register"],
          ["profile", "2. Profile"],
          ["assignment", "3. Assignment"],
          ["activity", "4. Activity"],
        ].map(([step, label]) => {
          const active = path.endsWith(`/${step}`) || (step === "officer-register" && path === "/survey-officers");
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
        <div
          style={{
            position: "fixed",
            right: "26px",
            bottom: "24px",
            zIndex: 1000,
            padding: "12px 15px",
            borderRadius: "9px",
            background: isDarkMode ? "#16233a" : "#ffffff",
            border: `1px solid ${colors.green}55`,
            boxShadow: "0 10px 30px rgba(0,0,0,.18)",
            color: colors.text,
            fontSize: "12px",
            fontWeight: "700",
          }}
        >
          ✓ {toast}
        </div>
      )}
    </div>
  );
}

export default SurveyOfficers;
