import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAtlas } from "../context/AtlasContext";
import { village } from "../data/atlasData";
import GISMap from "../components/GISMap";

const asArray = (value) => (Array.isArray(value) ? value : []);

const surveyOf = (parcel) =>
  String(parcel?.surveyNo ?? parcel?.survey ?? parcel?.id ?? "—");

const ownerOf = (parcel) =>
  parcel?.owner ?? parcel?.landowner ?? parcel?.ownerName ?? "Unknown";

const statusOf = (parcel) =>
  parcel?.recordStatus ?? parcel?.status ?? "Pending";

const officerIdOf = (officer) =>
  String(officer?.id ?? officer?.officerId ?? officer?.code ?? "");

const officerNameOf = (officer) =>
  officer?.name ??
  officer?.officerName ??
  officer?.fullName ??
  officerIdOf(officer) ??
  "Survey Officer";

const statusColor = (value, colors) => {
  const text = String(value ?? "").toLowerCase();
  if (
    text.includes("verified") ||
    text.includes("complete") ||
    text.includes("clear") ||
    text.includes("synced")
  ) {
    return colors.green;
  }
  if (
    text.includes("clash") ||
    text.includes("dispute") ||
    text.includes("missing") ||
    text.includes("reject") ||
    text.includes("inactive")
  ) {
    return colors.red;
  }
  if (
    text.includes("pending") ||
    text.includes("progress") ||
    text.includes("hold")
  ) {
    return colors.orange;
  }
  return colors.blue;
};

