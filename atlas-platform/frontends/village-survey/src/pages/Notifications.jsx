import React, { useEffect, useMemo, useState } from "react";
import { useAtlas } from "../context/AtlasContext";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

const STEPS = [
  {
    key: "objections",
    title: "Public Objections",
    subtitle: "Review and act on landowner objections",
    icon: "📝",
  },
  {
    key: "statutory-alerts",
    title: "Statutory Alerts",
    subtitle: "Track deadlines and mandatory actions",
    icon: "⚠️",
  },
  {
    key: "gram-sabha",
    title: "Gram Sabha",
    subtitle: "Manage meeting and notice records",
    icon: "🏛️",
  },
  {
    key: "notice-register",
    title: "Notice Register",
    subtitle: "Prepare and track issued notices",
    icon: "📄",
  },
];

function Notifications({ isDarkMode }) {
  const {
    objections = [],
    statutoryAlerts = [],
    gramSabha = {},
    updateObjection,
    updateGramSabha,
    addObjection,
    addActivity,
    addSyncItem,
  } = useAtlas();

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const colors = {
    card: isDarkMode ? "#1e2a3f" : "#ffffff",
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

  const routeStep = location.pathname.startsWith("/notifications/")
    ? location.pathname.split("/").pop()
    : null;

  const selectedObjectionId = searchParams.get("objection") || null;

  const normalizedObjections = useMemo(
    () =>
      (objections || []).map((item, index) => {
        if (Array.isArray(item)) {
          return {
            id: `OBJ-${index + 1}`,
            date: item[0] ?? "—",
            objector: item[1] ?? "—",
            survey: String(item[2] ?? "—"),
            nature: item[3] ?? "General objection",
            status: item[4] ?? "Pending",
            remarks: item[5] ?? "",
          };
        }

        return {
          ...item,
          id: item?.id ?? `OBJ-${index + 1}`,
          date: item?.date ?? item?.receivedDate ?? "—",
          objector: item?.objector ?? item?.name ?? item?.landowner ?? "—",
          survey: String(item?.survey ?? item?.surveyNo ?? item?.parcelNo ?? "—"),
          nature: item?.nature ?? item?.type ?? item?.reason ?? "General objection",
          status: item?.status ?? "Pending",
          remarks: item?.remarks ?? item?.description ?? "",
        };
      }),
    [objections]
  );

  const selectedObjection =
    normalizedObjections.find((item) => item.id === selectedObjectionId) ||
    normalizedObjections[0] ||
    null;

  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [remarks, setRemarks] = useState("");
  const [newObjection, setNewObjection] = useState({
    objector: "",
    survey: "",
    nature: "Boundary dispute",
    remarks: "",
  });

  const [meeting, setMeeting] = useState({
    date: gramSabha?.date ?? gramSabha?.meetingDate ?? "",
    venue: gramSabha?.venue ?? "",
    status: gramSabha?.status ?? "Scheduled",
    agenda: gramSabha?.agenda ?? "",
  });

  useEffect(() => {
    setRemarks(selectedObjection?.remarks ?? "");
  }, [selectedObjection?.id]);

  useEffect(() => {
    setMeeting({
      date: gramSabha?.date ?? gramSabha?.meetingDate ?? "",
      venue: gramSabha?.venue ?? "",
      status: gramSabha?.status ?? "Scheduled",
      agenda: gramSabha?.agenda ?? "",
    });
  }, [gramSabha?.date, gramSabha?.meetingDate, gramSabha?.venue, gramSabha?.status, gramSabha?.agenda]);

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => setToast(""), 2400);
  };

  const statusColor = (status) => {
    if (status === "Resolved" || status === "Forwarded") return colors.green;
    if (status === "Pending" || status === "Under Review") return colors.orange;
    if (status === "Rejected" || status === "Escalated") return colors.red;
    return colors.muted;
  };

  const visibleObjections = useMemo(() => {
    const q = query.trim().toLowerCase();

    return normalizedObjections.filter((item) => {
      const matchesQuery =
        !q ||
        `${item.objector} ${item.survey} ${item.nature} ${item.status}`
          .toLowerCase()
          .includes(q);

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [normalizedObjections, query, statusFilter]);

  const counts = useMemo(
    () => ({
      total: normalizedObjections.length,
      pending: normalizedObjections.filter(
        (item) => item.status === "Pending"
      ).length,
      review: normalizedObjections.filter(
        (item) => item.status === "Under Review"
      ).length,
      resolved: normalizedObjections.filter(
        (item) => item.status === "Resolved"
      ).length,
    }),
    [normalizedObjections]
  );

  const goToStep = (step) => {
    navigate(
      `/notifications/${step}?objection=${encodeURIComponent(
        selectedObjection?.id || ""
      )}`
    );
  };

  const goOverview = () => {
    navigate(
      `/notifications?objection=${encodeURIComponent(
        selectedObjection?.id || ""
      )}`
    );
  };

  const selectObjection = (id) => {
    setSearchParams({ objection: id });
  };

  const saveObjectionRemarks = () => {
    if (!selectedObjection) return;

    updateObjection?.(selectedObjection.id, {
      remarks,
      lastAction: "Remarks updated",
      updatedAt: new Date().toLocaleString(),
    });

    addActivity?.({
      id: `OBJ-NOTE-${Date.now()}`,
      type: "Notification",
      action: "Objection remarks updated",
      surveyNo: selectedObjection.survey,
      timestamp: new Date().toLocaleString(),
    });

    showToast(`Remarks saved for ${selectedObjection.id}`);
  };

  const changeObjectionStatus = (nextStatus) => {
    if (!selectedObjection) return;

    updateObjection?.(selectedObjection.id, {
      status: nextStatus,
      remarks,
      lastAction: nextStatus,
      updatedAt: new Date().toLocaleString(),
    });

    addActivity?.({
      id: `OBJ-STATUS-${Date.now()}`,
      type: "Notification",
      action: `Objection marked ${nextStatus}`,
      surveyNo: selectedObjection.survey,
      timestamp: new Date().toLocaleString(),
    });

    addSyncItem?.({
      id: `OBJ-SYNC-${Date.now()}`,
      type: "Objection Update",
      reference: `Survey ${selectedObjection.survey}`,
      size: "0.9 KB",
      status: "Pending",
    });

    showToast(`${selectedObjection.id} moved to ${nextStatus}`);
  };

  const submitNewObjection = () => {
    if (!newObjection.objector || !newObjection.survey) {
      showToast("Enter objector and survey number");
      return;
    }

    const id = `OBJ-${Date.now()}`;

    addObjection?.({
      id,
      date: new Date().toLocaleDateString("en-GB"),
      objector: newObjection.objector,
      survey: String(newObjection.survey),
      nature: newObjection.nature,
      status: "Pending",
      remarks: newObjection.remarks,
    });

    addActivity?.({
      id: `OBJ-NEW-${Date.now()}`,
      type: "Notification",
      action: "New public objection registered",
      surveyNo: String(newObjection.survey),
      timestamp: new Date().toLocaleString(),
    });

    addSyncItem?.({
      id: `OBJ-NEW-SYNC-${Date.now()}`,
      type: "Public Objection",
      reference: `Survey ${newObjection.survey}`,
      size: "1.0 KB",
      status: "Pending",
    });

    setNewObjection({
      objector: "",
      survey: "",
      nature: "Boundary dispute",
      remarks: "",
    });

    setSearchParams({ objection: id });
    showToast(`${id} registered successfully`);
  };

  const saveGramSabha = () => {
    updateGramSabha?.(meeting);

    addActivity?.({
      id: `GS-${Date.now()}`,
      type: "Gram Sabha",
      action: "Gram Sabha record updated",
      timestamp: new Date().toLocaleString(),
    });

    showToast("Gram Sabha details saved");
  };

  const markAlertActioned = (alert) => {
    addActivity?.({
      id: `ALERT-${Date.now()}`,
      type: "Statutory Alert",
      action: `Action recorded for ${alert?.title ?? "alert"}`,
      timestamp: new Date().toLocaleString(),
    });

    addSyncItem?.({
      id: `ALERT-SYNC-${Date.now()}`,
      type: "Statutory Alert Update",
      reference: alert?.title ?? "Statutory alert",
      size: "0.6 KB",
      status: "Pending",
    });

    showToast("Alert action recorded");
  };

  const exportObjections = () => {
    const rows = [
      ["ID", "Date", "Objector", "Survey No.", "Nature", "Status", "Remarks"],
      ...normalizedObjections.map((item) => [
        item.id,
        item.date,
        item.objector,
        item.survey,
        item.nature,
        item.status,
        item.remarks || "",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "public-objections-register.csv";
    link.click();
    URL.revokeObjectURL(url);

    showToast("Objection register exported");
  };

  const navigateToDispute = () => {
    if (!selectedObjection) return;

    navigate(
      `/disputes?survey=${encodeURIComponent(selectedObjection.survey)}`
    );
  };

  const nextStep =
    routeStep === "objections"
      ? "statutory-alerts"
      : routeStep === "statutory-alerts"
      ? "gram-sabha"
      : routeStep === "gram-sabha"
      ? "notice-register"
      : null;

  const previousStep =
    routeStep === "statutory-alerts"
      ? "objections"
      : routeStep === "gram-sabha"
      ? "statutory-alerts"
      : routeStep === "notice-register"
      ? "gram-sabha"
      : null;

  const allAlerts = Array.isArray(statutoryAlerts)
    ? statutoryAlerts
    : statutoryAlerts?.alerts || [];

  return (
    <div
      style={{
        width: "100%",
        color: colors.text,
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {toast && (
        <div
          style={{
            position: "fixed",
            right: "24px",
            bottom: "24px",
            zIndex: 1300,
            padding: "11px 15px",
            borderRadius: "8px",
            background: colors.text,
            color: colors.card,
            fontSize: "12px",
            fontWeight: "700",
            boxShadow: "0 8px 25px rgba(0,0,0,.2)",
          }}
        >
          {toast}
        </div>
      )}

      {/* HEADER */}
      <div
        style={{
          marginBottom: "18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "18px",
          flexWrap: "wrap",
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
            Notifications & Compliance
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "30px",
              lineHeight: "1.15",
              fontWeight: "800",
              letterSpacing: "-0.5px",
            }}
          >
            Notifications & Objections
          </h1>

          <p style={{ margin: "6px 0 0", color: colors.muted, fontSize: "14px" }}>
            Manage public objections, statutory alerts and village notices
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              padding: "7px 10px",
              borderRadius: "7px",
              background: `${colors.orange}18`,
              border: `1px solid ${colors.orange}35`,
              color: colors.orange,
              fontSize: "10px",
              fontWeight: "800",
            }}
          >
            {counts.pending} PENDING
          </span>

          <span
            style={{
              padding: "7px 10px",
              borderRadius: "7px",
              background: `${colors.green}18`,
              border: `1px solid ${colors.green}35`,
              color: colors.green,
              fontSize: "10px",
              fontWeight: "800",
            }}
          >
            {counts.resolved} RESOLVED
          </span>
        </div>
      </div>

      {/* SUBDIVISIONS */}
      <section style={{ ...card, padding: "12px", marginBottom: "20px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "8px",
          }}
        >
          {STEPS.map((step, index) => {
            const active = routeStep === step.key;

            return (
              <button
                key={step.key}
                type="button"
                onClick={() => goToStep(step.key)}
                style={{
                  minHeight: "68px",
                  textAlign: "left",
                  padding: "11px 12px",
                  borderRadius: "9px",
                  border: `1px solid ${active ? colors.blue : colors.border}`,
                  background: active ? `${colors.blue}18` : colors.input,
                  color: colors.text,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", gap: "9px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "17px" }}>{step.icon}</span>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: "800" }}>
                      {index + 1}. {step.title}
                    </div>
                    <div
                      style={{
                        marginTop: "3px",
                        color: colors.muted,
                        fontSize: "9px",
                        lineHeight: 1.35,
                      }}
                    >
                      {step.subtitle}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* OVERVIEW */}
      {!routeStep && (
        <>
          <section style={{ ...card, padding: "20px", marginBottom: "20px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: "10px",
              }}
            >
              {[
                ["TOTAL OBJECTIONS", counts.total, "Registered in village", colors.cyan],
                ["PENDING", counts.pending, "Awaiting action", colors.orange],
                ["UNDER REVIEW", counts.review, "Active review", colors.blue],
                ["RESOLVED", counts.resolved, "Closed matters", colors.green],
              ].map(([label, value, sub, accent]) => (
                <div
                  key={label}
                  style={{
                    padding: "14px",
                    borderRadius: "9px",
                    background: colors.input,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div style={{ color: colors.muted, fontSize: "9px", fontWeight: "800", textTransform: "uppercase" }}>
                    {label}
                  </div>
                  <div style={{ marginTop: "7px", color: accent, fontSize: "24px", fontWeight: "800" }}>
                    {value}
                  </div>
                  <div style={{ marginTop: "2px", color: colors.muted, fontSize: "10px" }}>
                    {sub}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "16px",
            }}
          >
            {STEPS.map((step) => (
              <button
                key={step.key}
                type="button"
                onClick={() => goToStep(step.key)}
                style={{
                  ...card,
                  padding: "20px",
                  textAlign: "left",
                  cursor: "pointer",
                  color: colors.text,
                }}
              >
                <div style={{ display: "flex", gap: "13px", alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "9px",
                      background: `${colors.blue}18`,
                      border: `1px solid ${colors.blue}35`,
                      display: "grid",
                      placeItems: "center",
                      fontSize: "20px",
                    }}
                  >
                    {step.icon}
                  </div>

                  <div>
                    <div style={{ fontSize: "16px", fontWeight: "800" }}>{step.title}</div>
                    <div style={{ marginTop: "5px", color: colors.muted, fontSize: "11px", lineHeight: 1.45 }}>
                      {step.subtitle}
                    </div>
                    <div style={{ marginTop: "10px", color: colors.blueSoft, fontSize: "10px", fontWeight: "800" }}>
                      Open section →
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </section>
        </>
      )}

      {/* OBJECTIONS */}
      {routeStep === "objections" && (
        <section style={{ ...card, padding: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>
                📝 Public Objections
              </h2>
              <p style={{ margin: "5px 0 0", color: colors.muted, fontSize: "12px" }}>
                Review objections submitted by affected landowners.
              </p>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={exportObjections}
                style={{
                  padding: "8px 12px",
                  borderRadius: "7px",
                  border: `1px solid ${colors.border}`,
                  background: colors.input,
                  color: colors.text,
                  fontSize: "10px",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                Export Register
              </button>

              <button
                type="button"
                onClick={() => showToast("New objection form opened below")}
                style={{
                  padding: "8px 12px",
                  borderRadius: "7px",
                  border: 0,
                  background: colors.blue,
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                + New Objection
              </button>
            </div>
          </div>

          <div
            style={{
              marginTop: "15px",
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 160px",
              gap: "8px",
            }}
          >
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search objector, survey no., nature or status..."
              style={{
                height: "38px",
                boxSizing: "border-box",
                padding: "0 12px",
                borderRadius: "8px",
                border: `1px solid ${colors.border}`,
                background: colors.input,
                color: colors.text,
                outline: "none",
                fontSize: "11px",
              }}
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              style={{
                height: "38px",
                padding: "0 10px",
                borderRadius: "8px",
                border: `1px solid ${colors.border}`,
                background: colors.input,
                color: colors.text,
                outline: "none",
                fontSize: "11px",
              }}
            >
              <option>All</option>
              <option>Pending</option>
              <option>Under Review</option>
              <option>Forwarded</option>
              <option>Resolved</option>
              <option>Escalated</option>
            </select>
          </div>

          <div style={{ overflowX: "auto", marginTop: "15px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
              <thead>
                <tr>
                  {["Date", "Objector", "Survey No.", "Nature", "Status", "Action"].map(
                    (heading) => (
                      <th
                        key={heading}
                        style={{
                          textAlign: "left",
                          color: colors.muted,
                          fontSize: "10px",
                          fontWeight: "800",
                          textTransform: "uppercase",
                          padding: "0 10px 10px 0",
                          borderBottom: `1px solid ${colors.border}`,
                        }}
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {visibleObjections.length ? (
                  visibleObjections.map((item) => (
                    <tr key={item.id}>
                      <td style={{ padding: "12px 10px 12px 0", color: colors.muted, fontSize: "11px", borderBottom: `1px solid ${colors.border}` }}>
                        {item.date}
                      </td>
                      <td style={{ padding: "12px 10px 12px 0", color: colors.text, fontWeight: "700", fontSize: "12px", borderBottom: `1px solid ${colors.border}` }}>
                        {item.objector}
                      </td>
                      <td style={{ padding: "12px 10px 12px 0", color: colors.cyan, fontWeight: "800", fontSize: "12px", borderBottom: `1px solid ${colors.border}` }}>
                        {item.survey}
                      </td>
                      <td style={{ padding: "12px 10px 12px 0", color: colors.muted, fontSize: "11px", borderBottom: `1px solid ${colors.border}` }}>
                        {item.nature}
                      </td>
                      <td style={{ padding: "12px 10px 12px 0", borderBottom: `1px solid ${colors.border}` }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "5px 8px",
                            borderRadius: "5px",
                            background: `${statusColor(item.status)}18`,
                            border: `1px solid ${statusColor(item.status)}30`,
                            color: statusColor(item.status),
                            fontSize: "10px",
                            fontWeight: "800",
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 0", borderBottom: `1px solid ${colors.border}` }}>
                        <button
                          type="button"
                          onClick={() => selectObjection(item.id)}
                          style={{
                            border: 0,
                            background: "transparent",
                            color: colors.blueSoft,
                            fontSize: "11px",
                            fontWeight: "800",
                            cursor: "pointer",
                          }}
                        >
                          Open →
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ padding: "24px", textAlign: "center", color: colors.muted, fontSize: "11px" }}>
                      No objections match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {selectedObjection && (
            <div
              style={{
                marginTop: "18px",
                padding: "16px",
                borderRadius: "9px",
                background: colors.input,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ color: colors.cyan, fontSize: "10px", fontWeight: "800" }}>
                    SELECTED OBJECTION
                  </div>
                  <div style={{ marginTop: "5px", fontSize: "16px", fontWeight: "800" }}>
                    {selectedObjection.id} · Survey {selectedObjection.survey}
                  </div>
                  <div style={{ marginTop: "3px", color: colors.muted, fontSize: "11px" }}>
                    {selectedObjection.objector} · {selectedObjection.nature}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => changeObjectionStatus("Under Review")}
                    style={{
                      padding: "8px 11px",
                      borderRadius: "7px",
                      border: `1px solid ${colors.orange}`,
                      background: "transparent",
                      color: colors.orange,
                      fontSize: "10px",
                      fontWeight: "800",
                      cursor: "pointer",
                    }}
                  >
                    Under Review
                  </button>

                  <button
                    type="button"
                    onClick={() => changeObjectionStatus("Resolved")}
                    style={{
                      padding: "8px 11px",
                      borderRadius: "7px",
                      border: 0,
                      background: colors.green,
                      color: "#fff",
                      fontSize: "10px",
                      fontWeight: "800",
                      cursor: "pointer",
                    }}
                  >
                    Mark Resolved
                  </button>

                  <button
                    type="button"
                    onClick={navigateToDispute}
                    style={{
                      padding: "8px 11px",
                      borderRadius: "7px",
                      border: `1px solid ${colors.red}`,
                      background: "transparent",
                      color: colors.red,
                      fontSize: "10px",
                      fontWeight: "800",
                      cursor: "pointer",
                    }}
                  >
                    Open Dispute
                  </button>
                </div>
              </div>

              <label style={{ display: "block", marginTop: "13px", color: colors.muted, fontSize: "10px", fontWeight: "800", textTransform: "uppercase", marginBottom: "6px" }}>
                Case Remarks
              </label>

              <textarea
                rows="5"
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                placeholder="Record action taken, hearing notes, supporting documents or follow-up..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  resize: "vertical",
                  padding: "11px",
                  borderRadius: "8px",
                  border: `1px solid ${colors.border}`,
                  background: colors.card,
                  color: colors.text,
                  outline: "none",
                  fontSize: "12px",
                  lineHeight: 1.5,
                  fontFamily: "inherit",
                }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={saveObjectionRemarks}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "7px",
                    border: `1px solid ${colors.border}`,
                    background: colors.card,
                    color: colors.text,
                    fontSize: "10px",
                    fontWeight: "800",
                    cursor: "pointer",
                  }}
                >
                  Save Remarks
                </button>
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: "16px",
              padding: "15px",
              borderRadius: "9px",
              border: `1px dashed ${colors.blue}60`,
              background: `${colors.blue}08`,
            }}
          >
            <div style={{ color: colors.text, fontSize: "12px", fontWeight: "800" }}>
              Register a New Objection
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 140px 1fr",
                gap: "8px",
                marginTop: "9px",
              }}
            >
              <input
                value={newObjection.objector}
                onChange={(event) =>
                  setNewObjection((current) => ({
                    ...current,
                    objector: event.target.value,
                  }))
                }
                placeholder="Objector name"
                style={{
                  height: "38px",
                  padding: "0 10px",
                  borderRadius: "7px",
                  border: `1px solid ${colors.border}`,
                  background: colors.card,
                  color: colors.text,
                  outline: "none",
                  fontSize: "11px",
                }}
              />

              <input
                value={newObjection.survey}
                onChange={(event) =>
                  setNewObjection((current) => ({
                    ...current,
                    survey: event.target.value,
                  }))
                }
                placeholder="Survey No."
                style={{
                  height: "38px",
                  padding: "0 10px",
                  borderRadius: "7px",
                  border: `1px solid ${colors.border}`,
                  background: colors.card,
                  color: colors.text,
                  outline: "none",
                  fontSize: "11px",
                }}
              />

              <select
                value={newObjection.nature}
                onChange={(event) =>
                  setNewObjection((current) => ({
                    ...current,
                    nature: event.target.value,
                  }))
                }
                style={{
                  height: "38px",
                  padding: "0 10px",
                  borderRadius: "7px",
                  border: `1px solid ${colors.border}`,
                  background: colors.card,
                  color: colors.text,
                  outline: "none",
                  fontSize: "11px",
                }}
              >
                <option>Boundary dispute</option>
                <option>Wrong ownership</option>
                <option>Compensation concern</option>
                <option>Document issue</option>
                <option>Other</option>
              </select>
            </div>

            <textarea
              rows="3"
              value={newObjection.remarks}
              onChange={(event) =>
                setNewObjection((current) => ({
                  ...current,
                  remarks: event.target.value,
                }))
              }
              placeholder="Initial objection remarks..."
              style={{
                width: "100%",
                marginTop: "8px",
                boxSizing: "border-box",
                resize: "vertical",
                padding: "10px",
                borderRadius: "7px",
                border: `1px solid ${colors.border}`,
                background: colors.card,
                color: colors.text,
                outline: "none",
                fontSize: "11px",
                fontFamily: "inherit",
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
              <button
                type="button"
                onClick={submitNewObjection}
                style={{
                  padding: "9px 14px",
                  borderRadius: "7px",
                  border: 0,
                  background: colors.blue,
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                Register Objection
              </button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "18px" }}>
            <button
              type="button"
              onClick={() => goToStep("statutory-alerts")}
              style={{
                padding: "9px 14px",
                borderRadius: "7px",
                border: 0,
                background: colors.blue,
                color: "#fff",
                fontSize: "10px",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              Next: Statutory Alerts →
            </button>
          </div>
        </section>
      )}

      {/* STATUTORY ALERTS */}
      {routeStep === "statutory-alerts" && (
        <section style={{ ...card, padding: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>
            ⚠️ Statutory Alerts
          </h2>
          <p style={{ margin: "5px 0 0", color: colors.muted, fontSize: "12px" }}>
            Track deadlines, notices and mandatory village-level actions.
          </p>

          <div style={{ display: "grid", gap: "9px", marginTop: "16px" }}>
            {allAlerts.length ? (
              allAlerts.map((alert, index) => (
                <div
                  key={alert?.id ?? `${alert?.title}-${index}`}
                  style={{
                    padding: "13px",
                    borderRadius: "9px",
                    border: `1px solid ${colors.border}`,
                    background: colors.input,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <div style={{ color: colors.text, fontSize: "12px", fontWeight: "800" }}>
                        {alert?.title ?? alert?.name ?? "Statutory Alert"}
                      </div>
                      <div style={{ marginTop: "4px", color: colors.muted, fontSize: "10px", lineHeight: 1.45 }}>
                        {alert?.description ?? alert?.message ?? "Action required at village level."}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => markAlertActioned(alert)}
                      style={{
                        padding: "7px 10px",
                        borderRadius: "7px",
                        border: `1px solid ${colors.orange}`,
                        background: "transparent",
                        color: colors.orange,
                        fontSize: "10px",
                        fontWeight: "800",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Record Action
                    </button>
                  </div>

                  <div style={{ marginTop: "8px", color: colors.orange, fontSize: "10px", fontWeight: "800" }}>
                    Due: {alert?.date ?? alert?.dueDate ?? alert?.deadline ?? "—"}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: "28px", textAlign: "center", color: colors.muted, fontSize: "11px", border: `1px dashed ${colors.border}`, borderRadius: "9px" }}>
                No statutory alerts currently recorded.
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "18px", gap: "8px" }}>
            <button
              type="button"
              onClick={() => goToStep(previousStep)}
              style={{
                padding: "9px 14px",
                borderRadius: "7px",
                border: `1px solid ${colors.border}`,
                background: colors.input,
                color: colors.text,
                fontSize: "10px",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              ← Previous
            </button>

            <button
              type="button"
              onClick={() => goToStep(nextStep)}
              style={{
                padding: "9px 14px",
                borderRadius: "7px",
                border: 0,
                background: colors.blue,
                color: "#fff",
                fontSize: "10px",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              Next: Gram Sabha →
            </button>
          </div>
        </section>
      )}

      {/* GRAM SABHA */}
      {routeStep === "gram-sabha" && (
        <section style={{ ...card, padding: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>
            🏛️ Gram Sabha
          </h2>
          <p style={{ margin: "5px 0 0", color: colors.muted, fontSize: "12px" }}>
            Maintain the meeting schedule, venue and agenda for the village.
          </p>

          <div
            style={{
              marginTop: "18px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            {[
              ["Meeting Date", "date", "date"],
              ["Venue", "venue", "text"],
            ].map(([label, key, type]) => (
              <div key={key}>
                <label style={{ display: "block", color: colors.muted, fontSize: "10px", fontWeight: "800", textTransform: "uppercase", marginBottom: "6px" }}>
                  {label}
                </label>
                <input
                  type={type}
                  value={meeting[key]}
                  onChange={(event) =>
                    setMeeting((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    height: "38px",
                    boxSizing: "border-box",
                    padding: "0 10px",
                    borderRadius: "7px",
                    border: `1px solid ${colors.border}`,
                    background: colors.input,
                    color: colors.text,
                    outline: "none",
                    fontSize: "11px",
                  }}
                />
              </div>
            ))}

            <div>
              <label style={{ display: "block", color: colors.muted, fontSize: "10px", fontWeight: "800", textTransform: "uppercase", marginBottom: "6px" }}>
                Status
              </label>
              <select
                value={meeting.status}
                onChange={(event) =>
                  setMeeting((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
                style={{
                  width: "100%",
                  height: "38px",
                  padding: "0 10px",
                  borderRadius: "7px",
                  border: `1px solid ${colors.border}`,
                  background: colors.input,
                  color: colors.text,
                  outline: "none",
                  fontSize: "11px",
                }}
              >
                <option>Scheduled</option>
                <option>Completed</option>
                <option>Postponed</option>
                <option>Cancelled</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", color: colors.muted, fontSize: "10px", fontWeight: "800", textTransform: "uppercase", marginBottom: "6px" }}>
                Agenda
              </label>
              <input
                value={meeting.agenda}
                onChange={(event) =>
                  setMeeting((current) => ({
                    ...current,
                    agenda: event.target.value,
                  }))
                }
                placeholder="Primary acquisition agenda"
                style={{
                  width: "100%",
                  height: "38px",
                  boxSizing: "border-box",
                  padding: "0 10px",
                  borderRadius: "7px",
                  border: `1px solid ${colors.border}`,
                  background: colors.input,
                  color: colors.text,
                  outline: "none",
                  fontSize: "11px",
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: "15px", display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={saveGramSabha}
              style={{
                padding: "9px 14px",
                borderRadius: "7px",
                border: 0,
                background: colors.blue,
                color: "#fff",
                fontSize: "10px",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              Save Gram Sabha Record
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "18px" }}>
            <button
              type="button"
              onClick={() => goToStep(previousStep)}
              style={{
                padding: "9px 14px",
                borderRadius: "7px",
                border: `1px solid ${colors.border}`,
                background: colors.input,
                color: colors.text,
                fontSize: "10px",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              ← Previous
            </button>

            <button
              type="button"
              onClick={() => goToStep(nextStep)}
              style={{
                padding: "9px 14px",
                borderRadius: "7px",
                border: 0,
                background: colors.blue,
                color: "#fff",
                fontSize: "10px",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              Next: Notice Register →
            </button>
          </div>
        </section>
      )}

      {/* NOTICE REGISTER */}
      {routeStep === "notice-register" && (
        <section style={{ ...card, padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>
                📄 Notice Register
              </h2>
              <p style={{ margin: "5px 0 0", color: colors.muted, fontSize: "12px" }}>
                Prepare a notice action against the selected objection.
              </p>
            </div>

            {selectedObjection && (
              <span
                style={{
                  padding: "7px 10px",
                  borderRadius: "7px",
                  background: `${statusColor(selectedObjection.status)}18`,
                  border: `1px solid ${statusColor(selectedObjection.status)}35`,
                  color: statusColor(selectedObjection.status),
                  fontSize: "10px",
                  fontWeight: "800",
                }}
              >
                Survey {selectedObjection.survey} · {selectedObjection.status}
              </span>
            )}
          </div>

          <div
            style={{
              marginTop: "17px",
              padding: "15px",
              borderRadius: "9px",
              border: `1px solid ${colors.border}`,
              background: colors.input,
            }}
          >
            <div style={{ color: colors.text, fontSize: "12px", fontWeight: "800" }}>
              Notice preparation
            </div>

            <div style={{ color: colors.muted, fontSize: "10px", marginTop: "4px", lineHeight: 1.45 }}>
              Use the selected objection as the working reference, record the notice action,
              and queue it for synchronization.
            </div>

            <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <div style={{ color: colors.muted, fontSize: "9px", fontWeight: "800", textTransform: "uppercase" }}>Recipient</div>
                <div style={{ marginTop: "4px", color: colors.text, fontSize: "12px", fontWeight: "700" }}>
                  {selectedObjection?.objector || "No objection selected"}
                </div>
              </div>

              <div>
                <div style={{ color: colors.muted, fontSize: "9px", fontWeight: "800", textTransform: "uppercase" }}>Survey</div>
                <div style={{ marginTop: "4px", color: colors.cyan, fontSize: "12px", fontWeight: "800" }}>
                  {selectedObjection?.survey || "—"}
                </div>
              </div>
            </div>

            <textarea
              rows="6"
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Enter notice wording / service remarks..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                marginTop: "13px",
                padding: "11px",
                borderRadius: "8px",
                border: `1px solid ${colors.border}`,
                background: colors.card,
                color: colors.text,
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
                fontSize: "11px",
                lineHeight: 1.5,
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "9px" }}>
              <button
                type="button"
                onClick={saveObjectionRemarks}
                style={{
                  padding: "9px 13px",
                  borderRadius: "7px",
                  border: `1px solid ${colors.border}`,
                  background: colors.card,
                  color: colors.text,
                  fontSize: "10px",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                Save Notice Draft
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!selectedObjection) {
                    showToast("Select an objection first");
                    return;
                  }

                  updateObjection?.(selectedObjection.id, {
                    status: "Forwarded",
                    remarks,
                    noticeIssued: true,
                    noticeIssuedAt: new Date().toLocaleString(),
                  });

                  addSyncItem?.({
                    id: `NOTICE-${Date.now()}`,
                    type: "Notice Issued",
                    reference: `Survey ${selectedObjection.survey}`,
                    size: "1.2 KB",
                    status: "Pending",
                  });

                  addActivity?.({
                    id: `NOTICE-ACT-${Date.now()}`,
                    type: "Notification",
                    action: "Notice issued",
                    surveyNo: selectedObjection.survey,
                    timestamp: new Date().toLocaleString(),
                  });

                  showToast(`Notice issued for Survey ${selectedObjection.survey}`);
                }}
                style={{
                  padding: "9px 13px",
                  borderRadius: "7px",
                  border: 0,
                  background: colors.green,
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                Issue Notice
              </button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "18px" }}>
            <button
              type="button"
              onClick={() => goToStep(previousStep)}
              style={{
                padding: "9px 14px",
                borderRadius: "7px",
                border: `1px solid ${colors.border}`,
                background: colors.input,
                color: colors.text,
                fontSize: "10px",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              ← Previous
            </button>

            <button
              type="button"
              onClick={goOverview}
              style={{
                padding: "9px 14px",
                borderRadius: "7px",
                border: 0,
                background: colors.blue,
                color: "#fff",
                fontSize: "10px",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              Finish Notifications Workflow
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default Notifications;
