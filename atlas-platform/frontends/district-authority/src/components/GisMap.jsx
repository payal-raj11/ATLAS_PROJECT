import React, { useMemo, useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  Tooltip,
  useMap,
  ZoomControl,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import cadastralData from '../data/parcels.json';


/* =========================================================
   STATUS
========================================================= */

const STATUS = {
  acquired: {
    label: 'Cleared',
    color: '#00c48c',
    fillOpacity: 0.36,
  },

  pending: {
    label: 'Under Scrutiny',
    color: '#fbbf24',
    fillOpacity: 0.34,
  },

  disputed: {
    label: 'Disputed / Encroached',
    color: '#f87171',
    fillOpacity: 0.34,
  },
};


/* =========================================================
   BASEMAPS
========================================================= */

const BASEMAPS = {
  street: {
    label: 'Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },

  light: {
    label: 'CARTO',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  },

  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
};


/* =========================================================
   MAP RECENTER
========================================================= */

function RecenterMap({ center, zoom, bounds }) {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.length > 0) {
      const leafletBounds = L.latLngBounds(bounds);

      if (leafletBounds.isValid()) {
        map.fitBounds(leafletBounds, {
          padding: [28, 28],
          maxZoom: 16,
        });

        return;
      }
    }

    map.setView(center, zoom);
  }, [center, zoom, bounds, map]);

  return null;
}


/* =========================================================
   STATUS NORMALIZER
========================================================= */

function normalizeStatus(value) {
  const s = String(value || '').toLowerCase();

  if (
    s.includes('acquir') ||
    s.includes('clear') ||
    s.includes('approved')
  ) {
    return 'acquired';
  }

  if (
    s.includes('disput') ||
    s.includes('encroach') ||
    s.includes('objection')
  ) {
    return 'disputed';
  }

  return 'pending';
}


/* =========================================================
   GEOJSON HELPERS
========================================================= */

function isCoordinate(value) {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
  );
}


function coordinateToLeaflet(coordinate) {
  if (!isCoordinate(coordinate)) {
    return null;
  }

  const [lng, lat] = coordinate;

  return [lat, lng];
}


/*
  Finds a usable coordinate ring regardless of whether the
  input is:

  [
    [lng, lat],
    [lng, lat]
  ]

  or

  [
    [
      [lng, lat],
      [lng, lat]
    ]
  ]

  or deeper nested Polygon/MultiPolygon data.
*/

function polygonToLeafletRing(value) {
  if (!Array.isArray(value)) {
    return [];
  }


  /* Already a single coordinate */

  if (isCoordinate(value)) {
    const point = coordinateToLeaflet(value);

    return point ? [point] : [];
  }


  /* A normal ring:
     [
       [lng, lat],
       [lng, lat],
       ...
     ]
  */

  if (
    value.length > 0 &&
    Array.isArray(value[0]) &&
    isCoordinate(value[0])
  ) {
    return value
      .map(coordinateToLeaflet)
      .filter(Boolean);
  }


  /*
    Nested polygon/multipolygon structure.

    Search recursively until we find the first
    valid linear ring.
  */

  for (const item of value) {
    const ring = polygonToLeafletRing(item);

    if (ring.length >= 3) {
      return ring;
    }
  }

  return [];
}


/* =========================================================
   GEOJSON FEATURE -> LEAFLET RING
========================================================= */

function getPolygonCoordinates(feature) {
  if (!feature) {
    return [];
  }


  /* ---------------------------------------------
     Standard GeoJSON Feature
  --------------------------------------------- */

  if (feature.geometry) {
    const geometry = feature.geometry;

    if (geometry.coordinates) {
      return polygonToLeafletRing(geometry.coordinates);
    }
  }


  /* ---------------------------------------------
     Some datasets may directly contain geometry
  --------------------------------------------- */

  if (feature.coordinates) {
    return polygonToLeafletRing(feature.coordinates);
  }


  return [];
}


/* =========================================================
   LOCAL DISTRICT PARCELS
========================================================= */

