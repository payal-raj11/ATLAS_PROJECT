import React, { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Common national GIS source shared across Central / State / District / Village views.
import gisData from "../data/gisParcels.json";

const BASEMAPS = {
  street: {
    label: "Street",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
  },
  satellite: {
    label: "Satellite",
    url:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics",
  },
};

const STATUS_COLORS = {
  Proposed: "#2f6fed",
  Notified: "#eab308",
  "Compensation Pending": "#ea580c",
  Acquired: "#16a34a",
};

const MALHAUR_SCOPE = {
  state: "Uttar Pradesh",
  district: "Lucknow",
  village: "Malhaur",
};

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "—";
  return `₹${Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

function markerIcon(status, selected = false) {
  const color = STATUS_COLORS[status] || "#64748b";
  const size = selected ? 18 : 13;

  return L.divIcon({
    className: "atlas-gis-square-marker",
    html: `
      <div
        title="${status || "GIS Parcel"}"
        style="
          width:${size}px;
          height:${size}px;
          box-sizing:border-box;
          border-radius:2px;
          background:${color};
          border:${selected ? "3px" : "2px"} solid #ffffff;
          box-shadow:0 2px 8px rgba(0,0,0,.48);
          transform:${selected ? "scale(1.08)" : "none"};
        "
      ></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FitToFeatures({ features }) {
  const map = useMap();

  useEffect(() => {
    if (!features.length) return;

    const points = features
      .filter(
        (feature) =>
          feature.geometry?.type === "Point" &&
          Array.isArray(feature.geometry.coordinates)
      )
      .map((feature) => {
        const [lng, lat] = feature.geometry.coordinates;
        return [lat, lng];
      });

    if (!points.length) return;

    const bounds = L.latLngBounds(points);

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [45, 45],
        maxZoom: 14,
      });
    }
  }, [features, map]);

  return null;
}

function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

function BasemapToggle({ basemap, setBasemap }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 1000,
        display: "flex",
        overflow: "hidden",
        borderRadius: 8,
        border: "1px solid rgba(15,23,42,.18)",
        boxShadow: "0 5px 18px rgba(0,0,0,.25)",
        background: "#fff",
      }}
    >
      {Object.entries(BASEMAPS).map(([key, cfg]) => (
        <button
          key={key}
          type="button"
          onClick={() => setBasemap(key)}
          style={{
            border: 0,
            padding: "9px 14px",
            cursor: "pointer",
            fontWeight: 800,
            fontSize: 12,
            color: basemap === key ? "#fff" : "#334155",
            background: basemap === key ? "#0e1b2e" : "#fff",
          }}
        >
          {key === "street" ? "🗺️ " : "🛰️ "}
          {cfg.label}
        </button>
      ))}
    </div>
  );
}

function ScopeBadge() {
  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        zIndex: 1000,
        padding: "8px 11px",
        borderRadius: 8,
        background: "rgba(14,27,46,.94)",
        color: "#fff",
        fontSize: 11,
        lineHeight: 1.35,
        boxShadow: "0 5px 18px rgba(0,0,0,.25)",
      }}
    >
      <strong>GIS Scope</strong>
      <br />
      Malhaur · Lucknow · Uttar Pradesh
    </div>
  );
}

function MapStats({ features, visibleFeatures }) {
  const totalArea = visibleFeatures.reduce(
    (sum, f) => sum + Number(f.properties?.area_acres || 0),
    0
  );

  const acquired = visibleFeatures.filter(
    (f) => f.properties?.acquisition_status === "Acquired"
  ).length;

  const compensationPending = visibleFeatures.filter(
    (f) => f.properties?.acquisition_status === "Compensation Pending"
  ).length;

  const estimatedValue = visibleFeatures.reduce(
    (sum, f) => sum + Number(f.properties?.estimated_value || 0),
    0
  );

  const stats = [
    ["Parcels", features.length.toLocaleString("en-IN")],
    ["Visible Area", `${totalArea.toFixed(2)} ac`],
    ["Acquired", acquired],
    ["Compensation Pending", compensationPending],
    ["Estimated Value", formatMoney(estimatedValue)],
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
        gap: 8,
        padding: "10px 0",
      }}
    >
      {stats.map(([label, value]) => (
        <div
          key={label}
          style={{
            minWidth: 0,
            padding: "9px 11px",
            borderRadius: 7,
            background: "var(--bg-card, #07101f)",
            border: "1px solid var(--border-color, rgba(148,163,184,.16))",
          }}
        >
          <div
            style={{
              color: "var(--text-muted, #94a3b8)",
              fontSize: 10,
              marginBottom: 3,
            }}
          >
            {label}
          </div>
          <div
            style={{
              color: "var(--text-primary, #f8fafc)",
              fontSize: 14,
              fontWeight: 800,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusLegend() {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 14,
        alignItems: "center",
        padding: "8px 0 10px",
        color: "var(--text-muted, #94a3b8)",
        fontSize: 11,
      }}
    >
      {Object.entries(STATUS_COLORS).map(([status, color]) => (
        <span
          key={status}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 2,
              background: color,
              display: "inline-block",
              border: "1px solid rgba(255,255,255,.35)",
            }}
          />
          {status}
        </span>
      ))}
      <span style={{ marginLeft: "auto" }}>
        Hover a parcel for quick details · Click for full details
      </span>
    </div>
  );
}

