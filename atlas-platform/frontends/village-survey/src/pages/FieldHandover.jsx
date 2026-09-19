import React, { useMemo, useState, useEffect } from "react";
import { useAtlas } from "../context/AtlasContext";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

const STEPS = [
  {
    key: "handover-register",
    title: "Handover Register",
    subtitle: "Review parcel readiness and handover status",
    icon: "📋",
  },
  {
    key: "parcel-details",
    title: "Parcel Details",
    subtitle: "Review selected parcel and responsible officer",
    icon: "📍",
  },
  {
    key: "clearance-checklist",
    title: "Clearance Checklist",
    subtitle: "Complete mandatory handover clearances",
    icon: "✅",
  },
  {
    key: "confirmation",
    title: "Confirmation",
    subtitle: "Confirm and record field handover",
    icon: "🤝",
  },
];

function FieldHandover({ isDarkMode }) {
  const {
    parcels = [],
    surveyOfficers = [],
    objections = [],
    disputes = [],
    updateParcel,
    addActivity,
    addSyncItem,
    getParcelWorkflowState,
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

  const routeStep = location.pathname.startsWith("/field-handover/")
    ? location.pathname.split("/").pop()
    : null;

  const selectedSurveyNo =
    searchParams.get("survey") ||
    parcels.find((parcel) => String(parcel.handoverStatus) === "Ready")?.surveyNo ||
    parcels[0]?.surveyNo ||
    "112";

  const selectedParcel =
    parcels.find((parcel) => String(parcel.surveyNo) === String(selectedSurveyNo)) ||
    parcels[0] ||
    null;

  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const liveWorkflow = useMemo(() => {
    if (!selectedParcel) {
      return { objections: [], disputes: [], hasOpenObjection: false, hasActiveDispute: false };
    }

    if (typeof getParcelWorkflowState === "function") {
      return getParcelWorkflowState(selectedParcel.surveyNo);
    }

    const surveyNo = String(selectedParcel.surveyNo);
    const relatedObjections = objections.filter((item) =>
      String(item?.surveyNo ?? item?.survey ?? item?.parcelNo ?? "") === surveyNo
    );
    const relatedDisputes = disputes.filter((item) =>
      String(item?.surveyNo ?? item?.survey ?? item?.parcelNo ?? "") === surveyNo
    );

    return {
      objections: relatedObjections,
      disputes: relatedDisputes,
      hasOpenObjection: relatedObjections.some((item) =>
        !["Resolved", "Closed", "Rejected"].includes(String(item?.status ?? ""))
      ),
      hasActiveDispute: relatedDisputes.some((item) =>
        ["Active", "Under Review", "Escalated"].includes(String(item?.status ?? ""))
      ),
    };
  }, [selectedParcel?.surveyNo, objections, disputes, getParcelWorkflowState]);

  const hasOpenObjection = liveWorkflow.hasOpenObjection;
  const hasActiveDispute = liveWorkflow.hasActiveDispute;

  const [statusFilter, setStatusFilter] = useState("All");

  const [checklist, setChecklist] = useState({
    landRecordsVerified: false,
    compensationComplete: false,
    boundaryVerified: false,
    objectionsResolved: false,
    disputeCleared: false,
    noticeIssued: false,
  });

  const [handoverDate, setHandoverDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [officerId, setOfficerId] = useState(
    surveyOfficers[0]?.id || surveyOfficers[0]?.officerId || "SO-001"
  );

  useEffect(() => {
    if (!selectedParcel) return;

    const parcelChecks = selectedParcel.handoverChecks || {};

    setChecklist({
      landRecordsVerified:
        Boolean(parcelChecks.landRecordsVerified) ||
        selectedParcel.recordStatus === "Verified",
      compensationComplete:
        Boolean(parcelChecks.compensationComplete),
      boundaryVerified:
        Boolean(parcelChecks.boundaryVerified) ||
        selectedParcel.boundaryStatus === "Clear",
      objectionsResolved:
        Boolean(parcelChecks.objectionsResolved) ||
        (!hasOpenObjection && (!selectedParcel.objectionsStatus || selectedParcel.objectionsStatus === "Resolved")),
      disputeCleared:
        Boolean(parcelChecks.disputeCleared) ||
        (!hasActiveDispute && (!selectedParcel.disputeStatus || selectedParcel.disputeStatus === "None")),
      noticeIssued:
        Boolean(parcelChecks.noticeIssued) ||
        Boolean(selectedParcel.handoverNoticeIssued),
    });

    if (selectedParcel.handoverDate) {
      const parsed = String(selectedParcel.handoverDate).slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
        setHandoverDate(parsed);
      }
    }

    const existingOfficer =
      selectedParcel.handoverOfficerId ||
      selectedParcel.assignedOfficerId ||
      surveyOfficers[0]?.id ||
      surveyOfficers[0]?.officerId;

    if (existingOfficer) setOfficerId(existingOfficer);
  }, [
    selectedParcel?.surveyNo,
    selectedParcel?.handoverStatus,
    selectedParcel?.recordStatus,
    selectedParcel?.boundaryStatus,
    selectedParcel?.objectionsStatus,
    selectedParcel?.disputeStatus,
    selectedParcel?.handoverChecks,
    selectedParcel?.handoverNoticeIssued,
    hasOpenObjection,
    hasActiveDispute,
  ]);

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => setToast(""), 2400);
  };

  const normalizeHandoverStatus = (parcel) => {
    if (!parcel) return "Pending";
    if (parcel.handoverStatus) return parcel.handoverStatus;
    if (parcel.disputeStatus && parcel.disputeStatus !== "None") return "Dispute Hold";
    if (parcel.recordStatus !== "Verified") return "Documents Pending";
    return "Ready";
  };

  const statusColor = (status) => {
    if (status === "Ready" || status === "Handed Over") return colors.green;
    if (status === "Documents Pending" || status === "Pending")
      return colors.orange;
    if (status === "Dispute Hold") return colors.red;
    return colors.muted;
  };

  const visibleParcels = useMemo(() => {
    const q = search.trim().toLowerCase();

    return parcels.filter((parcel) => {
      const status = normalizeHandoverStatus(parcel);
      const matchesQuery =
        !q ||
        `${parcel.surveyNo} ${parcel.owner} ${parcel.classification} ${status}`
          .toLowerCase()
          .includes(q);

      const matchesStatus =
        statusFilter === "All" || status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [parcels, search, statusFilter]);

  const counts = useMemo(
    () => ({
      ready: parcels.filter((p) => normalizeHandoverStatus(p) === "Ready").length,
      pending: parcels.filter(
        (p) => normalizeHandoverStatus(p) === "Documents Pending"
      ).length,
      hold: parcels.filter(
        (p) => normalizeHandoverStatus(p) === "Dispute Hold"
      ).length,
      handedOver: parcels.filter(
        (p) => normalizeHandoverStatus(p) === "Handed Over"
      ).length,
    }),
    [parcels]
  );

  const selectParcel = (surveyNo) => {
    setSearchParams({ survey: String(surveyNo) });
  };

  const goToStep = (step) => {
    if (!selectedParcel) return;
    navigate(
      `/field-handover/${step}?survey=${encodeURIComponent(
        selectedParcel.surveyNo
      )}`
    );
  };

  const goOverview = () => {
    navigate(
      `/field-handover?survey=${encodeURIComponent(
        selectedParcel?.surveyNo || ""
      )}`
    );
  };

  const selectedOfficer = useMemo(
    () =>
      surveyOfficers.find(
        (officer) =>
          String(officer.id ?? officer.officerId) === String(officerId)
      ) || surveyOfficers[0],
    [surveyOfficers, officerId]
  );

  const checklistItems = [
    ["landRecordsVerified", "Land records verified"],
    ["compensationComplete", "Compensation documentation complete"],
    ["boundaryVerified", "Boundary verification complete"],
    ["objectionsResolved", "Public objections resolved"],
    ["disputeCleared", "Dispute clearance received"],
    ["noticeIssued", "Handover notice issued"],
  ];

  const checklistComplete = checklistItems.every(
    ([key]) => checklist[key] === true
  );

  const toggleChecklist = (key) => {
    setChecklist((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const saveDraft = () => {
    if (!selectedParcel) return;

    updateParcel(selectedParcel.surveyNo, {
      handoverChecks: checklist,
      handoverDate,
      handoverOfficerId: officerId,
      handoverDraftSavedAt: new Date().toLocaleString(),
    });

    addActivity?.({
      id: `HAND-DRAFT-${Date.now()}`,
      type: "Field Handover",
      action: "Handover draft saved",
      surveyNo: selectedParcel.surveyNo,
      timestamp: new Date().toLocaleString(),
    });

    showToast(`Handover draft saved for Survey ${selectedParcel.surveyNo}`);
  };

  const confirmHandover = () => {
    if (!selectedParcel) return;

    const liveChecklist = {
      ...checklist,
      landRecordsVerified: selectedParcel.recordStatus === "Verified" || checklist.landRecordsVerified,
      boundaryVerified: selectedParcel.boundaryStatus === "Clear" || checklist.boundaryVerified,
      objectionsResolved: !hasOpenObjection && (!selectedParcel.objectionsStatus || selectedParcel.objectionsStatus === "Resolved" || checklist.objectionsResolved),
      disputeCleared: !hasActiveDispute && (!selectedParcel.disputeStatus || selectedParcel.disputeStatus === "None" || checklist.disputeCleared),
    };

    const allComplete = checklistItems.every(([key]) => liveChecklist[key] === true);
    if (!allComplete) {
      showToast("Resolve all linked clearances before confirming handover");
      return;
    }

    setChecklist(liveChecklist);

    updateParcel(selectedParcel.surveyNo, {
      handoverStatus: "Handed Over",
      handoverChecks: liveChecklist,
      handoverDate,
      handoverOfficerId: officerId,
      handedOverAt: new Date().toLocaleString(),
    });

    addActivity?.({
      id: `HAND-CONF-${Date.now()}`,
      type: "Field Handover",
      action: `Field handover confirmed by ${selectedOfficer?.name || "assigned officer"}`,
      surveyNo: selectedParcel.surveyNo,
      timestamp: new Date().toLocaleString(),
    });

    addSyncItem?.({
      id: `HAND-SYNC-${Date.now()}`,
      type: "Field Handover",
      reference: `Survey ${selectedParcel.surveyNo}`,
      size: "1.4 KB",
      status: "Pending",
    });

    showToast(`Survey ${selectedParcel.surveyNo} successfully handed over`);
  };

  const markNoticeIssued = () => {
    if (!selectedParcel) return;

    setChecklist((current) => ({
      ...current,
      noticeIssued: true,
    }));

    updateParcel(selectedParcel.surveyNo, {
      handoverNoticeIssued: true,
      handoverNoticeIssuedAt: new Date().toLocaleString(),
      handoverChecks: {
        ...(selectedParcel.handoverChecks || {}),
        ...checklist,
        noticeIssued: true,
      },
    });

    addActivity?.({
      id: `HAND-NOTICE-${Date.now()}`,
      type: "Field Handover",
      action: "Handover notice issued",
      surveyNo: selectedParcel.surveyNo,
      timestamp: new Date().toLocaleString(),
    });

    addSyncItem?.({
      id: `HAND-NOTICE-SYNC-${Date.now()}`,
      type: "Handover Notice",
      reference: `Survey ${selectedParcel.surveyNo}`,
      size: "0.9 KB",
      status: "Pending",
    });

    showToast("Handover notice marked as issued");
  };

  const exportRegister = () => {
    const rows = [
      ["Survey No.", "Landowner", "Area", "Record Status", "Handover Status"],
      ...parcels.map((parcel) => [
        parcel.surveyNo,
        parcel.owner,
        parcel.area,
        parcel.recordStatus,
        normalizeHandoverStatus(parcel),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "field-handover-register.csv";
    link.click();
    URL.revokeObjectURL(url);

    showToast("Handover register exported");
  };

  const openBoundaryCheck = () => {
    if (!selectedParcel) return;
    navigate(
      `/boundary-check/verification?survey=${encodeURIComponent(
        selectedParcel.surveyNo
      )}`
    );
  };

  const openDispute = () => {
    if (!selectedParcel) return;
    navigate(
      `/disputes/case-details?survey=${encodeURIComponent(
        selectedParcel.surveyNo
      )}`
    );
  };

  const nextStep =
    routeStep === "handover-register"
      ? "parcel-details"
      : routeStep === "parcel-details"
      ? "clearance-checklist"
      : routeStep === "clearance-checklist"
      ? "confirmation"
      : null;

  const previousStep =
    routeStep === "parcel-details"
      ? "handover-register"
      : routeStep === "clearance-checklist"
      ? "parcel-details"
      : routeStep === "confirmation"
      ? "clearance-checklist"
      : null;

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
            Acquisition Operations
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
            Field Handover
          </h1>

          <p style={{ margin: "6px 0 0", color: colors.muted, fontSize: "14px" }}>
            Track parcel readiness, clearance requirements and field handover activities
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
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
            {counts.ready} READY
          </span>

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
            {counts.hold} DISPUTE HOLD
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
            {counts.handedOver} HANDED OVER
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
                    <div style={{ marginTop: "3px", color: colors.muted, fontSize: "9px", lineHeight: 1.35 }}>
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
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
              <div>
                <div style={{ color: colors.cyan, fontSize: "10px", fontWeight: "800", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                  Selected Parcel
                </div>
                <h2 style={{ margin: "6px 0 0", fontSize: "21px", fontWeight: "800" }}>
                  Survey {selectedParcel?.surveyNo} — {selectedParcel?.owner}
                </h2>
                <p style={{ margin: "5px 0 0", color: colors.muted, fontSize: "11px" }}>
                  Move through the handover workflow one section at a time.
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
                marginTop: "18px",
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: "10px",
              }}
            >
              {[
                ["Survey No.", selectedParcel?.surveyNo, colors.cyan],
                ["Landowner", selectedParcel?.owner, colors.text],
                ["Area", selectedParcel?.area, colors.text],
                ["Handover Status", normalizeHandoverStatus(selectedParcel), statusColor(normalizeHandoverStatus(selectedParcel))],
              ].map(([label, value, accent]) => (
                <div key={label} style={{ padding: "13px", borderRadius: "9px", background: colors.input, border: `1px solid ${colors.border}` }}>
                  <div style={{ color: colors.muted, fontSize: "9px", fontWeight: "800", textTransform: "uppercase" }}>
                    {label}
                  </div>
                  <div style={{ marginTop: "6px", color: accent, fontSize: "12px", fontWeight: "800" }}>
                    {value || "—"}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" }}>
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

      {/* REGISTER */}
      {routeStep === "handover-register" && (
        <section style={{ ...card, padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>📋 Handover Register</h2>
              <p style={{ margin: "5px 0 0", color: colors.muted, fontSize: "12px" }}>
                Search parcels and open the handover workflow for an individual survey.
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 170px", gap: "8px", marginTop: "15px" }}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search survey, landowner or status..."
              style={{
                height: "38px",
                padding: "0 12px",
                borderRadius: "8px",
                border: `1px solid ${colors.border}`,
                background: colors.input,
                color: colors.text,
                outline: "none",
                fontSize: "11px",
                boxSizing: "border-box",
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
              <option>Ready</option>
              <option>Documents Pending</option>
              <option>Dispute Hold</option>
              <option>Handed Over</option>
            </select>
          </div>

          <div style={{ overflowX: "auto", marginTop: "15px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
              <thead>
                <tr>
                  {["Survey No.", "Landowner", "Area", "Record Status", "Handover Status", "Action"].map((heading) => (
                    <th key={heading} style={{ textAlign: "left", color: colors.muted, fontSize: "10px", fontWeight: "800", textTransform: "uppercase", padding: "0 10px 10px 0", borderBottom: `1px solid ${colors.border}` }}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {visibleParcels.map((parcel) => {
                  const status = normalizeHandoverStatus(parcel);

                  return (
                    <tr key={parcel.surveyNo}>
                      <td style={{ padding: "12px 10px 12px 0", borderBottom: `1px solid ${colors.border}` }}>
                        <button
                          type="button"
                          onClick={() => selectParcel(parcel.surveyNo)}
                          style={{ border: 0, background: "transparent", color: colors.cyan, fontWeight: "800", fontSize: "12px", cursor: "pointer" }}
                        >
                          {parcel.surveyNo}
                        </button>
                      </td>
                      <td style={{ padding: "12px 10px 12px 0", color: colors.text, fontSize: "12px", fontWeight: "700", borderBottom: `1px solid ${colors.border}` }}>
                        {parcel.owner}
                      </td>
                      <td style={{ padding: "12px 10px 12px 0", color: colors.muted, fontSize: "11px", borderBottom: `1px solid ${colors.border}` }}>
                        {parcel.area}
                      </td>
                      <td style={{ padding: "12px 10px 12px 0", color: statusColor(parcel.recordStatus), fontSize: "11px", fontWeight: "800", borderBottom: `1px solid ${colors.border}` }}>
                        {parcel.recordStatus || "—"}
                      </td>
                      <td style={{ padding: "12px 10px 12px 0", borderBottom: `1px solid ${colors.border}` }}>
                        <span style={{ padding: "5px 8px", borderRadius: "5px", background: `${statusColor(status)}18`, border: `1px solid ${statusColor(status)}30`, color: statusColor(status), fontSize: "10px", fontWeight: "800" }}>
                          {status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 0", borderBottom: `1px solid ${colors.border}` }}>
                        <button
                          type="button"
                          onClick={() => {
                            selectParcel(parcel.surveyNo);
                            goToStep("parcel-details");
                          }}
                          style={{ border: 0, background: "transparent", color: colors.blueSoft, fontSize: "11px", fontWeight: "800", cursor: "pointer" }}
                        >
                          Open →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* DETAILS */}
      {routeStep === "parcel-details" && (
        <section style={{ ...card, padding: "22px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>📍 Parcel Details</h2>
            <p style={{ margin: "5px 0 0", color: colors.muted, fontSize: "12px" }}>
              Review parcel readiness, responsible officer and linked workflow status.
            </p>
          </div>

          <div style={{ marginTop: "18px", display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: `1px solid ${colors.border}` }}>
            {[
              ["Survey No.", selectedParcel?.surveyNo, colors.cyan],
              ["Landowner", selectedParcel?.owner, colors.text],
              ["Area", selectedParcel?.area, colors.text],
              ["Classification", selectedParcel?.classification, colors.text],
              ["Record Status", selectedParcel?.recordStatus, statusColor(selectedParcel?.recordStatus)],
              ["Handover Status", normalizeHandoverStatus(selectedParcel), statusColor(normalizeHandoverStatus(selectedParcel))],
              ["Dispute Status", selectedParcel?.disputeStatus || "None", selectedParcel?.disputeStatus === "None" || !selectedParcel?.disputeStatus ? colors.green : colors.red],
              ["Boundary Status", selectedParcel?.boundaryStatus || "Not recorded", selectedParcel?.boundaryStatus === "Clear" ? colors.green : colors.orange],
            ].map(([label, value, accent]) => (
              <div key={label} style={{ padding: "15px 15px 15px 0", borderBottom: `1px solid ${colors.border}` }}>
                <div style={{ color: colors.muted, fontSize: "10px", fontWeight: "800", textTransform: "uppercase", marginBottom: "6px" }}>
                  {label}
                </div>
                <div style={{ color: accent, fontSize: "13px", fontWeight: "700" }}>{value || "—"}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: "17px",
              padding: "14px",
              borderRadius: "9px",
              background: colors.input,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div style={{ color: colors.text, fontSize: "12px", fontWeight: "800" }}>Assigned Handover Officer</div>

            <select
              value={officerId}
              onChange={(event) => setOfficerId(event.target.value)}
              style={{
                width: "100%",
                marginTop: "9px",
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
              {(surveyOfficers || []).map((officer) => (
                <option
                  key={officer.id ?? officer.officerId}
                  value={officer.id ?? officer.officerId}
                >
                  {officer.name || officer.officerName || "Survey Officer"}
                </option>
              ))}
            </select>

            <div style={{ marginTop: "9px", color: colors.muted, fontSize: "10px" }}>
              {selectedOfficer?.role || "Survey Officer"} · {selectedOfficer?.phone || "Contact not recorded"}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "18px", gap: "8px" }}>
            <button
              type="button"
              onClick={() => goToStep("handover-register")}
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
              ← Register
            </button>

            <button
              type="button"
              onClick={() => goToStep("clearance-checklist")}
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
              Next: Clearance Checklist →
            </button>
          </div>
        </section>
      )}

      {/* CHECKLIST */}
      {routeStep === "clearance-checklist" && (
        <section style={{ ...card, padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "15px", flexWrap: "wrap", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>✅ Clearance Checklist</h2>
              <p style={{ margin: "5px 0 0", color: colors.muted, fontSize: "12px" }}>
                Every mandatory clearance must be satisfied before field handover.
              </p>
            </div>

            <span
              style={{
                padding: "7px 10px",
                borderRadius: "7px",
                background: `${checklistComplete ? colors.green : colors.orange}18`,
                border: `1px solid ${checklistComplete ? colors.green : colors.orange}35`,
                color: checklistComplete ? colors.green : colors.orange,
                fontSize: "10px",
                fontWeight: "800",
              }}
            >
              {checklistItems.filter(([key]) => checklist[key]).length}/{checklistItems.length} COMPLETE
            </span>
          </div>

          <div style={{ marginTop: "16px", display: "grid", gap: "8px" }}>
            {checklistItems.map(([key, label]) => {
              const systemControlled = [
                "landRecordsVerified",
                "boundaryVerified",
                "objectionsResolved",
                "disputeCleared",
              ].includes(key);

              const sourceText = {
                landRecordsVerified:
                  selectedParcel?.recordStatus === "Verified"
                    ? "Verified from Land Scrutiny"
                    : "Complete Land Scrutiny first",
                boundaryVerified:
                  selectedParcel?.boundaryStatus === "Clear"
                    ? "Cleared by Boundary Check"
                    : "Complete Boundary Check first",
                objectionsResolved: hasOpenObjection
                  ? "Open objection linked from Notifications"
                  : "No open objection linked",
                disputeCleared: hasActiveDispute
                  ? "Active dispute linked from Dispute Escalation"
                  : "No active dispute linked",
              }[key];

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => { if (!systemControlled) toggleChecklist(key); }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    padding: "13px",
                    borderRadius: "8px",
                    border: `1px solid ${checklist[key] ? colors.green : colors.border}`,
                    background: checklist[key] ? `${colors.green}0d` : colors.input,
                    color: colors.text,
                    textAlign: "left",
                    cursor: systemControlled ? "default" : "pointer",
                    opacity: systemControlled && !checklist[key] ? 0.82 : 1,
                  }}
                >
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: "800" }}>{label}</div>
                    <div style={{ marginTop: "3px", color: colors.muted, fontSize: "9px", lineHeight: 1.35 }}>
                      Survey {selectedParcel?.surveyNo}
                    </div>
                    {systemControlled && (
                      <div style={{ marginTop: "4px", color: colors.blueSoft, fontSize: "9px", fontWeight: "700" }}>
                        {sourceText}
                      </div>
                    )}
                  </div>
                  <span style={{ color: checklist[key] ? colors.green : colors.orange, fontWeight: "900", fontSize: "16px" }}>
                    {checklist[key] ? "✓" : "○"}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              const next = {
                ...checklist,
                landRecordsVerified: selectedParcel.recordStatus === "Verified",
                boundaryVerified: selectedParcel.boundaryStatus === "Clear",
                objectionsResolved: !hasOpenObjection,
                disputeCleared: !hasActiveDispute,
              };
              setChecklist(next);
              updateParcel(selectedParcel.surveyNo, {
                handoverChecks: { ...(selectedParcel.handoverChecks || {}), ...next },
              });
              showToast("Linked clearances refreshed");
            }}
            style={{
              marginTop: "12px",
              padding: "8px 11px",
              borderRadius: "7px",
              border: `1px solid ${colors.blue}`,
              background: "transparent",
              color: colors.blueSoft,
              fontSize: "10px",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            Refresh Linked Clearances
          </button>

          {!checklist.disputeCleared && (
            <div
              style={{
                marginTop: "13px",
                padding: "12px",
                borderRadius: "8px",
                border: `1px solid ${colors.red}35`,
                background: `${colors.red}0d`,
              }}
            >
              <div style={{ color: colors.red, fontSize: "11px", fontWeight: "800" }}>
                ⚠ Dispute clearance is still pending
              </div>
              <div style={{ color: colors.muted, fontSize: "10px", marginTop: "3px" }}>
                Open the dispute workflow before confirming handover.
              </div>
              <button
                type="button"
                onClick={openDispute}
                style={{
                  marginTop: "8px",
                  padding: "7px 10px",
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
          )}

          {!checklist.boundaryVerified && (
            <div
              style={{
                marginTop: "9px",
                padding: "12px",
                borderRadius: "8px",
                border: `1px solid ${colors.orange}35`,
                background: `${colors.orange}0d`,
              }}
            >
              <div style={{ color: colors.orange, fontSize: "11px", fontWeight: "800" }}>
                Boundary verification is incomplete
              </div>
              <button
                type="button"
                onClick={openBoundaryCheck}
                style={{
                  marginTop: "8px",
                  padding: "7px 10px",
                  borderRadius: "7px",
                  border: `1px solid ${colors.orange}`,
                  background: "transparent",
                  color: colors.orange,
                  fontSize: "10px",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                Open Boundary Check
              </button>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "18px", gap: "8px" }}>
            <button
              type="button"
              onClick={() => goToStep("parcel-details")}
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
              onClick={() => goToStep("confirmation")}
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
              Next: Confirmation →
            </button>
          </div>
        </section>
      )}

      {/* CONFIRMATION */}
      {routeStep === "confirmation" && (
        <section style={{ ...card, padding: "20px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>🤝 Handover Confirmation</h2>
            <p style={{ margin: "5px 0 0", color: colors.muted, fontSize: "12px" }}>
              Finalize the handover record only after all mandatory checks are complete.
            </p>
          </div>

          <div
            style={{
              marginTop: "17px",
              padding: "15px",
              borderRadius: "9px",
              background: colors.input,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {[
                ["Survey No.", selectedParcel?.surveyNo],
                ["Landowner", selectedParcel?.owner],
                ["Area", selectedParcel?.area],
                ["Officer", selectedOfficer?.name || "Survey Officer"],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ color: colors.muted, fontSize: "9px", fontWeight: "800", textTransform: "uppercase" }}>
                    {label}
                  </div>
                  <div style={{ marginTop: "4px", color: colors.text, fontSize: "12px", fontWeight: "700" }}>
                    {value || "—"}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "13px" }}>
              <label style={{ display: "block", color: colors.muted, fontSize: "10px", fontWeight: "800", textTransform: "uppercase", marginBottom: "6px" }}>
                Handover Date
              </label>
              <input
                type="date"
                value={handoverDate}
                onChange={(event) => setHandoverDate(event.target.value)}
                style={{
                  width: "100%",
                  height: "38px",
                  padding: "0 10px",
                  boxSizing: "border-box",
                  borderRadius: "7px",
                  border: `1px solid ${colors.border}`,
                  background: colors.card,
                  color: colors.text,
                  outline: "none",
                  fontSize: "11px",
                }}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: "14px",
              padding: "14px",
              borderRadius: "9px",
              border: `1px solid ${checklistComplete ? colors.green : colors.red}35`,
              background: `${checklistComplete ? colors.green : colors.red}0d`,
            }}
          >
            <div style={{ color: checklistComplete ? colors.green : colors.red, fontSize: "12px", fontWeight: "800" }}>
              {checklistComplete
                ? "✓ All mandatory clearances are complete"
                : "⚠ Handover cannot yet be confirmed"}
            </div>

            <div style={{ color: colors.muted, fontSize: "10px", marginTop: "4px" }}>
              {checklistComplete
                ? "The parcel is ready to be recorded as handed over."
                : "Return to Clearance Checklist and complete every required item."}
            </div>
          </div>

          <div
            style={{
              marginTop: "15px",
              padding: "14px",
              borderRadius: "9px",
              border: `1px solid ${colors.border}`,
              background: colors.input,
            }}
          >
            <div style={{ color: colors.text, fontSize: "11px", fontWeight: "800" }}>
              Handover Notice
            </div>
            <div style={{ color: colors.muted, fontSize: "10px", marginTop: "3px" }}>
              {checklist.noticeIssued
                ? "Notice has been marked as issued."
                : "Issue the handover notice before final confirmation."}
            </div>

            {!checklist.noticeIssued && (
              <button
                type="button"
                onClick={markNoticeIssued}
                style={{
                  marginTop: "8px",
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
                Mark Notice Issued
              </button>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "18px", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => goToStep("clearance-checklist")}
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
              ← Checklist
            </button>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={saveDraft}
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
                Save Draft
              </button>

              <button
                type="button"
                onClick={confirmHandover}
                style={{
                  padding: "9px 14px",
                  borderRadius: "7px",
                  border: 0,
                  background: checklistComplete ? colors.green : colors.muted,
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: "800",
                  cursor: checklistComplete ? "pointer" : "not-allowed",
                }}
              >
                Confirm Field Handover
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default FieldHandover;
