import {
  MapContainer,
  TileLayer,
  useMap,
} from "react-leaflet";

import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

const PUNJAB_BOUNDS = [
  [29.5, 73.8],
  [32.7, 76.9],
];

function PunjabMapLock() {
  const map = useMap();

  useEffect(() => {
    // Force the map to Punjab
    map.fitBounds(PUNJAB_BOUNDS, {
      padding: [20, 20],
    });

    // Lock map movement inside Punjab area
    map.setMaxBounds(PUNJAB_BOUNDS);

    map.options.maxBoundsViscosity = 1.0;
  }, [map]);

  return null;
}

export default function GISMap({
  height = "450px",
}) {
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
      {/* State Lock Indicator */}
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
        🔒 Punjab State GIS
      </div>

      <MapContainer
        center={[30.901, 75.8573]}
        zoom={8}
        minZoom={7}
        maxZoom={16}
        maxBounds={PUNJAB_BOUNDS}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        zoomControl={true}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <PunjabMapLock />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
      </MapContainer>
    </div>
  );
}