function makeLocalParcels([lat, lng]) {
  const parcels = [
    {
      id: '402/1A',
      owner: 'Thiru. S. Arumugam',
      area: '0.45 Hectares',
      status: 'acquired',

      coords: [
        [lat + 0.0020, lng - 0.0030],
        [lat + 0.0050, lng - 0.0020],
        [lat + 0.0040, lng + 0.0010],
        [lat + 0.0010, lng],
      ],
    },

    {
      id: '402/1B',
      owner: 'Kalapet Expansion Corridor',
      area: '1.15 Hectares',
      status: 'pending',

      coords: [
        [lat + 0.0040, lng + 0.0010],
        [lat + 0.0070, lng + 0.0030],
        [lat + 0.0050, lng + 0.0060],
        [lat + 0.0020, lng + 0.0030],
      ],
    },

    {
      id: '403/2',
      owner: 'Coastal Buffer Land',
      area: '0.80 Hectares',
      status: 'disputed',

      coords: [
        [lat - 0.0020, lng - 0.0040],
        [lat + 0.0010, lng - 0.0030],
        [lat - 0.0010, lng + 0.0010],
        [lat - 0.0040, lng - 0.0010],
      ],
    },

    {
      id: '204/2B',
      owner: 'Muthialpet Public Way',
      area: '0.62 Hectares',
      status: 'acquired',

      coords: [
        [lat - 0.0040, lng + 0.0020],
        [lat - 0.0010, lng + 0.0040],
        [lat - 0.0030, lng + 0.0070],
        [lat - 0.0060, lng + 0.0040],
      ],
    },
  ];

  return parcels.map((parcel) => ({
    ...parcel,
    source: 'District operational layer',
  }));
}


/* =========================================================
   NATIONAL PARCELS
========================================================= */

function nationalFeatures() {
  if (!cadastralData) {
    return [];
  }


  /*
    Support both:

    {
      "type": "FeatureCollection",
      "features": [...]
    }

    and a plain array of features.
  */

  let features = [];

  if (Array.isArray(cadastralData)) {
    features = cadastralData;
  } else if (Array.isArray(cadastralData.features)) {
    features = cadastralData.features;
  }


  const result = [];


  features.forEach((feature, featureIndex) => {
    if (!feature) {
      return;
    }

    const properties = feature.properties || {};


    const baseId =
      properties.parcel_id ||
      properties.parcel_uuid ||
      properties.id ||
      properties.PARCEL_ID ||
      `National-${featureIndex + 1}`;


    const owner =
      properties.official_owner ||
      properties.owner_name ||
      properties.owner ||
      properties.OWNER_NAME ||
      'Recorded owner not available';


    let area = '—';

    if (
      properties.area_acres !== undefined &&
      properties.area_acres !== null
    ) {
      area = `${properties.area_acres} acres`;
    } else if (
      properties.area_hectares !== undefined &&
      properties.area_hectares !== null
    ) {
      area = `${properties.area_hectares} hectares`;
    }


    const status = normalizeStatus(
      properties.status ||
      properties.record_status ||
      properties.acquisition_status ||
      properties.STATUS
    );


    const coords = getPolygonCoordinates(feature);


    /*
      Only create a parcel if we successfully found
      at least 3 points.
    */

    if (coords.length >= 3) {
      result.push({
        id: baseId,
        owner,
        area,
        status,
        coords,
        source: 'National cadastral GeoJSON',
        properties,
      });
    }
  });


  return result;
}


/* =========================================================
   MAIN GIS MAP
========================================================= */

