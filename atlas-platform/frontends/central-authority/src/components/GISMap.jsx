import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// landParcels.json is ~2.7MB (1,000 parcels) — loaded lazily so it
// doesn't sit in the main app bundle for every page, only when the
// Dashboard (and this map) actually mounts.


/* =========================================================
   GIS MAP — parcel-level map on the Leaflet/react-leaflet
   dataset you supplied (data/landParcels.json, 1,000 point
   parcels across 4 states).

   v2 of this component (replacing the polygon/GeoJSON version):
   parcels are plotted as square markers rather than filled
   polygons — at country zoom, small polygons rendered as
   near-invisible blobs; square point markers read clearly at
   every zoom level. Also adds a street/satellite basemap toggle
   and a richer parcel panel (compensation %, possession %,
   affected families) matching your updated App.jsx.

   IMPORTANT — this dataset is independent from data/projects.js:
     - parcel `project_id`/`project_code` values ("P001"..) don't
       match data/projects.js ids ("ATLAS-PRJ-00x")
     - it covers 4 states (Tamil Nadu, Uttar Pradesh, Maharashtra,
       Bihar) out of the 8 in data/projects.js
     - parcel `acquisition_status` (Proposed / Notified /
       Compensation Pending / Acquired) is a different vocabulary
       than the project-level Active/Pending/Delayed/Completed
       buckets used elsewhere on this dashboard.
   A parcel click opens the detail panel below (real data, real
   coordinates) rather than navigating to /projects/:id — see the
   TODO in the Marker's eventHandlers below for where to wire that
   once the id schemes are joined.

   Requires `leaflet` + `react-leaflet` as dependencies — see the
   integration notes you were given alongside this file.
   ========================================================= */


const STATUS_STYLE = {
  Proposed: { color: "#2f6fed", tint: "#e4ecfd", text: "#1d4bab" },
  Notified: { color: "#eab308", tint: "#fbedc0", text: "#8a6403" },
  "Compensation Pending": { color: "#ea580c", tint: "#fde0cc", text: "#9a3c08" },
  Acquired: { color: "#16a34a", tint: "#d9f2e2", text: "#12703a" },
};

const STATUS_ORDER = ["Proposed", "Notified", "Compensation Pending", "Acquired"];

const BASEMAPS = {
  street: {
    label: "Street",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
  },
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics",
  },
};

const INDIA_CENTER = [22.9734, 78.6569];
const INDIA_ZOOM = 5;


function formatINR(value) {
  if (value === null || value === undefined) return "—";
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}


function statusStyleOf(status) {
  return STATUS_STYLE[status] || { color: "#6b7280", tint: "#e5e7eb", text: "#374151" };
}


