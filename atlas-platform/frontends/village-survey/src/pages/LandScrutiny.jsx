import React, { useEffect, useMemo, useState } from "react";
import { useAtlas } from "../context/AtlasContext";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

const STEPS = [
  {
    key: "basic-info",
    title: "Basic Information",
    subtitle: "Official parcel and ownership details",
    icon: "📋",
  },
  {
    key: "field-evidence",
    title: "Field Evidence & Notes",
    subtitle: "Inspection observations and evidence capture",
    icon: "📷",
  },
  {
    key: "adjacent-parcels",
    title: "Adjacent Parcels",
    subtitle: "Neighbouring plots and cross-checks",
    icon: "🗺️",
  },
  {
    key: "documents",
    title: "Uploaded Documents",
    subtitle: "Supporting records and document review",
    icon: "📁",
  },
];

function LandScrutiny({ isDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    parcels = [],
    documents = [],
    updateParcel,
    addSyncItem,
    addActivity,
  } = useAtlas();

  const colors = {
    bg: isDarkMode ? "#0b1120" : "#f1f5f9",
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

  const routeStep = location.pathname.startsWith("/land-scrutiny/")
    ? location.pathname.split("/").pop()
    : null;

  const selectedSurveyNo =
    searchParams.get("survey") || parcels[0]?.surveyNo || "113";

  const selectedParcel =
    parcels.find((parcel) => String(parcel.surveyNo) === String(selectedSurveyNo)) ||
    parcels[0] ||
    null;

  const [toast, setToast] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedEvidenceType, setSelectedEvidenceType] = useState("Field Photography");
  const [newDocumentName, setNewDocumentName] = useState("");

  useEffect(() => {
    setNotes(selectedParcel?.scrutinyNotes ?? selectedParcel?.remarks ?? "");
  }, [selectedParcel?.surveyNo, selectedParcel?.scrutinyNotes, selectedParcel?.remarks]);

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => setToast(""), 2400);
  };

  const statusColor = (status) => {
    if (status === "Verified") return colors.green;
    if (status === "Pending") return colors.orange;
    if (status === "Missing RoR" || status === "Rejected") return colors.red;
    return colors.muted;
  };

  const goToStep = (stepKey) => {
    if (!selectedParcel) return;
    navigate(`/land-scrutiny/${stepKey}?survey=${encodeURIComponent(selectedParcel.surveyNo)}`);
  };

  const goBackToHub = () => {
    navigate(`/land-scrutiny?survey=${encodeURIComponent(selectedParcel?.surveyNo || "")}`);
  };

  const selectSurvey = (event) => {
    const surveyNo = event.target.value;
    setSearchParams({ survey: surveyNo });
  };

  const currentStepIndex = Math.max(
    0,
    STEPS.findIndex((step) => step.key === routeStep)
  );

  const linkedDocuments = useMemo(
    () =>
      (documents || []).filter(
        (doc) =>
          String(doc?.surveyNo ?? doc?.survey ?? "") ===
          String(selectedParcel?.surveyNo ?? "")
      ),
    [documents, selectedParcel?.surveyNo]
  );

  const saveNotes = () => {
    if (!selectedParcel) return;

    updateParcel(selectedParcel.surveyNo, {
      scrutinyNotes: notes,
      lastScrutinyAction: "Inspection notes updated",
    });

    addActivity?.({
      id: `SCR-NOTE-${Date.now()}`,
      type: "Land Scrutiny",
      action: "Inspection notes updated",
      surveyNo: selectedParcel.surveyNo,
      timestamp: new Date().toLocaleString(),
    });

    showToast(`Notes saved for Survey ${selectedParcel.surveyNo}`);
  };

  const markVerified = () => {
    if (!selectedParcel) return;

    updateParcel(selectedParcel.surveyNo, {
      recordStatus: "Verified",
      scrutinyStatus: "Verified",
      scrutinyNotes: notes,
      verifiedAt: new Date().toLocaleString(),
    });

    addActivity?.({
      id: `SCR-VER-${Date.now()}`,
      type: "Land Scrutiny",
      action: "Parcel marked verified",
      surveyNo: selectedParcel.surveyNo,
      timestamp: new Date().toLocaleString(),
    });

    showToast(`Survey ${selectedParcel.surveyNo} marked as verified`);
  };

  const reopenReview = () => {
    if (!selectedParcel) return;

    updateParcel(selectedParcel.surveyNo, {
      scrutinyStatus: "Pending",
      lastScrutinyAction: "Review reopened",
    });

    addActivity?.({
      id: `SCR-REOPEN-${Date.now()}`,
      type: "Land Scrutiny",
      action: "Review reopened",
      surveyNo: selectedParcel.surveyNo,
      timestamp: new Date().toLocaleString(),
    });

    showToast(`Review reopened for Survey ${selectedParcel.surveyNo}`);
  };

  const requestRoR = () => {
    if (!selectedParcel) return;

    updateParcel(selectedParcel.surveyNo, {
      recordStatus: "Missing RoR",
      scrutinyStatus: "Pending",
      lastScrutinyAction: "RoR requested",
    });

    addSyncItem?.({
      id: `ROR-${Date.now()}`,
      type: "Record Request",
      reference: `Survey ${selectedParcel.surveyNo}`,
      size: "0.8 KB",
      status: "Pending",
    });

    addActivity?.({
      id: `SCR-ROR-${Date.now()}`,
      type: "Land Scrutiny",
      action: "Record of Rights requested",
      surveyNo: selectedParcel.surveyNo,
      timestamp: new Date().toLocaleString(),
    });

    showToast("RoR request added to Offline / Sync");
  };

  const validateRecord = () => {
    if (!selectedParcel) return;

    updateParcel(selectedParcel.surveyNo, {
      validationStatus:
        selectedParcel.owner && selectedParcel.area && selectedParcel.classification
          ? "Passed"
          : "Needs Review",
      lastValidationAt: new Date().toLocaleString(),
    });

    showToast("Record validation completed");
  };

  const saveEvidence = () => {
    if (!selectedParcel) return;

    updateParcel(selectedParcel.surveyNo, {
      lastFieldEvidence: selectedEvidenceType,
      scrutinyNotes: notes,
      lastEvidenceAt: new Date().toLocaleString(),
    });

    addActivity?.({
      id: `SCR-EVID-${Date.now()}`,
      type: "Land Scrutiny",
      action: `${selectedEvidenceType} captured`,
      surveyNo: selectedParcel.surveyNo,
      timestamp: new Date().toLocaleString(),
    });

    addSyncItem?.({
      id: `EVID-${Date.now()}`,
      type: "Field Evidence",
      reference: `Survey ${selectedParcel.surveyNo}`,
      size: "1.4 MB",
      status: "Pending",
    });

    showToast(`${selectedEvidenceType} queued for synchronization`);
  };

  const exportParcel = () => {
    if (!selectedParcel) return;

    const rows = [
      ["Field", "Value"],
      ["Survey No.", selectedParcel.surveyNo],
      ["Landowner", selectedParcel.owner],
      ["Area", selectedParcel.area],
      ["Classification", selectedParcel.classification],
      ["Record Status", selectedParcel.recordStatus],
      ["Scrutiny Status", selectedParcel.scrutinyStatus],
      ["Dispute Status", selectedParcel.disputeStatus || "None"],
      ["Remarks", notes || selectedParcel.remarks || "—"],
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `land-scrutiny-${selectedParcel.surveyNo}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    showToast("Parcel scrutiny record exported");
  };

  const previousStep = currentStepIndex > 0 ? STEPS[currentStepIndex - 1] : null;
  const nextStep =
    currentStepIndex < STEPS.length - 1 ? STEPS[currentStepIndex + 1] : null;

  const adjacentDirections = {
    "107": "North-West",
    "112": "North",
    "114": "South",
    "116": "West",
    "117": "South",
  };

  const adjacentParcels = Object.entries(adjacentDirections)
    .map(([surveyNo, relation]) => {
      const parcel = parcels.find(
        (item) => String(item.surveyNo) === String(surveyNo)
      );
      if (!parcel || String(parcel.surveyNo) === String(selectedParcel?.surveyNo)) {
        return null;
      }
      return {
        ...parcel,
        relation,
        color: statusColor(parcel.recordStatus || parcel.scrutinyStatus || "Pending"),
      };
    })
    .filter(Boolean);

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
            Land Record Verification
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
            Land Scrutiny
          </h1>

          <p style={{ margin: "6px 0 0", color: colors.muted, fontSize: "14px" }}>
            Complete parcel verification through separate review sections
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <select
            value={selectedParcel?.surveyNo || ""}
            onChange={selectSurvey}
            style={{
              height: "36px",
              minWidth: "190px",
              padding: "0 10px",
              borderRadius: "7px",
              border: `1px solid ${colors.border}`,
              background: colors.input,
              color: colors.text,
              outline: "none",
              fontSize: "11px",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            {parcels.map((parcel) => (
              <option key={parcel.surveyNo} value={parcel.surveyNo}>
                Survey {parcel.surveyNo} — {parcel.owner}
              </option>
            ))}
          </select>

          <span
            style={{
              padding: "7px 10px",
              borderRadius: "7px",
              background: `${statusColor(selectedParcel?.scrutinyStatus)}18`,
              border: `1px solid ${statusColor(selectedParcel?.scrutinyStatus)}35`,
              color: statusColor(selectedParcel?.scrutinyStatus),
              fontSize: "10px",
              fontWeight: "800",
            }}
          >
            {selectedParcel?.scrutinyStatus || "Pending"}
          </span>
        </div>
      </div>

      {/* FORM PROGRESS / SUBDIVISIONS */}
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
            const completed =
              selectedParcel &&
              ((step.key === "basic-info" &&
                selectedParcel.recordStatus === "Verified") ||
                (step.key === "field-evidence" && selectedParcel.lastEvidenceAt) ||
                (step.key === "documents" && linkedDocuments.length > 0));

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
                  border: `1px solid ${
                    active ? colors.blue : colors.border
                  }`,
                  background: active
                    ? `${colors.blue}18`
                    : colors.input,
                  color: colors.text,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", gap: "9px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "17px" }}>{step.icon}</span>
                  <div style={{ minWidth: 0 }}>
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
                    {completed && (
                      <div
                        style={{
                          marginTop: "4px",
                          color: colors.green,
                          fontSize: "9px",
                          fontWeight: "800",
                        }}
                      >
                        ✓ Completed
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* HUB */}
      {!routeStep && (
        <>
          <section style={{ ...card, padding: "22px", marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "20px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    color: colors.cyan,
                    fontSize: "11px",
                    fontWeight: "800",
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                  }}
                >
                  Selected Parcel
                </div>
                <h2 style={{ margin: "6px 0 0", fontSize: "22px", fontWeight: "800" }}>
                  Survey {selectedParcel?.surveyNo} — {selectedParcel?.owner}
                </h2>
                <p style={{ margin: "6px 0 0", color: colors.muted, fontSize: "12px" }}>
                  Start with Basic Information and move through each section as a
                  controlled verification workflow.
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={validateRecord}
                  style={{
                    padding: "9px 13px",
                    borderRadius: "7px",
                    border: `1px solid ${colors.blue}`,
                    background: "transparent",
                    color: colors.blueSoft,
                    fontSize: "10px",
                    fontWeight: "800",
                    cursor: "pointer",
                  }}
                >
                  Validate Record
                </button>
                <button
                  type="button"
                  onClick={exportParcel}
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
                  Export Parcel
                </button>
              </div>
            </div>

            <div
              style={{
                marginTop: "20px",
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: "10px",
              }}
            >
              {[
                ["Survey No.", selectedParcel?.surveyNo, colors.cyan],
                ["Landowner", selectedParcel?.owner, colors.text],
                ["Area", selectedParcel?.area, colors.text],
                ["Record Status", selectedParcel?.recordStatus, statusColor(selectedParcel?.recordStatus)],
              ].map(([label, value, accent]) => (
                <div
                  key={label}
                  style={{
                    padding: "13px",
                    borderRadius: "9px",
                    background: colors.input,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    style={{
                      color: colors.muted,
                      fontSize: "9px",
                      fontWeight: "800",
                      textTransform: "uppercase",
                      marginBottom: "5px",
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ color: accent, fontSize: "12px", fontWeight: "800" }}>
                    {value || "—"}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div
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
                    transition: "transform .15s ease, border-color .15s ease",
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.borderColor = colors.blueSoft;
                    event.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.borderColor = colors.border;
                    event.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
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
                        flexShrink: 0,
                      }}
                    >
                      {step.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "800" }}>
                        {step.title}
                      </div>
                      <div
                        style={{
                          marginTop: "5px",
                          color: colors.muted,
                          fontSize: "11px",
                          lineHeight: 1.45,
                        }}
                      >
                        {step.subtitle}
                      </div>
                      <div
                        style={{
                          marginTop: "11px",
                          color: colors.blueSoft,
                          fontSize: "10px",
                          fontWeight: "800",
                        }}
                      >
                        Open section →
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {/* BASIC INFO */}
      {routeStep === "basic-info" && (
        <section style={{ ...card, padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "15px", alignItems: "flex-start", flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>
                📋 Basic Information
              </h2>
              <p style={{ margin: "5px 0 0", color: colors.muted, fontSize: "12px" }}>
                Review the official parcel identity and land record metadata.
              </p>
            </div>
            <button
              type="button"
              onClick={validateRecord}
              style={{
                padding: "8px 12px",
                borderRadius: "7px",
                border: `1px solid ${colors.blue}`,
                background: "transparent",
                color: colors.blueSoft,
                fontSize: "10px",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              Validate Record
            </button>
          </div>

          <div
            style={{
              marginTop: "18px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              borderTop: `1px solid ${colors.border}`,
            }}
          >
            {[
              ["Survey No.", selectedParcel?.surveyNo, colors.cyan],
              ["Landowner Name", selectedParcel?.owner, colors.text],
              ["Official Area", selectedParcel?.area, colors.text],
              ["Land Classification", selectedParcel?.classification, colors.text],
              ["Record Status", selectedParcel?.recordStatus, statusColor(selectedParcel?.recordStatus)],
              ["Dispute Status", selectedParcel?.disputeStatus || "None", selectedParcel?.disputeStatus && selectedParcel.disputeStatus !== "None" ? colors.red : colors.green],
              ["Scrutiny Status", selectedParcel?.scrutinyStatus, statusColor(selectedParcel?.scrutinyStatus)],
              ["Validation", selectedParcel?.validationStatus || "Not run", selectedParcel?.validationStatus === "Passed" ? colors.green : colors.orange],
            ].map(([label, value, accent]) => (
              <div key={label} style={{ padding: "15px 15px 15px 0", borderBottom: `1px solid ${colors.border}` }}>
                <div style={{ color: colors.muted, fontSize: "10px", fontWeight: "800", textTransform: "uppercase", marginBottom: "6px" }}>
                  {label}
                </div>
                <div style={{ color: accent, fontSize: "13px", fontWeight: "700" }}>{value || "—"}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={goBackToHub}
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
              ← Scrutiny Overview
            </button>

            <div style={{ display: "flex", gap: "8px" }}>
              {selectedParcel?.recordStatus === "Verified" ? (
                <button
                  type="button"
                  onClick={reopenReview}
                  style={{
                    padding: "9px 14px",
                    borderRadius: "7px",
                    border: `1px solid ${colors.orange}`,
                    background: "transparent",
                    color: colors.orange,
                    fontSize: "10px",
                    fontWeight: "800",
                    cursor: "pointer",
                  }}
                >
                  Reopen Review
                </button>
              ) : (
                <button
                  type="button"
                  onClick={markVerified}
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
                  ✓ Mark as Verified
                </button>
              )}

              {nextStep && (
                <button
                  type="button"
                  onClick={() => goToStep(nextStep.key)}
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
                  Next: {nextStep.title} →
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* FIELD EVIDENCE */}
      {routeStep === "field-evidence" && (
        <section style={{ ...card, padding: "22px" }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>
            📷 Field Evidence & Notes
          </h2>
          <p style={{ margin: "5px 0 0", color: colors.muted, fontSize: "12px" }}>
            Record inspection remarks and add the evidence item to the offline queue.
          </p>

          <div
            style={{
              marginTop: "18px",
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.1fr) minmax(280px, .9fr)",
              gap: "18px",
            }}
          >
            <div>
              <label style={{ display: "block", color: colors.muted, fontSize: "10px", fontWeight: "800", textTransform: "uppercase", marginBottom: "7px" }}>
                Inspection Notes
              </label>
              <textarea
                rows="12"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Enter field observations, owner remarks, boundary notes or document issues..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  resize: "vertical",
                  padding: "12px",
                  borderRadius: "8px",
                  border: `1px solid ${colors.border}`,
                  outline: "none",
                  background: colors.input,
                  color: colors.text,
                  fontSize: "13px",
                  lineHeight: 1.55,
                  fontFamily: "inherit",
                }}
              />

              <div style={{ display: "flex", gap: "8px", marginTop: "9px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={saveNotes}
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
                  Save Notes
                </button>

                <button
                  type="button"
                  onClick={requestRoR}
                  style={{
                    padding: "9px 14px",
                    borderRadius: "7px",
                    border: `1px solid ${colors.orange}`,
                    background: "transparent",
                    color: colors.orange,
                    fontSize: "10px",
                    fontWeight: "800",
                    cursor: "pointer",
                  }}
                >
                  Request Missing RoR
                </button>
              </div>
            </div>

            <div
              style={{
                padding: "16px",
                borderRadius: "10px",
                border: `1px solid ${colors.border}`,
                background: colors.input,
              }}
            >
              <div style={{ color: colors.text, fontSize: "12px", fontWeight: "800" }}>
                Evidence Capture
              </div>
              <div style={{ color: colors.muted, fontSize: "10px", marginTop: "4px" }}>
                Select the evidence type that is being recorded during this review.
              </div>

              {[
                "Field Photography",
                "Boundary Marker Check",
                "Owner Verification",
                "Land-use Observation",
              ].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedEvidenceType(type)}
                  style={{
                    width: "100%",
                    marginTop: "9px",
                    padding: "10px 11px",
                    textAlign: "left",
                    borderRadius: "7px",
                    border: `1px solid ${selectedEvidenceType === type ? colors.blue : colors.border}`,
                    background: selectedEvidenceType === type ? `${colors.blue}18` : "transparent",
                    color: selectedEvidenceType === type ? colors.blueSoft : colors.text,
                    fontSize: "10px",
                    fontWeight: "800",
                    cursor: "pointer",
                  }}
                >
                  {selectedEvidenceType === type ? "✓ " : "○ "}
                  {type}
                </button>
              ))}

              <button
                type="button"
                onClick={saveEvidence}
                style={{
                  width: "100%",
                  marginTop: "14px",
                  padding: "10px 12px",
                  border: 0,
                  borderRadius: "7px",
                  background: colors.blue,
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                Save Evidence
              </button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", gap: "8px" }}>
            <button
              type="button"
              onClick={() => goToStep(previousStep?.key || "basic-info")}
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
              onClick={() => goToStep(nextStep.key)}
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
              Next: {nextStep.title} →
            </button>
          </div>
        </section>
      )}

      {/* ADJACENT */}
      {routeStep === "adjacent-parcels" && (
        <section style={{ ...card, padding: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>
            🗺️ Adjacent Parcels
          </h2>
          <p style={{ margin: "5px 0 0", color: colors.muted, fontSize: "12px" }}>
            Cross-check neighbouring parcels without leaving the scrutiny workflow.
          </p>

          <div style={{ overflowX: "auto", marginTop: "16px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "650px" }}>
              <thead>
                <tr>
                  {["Survey No.", "Landowner", "Relation", "Status", "Review"].map((heading) => (
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
                {adjacentParcels.map((parcel) => (
                  <tr key={parcel.surveyNo}>
                    <td style={{ padding: "13px 10px 13px 0", borderBottom: `1px solid ${colors.border}` }}>
                      <button
                        type="button"
                        onClick={() => setSearchParams({ survey: String(parcel.surveyNo) })}
                        style={{ border: 0, background: "transparent", color: colors.cyan, fontSize: "12px", fontWeight: "800", cursor: "pointer" }}
                      >
                        {parcel.surveyNo}
                      </button>
                    </td>
                    <td style={{ padding: "13px 10px 13px 0", color: colors.text, fontSize: "12px", fontWeight: "700", borderBottom: `1px solid ${colors.border}` }}>
                      {parcel.owner}
                    </td>
                    <td style={{ padding: "13px 10px 13px 0", color: colors.muted, fontSize: "12px", borderBottom: `1px solid ${colors.border}` }}>
                      {parcel.relation}
                    </td>
                    <td style={{ padding: "13px 10px 13px 0", color: parcel.color, fontSize: "11px", fontWeight: "800", borderBottom: `1px solid ${colors.border}` }}>
                      ● {parcel.recordStatus || parcel.scrutinyStatus}
                    </td>
                    <td style={{ padding: "13px 0", borderBottom: `1px solid ${colors.border}` }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchParams({ survey: String(parcel.surveyNo) });
                          showToast(`Survey ${parcel.surveyNo} selected`);
                        }}
                        style={{ border: 0, background: "transparent", color: colors.blueSoft, fontSize: "11px", fontWeight: "800", cursor: "pointer" }}
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "18px" }}>
            <button
              type="button"
              onClick={goBackToHub}
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
              ← Scrutiny Overview
            </button>
            <button
              type="button"
              onClick={() => goToStep("documents")}
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
              Next: Documents →
            </button>
          </div>
        </section>
      )}

      {/* DOCUMENTS */}
      {routeStep === "documents" && (
        <section style={{ ...card, padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>
                📁 Uploaded Documents
              </h2>
              <p style={{ margin: "5px 0 0", color: colors.muted, fontSize: "12px" }}>
                Review documents linked to Survey {selectedParcel?.surveyNo}.
              </p>
            </div>

            <span
              style={{
                padding: "7px 10px",
                borderRadius: "7px",
                background: `${colors.cyan}15`,
                border: `1px solid ${colors.cyan}30`,
                color: colors.cyan,
                fontSize: "10px",
                fontWeight: "800",
              }}
            >
              {linkedDocuments.length} LINKED
            </span>
          </div>

          <div style={{ marginTop: "17px", display: "grid", gap: "9px" }}>
            {linkedDocuments.length ? (
              linkedDocuments.map((doc, index) => (
                <div
                  key={`${doc.id || doc.name}-${index}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px",
                    borderRadius: "8px",
                    background: colors.input,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div>
                    <div style={{ color: colors.text, fontSize: "12px", fontWeight: "700" }}>
                      {doc.type === "Field Evidence" ? "🖼️" : "📄"} {doc.name}
                    </div>
                    <div style={{ color: colors.muted, fontSize: "9px", marginTop: "3px" }}>
                      {doc.type || "Document"} · {doc.size || "—"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast(`Opening preview for ${doc.name}`)}
                    style={{ border: 0, background: "transparent", color: colors.blueSoft, fontSize: "10px", fontWeight: "800", cursor: "pointer" }}
                  >
                    View
                  </button>
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: "30px",
                  borderRadius: "9px",
                  border: `1px dashed ${colors.border}`,
                  color: colors.muted,
                  textAlign: "center",
                  fontSize: "11px",
                }}
              >
                No linked documents found for this parcel.
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: "15px",
              padding: "14px",
              borderRadius: "9px",
              background: colors.input,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div style={{ color: colors.text, fontSize: "12px", fontWeight: "800" }}>
              Add document reference
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "9px", flexWrap: "wrap" }}>
              <input
                value={newDocumentName}
                onChange={(event) => setNewDocumentName(event.target.value)}
                placeholder="e.g. RoR_115.pdf"
                style={{
                  flex: 1,
                  minWidth: "220px",
                  height: "38px",
                  boxSizing: "border-box",
                  padding: "0 10px",
                  borderRadius: "7px",
                  border: `1px solid ${colors.border}`,
                  background: colors.cardDark,
                  color: colors.text,
                  outline: "none",
                  fontSize: "11px",
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const name = newDocumentName.trim();
                  if (!name || !selectedParcel) {
                    showToast("Enter a document name first");
                    return;
                  }

                  addSyncItem?.({
                    id: `DOC-${Date.now()}`,
                    type: "Document Upload",
                    reference: `Survey ${selectedParcel.surveyNo}`,
                    name,
                    size: "Local",
                    status: "Pending",
                  });

                  setNewDocumentName("");
                  showToast(`${name} added to Offline / Sync`);
                }}
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
                Add to Queue
              </button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "18px", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => goToStep(previousStep.key)}
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

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={exportParcel}
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
                Export Record
              </button>
              <button
                type="button"
                onClick={goBackToHub}
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
                Finish Scrutiny
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default LandScrutiny;
