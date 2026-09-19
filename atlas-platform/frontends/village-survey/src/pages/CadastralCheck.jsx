import React, { useEffect, useMemo, useState } from "react";
import { useAtlas } from "../context/AtlasContext";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import GISMap from "../components/GISMap";

const STEPS = [
  {
    key: "parcel-info",
    title: "Parcel Information",
    subtitle: "Official parcel and ownership details",
    icon: "📋",
  },
  {
    key: "gis-map",
    title: "GIS Map",
    subtitle: "Inspect location and map context",
    icon: "🗺️",
  },
  {
    key: "verification",
    title: "Boundary Verification",
    subtitle: "Record findings and boundary status",
    icon: "🔍",
  },
  {
    key: "adjacent-parcels",
    title: "Adjacent Parcels",
    subtitle: "Cross-check neighbouring survey numbers",
    icon: "📍",
  },
];

function BoundaryCheck({ isDarkMode }) {
  const { parcels = [], updateParcel, addActivity, addSyncItem } = useAtlas();

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const colors = {
    bg: isDarkMode ? "#0b1120" : "#f1f5f9",
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

  const routeStep = location.pathname.startsWith("/boundary-check/")
    ? location.pathname.split("/").pop()
    : null;

  const selectedSurveyNo =
    searchParams.get("survey") || parcels.find((p) => String(p.surveyNo) === "115")?.surveyNo || parcels[0]?.surveyNo || "115";

  const selectedParcel =
    parcels.find((p) => String(p.surveyNo) === String(selectedSurveyNo)) ||
    parcels[0] ||
    null;

  const [toast, setToast] = useState("");
  const [remarks, setRemarks] = useState("");
  const [finding, setFinding] = useState("Boundary clash detected");
  const [confidence, setConfidence] = useState("Field verification required");

  useEffect(() => {
    setRemarks(
      selectedParcel?.boundaryRemarks ??
        selectedParcel?.remarks ??
        selectedParcel?.disputeRemarks ??
        ""
    );

    const savedFinding =
      selectedParcel?.boundaryFinding ??
      (selectedParcel?.disputeStatus && selectedParcel.disputeStatus !== "None"
        ? "Boundary clash detected"
        : "Matched with surrounding records");

    setFinding(savedFinding);
    setConfidence(
      selectedParcel?.boundaryConfidence ?? "Field verification required"
    );
  }, [
    selectedParcel?.surveyNo,
    selectedParcel?.boundaryRemarks,
    selectedParcel?.remarks,
    selectedParcel?.disputeStatus,
    selectedParcel?.boundaryFinding,
    selectedParcel?.boundaryConfidence,
  ]);

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => setToast(""), 2400);
  };

  const statusColor = (status) => {
    if (status === "Verified" || status === "Clear" || status === "Matched")
      return colors.green;
    if (status === "Pending" || status === "Review Required")
      return colors.orange;
    if (
      status === "Boundary Clash" ||
      status === "Conflict" ||
      status === "Disputed"
    )
      return colors.red;
    return colors.muted;
  };

  const boundaryStatus =
    selectedParcel?.boundaryStatus ??
    (selectedParcel?.disputeStatus &&
    selectedParcel.disputeStatus !== "None"
      ? "Boundary Clash"
      : "Pending");

  const adjacentDirections = {
    "107": "North-West",
    "112": "North",
    "114": "South",
    "116": "West",
    "117": "South",
    "118": "South-East",
  };

  const adjacentParcels = useMemo(
    () =>
      Object.entries(adjacentDirections)
        .map(([surveyNo, relation]) => {
          const parcel = parcels.find(
            (item) => String(item.surveyNo) === String(surveyNo)
          );
          if (!parcel || String(parcel.surveyNo) === String(selectedParcel?.surveyNo)) {
            return null;
          }

          const parcelStatus =
            parcel.boundaryStatus ??
            (parcel.disputeStatus && parcel.disputeStatus !== "None"
              ? "Boundary Clash"
              : parcel.recordStatus ?? "Pending");

          return {
            ...parcel,
            relation,
            status: parcelStatus,
            color: statusColor(parcelStatus),
          };
        })
        .filter(Boolean),
    [parcels, selectedParcel?.surveyNo]
  );

  const goToStep = (stepKey) => {
    if (!selectedParcel) return;
    navigate(
      `/boundary-check/${stepKey}?survey=${encodeURIComponent(
        selectedParcel.surveyNo
      )}`
    );
  };

  const goOverview = () => {
    navigate(
      `/boundary-check?survey=${encodeURIComponent(
        selectedParcel?.surveyNo || ""
      )}`
    );
  };

  const selectSurvey = (event) => {
    setSearchParams({ survey: event.target.value });
  };

  const saveVerification = () => {
    if (!selectedParcel) return;

    updateParcel(selectedParcel.surveyNo, {
      boundaryStatus:
        finding === "Boundary cleared"
          ? "Clear"
          : finding === "Adjacent plot mismatch"
          ? "Review Required"
          : "Boundary Clash",
      boundaryFinding: finding,
      boundaryConfidence: confidence,
      boundaryRemarks: remarks,
      boundaryCheckedAt: new Date().toLocaleString(),
    });

    addActivity?.({
      id: `BC-CHECK-${Date.now()}`,
      type: "Boundary Check",
      action: `Boundary finding recorded: ${finding}`,
      surveyNo: selectedParcel.surveyNo,
      timestamp: new Date().toLocaleString(),
    });

    addSyncItem?.({
      id: `BC-SYNC-${Date.now()}`,
      type: "Boundary Verification",
      reference: `Survey ${selectedParcel.surveyNo}`,
      size: "1.1 KB",
      status: "Pending",
    });

    showToast(`Boundary verification saved for Survey ${selectedParcel.surveyNo}`);
  };

  const markBoundaryClear = () => {
    if (!selectedParcel) return;

    updateParcel(selectedParcel.surveyNo, {
      boundaryStatus: "Clear",
      boundaryFinding: "Boundary cleared",
      boundaryConfidence: "Verified on field records",
      boundaryRemarks: remarks,
      disputeStatus: "None",
      boundaryCheckedAt: new Date().toLocaleString(),
    });

    addActivity?.({
      id: `BC-CLEAR-${Date.now()}`,
      type: "Boundary Check",
      action: "Boundary marked clear",
      surveyNo: selectedParcel.surveyNo,
      timestamp: new Date().toLocaleString(),
    });

    showToast(`Survey ${selectedParcel.surveyNo} boundary marked clear`);
  };

  const raiseConflict = () => {
    if (!selectedParcel) return;

    updateParcel(selectedParcel.surveyNo, {
      boundaryStatus: "Boundary Clash",
      boundaryFinding: "Boundary clash detected",
      boundaryConfidence: confidence,
      boundaryRemarks: remarks,
      disputeStatus: "Active",
      boundaryCheckedAt: new Date().toLocaleString(),
    });

    addActivity?.({
      id: `BC-RAISE-${Date.now()}`,
      type: "Boundary Check",
      action: "Boundary conflict raised",
      surveyNo: selectedParcel.surveyNo,
      timestamp: new Date().toLocaleString(),
    });

    addSyncItem?.({
      id: `BC-CONFLICT-${Date.now()}`,
      type: "Boundary Conflict",
      reference: `Survey ${selectedParcel.surveyNo}`,
      size: "2.0 KB",
      status: "Pending",
    });

    showToast(`Boundary conflict raised for Survey ${selectedParcel.surveyNo}`);
  };

  const openLandScrutiny = () => {
    if (!selectedParcel) return;
    navigate(
      `/land-scrutiny/basic-info?survey=${encodeURIComponent(
        selectedParcel.surveyNo
      )}`
    );
  };

  const openDispute = () => {
    if (!selectedParcel) return;
    navigate(
      `/disputes?survey=${encodeURIComponent(selectedParcel.surveyNo)}`
    );
  };

  const openHandover = () => {
    if (!selectedParcel) return;
    navigate(
      `/field-handover?survey=${encodeURIComponent(selectedParcel.surveyNo)}`
    );
  };

  const exportBoundaryReport = () => {
    if (!selectedParcel) return;

    const rows = [
      ["Field", "Value"],
      ["Survey No.", selectedParcel.surveyNo],
      ["Landowner", selectedParcel.owner],
      ["Area", selectedParcel.area],
      ["Classification", selectedParcel.classification],
      ["Boundary Status", boundaryStatus],
      ["Finding", finding],
      ["Confidence", confidence],
      ["Remarks", remarks || "—"],
      ["Checked At", selectedParcel.boundaryCheckedAt || "—"],
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
    link.download = `boundary-check-${selectedParcel.surveyNo}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    showToast("Boundary report exported");
  };

  const currentStepIndex = Math.max(
    0,
    STEPS.findIndex((step) => step.key === routeStep)
  );

  const previousStep =
    currentStepIndex > 0 ? STEPS[currentStepIndex - 1] : null;
  const nextStep =
    currentStepIndex < STEPS.length - 1
      ? STEPS[currentStepIndex + 1]
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
            GIS & Boundary Verification
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
            Boundary Check
          </h1>

          <p style={{ margin: "6px 0 0", color: colors.muted, fontSize: "14px" }}>
            Verify parcel boundaries, inspect the GIS map and record discrepancies
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
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
              background: `${statusColor(boundaryStatus)}18`,
              border: `1px solid ${statusColor(boundaryStatus)}35`,
              color: statusColor(boundaryStatus),
              fontSize: "10px",
              fontWeight: "800",
            }}
          >
            {boundaryStatus}
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
          <section style={{ ...card, padding: "22px", marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "18px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    color: colors.cyan,
                    fontSize: "11px",
                    fontWeight: "800",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                  }}
                >
                  Selected Parcel
                </div>
                <h2 style={{ margin: "6px 0 0", fontSize: "22px", fontWeight: "800" }}>
                  Survey {selectedParcel?.surveyNo} — {selectedParcel?.owner}
                </h2>
                <p style={{ margin: "6px 0 0", color: colors.muted, fontSize: "12px" }}>
                  Complete the boundary workflow one section at a time.
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={openLandScrutiny}
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
                  ← Land Scrutiny
                </button>

                <button
                  type="button"
                  onClick={openDispute}
                  style={{
                    padding: "9px 13px",
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

            <div
              style={{
                marginTop: "19px",
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: "10px",
              }}
            >
              {[
                ["Survey No.", selectedParcel?.surveyNo, colors.cyan],
                ["Landowner", selectedParcel?.owner, colors.text],
                ["Boundary Status", boundaryStatus, statusColor(boundaryStatus)],
                ["Dispute Status", selectedParcel?.disputeStatus || "None", selectedParcel?.disputeStatus === "None" || !selectedParcel?.disputeStatus ? colors.green : colors.red],
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
                    <div style={{ marginTop: "5px", color: colors.muted, fontSize: "11px", lineHeight: 1.45 }}>
                      {step.subtitle}
                    </div>
                    <div style={{ marginTop: "11px", color: colors.blueSoft, fontSize: "10px", fontWeight: "800" }}>
                      Open section →
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </section>
        </>
      )}

      {/* PARCEL INFO */}
      {routeStep === "parcel-info" && (
        <section style={{ ...card, padding: "22px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>
              📋 Parcel Information
            </h2>
            <p style={{ margin: "5px 0 0", color: colors.muted, fontSize: "12px" }}>
              Official information for the selected survey parcel.
            </p>
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
              ["Boundary Status", boundaryStatus, statusColor(boundaryStatus)],
              ["Dispute Status", selectedParcel?.disputeStatus || "None", selectedParcel?.disputeStatus === "None" || !selectedParcel?.disputeStatus ? colors.green : colors.red],
              ["Checked At", selectedParcel?.boundaryCheckedAt || "Not checked", colors.muted],
            ].map(([label, value, accent]) => (
              <div key={label} style={{ padding: "15px 15px 15px 0", borderBottom: `1px solid ${colors.border}` }}>
                <div style={{ color: colors.muted, fontSize: "10px", fontWeight: "800", textTransform: "uppercase", marginBottom: "6px" }}>
                  {label}
                </div>
                <div style={{ color: accent, fontSize: "13px", fontWeight: "700" }}>
                  {value || "—"}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", gap: "8px" }}>
            <button
              type="button"
              onClick={goOverview}
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
              ← Boundary Overview
            </button>

            <button
              type="button"
              onClick={() => goToStep("gis-map")}
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
              Next: GIS Map →
            </button>
          </div>
        </section>
      )}

      {/* GIS MAP */}
      {routeStep === "gis-map" && (
        <section style={{ ...card, padding: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "15px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>
                🗺️ GIS Map — Malhaur
              </h2>
              <p style={{ margin: "5px 0 0", color: colors.muted, fontSize: "12px" }}>
                Location context for Survey {selectedParcel?.surveyNo}
              </p>
            </div>

            <span
              style={{
                padding: "7px 10px",
                borderRadius: "7px",
                background: `${statusColor(boundaryStatus)}18`,
                border: `1px solid ${statusColor(boundaryStatus)}35`,
                color: statusColor(boundaryStatus),
                fontSize: "10px",
                fontWeight: "800",
              }}
            >
              {boundaryStatus}
            </span>
          </div>

          <div
            style={{
              marginTop: "16px",
              height: "420px",
              borderRadius: "10px",
              overflow: "hidden",
              border: `1px solid ${colors.border}`,
            }}
          >
            <GISMap />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px", gap: "8px" }}>
            <button
              type="button"
              onClick={() => goToStep("parcel-info")}
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
              onClick={() => goToStep("verification")}
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
              Next: Boundary Verification →
            </button>
          </div>
        </section>
      )}

      {/* VERIFICATION */}
      {routeStep === "verification" && (
        <section style={{ ...card, padding: "20px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>
              🔍 Boundary Verification
            </h2>
            <p style={{ margin: "5px 0 0", color: colors.muted, fontSize: "12px" }}>
              Record the observed boundary condition and field remarks.
            </p>
          </div>

          <div
            style={{
              marginTop: "18px",
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.15fr) minmax(280px, .85fr)",
              gap: "18px",
            }}
          >
            <div>
              <label style={{ display: "block", color: colors.muted, fontSize: "10px", fontWeight: "800", textTransform: "uppercase", marginBottom: "7px" }}>
                Boundary Finding
              </label>

              {[
                "Boundary clash detected",
                "Adjacent plot mismatch",
                "Boundary cleared",
              ].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFinding(option)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "11px 12px",
                    marginBottom: "8px",
                    borderRadius: "7px",
                    border: `1px solid ${
                      finding === option ? colors.blue : colors.border
                    }`,
                    background:
                      finding === option ? `${colors.blue}18` : colors.input,
                    color: finding === option ? colors.blueSoft : colors.text,
                    fontSize: "11px",
                    fontWeight: "800",
                    cursor: "pointer",
                  }}
                >
                  {finding === option ? "✓ " : "○ "}
                  {option}
                </button>
              ))}

              <label style={{ display: "block", color: colors.muted, fontSize: "10px", fontWeight: "800", textTransform: "uppercase", margin: "15px 0 7px" }}>
                Remarks
              </label>

              <textarea
                rows="9"
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                placeholder="Describe boundary markers, overlaps, measurements, adjoining plots and field observations..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  resize: "vertical",
                  padding: "12px",
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
            </div>

            <div
              style={{
                padding: "16px",
                borderRadius: "9px",
                background: colors.input,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div style={{ color: colors.text, fontSize: "12px", fontWeight: "800" }}>
                Verification Confidence
              </div>

              {[
                "Field verification required",
                "Supported by records",
                "Verified on field records",
              ].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setConfidence(option)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    marginTop: "9px",
                    padding: "10px",
                    borderRadius: "7px",
                    border: `1px solid ${
                      confidence === option ? colors.cyan : colors.border
                    }`,
                    background:
                      confidence === option ? `${colors.cyan}13` : "transparent",
                    color: confidence === option ? colors.cyan : colors.text,
                    fontSize: "10px",
                    fontWeight: "800",
                    cursor: "pointer",
                  }}
                >
                  {confidence === option ? "✓ " : "○ "}
                  {option}
                </button>
              ))}

              <button
                type="button"
                onClick={saveVerification}
                style={{
                  width: "100%",
                  marginTop: "15px",
                  padding: "10px",
                  border: 0,
                  borderRadius: "7px",
                  background: colors.blue,
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                Save Verification
              </button>

              <button
                type="button"
                onClick={markBoundaryClear}
                style={{
                  width: "100%",
                  marginTop: "8px",
                  padding: "10px",
                  borderRadius: "7px",
                  border: `1px solid ${colors.green}`,
                  background: "transparent",
                  color: colors.green,
                  fontSize: "10px",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                ✓ Mark Boundary Clear
              </button>

              <button
                type="button"
                onClick={raiseConflict}
                style={{
                  width: "100%",
                  marginTop: "8px",
                  padding: "10px",
                  borderRadius: "7px",
                  border: `1px solid ${colors.red}`,
                  background: "transparent",
                  color: colors.red,
                  fontSize: "10px",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                ⚠ Raise Boundary Conflict
              </button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "18px", gap: "8px" }}>
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
              ← GIS Map
            </button>

            <button
              type="button"
              onClick={() => goToStep("adjacent-parcels")}
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
              Next: Adjacent Parcels →
            </button>
          </div>
        </section>
      )}

      {/* ADJACENT PARCELS */}
      {routeStep === "adjacent-parcels" && (
        <section style={{ ...card, padding: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "15px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>
                📍 Adjacent Parcels
              </h2>
              <p style={{ margin: "5px 0 0", color: colors.muted, fontSize: "12px" }}>
                Cross-check neighbouring parcels for conflicts or mismatches.
              </p>
            </div>

            <button
              type="button"
              onClick={exportBoundaryReport}
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
              Export Boundary Report
            </button>
          </div>

          <div style={{ marginTop: "16px", overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "650px",
              }}
            >
              <thead>
                <tr>
                  {["Survey No.", "Landowner", "Relation", "Status", "Action"].map(
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
                {adjacentParcels.map((parcel) => (
                  <tr key={parcel.surveyNo}>
                    <td style={{ padding: "13px 10px 13px 0", borderBottom: `1px solid ${colors.border}` }}>
                      <button
                        type="button"
                        onClick={() =>
                          setSearchParams({ survey: String(parcel.surveyNo) })
                        }
                        style={{
                          border: 0,
                          background: "transparent",
                          color: colors.cyan,
                          fontSize: "12px",
                          fontWeight: "800",
                          cursor: "pointer",
                        }}
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
                      ● {parcel.status}
                    </td>

                    <td style={{ padding: "13px 0", borderBottom: `1px solid ${colors.border}` }}>
                      <button
                        type="button"
                        onClick={() =>
                          setSearchParams({ survey: String(parcel.surveyNo) })
                        }
                        style={{
                          border: 0,
                          background: "transparent",
                          color: colors.blueSoft,
                          fontSize: "11px",
                          fontWeight: "800",
                          cursor: "pointer",
                        }}
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginTop: "16px",
              padding: "13px",
              borderRadius: "8px",
              border: `1px solid ${
                boundaryStatus === "Boundary Clash" ? colors.red : colors.orange
              }35`,
              background: `${
                boundaryStatus === "Boundary Clash" ? colors.red : colors.orange
              }0d`,
            }}
          >
            <div
              style={{
                color:
                  boundaryStatus === "Boundary Clash"
                    ? colors.red
                    : colors.orange,
                fontWeight: "800",
                fontSize: "12px",
              }}
            >
              {boundaryStatus === "Boundary Clash"
                ? "⚠ Boundary Discrepancy Detected"
                : "ℹ Boundary Review Status"}
            </div>

            <div
              style={{
                color: colors.muted,
                fontSize: "11px",
                marginTop: "4px",
                lineHeight: 1.45,
              }}
            >
              {finding}. {remarks || "Add field remarks in Boundary Verification."}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "8px",
              marginTop: "18px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => goToStep("verification")}
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
                onClick={openDispute}
                style={{
                  padding: "9px 14px",
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

              <button
                type="button"
                onClick={openHandover}
                style={{
                  padding: "9px 14px",
                  borderRadius: "7px",
                  border: `1px solid ${colors.green}`,
                  background: "transparent",
                  color: colors.green,
                  fontSize: "10px",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                Open Field Handover
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
                Finish Boundary Check
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default BoundaryCheck;
