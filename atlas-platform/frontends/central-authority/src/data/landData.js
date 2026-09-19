import { useEffect, useState } from "react";

/* =========================================================
   LAND & IMPACT — data layer

   Everything here is derived from data/landParcels.json (1,000
   real parcel records with state/district/village, classification,
   ownership counts, dispute flags and acquisition status) — the
   same dataset the GIS map already uses. Loaded lazily (it's a
   ~2.7MB file) and cached once per session so every Land & Impact
   tab shares one fetch instead of five.

   Anything the Land & Impact spec asks for that this dataset
   simply doesn't capture yet (forest area, water bodies, roads,
   schools/hospitals, vulnerable-group counts, ownership TYPE as
   private/government/community) is left out rather than invented
   — the pages below say so explicitly instead of filling the gap
   with a fabricated number.
   ========================================================= */

let cachedFeatures = null;
let inFlight = null;

export function useLandParcels() {

  const [features, setFeatures] = useState(cachedFeatures);

  useEffect(() => {

    if (cachedFeatures) {
      setFeatures(cachedFeatures);
      return;
    }

    let cancelled = false;

    if (!inFlight) {
      inFlight = import("./landParcels.json").then((mod) => mod.default.features);
    }

    inFlight.then((feats) => {
      cachedFeatures = feats;
      if (!cancelled) setFeatures(feats);
    });

    return () => {
      cancelled = true;
    };

  }, []);

  return features; // null while loading

}


export function computeLandStats(features) {

  if (!features) return null;

  const props = features.map((f) => f.properties);

  const totalParcels = props.length;
  const totalAreaAcres = props.reduce((s, p) => s + p.area_acres, 0);

  const byStatus = {};
  props.forEach((p) => {
    byStatus[p.acquisition_status] = (byStatus[p.acquisition_status] || 0) + 1;
  });

  const acquiredArea = props
    .filter((p) => p.acquisition_status === "Acquired")
    .reduce((s, p) => s + p.area_acres, 0);

  const pendingArea = totalAreaAcres - acquiredArea;

  const byClassification = {};
  props.forEach((p) => {
    if (!byClassification[p.land_classification]) {
      byClassification[p.land_classification] = { count: 0, acres: 0 };
    }
    byClassification[p.land_classification].count += 1;
    byClassification[p.land_classification].acres += p.area_acres;
  });

  const byRecordStatus = {};
  props.forEach((p) => {
    byRecordStatus[p.record_status] = (byRecordStatus[p.record_status] || 0) + 1;
  });

  const byState = {};
  props.forEach((p) => {
    if (!byState[p.state]) byState[p.state] = { count: 0, acres: 0, districts: new Set() };
    byState[p.state].count += 1;
    byState[p.state].acres += p.area_acres;
    byState[p.state].districts.add(p.district);
  });

  const byProjectType = {};
  props.forEach((p) => {
    byProjectType[p.project_type] = (byProjectType[p.project_type] || 0) + 1;
  });

  const totalFamilies = props.reduce((s, p) => s + p.affected_families, 0);
  const totalOwners = props.reduce((s, p) => s + p.number_of_owners, 0);
  const jointOwnershipParcels = props.filter((p) => p.number_of_owners > 1).length;

  const legalCases = props.filter((p) => p.legal_cases).length;
  const boundaryDisputes = props.filter((p) => p.boundary_disputes).length;
  const ownershipDisputes = props.filter((p) => p.ownership_disputes).length;
  const missingDocuments = props.filter((p) => p.missing_documents).length;

  const avgCompensationPct = props.reduce((s, p) => s + p.compensation_percentage, 0) / totalParcels;
  const avgPossessionPct = props.reduce((s, p) => s + p.possession_percentage, 0) / totalParcels;

  const districts = new Set(props.map((p) => `${p.state}::${p.district}`));
  const villages = new Set(props.map((p) => `${p.state}::${p.district}::${p.village}`));

  return {
    totalParcels,
    totalAreaAcres,
    acquiredArea,
    pendingArea,
    byStatus,
    byClassification,
    byRecordStatus,
    byState,
    byProjectType,
    totalFamilies,
    totalOwners,
    jointOwnershipParcels,
    legalCases,
    boundaryDisputes,
    ownershipDisputes,
    missingDocuments,
    avgCompensationPct,
    avgPossessionPct,
    districtCount: districts.size,
    villageCount: villages.size,
  };

}


export const CLASSIFICATION_COLOR = {
  Agricultural: "var(--series-3)",
  "Multi-crop": "var(--series-6)",
  Commercial: "var(--series-4)",
  Residential: "var(--series-1)",
};

export const STATUS_COLOR = {
  Proposed: "var(--series-1)",
  Notified: "var(--series-4)",
  "Compensation Pending": "var(--series-2)",
  Acquired: "var(--accent-green)",
};

export const RECORD_STATUS_COLOR = {
  Verified: "var(--accent-green)",
  Active: "var(--series-1)",
  "Pending Review": "var(--series-4)",
  Disputed: "#ef4444",
};
