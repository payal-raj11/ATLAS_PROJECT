# GIS integration included

This `src` package keeps the existing ATLAS dashboard and integrates a working Leaflet/React-Leaflet cadastral map.

## Included
- `src/components/GisMap.jsx` — interactive GIS map component.
- `src/data/cadastral.geojson` — the supplied 50-feature cadastral polygon dataset.
- District layer with clickable/hoverable parcel polygons, status colors and road corridor.
- National layer using the supplied GeoJSON polygons.
- Street, CARTO light, and Esri satellite basemaps.
- Zoom controls, automatic map fitting, tooltips and parcel telemetry integration.
- Existing dashboard `selectedParcel` panel is wired to the GIS parcel selection.

## Required packages
From your project root run:

```bash
npm install leaflet react-leaflet chart.js
```

If your project already has these packages, no duplicate installation is needed.

## Important
The uploaded files were `src` folders rather than a complete Vite project, so this ZIP intentionally contains the integrated `src` plus the GIS dataset and setup notes. Keep your existing project-level `package.json`, `index.html`, `vite.config.*`, etc.
