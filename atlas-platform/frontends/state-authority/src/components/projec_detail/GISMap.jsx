import {
  MapContainer,
  TileLayer,
  useMap,
} from "react-leaflet";

import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

const STATE_CONFIG = {
  Punjab: {
    center: [30.901, 75.8573],
    zoom: 8,
    bounds: [
      [29.5, 73.8],
      [32.7, 76.9],
    ],
  },

  Haryana: {
    center: [29.0588, 76.0856],
    zoom: 8,
    bounds: [
      [27.6, 74.4],
      [30.9, 77.6],
    ],
  },

  Rajasthan: {
    center: [27.0238, 74.2179],
    zoom: 7,
    bounds: [
      [23.0, 69.3],
      [30.2, 78.3],
    ],
  },

  "Uttar Pradesh": {
    center: [26.8467, 80.9462],
    zoom: 7,
    bounds: [
      [23.8, 77.0],
      [30.5, 84.7],
    ],
  },

  Maharashtra: {
    center: [19.7515, 75.7139],
    zoom: 7,
    bounds: [
      [15.6, 72.6],
      [22.1, 80.9],
    ],
  },

  "Tamil Nadu": {
    center: [11.1271, 78.6569],
    zoom: 7,
    bounds: [
      [8.0, 76.2],
      [13.6, 80.4],
    ],
  },

  Bihar: {
    center: [25.0961, 85.3131],
    zoom: 7,
    bounds: [
      [24.0, 83.0],
      [27.6, 88.3],
    ],
  },

  "Himachal Pradesh": {
    center: [31.1048, 77.1734],
    zoom: 7,
    bounds: [
      [30.3, 75.5],
      [33.3, 79.0],
    ],
  },
};

function StateLock({ bounds }) {
  const map = useMap();

  useEffect(() => {
    if (!bounds) return;

    // Force the map into the permitted state area
    map.fitBounds(bounds, {
      padding: [15, 15],
    });

    // Prevent dragging outside the state area
    map.setMaxBounds(bounds);

    map.options.maxBoundsViscosity = 1.0;
  }, [map, bounds]);

  return null;
}

export default function GISMap({
  state = "Punjab",
  height = "450px",
}) {
  const config =
    STATE_CONFIG[state] || STATE_CONFIG.Punjab;

  return (
    <div
      style={{
        width: "100%",
        height,
        borderRadius: "10px",
        overflow: "hidden",
        position: "relative",
        border: "1px solid var(--border)",
      }}
    >
      {/* State restriction badge */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          zIndex: 1000,
          background: "var(--surface)",
          color: "var(--text-primary)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "8px 12px",
          fontSize: "12px",
          fontWeight: "600",
          boxShadow: "var(--shadow)",
        }}
      >
        🔒 {state} State GIS
      </div>

      <MapContainer
        key={state}
        center={config.center}
        zoom={config.zoom}
        minZoom={config.zoom}
        maxZoom={16}
        maxBounds={config.bounds}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        zoomControl={true}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <StateLock bounds={config.bounds} />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
      </MapContainer>
    </div>
  );
}