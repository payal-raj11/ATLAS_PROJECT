import React, { useMemo, useState } from "react";
import { useAtlas } from "../context/AtlasContext";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

const STEPS = [
  {
    key: "case-list",
    title: "Dispute Register",
    subtitle: "Review active and resolved dispute cases",
    icon: "⚖️",
  },
  {
    key: "case-details",
    title: "Case Details",
    subtitle: "Review the selected dispute record",
    icon: "📋",
  },
  {
    key: "escalation",
    title: "Escalation",
    subtitle: "Record authority, priority and escalation action",
    icon: "🚨",
  },
  {
    key: "timeline",
    title: "Escalation Timeline",
    subtitle: "Track the complete case history",
    icon: "🕘",
  },
];

function DisputeEscalation({ isDarkMode }) {
  const {
    disputes: disputeData = [],
    updateDispute,
    updateObjection,
    updateParcel,
    objections = [],
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

  const routeStep = location.pathname.startsWith("/disputes/")
    ? location.pathname.split("/").pop()
    : null;

  const normalizedDisputes = useMemo(
    () =>
      (Array.isArray(disputeData) ? disputeData : []).map((item, index) => {
        if (Array.isArray(item)) {
          const [id, owner, survey, type, priority, escalatedTo, status] = item;
          return {
            id: id ?? `DSP-${index + 1}`,
            owner: owner ?? "—",
            survey: String(survey ?? "—"),
            type: type ?? "General Dispute",
            priority: priority ?? "Low",
            escalatedTo: escalatedTo ?? "—",
            status: status ?? "Active",
            reportedOn: "12-09-2025",
            remarks:
              "Boundary overlap or land record issue reported during acquisition monitoring.",
            timeline: [],
          };
        }

        return {
          ...item,
          id: item?.id ?? item?.caseId ?? `DSP-${index + 1}`,
          owner: item?.owner ?? item?.landowner ?? "—",
          survey: String(item?.survey ?? item?.surveyNo ?? item?.parcelNo ?? "—"),
          type:
            item?.type ??
            item?.disputeType ??
            item?.nature ??
            "General Dispute",
          priority: item?.priority ?? "Low",
          escalatedTo:
            item?.escalatedTo ??
            item?.authority ??
            item?.currentAuthority ??
            "—",
          status: item?.status ?? item?.resolutionStatus ?? "Active",
          reportedOn:
            item?.reportedOn ??
            item?.reportedDate ??
            item?.date ??
            "—",
          remarks:
            item?.remarks ??
            item?.description ??
            item?.details ??
            "Boundary overlap or land record issue reported during acquisition monitoring.",
          timeline: Array.isArray(item?.timeline) ? item.timeline : [],
        };
      }),
    [disputeData]
  );

  const selectedId =
    searchParams.get("dispute") ||
    normalizedDisputes.find(
      (item) => String(item.survey) === String(searchParams.get("survey"))
    )?.id ||
    normalizedDisputes[0]?.id ||
    null;

  const selectedCase =
    normalizedDisputes.find((item) => item.id === selectedId) ||
    normalizedDisputes[0] ||
    null;

  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [notes, setNotes] = useState(selectedCase?.remarks ?? "");
  const [authority, setAuthority] = useState(
    selectedCase?.escalatedTo === "—"
      ? "SDM Office"
      : selectedCase?.escalatedTo || "SDM Office"
  );
  const [priority, setPriority] = useState(selectedCase?.priority || "Medium");

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => setToast(""), 2400);
  };

  const priorityColor = (value) => {
    if (value === "High" || value === "Critical") return colors.red;
    if (value === "Medium") return colors.orange;
    return colors.green;
  };

  const statusColor = (value) => {
    if (value === "Resolved" || value === "Closed") return colors.green;
    if (value === "Under Review" || value === "Escalated") return colors.orange;
    if (value === "Active") return colors.red;
    return colors.muted;
  };

  const visibleCases = useMemo(() => {
    const q = query.trim().toLowerCase();

    return normalizedDisputes.filter((item) => {
      const queryMatch =
        !q ||
        `${item.id} ${item.owner} ${item.survey} ${item.type} ${item.escalatedTo}`
          .toLowerCase()
          .includes(q);

      const priorityMatch =
        priorityFilter === "All" || item.priority === priorityFilter;

      const statusMatch =
        statusFilter === "All" || item.status === statusFilter;

      return queryMatch && priorityMatch && statusMatch;
    });
  }, [normalizedDisputes, query, priorityFilter, statusFilter]);

  const counts = useMemo(
    () => ({
      active: normalizedDisputes.filter(
        (item) => item.status === "Active"
      ).length,
      high: normalizedDisputes.filter(
        (item) => item.priority === "High" || item.priority === "Critical"
      ).length,
      review: normalizedDisputes.filter(
        (item) => item.status === "Under Review"
      ).length,
      resolved: normalizedDisputes.filter(
        (item) => item.status === "Resolved" || item.status === "Closed"
      ).length,
    }),
    [normalizedDisputes]
  );

  const relatedObjection = objections.find(
    (item) =>
      String(item?.survey ?? item?.surveyNo ?? item?.parcelNo ?? "") ===
      String(selectedCase?.survey)
  );

  const goToStep = (step) => {
    if (!selectedCase) return;

    navigate(
      `/disputes/${step}?dispute=${encodeURIComponent(selectedCase.id)}`
    );
  };

  const goOverview = () => {
    navigate(
      `/disputes?dispute=${encodeURIComponent(selectedCase?.id || "")}`
    );
  };

  const selectCase = (id) => {
    const next = normalizedDisputes.find((item) => item.id === id);
    setSearchParams({ dispute: id });
    setNotes(next?.remarks || "");
    setAuthority(next?.escalatedTo || "SDM Office");
    setPriority(next?.priority || "Medium");
  };

  const saveNotes = () => {
    if (!selectedCase) return;

    updateDispute?.(selectedCase.id, {
      remarks: notes,
      updatedAt: new Date().toLocaleString(),
    });

    addActivity?.({
      id: `DSP-NOTE-${Date.now()}`,
      type: "Dispute",
      action: "Case notes updated",
      surveyNo: selectedCase.survey,
      timestamp: new Date().toLocaleString(),
    });

    showToast(`Notes saved for ${selectedCase.id}`);
  };

  const escalateCase = () => {
    if (!selectedCase) return;

    updateDispute?.(selectedCase.id, {
      status: "Under Review",
      priority,
      escalatedTo: authority,
      remarks: notes,
      lastAction: "Escalated for authority review",
      escalatedAt: new Date().toLocaleString(),
    });

    updateParcel?.(selectedCase.survey, {
      disputeStatus: "Active",
      disputePriority: priority,
    });

    updateObjection?.(relatedObjection?.id, {
      status: "Escalated",
      updatedAt: new Date().toLocaleString(),
    });

    addActivity?.({
      id: `DSP-ESC-${Date.now()}`,
      type: "Dispute",
      action: `Case escalated to ${authority}`,
      surveyNo: selectedCase.survey,
      timestamp: new Date().toLocaleString(),
    });

    addSyncItem?.({
      id: `DSP-SYNC-${Date.now()}`,
      type: "Dispute Escalation",
      reference: selectedCase.id,
      size: "1.3 KB",
      status: "Pending",
    });

    showToast(`${selectedCase.id} escalated to ${authority}`);
  };

  const resolveCase = () => {
    if (!selectedCase) return;

    updateDispute?.(selectedCase.id, {
      status: "Resolved",
      remarks: notes,
      resolvedAt: new Date().toLocaleString(),
      lastAction: "Case resolved",
    });

    updateParcel?.(selectedCase.survey, {
      disputeStatus: "None",
      disputePriority: null,
      disputeResolvedAt: new Date().toLocaleString(),
    });

    updateObjection?.(relatedObjection?.id, {
      status: "Resolved",
      updatedAt: new Date().toLocaleString(),
    });

    addActivity?.({
      id: `DSP-RES-${Date.now()}`,
      type: "Dispute",
      action: "Dispute resolved",
      surveyNo: selectedCase.survey,
      timestamp: new Date().toLocaleString(),
    });

    addSyncItem?.({
      id: `DSP-RES-SYNC-${Date.now()}`,
      type: "Dispute Resolution",
      reference: selectedCase.id,
      size: "1.0 KB",
      status: "Pending",
    });

    showToast(`${selectedCase.id} marked resolved`);
  };

  const saveEscalationDetails = () => {
    if (!selectedCase) return;

    updateDispute?.(selectedCase.id, {
      escalatedTo: authority,
      priority,
      remarks: notes,
      updatedAt: new Date().toLocaleString(),
    });

    showToast("Escalation details saved");
  };

  const exportRegister = () => {
    const rows = [
      ["Case ID", "Owner", "Survey", "Type", "Priority", "Authority", "Status"],
      ...normalizedDisputes.map((item) => [
        item.id,
        item.owner,
        item.survey,
        item.type,
        item.priority,
        item.escalatedTo,
        item.status,
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
    link.download = "dispute-escalation-register.csv";
    link.click();
    URL.revokeObjectURL(url);

    showToast("Dispute register exported");
  };

  const nextStep =
    routeStep === "case-list"
      ? "case-details"
      : routeStep === "case-details"
      ? "escalation"
      : routeStep === "escalation"
      ? "timeline"
      : null;

  const previousStep =
    routeStep === "case-details"
      ? "case-list"
      : routeStep === "escalation"
      ? "case-details"
      : routeStep === "timeline"
      ? "escalation"
      : null;

  const buildTimeline = () => {
    if (!selectedCase) return [];

    if (selectedCase.timeline?.length) return selectedCase.timeline;

    return [
      {
        time: selectedCase.reportedOn || "—",
        event: "Dispute case registered",
        accent: colors.cyan,
      },
      {
        time: selectedCase.escalatedTo || "Village level",
        event: `Case assigned to ${selectedCase.escalatedTo || "review authority"}`,
        accent: colors.orange,
      },
      {
        time: selectedCase.updatedAt || "Current",
        event:
          selectedCase.status === "Resolved"
            ? "Case marked resolved"
            : "Awaiting authority response",
        accent:
          selectedCase.status === "Resolved"
            ? colors.green
            : colors.orange,
      },
    ];
  };

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
            Dispute Resolution & Escalation
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
            Dispute Escalation
          </h1>

          <p style={{ margin: "6px 0 0", color: colors.muted, fontSize: "14px" }}>
            Review dispute cases, escalate matters and track resolution
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span
            style={{
              padding: "7px 10px",
              borderRadius: "7px",
              background: `${colors.red}18`,
              border: `1px solid ${colors.red}35`,
              color: colors.red,
              fontSize: "10px",
              fontWeight: "800",
            }}
          >
            {counts.active} ACTIVE
          </span>
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
            {counts.high} HIGH PRIORITY
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
                ["ACTIVE CASES", counts.active, "Requiring action", colors.red],
                ["HIGH PRIORITY", counts.high, "Urgent cases", colors.orange],
                ["UNDER REVIEW", counts.review, "With authority", colors.blue],
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

      {/* CASE LIST */}
      {routeStep === "case-list" && (
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
                ⚖️ Dispute Register
              </h2>
              <p style={{ margin: "5px 0 0", color: colors.muted, fontSize: "12px" }}>
                Search, filter and open an individual dispute case.
              </p>
            </div>

            <button
              type="button"
              onClick={exportRegister}
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
          </div>

          <div
            style={{
              marginTop: "15px",
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 150px 150px",
              gap: "8px",
            }}
          >
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search case, owner, survey, dispute type or authority..."
              style={{
                height: "38px",
                padding: "0 12px",
                boxSizing: "border-box",
                borderRadius: "8px",
                border: `1px solid ${colors.border}`,
                background: colors.input,
                color: colors.text,
                outline: "none",
                fontSize: "11px",
              }}
            />

            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
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
              <option>Critical</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>

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
              <option>Active</option>
              <option>Under Review</option>
              <option>Escalated</option>
              <option>Resolved</option>
              <option>Closed</option>
            </select>
          </div>

          <div style={{ overflowX: "auto", marginTop: "15px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "780px" }}>
              <thead>
                <tr>
                  {["Case", "Owner", "Survey", "Type", "Priority", "Authority", "Status", "Action"].map((heading) => (
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
                  ))}
                </tr>
              </thead>

              <tbody>
                {visibleCases.length ? (
                  visibleCases.map((item) => (
                    <tr key={item.id}>
                      <td style={{ padding: "12px 10px 12px 0", color: colors.cyan, fontSize: "11px", fontWeight: "800", borderBottom: `1px solid ${colors.border}` }}>
                        {item.id}
                      </td>
                      <td style={{ padding: "12px 10px 12px 0", color: colors.text, fontSize: "11px", fontWeight: "700", borderBottom: `1px solid ${colors.border}` }}>
                        {item.owner}
                      </td>
                      <td style={{ padding: "12px 10px 12px 0", color: colors.cyan, fontSize: "11px", fontWeight: "800", borderBottom: `1px solid ${colors.border}` }}>
                        {item.survey}
                      </td>
                      <td style={{ padding: "12px 10px 12px 0", color: colors.muted, fontSize: "11px", borderBottom: `1px solid ${colors.border}` }}>
                        {item.type}
                      </td>
                      <td style={{ padding: "12px 10px 12px 0", color: priorityColor(item.priority), fontSize: "10px", fontWeight: "800", borderBottom: `1px solid ${colors.border}` }}>
                        {item.priority}
                      </td>
                      <td style={{ padding: "12px 10px 12px 0", color: colors.muted, fontSize: "10px", borderBottom: `1px solid ${colors.border}` }}>
                        {item.escalatedTo}
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
                          onClick={() => {
                            selectCase(item.id);
                            goToStep("case-details");
                          }}
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
                    <td colSpan="8" style={{ padding: "24px", textAlign: "center", color: colors.muted, fontSize: "11px" }}>
                      No dispute cases match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* CASE DETAILS */}
      {routeStep === "case-details" && (
        <section style={{ ...card, padding: "22px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>
              📋 Case Details
            </h2>
            <p style={{ margin: "5px 0 0", color: colors.muted, fontSize: "12px" }}>
              Detailed record for {selectedCase?.id || "selected dispute"}.
            </p>
          </div>

          <div
            style={{
              marginTop: "17px",
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              borderTop: `1px solid ${colors.border}`,
            }}
          >
            {[
              ["Case ID", selectedCase?.id, colors.cyan],
              ["Landowner", selectedCase?.owner, colors.text],
              ["Survey No.", selectedCase?.survey, colors.cyan],
              ["Dispute Type", selectedCase?.type, colors.text],
              ["Priority", selectedCase?.priority, priorityColor(selectedCase?.priority)],
              ["Status", selectedCase?.status, statusColor(selectedCase?.status)],
              ["Escalated To", selectedCase?.escalatedTo, colors.text],
              ["Reported On", selectedCase?.reportedOn, colors.muted],
            ].map(([label, value, accent]) => (
              <div
                key={label}
                style={{
                  padding: "15px 15px 15px 0",
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <div style={{ color: colors.muted, fontSize: "10px", fontWeight: "800", textTransform: "uppercase", marginBottom: "6px" }}>
                  {label}
                </div>
                <div style={{ color: accent, fontSize: "13px", fontWeight: "700" }}>
                  {value || "—"}
                </div>
              </div>
            ))}
          </div>

          <label style={{ display: "block", color: colors.muted, fontSize: "10px", fontWeight: "800", textTransform: "uppercase", margin: "17px 0 7px" }}>
            Case Notes
          </label>

          <textarea
            rows="7"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Add the current case note, field finding or follow-up requirement..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              resize: "vertical",
              padding: "11px",
              borderRadius: "8px",
              border: `1px solid ${colors.border}`,
              background: colors.input,
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
              onClick={saveNotes}
              style={{
                padding: "9px 13px",
                borderRadius: "7px",
                border: `1px solid ${colors.border}`,
                background: colors.input,
                color: colors.text,
                fontSize: "10px",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              Save Notes
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "18px", gap: "8px" }}>
            <button
              type="button"
              onClick={() => goToStep("case-list")}
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
              ← Dispute Register
            </button>

            <button
              type="button"
              onClick={() => goToStep("escalation")}
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
              Next: Escalation →
            </button>
          </div>
        </section>
      )}

      {/* ESCALATION */}
      {routeStep === "escalation" && (
        <section style={{ ...card, padding: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>
            🚨 Escalation
          </h2>
          <p style={{ margin: "5px 0 0", color: colors.muted, fontSize: "12px" }}>
            Assign the dispute to the appropriate authority and record the escalation action.
          </p>

          <div
            style={{
              marginTop: "17px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div>
              <label style={{ display: "block", color: colors.muted, fontSize: "10px", fontWeight: "800", textTransform: "uppercase", marginBottom: "6px" }}>
                Escalate To
              </label>
              <select
                value={authority}
                onChange={(event) => setAuthority(event.target.value)}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 10px",
                  borderRadius: "7px",
                  border: `1px solid ${colors.border}`,
                  background: colors.input,
                  color: colors.text,
                  outline: "none",
                  fontSize: "11px",
                }}
              >
                <option>Tehsil Office</option>
                <option>SDM Office</option>
                <option>District Magistrate Office</option>
                <option>Revenue Board</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", color: colors.muted, fontSize: "10px", fontWeight: "800", textTransform: "uppercase", marginBottom: "6px" }}>
                Priority
              </label>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 10px",
                  borderRadius: "7px",
                  border: `1px solid ${colors.border}`,
                  background: colors.input,
                  color: colors.text,
                  outline: "none",
                  fontSize: "11px",
                }}
              >
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>

          <div
            style={{
              marginTop: "14px",
              padding: "14px",
              borderRadius: "9px",
              border: `1px solid ${priorityColor(priority)}35`,
              background: `${priorityColor(priority)}0d`,
            }}
          >
            <div style={{ color: priorityColor(priority), fontSize: "12px", fontWeight: "800" }}>
              {priority} priority case
            </div>
            <div style={{ color: colors.muted, fontSize: "10px", marginTop: "4px", lineHeight: 1.45 }}>
              Survey {selectedCase?.survey} · {selectedCase?.type} · Current status: {selectedCase?.status}
            </div>
          </div>

          <textarea
            rows="6"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Add escalation justification or authority handoff note..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              marginTop: "14px",
              padding: "11px",
              borderRadius: "8px",
              border: `1px solid ${colors.border}`,
              background: colors.input,
              color: colors.text,
              outline: "none",
              resize: "vertical",
              fontFamily: "inherit",
              fontSize: "11px",
              lineHeight: 1.5,
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
              marginTop: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={saveEscalationDetails}
              style={{
                padding: "9px 13px",
                borderRadius: "7px",
                border: `1px solid ${colors.border}`,
                background: colors.input,
                color: colors.text,
                fontSize: "10px",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              Save Escalation Details
            </button>

            <button
              type="button"
              onClick={escalateCase}
              style={{
                padding: "9px 13px",
                borderRadius: "7px",
                border: 0,
                background: colors.orange,
                color: "#fff",
                fontSize: "10px",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              Escalate Case
            </button>

            <button
              type="button"
              onClick={resolveCase}
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
              Mark Resolved
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
              onClick={() => goToStep("timeline")}
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
              Next: Timeline →
            </button>
          </div>
        </section>
      )}

      {/* TIMELINE */}
      {routeStep === "timeline" && (
        <section style={{ ...card, padding: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>
                🕘 Escalation Timeline
              </h2>
              <p style={{ margin: "5px 0 0", color: colors.muted, fontSize: "12px" }}>
                Audit trail for {selectedCase?.id}.
              </p>
            </div>

            <span
              style={{
                padding: "7px 10px",
                borderRadius: "7px",
                background: `${statusColor(selectedCase?.status)}18`,
                border: `1px solid ${statusColor(selectedCase?.status)}35`,
                color: statusColor(selectedCase?.status),
                fontSize: "10px",
                fontWeight: "800",
              }}
            >
              {selectedCase?.status || "—"}
            </span>
          </div>

          <div style={{ marginTop: "18px" }}>
            {buildTimeline().map((item, index) => (
              <div
                key={`${item.time}-${item.event}-${index}`}
                style={{
                  display: "flex",
                  gap: "13px",
                  minHeight: "82px",
                }}
              >
                <div
                  style={{
                    width: "14px",
                    display: "flex",
                    justifyContent: "center",
                    position: "relative",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: item.accent || colors.blue,
                      marginTop: "4px",
                      zIndex: 2,
                    }}
                  />
                  {index < buildTimeline().length - 1 && (
                    <span
                      style={{
                        position: "absolute",
                        top: "13px",
                        bottom: "-4px",
                        width: "1px",
                        background: colors.border,
                      }}
                    />
                  )}
                </div>

                <div>
                  <div style={{ color: colors.text, fontSize: "12px", fontWeight: "800" }}>
                    {item.event}
                  </div>
                  <div style={{ color: colors.muted, fontSize: "10px", marginTop: "4px" }}>
                    {item.time}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: "5px",
              padding: "13px",
              borderRadius: "8px",
              background: `${colors.orange}0d`,
              border: `1px solid ${colors.orange}35`,
            }}
          >
            <div style={{ color: colors.orange, fontSize: "12px", fontWeight: "800" }}>
              {selectedCase?.status === "Resolved"
                ? "✓ Case resolved"
                : "⏳ Awaiting authority response"}
            </div>
            <div style={{ color: colors.muted, fontSize: "11px", marginTop: "4px" }}>
              {selectedCase?.status === "Resolved"
                ? "No further escalation is pending for this case."
                : "Follow up with the current authority if no response is received."}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "18px",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => goToStep("escalation")}
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
              ← Escalation
            </button>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/notifications/objections?objection=${encodeURIComponent(
                      relatedObjection?.id || ""
                    )}`
                  )
                }
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
                Open Related Objection
              </button>

              <button
                type="button"
                onClick={goOverview}
                style={{
                  padding: "9px 14px",
                  borderRadius: "7px",
                  border: 0,
                  background: colors.green,
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                Finish Dispute Workflow
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default DisputeEscalation;