function squareIcon(color) {
  return L.divIcon({
    className: "parcel-marker",
    html: `<span style="background:${color}"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}


// Cache icons per status so we don't rebuild a divIcon on every render.
const ICON_CACHE = Object.fromEntries(
  STATUS_ORDER.map((s) => [s, squareIcon(STATUS_STYLE[s].color)])
);


function FitBounds({ features }) {

  const map = useMap();

  useEffect(() => {

    if (!features || features.length === 0) {
      map.setView(INDIA_CENTER, INDIA_ZOOM);
      return;
    }

    const bounds = L.latLngBounds(
      features.map((f) => [f.geometry.coordinates[1], f.geometry.coordinates[0]])
    );

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }

  }, [features, map]);

  return null;

}


function BasemapToggle({ basemap, setBasemap }) {

  return (

    <div className="basemap-toggle">

      {Object.entries(BASEMAPS).map(([key, cfg]) => (

        <button
          key={key}
          type="button"
          className={`basemap-btn ${basemap === key ? "basemap-btn-active" : ""}`}
          onClick={() => setBasemap(key)}
        >
          {cfg.label}
        </button>

      ))}

    </div>

  );

}


function GISMap({
  compact = false,
  title = "India GIS Parcel Map",
  viewFullTo,
  forcedState,
  forcedDistricts,
  hideHeader = false,
  emptyMessage = "No parcel-level records for this area yet.",
}) {

  const [parcelData, setParcelData] = useState(null);

  // Land Overview's status donut and the module's other tabs link
  // here with ?status=<acquisition status> — read once as the
  // initial filter value so the click-through actually lands on a
  // filtered map instead of just the unfiltered default view.
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get("status");
  const stateParam = searchParams.get("state");

  const [stateFilter, setStateFilter] = useState(forcedState || stateParam || "All");
  const [statusFilter, setStatusFilter] = useState(statusParam || "All");
  const [basemap, setBasemap] = useState("street");
  const [selectedParcel, setSelectedParcel] = useState(null);

  // Embedded/compact usages (e.g. Land Overview's own state filter)
  // pass forcedState as a prop rather than a URL param — keep the
  // map in sync whenever the host page's filter changes.
  useEffect(() => {
    if (forcedState !== undefined) {
      setStateFilter(forcedState || "All");
    }
  }, [forcedState]);

  useEffect(() => {

    let cancelled = false;

    import("../data/landParcels.json").then((module) => {
      if (!cancelled) {
        setParcelData(module.default);
      }
    });

    return () => {
      cancelled = true;
    };

  }, []);

  const allFeatures = useMemo(
    () => parcelData?.features || [],
    [parcelData]
  );

  const states = useMemo(
    () => ["All", ...new Set(allFeatures.map((f) => f.properties.state))].sort(),
    [allFeatures]
  );

  const filteredFeatures = useMemo(() => {

    return allFeatures.filter((f) => {

      const p = f.properties;

      const stateMatch = stateFilter === "All" || p.state === stateFilter;
      const statusMatch = statusFilter === "All" || p.acquisition_status === statusFilter;
      const districtMatch =
        !forcedDistricts || forcedDistricts.length === 0 || forcedDistricts.includes(p.district);

      return stateMatch && statusMatch && districtMatch;

    });

  }, [allFeatures, stateFilter, statusFilter, forcedDistricts]);

  const totalParcels = filteredFeatures.length;

  const totalAreaAcres = useMemo(
    () => filteredFeatures.reduce((sum, f) => sum + f.properties.area_acres, 0),
    [filteredFeatures]
  );

  const acquiredCount = useMemo(
    () =>
      filteredFeatures.filter((f) => f.properties.acquisition_status === "Acquired").length,
    [filteredFeatures]
  );

  const compensationPendingCount = useMemo(
    () =>
      filteredFeatures.filter(
        (f) => f.properties.acquisition_status === "Compensation Pending"
      ).length,
    [filteredFeatures]
  );

  const totalEstimatedValue = useMemo(
    () => filteredFeatures.reduce((sum, f) => sum + f.properties.estimated_value, 0),
    [filteredFeatures]
  );

  // Clear the open parcel panel whenever the filters change the visible set.
  useEffect(() => {
    setSelectedParcel(null);
  }, [stateFilter, statusFilter]);

  const selected = selectedParcel?.properties;

  if (!parcelData) {

    return (

      <div className={`gis-map-slot ${compact ? "gis-map-slot-compact" : ""}`}>

        <div className="gis-map-header">

          <h3>
            {title}
          </h3>

        </div>

        <div className="gis-map-loading">
          Loading parcel data…
        </div>

      </div>

    );

  }

  return (

    <div className={`gis-map-slot ${compact ? "gis-map-slot-compact" : ""}`}>

      {!hideHeader && (

        <div className="gis-map-header">

          <h3>
            {title}
          </h3>

          {viewFullTo ? (
            <Link to={viewFullTo} className="panel-link">
              View full map →
            </Link>
          ) : (
            <span>
              Click a parcel for details
            </span>
          )}

        </div>

      )}


      {!compact && (

        <div className="gis-mini-stats">

          <div className="gis-mini-stat">
            <span>Parcels</span>
            <strong>{totalParcels.toLocaleString("en-IN")}</strong>
          </div>

          <div className="gis-mini-stat">
            <span>Total Area</span>
            <strong>{totalAreaAcres.toFixed(1)} ac</strong>
          </div>

          <div className="gis-mini-stat">
            <span>Acquired</span>
            <strong>{acquiredCount.toLocaleString("en-IN")}</strong>
          </div>

          <div className="gis-mini-stat">
            <span>Compensation Pending</span>
            <strong>{compensationPendingCount.toLocaleString("en-IN")}</strong>
          </div>

          <div className="gis-mini-stat">
            <span>Estimated Value</span>
            <strong>{formatINR(totalEstimatedValue)}</strong>
          </div>

        </div>

      )}


      {!compact && (

        <div className="gis-filters">

          <label>
            State
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
            >
              {states.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          <label>
            Acquisition Status
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All</option>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

        </div>

      )}


      {!compact && (

        <div className="gis-map-legend">

          {STATUS_ORDER.map((s) => (

            <span key={s}>
              <i style={{ backgroundColor: STATUS_STYLE[s].color }} />
              {s}
            </span>

          ))}

        </div>

      )}


      {totalParcels === 0 ? (

        <div className={`gis-empty-state ${compact ? "gis-empty-state-compact" : ""}`}>
          <span>{emptyMessage}</span>
        </div>

      ) : (

      <div className={`gis-leaflet-wrap ${compact ? "gis-leaflet-wrap-compact" : ""}`}>

        <MapContainer
          center={INDIA_CENTER}
          zoom={INDIA_ZOOM}
          className="gis-leaflet-map"
          attributionControl={false}
          preferCanvas
          zoomControl={!compact}
          dragging={!compact}
          scrollWheelZoom={!compact}
          doubleClickZoom={!compact}
          touchZoom={!compact}
        >

          <TileLayer
            url={BASEMAPS[basemap].url}
            attribution={BASEMAPS[basemap].attribution}
          />

          {filteredFeatures.map((f) => {

            const [lng, lat] = f.geometry.coordinates;
            const icon = ICON_CACHE[f.properties.acquisition_status] || ICON_CACHE.Proposed;

            return (

              <Marker
                key={f.properties.parcel_id}
                position={[lat, lng]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    // TODO: once parcel.project_code matches an id in
                    // data/projects.js, navigate(`/projects/${p.project_code}`)
                    // here instead of opening the local detail panel.
                    setSelectedParcel(f);
                  },
                }}
              />

            );

          })}

          <FitBounds features={filteredFeatures} />

        </MapContainer>


        {!compact && (
          <BasemapToggle
            basemap={basemap}
            setBasemap={setBasemap}
          />
        )}


        {selected && (

          <div className="gis-parcel-panel">

            <button
              className="gis-parcel-close"
              onClick={() => setSelectedParcel(null)}
              type="button"
            >
              ✕
            </button>

            <h4>
              Parcel {selected.parcel_id}
            </h4>

            <span
              className="gis-status-badge"
              style={{
                backgroundColor: statusStyleOf(selected.acquisition_status).tint,
                color: statusStyleOf(selected.acquisition_status).text,
              }}
            >
              {selected.acquisition_status}
            </span>

            <dl>

              <dt>Owner of Record</dt>
              <dd>{selected.official_owner}</dd>

              <dt>Land Type</dt>
              <dd>{selected.land_classification}</dd>

              <dt>Record Status</dt>
              <dd>{selected.record_status}</dd>

              <dt>Project</dt>
              <dd>{selected.project_code}</dd>

              <dt>Survey Number</dt>
              <dd>{selected.survey_number}</dd>

              <dt>Village</dt>
              <dd>{selected.village}</dd>

              <dt>District</dt>
              <dd>{selected.district}</dd>

              <dt>State</dt>
              <dd>{selected.state}</dd>

              <dt>Area</dt>
              <dd>{selected.area_acres} acres</dd>

              <dt>Estimated Value</dt>
              <dd>{formatINR(selected.estimated_value)}</dd>

              <dt>Compensation Paid</dt>
              <dd>{selected.compensation_percentage}%</dd>

              <dt>Possession</dt>
              <dd>{selected.possession_percentage}%</dd>

              <dt>Affected Families</dt>
              <dd>{selected.affected_families}</dd>

            </dl>

          </div>

        )}

      </div>

      )}

    </div>

  );

}


export default GISMap;
