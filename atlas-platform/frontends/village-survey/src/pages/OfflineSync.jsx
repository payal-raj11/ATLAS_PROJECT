import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAtlas } from "../context/AtlasContext";

const getQueueId = (item) => item?.id || item?.queueId || item?.syncId || `SYNC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const getQueueType = (item) => item?.type || item?.entityType || "Offline Record";
const getQueueRef = (item) => item?.reference || item?.surveyNo || item?.survey || item?.ref || "Local record";
const getQueueStatus = (item) => item?.status || "Pending";
const getQueueSize = (item) => item?.size || item?.fileSize || "—";

function OfflineSync({ isDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const atlas = useAtlas();

  const {
    syncQueue: rawQueue = [],
    addActivity,
    updateSyncItem,
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

  const [online, setOnline] = useState(() => navigator.onLine);
  const [lastSync, setLastSync] = useState("2 min ago");
  const [lastSyncClock, setLastSyncClock] = useState("09:42 AM");
  const [search, setSearch] = useState("");
  const [queueFilter, setQueueFilter] = useState("all");
  const [storagePercent, setStoragePercent] = useState(68);
  const [toast, setToast] = useState("");

  const fallbackQueue = useMemo(
    () => [
      { id: "FV-2025-019", type: "Field Visit", reference: "Survey 120", size: "2.4 KB", status: "Pending" },
      { id: "FV-2025-018", type: "Field Evidence", reference: "Survey 121", size: "1.8 MB", status: "Pending" },
      { id: "SO-003", type: "Officer Activity", reference: "Iqbal Khan", size: "3.1 KB", status: "Pending" },
    ],
    []
  );

  const queue = rawQueue.length ? rawQueue : fallbackQueue;

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  const filteredQueue = queue.filter((item) => {
    const text = `${getQueueId(item)} ${getQueueType(item)} ${getQueueRef(item)} ${getQueueStatus(item)}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const status = String(getQueueStatus(item)).toLowerCase();
    const matchesFilter =
      queueFilter === "all" ||
      (queueFilter === "pending" && status.includes("pending")) ||
      (queueFilter === "failed" && status.includes("fail")) ||
      (queueFilter === "synced" && status.includes("sync"));
    return matchesSearch && matchesFilter;
  });

  const pendingItems = queue.filter((item) => String(getQueueStatus(item)).toLowerCase().includes("pending"));
  const failedItems = queue.filter((item) => String(getQueueStatus(item)).toLowerCase().includes("fail"));
  const syncedItems = queue.filter((item) => String(getQueueStatus(item)).toLowerCase().includes("sync"));

  const syncItems = [
    { name: "Land records", records: "432 records", status: "Synced", time: "2 min ago", accent: colors.green },
    { name: "Cadastral data", records: "432 parcels", status: "Synced", time: "4 min ago", accent: colors.green },
    { name: "Field evidence", records: "86 files", status: "Synced", time: "8 min ago", accent: colors.green },
    { name: "Survey activities", records: `${Math.max(65, pendingItems.length)} records`, status: pendingItems.length ? "Pending" : "Synced", time: pendingItems.length ? "Waiting for network" : "Just now", accent: pendingItems.length ? colors.orange : colors.green },
    { name: "Notifications", records: "14 records", status: "Synced", time: "11 min ago", accent: colors.green },
  ];

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

  const notify = (message) => setToast(message);

  const syncNow = () => {
    if (!online) {
      notify("Sync paused — device is offline");
      return;
    }

    const now = new Date();
    setLastSync("Just now");
    setLastSyncClock(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));

    pendingItems.forEach((item) => {
      const id = getQueueId(item);
      if (typeof updateSyncItem === "function" && id) {
        updateSyncItem(id, { status: "Synced", syncedAt: now.toISOString() });
      }
    });

    if (typeof addActivity === "function") {
      addActivity({
        type: "manual-sync",
        message: `Manual synchronization completed for ${pendingItems.length} pending item(s)`,
        timestamp: now.toISOString(),
      });
    }

    notify(pendingItems.length ? `${pendingItems.length} item(s) synchronized` : "Everything is already synchronized");
  };

  const testConnection = () => {
    if (navigator.onLine) {
      setOnline(true);
      notify("Connection test successful");
    } else {
      setOnline(false);
      notify("Connection unavailable");
    }
  };

  const clearQueue = () => {
    if (!pendingItems.length) {
      notify("No pending items to clear");
      return;
    }

    pendingItems.forEach((item) => {
      const id = getQueueId(item);
      if (typeof updateSyncItem === "function" && id) {
        updateSyncItem(id, { status: "Cleared" });
      }
    });

    notify(`${pendingItems.length} pending item(s) cleared locally`);
  };

  const uploadAll = () => syncNow();

  const retryItem = (item) => {
    const id = getQueueId(item);
    if (typeof updateSyncItem === "function" && id) {
      updateSyncItem(id, { status: online ? "Pending" : "Waiting for Network" });
    }
    notify(`Retry queued for ${id}`);
  };

  const openQueueItem = (item) => {
    const id = getQueueId(item);
    const type = String(getQueueType(item)).toLowerCase();

    if (type.includes("field visit")) {
      navigate(`/field-visits/visit-details?visit=${encodeURIComponent(id)}`);
      return;
    }
    if (type.includes("officer")) {
      navigate("/survey-officers/activity");
      return;
    }
    if (type.includes("evidence")) {
      navigate(`/field-visits/evidence?visit=${encodeURIComponent(id)}`);
      return;
    }

    navigate(`/sync/queue-item?item=${encodeURIComponent(id)}`);
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
      <div style={{ color: accent, fontSize: "28px", lineHeight: "1", fontWeight: "800", marginTop: "12px" }}>{value}</div>
      <div style={{ color: colors.muted, fontSize: "12px", marginTop: "8px" }}>{sub}</div>
    </div>
  );

  const section = (title, subtitle, children, right = null) => (
    <section style={{ ...card, overflow: "hidden" }}>
      <div style={{ padding: "18px 20px 15px", borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" }}>
        <div>
          <h2 style={{ margin: 0, color: colors.text, fontSize: "19px", fontWeight: "800" }}>{title}</h2>
          <p style={{ margin: "4px 0 0", color: colors.muted, fontSize: "12px" }}>{subtitle}</p>
        </div>
        {right}
      </div>
      {children}
    </section>
  );

  const renderOverview = () => (
    <>
      {header(
        "Data Operations",
        "Offline / Sync",
        "Monitor connectivity, local records and synchronization status",
        <div style={{ display: "flex", gap: "8px" }}>
          <button type="button" onClick={syncNow} style={primaryButton}>Sync Now</button>
          <button type="button" onClick={() => navigate("/sync/queue")} style={secondaryButton}>Open Queue</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: "16px", marginBottom: "20px" }}>
        {stat("CONNECTION", online ? "Online" : "Offline", online ? "Stable network connection" : "Records remain stored locally", online ? colors.green : colors.red)}
        {stat("LAST SYNC", lastSync, `${lastSyncClock} today`, colors.blue)}
        {stat("PENDING UPLOADS", pendingItems.length, "Waiting in local queue", colors.orange)}
        {stat("LOCAL STORAGE", `${storagePercent}%`, "340 MB of 500 MB used", colors.cyan)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.25fr) minmax(350px,.75fr)", gap: "20px", alignItems: "start" }}>
        {section(
          "🔄 Synchronization Status",
          "Current status of village data synchronization",
          <div style={{ padding: "0 20px 20px" }}>
            {syncItems.map((item) => (
              <div key={item.name} style={{ display: "flex", alignItems: "center", gap: "13px", padding: "14px 0", borderBottom: `1px solid ${colors.border}` }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: `${item.accent}18`, border: `1px solid ${item.accent}30`, color: item.accent, fontSize: "14px", flexShrink: 0 }}>
                  {item.status === "Synced" ? "✓" : "↻"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: colors.text, fontSize: "12px", fontWeight: "800" }}>{item.name}</div>
                  <div style={{ color: colors.muted, fontSize: "10px", marginTop: "3px" }}>{item.records}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: item.accent, fontSize: "10px", fontWeight: "800" }}>{item.status}</div>
                  <div style={{ color: colors.muted, fontSize: "9px", marginTop: "3px" }}>{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {section(
          "📡 Connection",
          "Network and device connectivity",
          <div style={{ padding: "17px 20px 20px" }}>
            <div style={{ padding: "15px", borderRadius: "9px", background: online ? `${colors.green}0d` : `${colors.red}0d`, border: `1px solid ${online ? colors.green : colors.red}35`, display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: `${online ? colors.green : colors.red}20`, color: online ? colors.green : colors.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                {online ? "✓" : "×"}
              </div>
              <div>
                <div style={{ color: online ? colors.green : colors.red, fontSize: "13px", fontWeight: "800" }}>{online ? "Connected" : "Offline"}</div>
                <div style={{ color: colors.muted, fontSize: "10px", marginTop: "3px" }}>{online ? "Network connection is stable" : "Waiting for a connection"}</div>
              </div>
            </div>

            {[
              ["Network", online ? "4G / LTE" : "Unavailable"],
              ["Signal Strength", online ? "Good" : "—"],
              ["Device Storage", `${Math.round(storagePercent * 5)} MB / 500 MB`],
              ["Last Successful Sync", lastSyncClock],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${colors.border}` }}>
                <span style={{ color: colors.muted, fontSize: "11px" }}>{label}</span>
                <span style={{ color: colors.text, fontSize: "11px", fontWeight: "700" }}>{value}</span>
              </div>
            ))}

            <button type="button" onClick={testConnection} style={{ ...secondaryButton, width: "100%", marginTop: "15px" }}>Test Connection</button>
          </div>
        )}
      </div>

      <div style={{ marginTop: "20px" }}>
        {section(
          "📦 Offline Sync Queue",
          "Records captured locally and waiting to synchronize",
          <div style={{ padding: "14px 20px 20px" }}>
            {queue.slice(0, 5).map((item) => {
              const status = getQueueStatus(item);
              const accent = String(status).toLowerCase().includes("sync") ? colors.green : String(status).toLowerCase().includes("fail") ? colors.red : colors.orange;
              const id = getQueueId(item);
              return (
                <button key={id} type="button" onClick={() => openQueueItem(item)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "13px", padding: "12px", marginBottom: "8px", borderRadius: "8px", background: colors.input, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "left", cursor: "pointer" }}>
                  <div style={{ width: "34px", height: "34px", borderRadius: "7px", background: `${accent}18`, border: `1px solid ${accent}30`, color: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", flexShrink: 0 }}>↻</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "12px", fontWeight: "800" }}>{id}</div>
                    <div style={{ color: colors.muted, fontSize: "10px", marginTop: "3px" }}>{getQueueType(item)} · {getQueueRef(item)}</div>
                  </div>
                  <span style={{ color: colors.muted, fontSize: "10px", marginRight: "10px" }}>{getQueueSize(item)}</span>
                  <span style={{ color: accent, fontSize: "10px", fontWeight: "800" }}>{status}</span>
                </button>
              );
            })}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "9px", marginTop: "14px" }}>
              <button type="button" onClick={clearQueue} style={secondaryButton}>Clear Queue</button>
              <button type="button" onClick={uploadAll} style={{ ...primaryButton, background: colors.green }}>↑ Upload All</button>
            </div>
          </div>
        )}
      </div>
    </>
  );

  const renderQueue = () => (
    <>
      {header(
        "Data Operations",
        "Sync Queue",
        "Review, inspect and retry locally stored records",
        <button type="button" onClick={() => navigate("/sync")} style={secondaryButton}>← Sync Overview</button>
      )}

      {section(
        "📦 Local Sync Queue",
        `${pendingItems.length} pending · ${failedItems.length} failed · ${syncedItems.length} synced`,
        <>
          <div style={{ padding: "15px 20px", display: "grid", gridTemplateColumns: "minmax(0,1fr) 170px auto", gap: "9px" }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search queue ID, type, reference..." style={inputStyle} />
            <select value={queueFilter} onChange={(e) => setQueueFilter(e.target.value)} style={inputStyle}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="synced">Synced</option>
            </select>
            <button type="button" onClick={() => { setSearch(""); setQueueFilter("all"); }} style={secondaryButton}>Reset</button>
          </div>

          <div style={{ padding: "0 20px 20px", overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: "760px", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr>
                  {["Queue ID", "Type", "Reference", "Size", "Status", "Action"].map((h) => (
                    <th key={h} style={{ textAlign: "left", color: colors.muted, fontSize: "10px", fontWeight: "800", textTransform: "uppercase", padding: "0 10px 10px 0", borderBottom: `1px solid ${colors.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredQueue.map((item) => {
                  const id = getQueueId(item);
                  const status = getQueueStatus(item);
                  const accent = String(status).toLowerCase().includes("sync") ? colors.green : String(status).toLowerCase().includes("fail") ? colors.red : colors.orange;
                  return (
                    <tr key={id}>
                      <td style={{ padding: "13px 10px 13px 0", color: colors.cyan, fontWeight: "800", borderBottom: `1px solid ${colors.border}` }}>{id}</td>
                      <td style={{ padding: "13px 10px 13px 0", color: colors.text, fontWeight: "700", borderBottom: `1px solid ${colors.border}` }}>{getQueueType(item)}</td>
                      <td style={{ padding: "13px 10px 13px 0", color: colors.muted, borderBottom: `1px solid ${colors.border}` }}>{getQueueRef(item)}</td>
                      <td style={{ padding: "13px 10px 13px 0", color: colors.muted, borderBottom: `1px solid ${colors.border}` }}>{getQueueSize(item)}</td>
                      <td style={{ padding: "13px 10px 13px 0", borderBottom: `1px solid ${colors.border}` }}><span style={{ color: accent, fontWeight: "800", fontSize: "10px" }}>● {status}</span></td>
                      <td style={{ padding: "13px 0", borderBottom: `1px solid ${colors.border}` }}>
                        <div style={{ display: "flex", gap: "5px" }}>
                          <button type="button" onClick={() => openQueueItem(item)} style={{ border: 0, background: "transparent", color: colors.blueSoft, fontWeight: "800", fontSize: "10px", cursor: "pointer" }}>Open</button>
                          {String(status).toLowerCase().includes("fail") && (
                            <button type="button" onClick={() => retryItem(item)} style={{ border: 0, background: "transparent", color: colors.orange, fontWeight: "800", fontSize: "10px", cursor: "pointer" }}>Retry</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );

  const renderConnection = () => (
    <>
      {header(
        "Data Operations",
        "Connection",
        "Network health, device storage and synchronization readiness",
        <button type="button" onClick={() => navigate("/sync")} style={secondaryButton}>← Sync Overview</button>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {section(
          "📡 Network Status",
          "Live browser connectivity state",
          <div style={{ padding: "20px" }}>
            <div style={{ padding: "20px", borderRadius: "10px", border: `1px solid ${online ? colors.green : colors.red}45`, background: `${online ? colors.green : colors.red}0d` }}>
              <div style={{ color: online ? colors.green : colors.red, fontSize: "22px", fontWeight: "800" }}>{online ? "● CONNECTED" : "● OFFLINE"}</div>
              <div style={{ color: colors.muted, fontSize: "12px", marginTop: "7px" }}>{online ? "The device can attempt synchronization." : "New records will remain in the local queue until connectivity returns."}</div>
            </div>
            <div style={{ display: "grid", gap: "9px", marginTop: "15px" }}>
              <button type="button" onClick={testConnection} style={secondaryButton}>Run Connection Test</button>
              <button type="button" onClick={syncNow} style={primaryButton}>Run Synchronization</button>
            </div>
          </div>
        )}
        {section(
          "💾 Local Storage",
          "Estimated local application storage",
          <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: colors.muted, fontSize: "11px" }}>Used Storage</span>
              <span style={{ color: colors.cyan, fontSize: "12px", fontWeight: "800" }}>{storagePercent}%</span>
            </div>
            <div style={{ height: "10px", borderRadius: "20px", background: isDarkMode ? "#33445e" : "#dbe3ed", overflow: "hidden" }}>
              <div style={{ width: `${storagePercent}%`, height: "100%", background: colors.cyan, borderRadius: "20px" }} />
            </div>
            <div style={{ color: colors.muted, fontSize: "11px", marginTop: "8px" }}>340 MB of 500 MB used</div>
            <div style={{ marginTop: "17px", display: "flex", gap: "8px" }}>
              <button type="button" onClick={() => { setStoragePercent((v) => Math.max(0, v - 5)); notify("Local cache reduced"); }} style={secondaryButton}>Clear Cache</button>
              <button type="button" onClick={() => setStoragePercent((v) => Math.min(95, v + 5))} style={secondaryButton}>Simulate Usage</button>
            </div>
          </div>
        )}
      </div>
    </>
  );

  const renderQueueItem = () => {
    const itemId = new URLSearchParams(location.search).get("item");
    const item = queue.find((q) => getQueueId(q) === itemId) || queue[0];
    const status = getQueueStatus(item);
    return (
      <>
        {header(
          "Data Operations",
          "Queue Item",
          `${getQueueId(item)} · ${getQueueType(item)}`,
          <button type="button" onClick={() => navigate("/sync/queue")} style={secondaryButton}>← Sync Queue</button>
        )}

        {section(
          "Record Details",
          "Locally stored synchronization item",
          <div style={{ padding: "20px" }}>
            {[
              ["Queue ID", getQueueId(item)],
              ["Type", getQueueType(item)],
              ["Reference", getQueueRef(item)],
              ["Payload Size", getQueueSize(item)],
              ["Status", status],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "13px 0", borderBottom: `1px solid ${colors.border}` }}>
                <span style={{ color: colors.muted, fontSize: "10px", fontWeight: "800" }}>{label}</span>
                <span style={{ color: colors.text, fontSize: "12px", fontWeight: "800" }}>{value}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "9px", marginTop: "16px" }}>
              <button type="button" onClick={() => openQueueItem({ ...item, type: "Field Visit" })} style={secondaryButton}>Open Related Workflow</button>
              <button type="button" onClick={() => retryItem(item)} style={primaryButton}>Retry Sync</button>
            </div>
          </div>
        )}
      </>
    );
  };

  const path = location.pathname.replace(/\/+$/, "");
  let content = renderOverview();

  if (path.endsWith("/queue")) content = renderQueue();
  else if (path.endsWith("/connection")) content = renderConnection();
  else if (path.endsWith("/queue-item")) content = renderQueueItem();

  return (
    <div style={{ width: "100%", color: colors.text, fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {content}

      <div style={{ marginTop: "20px", padding: "14px 16px", border: `1px solid ${colors.border}`, borderRadius: "10px", background: colors.cardDark, display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {[
          ["overview", "1. Overview", "/sync"],
          ["queue", "2. Sync Queue", "/sync/queue"],
          ["connection", "3. Connection", "/sync/connection"],
        ].map(([step, label, target]) => {
          const active =
            (step === "overview" && path === "/sync") ||
            (step === "queue" && path.endsWith("/queue")) ||
            (step === "connection" && path.endsWith("/connection"));
          return (
            <button
              key={step}
              type="button"
              onClick={() => navigate(target)}
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

      <div style={{ marginTop: "20px", padding: "14px 17px", borderRadius: "9px", border: `1px solid ${colors.blue}35`, background: `${colors.blue}0d`, display: "flex", alignItems: "flex-start", gap: "11px" }}>
        <span style={{ color: colors.blue, fontSize: "16px" }}>ℹ</span>
        <div>
          <div style={{ color: colors.text, fontSize: "12px", fontWeight: "800" }}>Offline-first field operations</div>
          <div style={{ color: colors.muted, fontSize: "11px", marginTop: "3px", lineHeight: "1.45" }}>
            Field records can be captured without network connectivity and remain available in the local synchronization queue until connectivity returns.
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: "fixed", right: "26px", bottom: "24px", zIndex: 1000, padding: "12px 15px", borderRadius: "9px", background: isDarkMode ? "#16233a" : "#ffffff", border: `1px solid ${colors.green}55`, boxShadow: "0 10px 30px rgba(0,0,0,.18)", color: colors.text, fontSize: "12px", fontWeight: "700" }}>
          ✓ {toast}
        </div>
      )}
    </div>
  );
}

export default OfflineSync;