function Dashboard({ isDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const atlas = useAtlas() || {};

  const parcels = asArray(atlas.parcels);
  const objections = asArray(atlas.objections);
  const disputes = asArray(atlas.disputes);
  const surveyOfficers = asArray(atlas.surveyOfficers);
  const fieldVisits = asArray(atlas.fieldVisits);
  const syncQueue = asArray(atlas.syncQueue);

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

  const [parcelSearch, setParcelSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  const notify = (message) => setToast(message);

  const verifiedCount = parcels.filter((parcel) =>
    /verified|complete|clear/i.test(String(statusOf(parcel)))
  ).length;

  const pendingScrutiny = parcels.filter((parcel) =>
    /pending|missing/i.test(
      String(parcel?.scrutinyStatus ?? statusOf(parcel))
    )
  ).length;

  const activeDisputes = disputes.filter(
    (dispute) =>
      !/resolved|closed/i.test(String(dispute?.status ?? ""))
  ).length;

  const today = new Date().toISOString().slice(0, 10);

  const visitsToday = fieldVisits.filter((visit) =>
    String(
      visit?.date ??
        visit?.visitDate ??
        visit?.inspectionDate ??
        visit?.createdAt ??
        ""
    ).slice(0, 10) === today
  ).length;

  const pendingSync = syncQueue.filter((item) =>
    /pending|waiting|fail/i.test(String(item?.status ?? ""))
  ).length;

  const officerRows = useMemo(
    () =>
      surveyOfficers.map((officer) => {
        const assigned =
          Number(
            officer?.assigned ??
              officer?.assignedParcels ??
              officer?.totalAssigned ??
              0
          ) || 0;

        const completed =
          Number(
            officer?.completed ??
              officer?.completedSurveys ??
              0
          ) || 0;

        const progress =
          typeof officer?.progress === "number"
            ? officer.progress
            : assigned > 0
            ? Math.round((completed / assigned) * 100)
            : 0;

        return {
          ...officer,
          assigned,
          completed,
          progress: Math.max(0, Math.min(100, progress)),
        };
      }),
    [surveyOfficers]
  );

  const parcelRows = useMemo(() => {
    return parcels
      .filter((parcel) => {
        const text = [
          surveyOf(parcel),
          ownerOf(parcel),
          parcel?.classification ?? "",
          statusOf(parcel),
        ]
          .join(" ")
          .toLowerCase();

        const searchMatch = text.includes(parcelSearch.toLowerCase());

        const statusText = String(statusOf(parcel)).toLowerCase();

        const statusMatch =
          statusFilter === "all" ||
          (statusFilter === "verified" &&
            /verified|complete/i.test(statusText)) ||
          (statusFilter === "pending" &&
            /pending|missing/i.test(statusText)) ||
          (statusFilter === "clash" &&
            /clash|dispute/i.test(statusText));

        return searchMatch && statusMatch;
      })
      .slice(0, 12);
  }, [parcels, parcelSearch, statusFilter]);

  const fieldVisitCount = fieldVisits.length;
  const activeOfficerCount = surveyOfficers.filter(
    (officer) => !/inactive/i.test(String(officer?.status ?? ""))
  ).length;

  const stat = (label, value, sub, accent) => (
    <div
      style={{
        ...card,
        padding: "18px 20px",
        minHeight: "125px",
        position: "relative",
      }}
    >
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
      <div style={{ color: colors.muted, fontSize: "11px", fontWeight: "800" }}>
        {label}
      </div>
      <div
        style={{
          color: accent,
          fontSize: "32px",
          lineHeight: "1",
          fontWeight: "800",
          marginTop: "11px",
        }}
      >
        {value}
      </div>
      <div style={{ color: colors.muted, fontSize: "12px", marginTop: "7px" }}>
        {sub}
      </div>
    </div>
  );

  const button = (primary = false) => ({
    height: "38px",
    padding: "0 13px",
    borderRadius: "8px",
    border: primary ? 0 : `1px solid ${colors.border}`,
    background: primary ? colors.blue : colors.cardDark,
    color: primary ? "#fff" : colors.text,
    fontSize: "11px",
    fontWeight: "800",
    cursor: "pointer",
  });

  const header = (eyebrow, title, subtitle, action) => (
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

  const section = (title, subtitle, children, right = null) => (
    <section style={{ ...card, overflow: "hidden" }}>
      <div
        style={{
          padding: "18px 20px 15px",
          borderBottom: `1px solid ${colors.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "20px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              color: colors.text,
              fontSize: "19px",
              fontWeight: "800",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              margin: "4px 0 0",
              color: colors.muted,
              fontSize: "12px",
            }}
          >
            {subtitle}
          </p>
        </div>
        {right}
      </div>
      {children}
    </section>
  );

  const renderOverview = () => (
    <>
      {header(
        "Village Workbench",
        "Dashboard",
        `${village.name} · ${village.tehsil} Tehsil · ${village.district} District`,
        <button
          type="button"
          onClick={() => navigate("/land-scrutiny")}
          style={button(true)}
        >
          Open Workbench →
        </button>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,minmax(0,1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        {stat(
          "TOTAL VILLAGE PLOTS",
          village.totalPlots || parcels.length,
          "Assigned for acquisition",
          colors.cyan
        )}
        {stat(
          "VERIFIED PARCELS",
          verifiedCount || village.verifiedParcels || 0,
          "Current record state",
          colors.green
        )}
        {stat(
          "PENDING SCRUTINY",
          pendingScrutiny || village.pendingScrutiny || 0,
          "Documents requiring review",
          colors.orange
        )}
        {stat(
          "ACTIVE DISPUTES",
          activeDisputes || village.activeDisputes || 0,
          "Open escalation cases",
          colors.red
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1.2fr) minmax(0,.8fr)",
          gap: "20px",
          alignItems: "start",
        }}
      >
        {section(
          "🗺️ Village GIS Overview",
          "Parcel status map centered on Malhaur",
          <div style={{ padding: "15px 20px 20px" }}>
            <div
              style={{
                height: "360px",
                borderRadius: "11px",
                overflow: "hidden",
                border: `1px solid ${colors.border}`,
              }}
            >
              <GISMap isDarkMode={isDarkMode} />
            </div>

            <div
              style={{
                display: "flex",
                gap: "18px",
                marginTop: "10px",
                fontSize: "11px",
              }}
            >
              <span style={{ color: colors.green }}>● Verified</span>
              <span style={{ color: colors.orange }}>● Pending</span>
              <span style={{ color: colors.red }}>● Boundary Clash / Dispute</span>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "13px" }}>
              <button
                type="button"
                onClick={() => navigate("/boundary-check/gis-map")}
                style={button(true)}
              >
                Open GIS Workflow
              </button>
              <button
                type="button"
                onClick={() => navigate("/boundary-check")}
                style={button()}
              >
                Boundary Register
              </button>
            </div>
          </div>
        )}
        {section(
          "👥 Survey Officers",
          "Current field workload and progress",
          <div style={{ padding: "16px 20px 20px" }}>
            {officerRows.length ? (
              officerRows.slice(0, 3).map((officer) => (
                <button
                  key={
                    officerIdOf(officer) ||
                    officerNameOf(officer)
                  }
                  type="button"
                  onClick={() =>
                    navigate(
                      `/survey-officers/profile?officer=${encodeURIComponent(
                        officerIdOf(officer)
                      )}`
                    )
                  }
                  style={{
                    width: "100%",
                    border: 0,
                    background: "transparent",
                    padding: "13px 0",
                    borderBottom: `1px solid ${colors.border}`,
                    textAlign: "left",
                    color: colors.text,
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "10px",
                    }}
                  >
                    <span style={{ fontSize: "12px", fontWeight: "800" }}>
                      {officerNameOf(officer)}
                    </span>
                    <span
                      style={{
                        color: statusColor(
                          officer.status || "Active",
                          colors
                        ),
                        fontSize: "10px",
                        fontWeight: "800",
                      }}
                    >
                      {officer.status || "Active"}
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: "7px",
                      height: "7px",
                      background: isDarkMode ? "#33445e" : "#dbe3ed",
                      borderRadius: "20px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${officer.progress}%`,
                        height: "100%",
                        background: statusColor(
                          officer.status || "Active",
                          colors
                        ),
                        borderRadius: "20px",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "6px",
                      color: colors.muted,
                      fontSize: "9px",
                    }}
                  >
                    <span>
                      {officer.completed} completed / {officer.assigned} assigned
                    </span>
                    <span>{officer.progress}%</span>
                  </div>
                </button>
              ))
            ) : (
              <div style={{ padding: "20px 0", color: colors.muted, fontSize: "12px" }}>
                No survey officers available.
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate("/survey-officers")}
              style={{ ...button(), width: "100%", marginTop: "13px" }}
            >
              View All Officers →
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: "20px" }}>
        {section(
          "📋 Parcel Monitoring",
          "Live land acquisition records and current status",
          <>
            <div
              style={{
                padding: "15px 20px",
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) 170px",
                gap: "9px",
              }}
            >
              <input
                value={parcelSearch}
                onChange={(e) => setParcelSearch(e.target.value)}
                placeholder="Search survey number, landowner or classification..."
                style={{
                  ...button(),
                  height: "39px",
                  textAlign: "left",
                  paddingLeft: "12px",
                  boxSizing: "border-box",
                }}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ ...button(), height: "39px" }}
              >
                <option value="all">All Status</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="clash">Clash / Dispute</option>
              </select>
            </div>

            <div style={{ padding: "0 20px 20px", overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: "760px",
                  borderCollapse: "collapse",
                  fontSize: "12px",
                }}
              >
                <thead>
                  <tr>
                    {[
                      "Survey No.",
                      "Landowner",
                      "Area",
                      "Classification",
                      "Status",
                      "Action",
                    ].map((heading) => (
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
                  {parcelRows.map((parcel) => {
                    const survey = surveyOf(parcel);

                    return (
                      <tr key={survey}>
                        <td
                          style={{
                            padding: "12px 10px 12px 0",
                            color: colors.cyan,
                            fontWeight: "800",
                            borderBottom: `1px solid ${colors.border}`,
                          }}
                        >
                          {survey}
                        </td>
                        <td
                          style={{
                            padding: "12px 10px 12px 0",
                            color: colors.text,
                            fontWeight: "700",
                            borderBottom: `1px solid ${colors.border}`,
                          }}
                        >
                          {ownerOf(parcel)}
                        </td>
                        <td
                          style={{
                            padding: "12px 10px 12px 0",
                            color: colors.muted,
                            borderBottom: `1px solid ${colors.border}`,
                          }}
                        >
                          {parcel?.area ? `${parcel.area} Ha` : "—"}
                        </td>
                        <td
                          style={{
                            padding: "12px 10px 12px 0",
                            color: colors.muted,
                            borderBottom: `1px solid ${colors.border}`,
                          }}
                        >
                          {parcel?.classification || "—"}
                        </td>
                        <td
                          style={{
                            padding: "12px 10px 12px 0",
                            borderBottom: `1px solid ${colors.border}`,
                          }}
                        >
                          <span
                            style={{
                              color: statusColor(statusOf(parcel), colors),
                              fontSize: "10px",
                              fontWeight: "800",
                            }}
                          >
                            ● {statusOf(parcel)}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "12px 0",
                            borderBottom: `1px solid ${colors.border}`,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/land-scrutiny/basic-info?survey=${encodeURIComponent(
                                  survey
                                )}`
                              )
                            }
                            style={{
                              border: 0,
                              background: "transparent",
                              color: colors.blueSoft,
                              fontSize: "10px",
                              fontWeight: "800",
                              cursor: "pointer",
                            }}
                          >
                            Open →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {!parcelRows.length && (
                <div
                  style={{
                    padding: "28px 0 10px",
                    textAlign: "center",
                    color: colors.muted,
                    fontSize: "12px",
                  }}
                >
                  No parcels match the selected filter.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );

  const renderOperations = () => (
    <>
      {header(
        "Village Workbench",
        "Operations Monitor",
        "Live workload across scrutiny, field activity, disputes and synchronization",
        <button
          type="button"
          onClick={() => navigate("/field-visits")}
          style={button(true)}
        >
          Open Field Visits →
        </button>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,minmax(0,1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        {stat(
          "FIELD VISITS",
          fieldVisitCount,
          "All recorded field inspections",
          colors.orange
        )}
        {stat(
          "OPEN OBJECTIONS",
          objections.filter(
            (item) =>
              !/resolved|closed/i.test(String(item?.status ?? ""))
          ).length,
          "Pending public issues",
          colors.red
        )}
        {stat(
          "PENDING SYNC",
          pendingSync,
          "Records awaiting upload",
          colors.cyan
        )}
        {stat(
          "OFFICERS ACTIVE",
          activeOfficerCount,
          "Available field staff",
          colors.green
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
        }}
      >
        {section(
          "⚠️ Priority Actions",
          "Items that may require village clerk attention",
          <div style={{ padding: "10px 20px 18px" }}>
            {[
              [
                pendingScrutiny > 0,
                "Land scrutiny backlog",
                `${pendingScrutiny} parcel(s) need document review`,
                "/land-scrutiny",
                colors.orange,
              ],
              [
                activeDisputes > 0,
                "Active dispute cases",
                `${activeDisputes} open escalation case(s)`,
                "/disputes",
                colors.red,
              ],
              [
                pendingSync > 0,
                "Offline sync queue",
                `${pendingSync} local record(s) awaiting synchronization`,
                "/sync/queue",
                colors.cyan,
              ],
              [
                visitsToday > 0,
                "Today's field operations",
                `${visitsToday} visit(s) recorded today`,
                "/field-visits",
                colors.green,
              ],
            ].map(([show, title, sub, route, accent]) =>
              show ? (
                <button
                  key={title}
                  type="button"
                  onClick={() => navigate(route)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "13px 0",
                    border: 0,
                    borderBottom: `1px solid ${colors.border}`,
                    background: "transparent",
                    color: colors.text,
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      width: "9px",
                      height: "9px",
                      borderRadius: "50%",
                      background: accent,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", fontSize: "12px", fontWeight: "800" }}>
                      {title}
                    </span>
                    <span style={{ display: "block", color: colors.muted, fontSize: "10px", marginTop: "3px" }}>
                      {sub}
                    </span>
                  </span>
                  <span style={{ color: colors.blueSoft, fontSize: "10px", fontWeight: "800" }}>
                    Open →
                  </span>
                </button>
              ) : null
            )}

            {pendingScrutiny === 0 &&
              activeDisputes === 0 &&
              pendingSync === 0 &&
              visitsToday === 0 && (
                <div style={{ padding: "24px 0 12px", color: colors.muted, textAlign: "center", fontSize: "12px" }}>
                  No urgent workflow exceptions currently detected.
                </div>
              )}
          </div>
        )}

        {section(
          "🔗 Quick Workflow",
          "Jump directly into a current acquisition task",
          <div style={{ padding: "16px 20px 20px", display: "grid", gap: "9px" }}>
            <button type="button" onClick={() => navigate("/land-scrutiny")} style={button(true)}>
              1. Land Scrutiny
            </button>
            <button type="button" onClick={() => navigate("/boundary-check")} style={button()}>
              2. Boundary / GIS
            </button>
            <button type="button" onClick={() => navigate("/notifications")} style={button()}>
              3. Notifications &amp; Objections
            </button>
            <button type="button" onClick={() => navigate("/disputes")} style={button()}>
              4. Dispute Escalation
            </button>
            <button type="button" onClick={() => navigate("/field-handover")} style={button()}>
              5. Field Handover
            </button>
          </div>
        )}
      </div>
    </>
  );

  const renderAnalytics = () => {
    const total = Math.max(parcels.length, 1);

    return (
      <>
        {header(
          "Village Workbench",
          "Progress Analytics",
          "At-a-glance monitoring of parcel, field and exception workload",
          <button
            type="button"
            onClick={() => navigate("/land-scrutiny")}
            style={button()}
          >
            Open Detailed Scrutiny
          </button>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1.1fr) minmax(0,.9fr)",
            gap: "20px",
          }}
        >
          {section(
            "📊 Parcel Progress",
            "Current frontend state across village parcel records",
            <div style={{ padding: "20px" }}>
              {[
                [
                  "Verified / Cleared",
                  Math.round((verifiedCount / total) * 100),
                  colors.green,
                ],
                [
                  "Pending / Missing",
                  Math.round((pendingScrutiny / total) * 100),
                  colors.orange,
                ],
                [
                  "Exceptions / Disputes",
                  Math.round((activeDisputes / total) * 100),
                  colors.red,
                ],
              ].map(([label, percent, accent]) => (
                <div key={label} style={{ marginBottom: "18px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "7px",
                    }}
                  >
                    <span style={{ color: colors.text, fontSize: "11px", fontWeight: "700" }}>
                      {label}
                    </span>
                    <span style={{ color: accent, fontSize: "11px", fontWeight: "800" }}>
                      {Math.min(100, percent)}%
                    </span>
                  </div>

                  <div
                    style={{
                      height: "9px",
                      borderRadius: "20px",
                      background: isDarkMode ? "#33445e" : "#dbe3ed",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, percent)}%`,
                        height: "100%",
                        background: accent,
                        borderRadius: "20px",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {section(
            "🧭 Workflow Coverage",
            "Current records available in connected modules",
            <div style={{ padding: "20px" }}>
              {[
                ["Parcels", parcels.length, "/land-scrutiny"],
                ["Objections", objections.length, "/notifications"],
                ["Disputes", disputes.length, "/disputes"],
                ["Survey Officers", surveyOfficers.length, "/survey-officers"],
                ["Field Visits", fieldVisits.length, "/field-visits"],
                ["Sync Queue", syncQueue.length, "/sync"],
              ].map(([label, value, route]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => navigate(route)}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "11px 0",
                    border: 0,
                    borderBottom: `1px solid ${colors.border}`,
                    background: "transparent",
                    color: colors.text,
                    cursor: "pointer",
                  }}
                >
                  <span style={{ color: colors.muted, fontSize: "11px" }}>{label}</span>
                  <span style={{ color: colors.blueSoft, fontSize: "12px", fontWeight: "800" }}>
                    {value} →
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </>
    );
  };

  const normalizedPath = location.pathname.replace(/\/+$/, "") || "/";

  let content = renderOverview();

  if (
    normalizedPath === "/dashboard/operations" ||
    normalizedPath === "/dashboard/operations/"
  ) {
    content = renderOperations();
  } else if (
    normalizedPath === "/dashboard/analytics" ||
    normalizedPath === "/dashboard/analytics/"
  ) {
    content = renderAnalytics();
  } else {
    content = renderOverview();
  }

  return (
    <div
      style={{
        width: "100%",
        color: colors.text,
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
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
          ["/dashboard", "1. Overview"],
          ["/dashboard/operations", "2. Operations"],
          ["/dashboard/analytics", "3. Analytics"],
        ].map(([route, label]) => {
          const active =
            normalizedPath === route ||
            (route === "/dashboard" && normalizedPath === "/");

          return (
            <button
              key={route}
              type="button"
              onClick={() => navigate(route)}
              style={{
                height: "32px",
                padding: "0 11px",
                borderRadius: "7px",
                border: `1px solid ${
                  active ? colors.blue : colors.border
                }`,
                background: active
                  ? `${colors.blue}18`
                  : "transparent",
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

export default Dashboard;