function ParcelPanel({ parcel, onClose, onParcelClick }) {
  if (!parcel) return null;

  const p = parcel.properties || {};

  return (
    <div
      style={{
        position: "absolute",
        top: 58,
        right: 12,
        zIndex: 1100,
        width: 325,
        maxHeight: "calc(100% - 70px)",
        overflowY: "auto",
        padding: 18,
        borderRadius: 10,
        background: "rgba(255,255,255,.98)",
        border: "1px solid #dbe2ea",
        boxShadow: "0 14px 35px rgba(15,23,42,.28)",
        color: "#16243c",
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close parcel details"
        style={{
          position: "absolute",
          top: 9,
          right: 11,
          border: 0,
          background: "transparent",
          cursor: "pointer",
          fontSize: 19,
          color: "#64748b",
        }}
      >
        ×
      </button>

      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: ".08em",
        }}
      >
        GIS Parcel
      </div>

      <h3 style={{ margin: "5px 28px 8px 0", fontSize: 19 }}>
        Survey {p.survey_number || "—"}
      </h3>

      <span
        style={{
          display: "inline-block",
          padding: "5px 9px",
          borderRadius: 5,
          background: `${STATUS_COLORS[p.acquisition_status] || "#64748b"}18`,
          color: STATUS_COLORS[p.acquisition_status] || "#475569",
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        {p.acquisition_status || "—"}
      </span>

      <hr
        style={{
          border: 0,
          borderTop: "1px solid #e2e8f0",
          margin: "13px 0",
        }}
      />

      {[
        ["Parcel UUID", p.parcel_uuid],
        ["Owner", p.official_owner],
        ["Village", p.village],
        ["District", p.district],
        ["State", p.state],
        ["Project", p.project_id],
        ["Project Type", p.project_type],
        ["Area", p.official_area || `${p.area_acres || "—"} acres`],
        ["Classification", p.land_classification],
        ["Record Status", p.record_status],
        ["Compensation", `${p.compensation_percentage ?? 0}%`],
        ["Possession", `${p.possession_percentage ?? 0}%`],
        ["Estimated Value", formatMoney(p.estimated_value)],
        ["GIS Source", p.coord_source || "Source coordinate"],
      ].map(([label, value]) => (
        <div
          key={label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            padding: "5px 0",
            fontSize: 12,
          }}
        >
          <span style={{ color: "#64748b", fontWeight: 600 }}>{label}</span>
          <strong
            style={{
              textAlign: "right",
              maxWidth: "63%",
              overflowWrap: "anywhere",
            }}
          >
            {value ?? "—"}
          </strong>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onParcelClick?.(parcel)}
        style={{
          width: "100%",
          marginTop: 12,
          padding: "10px 12px",
          borderRadius: 7,
          border: "1px solid #d5dbe5",
          background: "#0e1b2e",
          color: "#fff",
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        Select GIS Parcel →
      </button>
    </div>
  );
}

export default function GISMap({
  state = MALHAUR_SCOPE.state,
  district = MALHAUR_SCOPE.district,
  village = MALHAUR_SCOPE.village,
  onParcelSelect,
}) {
  const [basemap, setBasemap] = useState("street");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedParcel, setSelectedParcel] = useState(null);

  const features = useMemo(() => {
    return (gisData.features || []).filter((feature) => {
      const p = feature.properties || {};

      return (
        p.state === state &&
        p.district === district &&
        p.village === village &&
        feature.geometry?.type === "Point"
      );
    });
  }, [state, district, village]);

  const visibleFeatures = useMemo(() => {
    if (statusFilter === "All") return features;

    return features.filter(
      (feature) =>
        feature.properties?.acquisition_status === statusFilter
    );
  }, [features, statusFilter]);

  const center = useMemo(() => {
    if (!features.length) return [26.839, 80.948];

    const lat =
      features.reduce(
        (sum, f) => sum + Number(f.geometry.coordinates[1]),
        0
      ) / features.length;

    const lng =
      features.reduce(
        (sum, f) => sum + Number(f.geometry.coordinates[0]),
        0
      ) / features.length;

    return [lat, lng];
  }, [features]);

  const handleSelect = (parcel) => {
    setSelectedParcel(parcel);
    onParcelSelect?.(parcel);
  };

  return (
    <div style={{ width: "100%" }}>
      <MapStats features={features} visibleFeatures={visibleFeatures} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 2,
        }}
      >
        <div
          style={{
            color: "var(--text-muted, #94a3b8)",
            fontSize: 11,
          }}
        >
          Uttar Pradesh / Lucknow / Malhaur · {visibleFeatures.length} visible
          parcel records
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            minWidth: 175,
            padding: "8px 10px",
            borderRadius: 7,
            border: "1px solid var(--border-color, #334155)",
            background: "var(--bg-input, #0b1424)",
            color: "var(--text-primary, #f8fafc)",
            fontSize: 11,
            outline: "none",
          }}
        >
          <option value="All">All Acquisition Status</option>
          {Object.keys(STATUS_COLORS).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <StatusLegend />

      <div
        style={{
          position: "relative",
          width: "100%",
          height: "min(58vh, 620px)",
          minHeight: 430,
          borderRadius: 9,
          overflow: "hidden",
          border: "1px solid var(--border-color, rgba(255,255,255,.12))",
        }}
      >
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom
          style={{ width: "100%", height: "100%" }}
          attributionControl
        >
          <TileLayer
            key={basemap}
            url={BASEMAPS[basemap].url}
            attribution={BASEMAPS[basemap].attribution}
          />

          {visibleFeatures.map((feature) => {
            const [lng, lat] = feature.geometry.coordinates;
            const p = feature.properties || {};
            const selected =
              selectedParcel?.properties?.parcel_uuid === p.parcel_uuid;

            return (
              <Marker
                key={p.parcel_uuid}
                position={[lat, lng]}
                icon={markerIcon(p.acquisition_status, selected)}
                eventHandlers={{
                  click: () => handleSelect(feature),
                }}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -7]}
                  opacity={1}
                  sticky
                >
                  <div
                    style={{
                      minWidth: 205,
                      fontSize: 12,
                      lineHeight: 1.45,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 13,
                        marginBottom: 3,
                      }}
                    >
                      Survey {p.survey_number || "—"}
                    </div>
                    <div>
                      <strong>Owner:</strong> {p.official_owner || "—"}
                    </div>
                    <div>
                      <strong>Area:</strong> {p.official_area || "—"}
                    </div>
                    <div>
                      <strong>Status:</strong>{" "}
                      {p.acquisition_status || "—"}
                    </div>
                    <div>
                      <strong>Project:</strong> {p.project_id || "—"} ·{" "}
                      {p.project_type || "—"}
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        color: "#64748b",
                        fontSize: 10,
                      }}
                    >
                      Hover for details · Click for full parcel panel
                    </div>
                  </div>
                </Tooltip>

                <Popup>
                  <strong>Survey {p.survey_number || "—"}</strong>
                  <br />
                  {p.official_owner || "Owner unavailable"}
                  <br />
                  {p.village}, {p.district}
                  <br />
                  {p.acquisition_status || "Status unavailable"}
                </Popup>
              </Marker>
            );
          })}

          <FitToFeatures features={visibleFeatures} />
          <MapResizeHandler />
        </MapContainer>

        <ScopeBadge />
        <BasemapToggle basemap={basemap} setBasemap={setBasemap} />

        <ParcelPanel
          parcel={selectedParcel}
          onClose={() => setSelectedParcel(null)}
          onParcelClick={onParcelSelect}
        />

        {!visibleFeatures.length && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 900,
              display: "grid",
              placeItems: "center",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                padding: "14px 18px",
                borderRadius: 9,
                background: "rgba(14,27,46,.94)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              No GIS records match the current village/status filter.
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 7,
          color: "var(--text-muted, #94a3b8)",
          fontSize: 10,
        }}
      >
        GIS points are rendered from the uploaded master dataset. The dataset
        identifies these coordinates as approximate; they should not be treated
        as official cadastral boundaries.
      </div>
    </div>
  );
}