export default function GisMap({
  district,
  onSelectParcel,
}) {
  const [basemap, setBasemap] = useState('light');
  const [layer, setLayer] = useState('district');
  const [hovered, setHovered] = useState(null);


  /* ---------------------------------------------
     District parcels
  --------------------------------------------- */

  const districtParcels = useMemo(
    () => makeLocalParcels(district.center),
    [district.center]
  );


  /* ---------------------------------------------
     National parcels
  --------------------------------------------- */

  const nationalParcels = useMemo(
    () => nationalFeatures(),
    []
  );


  /* ---------------------------------------------
     Active layer
  --------------------------------------------- */

  const parcels =
    layer === 'national'
      ? nationalParcels
      : districtParcels;


  /* ---------------------------------------------
     Bounds
  --------------------------------------------- */

  const bounds = useMemo(() => {
    const points = parcels.flatMap((parcel) => {
      if (!Array.isArray(parcel.coords)) {
        return [];
      }

      return parcel.coords;
    });

    return points.length > 0 ? points : null;
  }, [parcels]);


  /* ---------------------------------------------
     Road corridor
  --------------------------------------------- */

  const roadCorridor = useMemo(() => {
    const [lat, lng] = district.center;

    return [
      [lat - 0.009, lng + 0.001],
      [lat - 0.004, lng + 0.0015],
      [lat + 0.001, lng + 0.002],
      [lat + 0.006, lng + 0.003],
      [lat + 0.010, lng + 0.004],
    ];
  }, [district.center]);


  return (
    <div className="gis-map-wrapper">


      {/* =================================================
          TOOLBAR
      ================================================= */}

      <div className="gis-map-toolbar">

        <div className="gis-toolbar-group">

          <span className="gis-toolbar-label">
            Layer
          </span>

          <button
            type="button"
            className={
              layer === 'district'
                ? 'gis-tool-active'
                : ''
            }
            onClick={() => setLayer('district')}
          >
            District
          </button>

          <button
            type="button"
            className={
              layer === 'national'
                ? 'gis-tool-active'
                : ''
            }
            onClick={() => setLayer('national')}
          >
            National
          </button>

        </div>


        <div className="gis-toolbar-group">

          <span className="gis-toolbar-label">
            Basemap
          </span>

          {Object.entries(BASEMAPS).map(
            ([key, map]) => (
              <button
                key={key}
                type="button"
                className={
                  basemap === key
                    ? 'gis-tool-active'
                    : ''
                }
                onClick={() => setBasemap(key)}
              >
                {map.label}
              </button>
            )
          )}

        </div>

      </div>


      {/* =================================================
          MAP CANVAS
      ================================================= */}

      <div className="gis-map-canvas">

        <MapContainer
          center={district.center}
          zoom={district.zoom}
          style={{
            height: '100%',
            width: '100%',
          }}
          zoomControl={false}
          scrollWheelZoom={true}
          preferCanvas={true}
        >

          <ZoomControl position="topleft" />


          <RecenterMap
            center={district.center}
            zoom={district.zoom}
            bounds={bounds}
          />


          {/* BASEMAP */}

          <TileLayer
            key={basemap}
            url={BASEMAPS[basemap].url}
            attribution={
              BASEMAPS[basemap].attribution
            }
          />


          {/* =================================================
              ROAD / ACQUISITION CORRIDOR
          ================================================= */}

          {layer === 'district' && (
            <Polyline
              positions={roadCorridor}
              pathOptions={{
                color: '#f59e0b',
                weight: 5,
                opacity: 0.72,
              }}
            >
              <Tooltip sticky>
                Road / acquisition corridor
              </Tooltip>
            </Polyline>
          )}


          {/* =================================================
              PARCELS
          ================================================= */}

          {parcels.map((parcel, index) => {

            const style =
              STATUS[parcel.status] ||
              STATUS.pending;


            const selected =
              hovered?.id === parcel.id;


            if (
              !Array.isArray(parcel.coords) ||
              parcel.coords.length < 3
            ) {
              return null;
            }


            return (
              <Polygon
                key={`${layer}-${parcel.id || index}`}
                positions={parcel.coords}

                pathOptions={{
                  color: style.color,
                  weight: selected ? 3 : 2,
                  fillColor: style.color,
                  fillOpacity: selected
                    ? 0.72
                    : style.fillOpacity,
                }}

                eventHandlers={{

                  mouseover: () => {
                    setHovered(parcel);

                    if (onSelectParcel) {
                      onSelectParcel(parcel);
                    }
                  },


                  mouseout: () => {
                    setHovered(null);
                  },


                  click: () => {
                    if (onSelectParcel) {
                      onSelectParcel(parcel);
                    }
                  },

                }}
              >

                <Tooltip sticky>

                  <strong>
                    Parcel #{parcel.id}
                  </strong>

                  <br />

                  {parcel.owner}

                  <br />

                  {style.label}

                  <br />

                  Area: {parcel.area}

                </Tooltip>

              </Polygon>
            );
          })}

        </MapContainer>

      </div>

    </div>
  );
}