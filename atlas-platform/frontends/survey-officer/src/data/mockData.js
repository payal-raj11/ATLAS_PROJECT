// ---------------------------------------------------------------------
// Mock data for the ATLAS Landowner Dashboard.
// In production this would come from the ATLAS API (per-landowner,
// authenticated session). Shapes are kept flat and simple on purpose so
// they are easy to swap for real fetch() calls later.
// ---------------------------------------------------------------------

export const LIFECYCLE_STAGES = [
  "Proposal Submitted",
  "Notification Issued (Sec 11)",
  "Award Declared",
  "Compensation Assessed",
  "Compensation Disbursed",
  "Possession Taken",
];

export const landowner = {
  id: "LO-UP-2026-04821",
  name: "Ramesh Kumar Yadav",
  fatherName: "S/o Late Shri Ram Lakhan Yadav",
  role: "Landowner / Khatedar",
  village: "Chinhat",
  district: "Lucknow",
  state: "Uttar Pradesh",
  phone: "+91 98XXX XX214",
  email: "ramesh.yadav@example.com",
  aadhaarLast4: "8842",
  bankAccountMasked: "XXXX XXXX 4471",
  ifsc: "SBIN00XXXXX",
  photoInitials: "RY",
};

export const parcels = [
  {
    id: "PAR-UP-LKO-2026-10842",
    project: "NH-27 Lucknow Bypass Expansion",
    projectType: "Highway",
    surveyNumber: "197/5B",
    village: "Chinhat",
    district: "Lucknow",
    state: "Uttar Pradesh",
    classification: "Agricultural",
    areaAcres: 2.34,
    currentStage: 4, // index into LIFECYCLE_STAGES (0-based) -> "Compensation Disbursed"
    compensation: {
      baseMarketValuePerAcre: 320000,
      multiplier: 2,
      assetValue: 1497600,
      solatium: 1497600,
      totalCompensation: 2995200,
      disbursed: 2246400,
      installments: [
        { id: "INST-1", date: "2026-03-12", amount: 898560, status: "Paid", mode: "DBT" },
        { id: "INST-2", date: "2026-05-28", amount: 1347840, status: "Paid", mode: "DBT" },
        { id: "INST-3", date: "2026-09-30", amount: 748800, status: "Pending", mode: "DBT" },
      ],
    },
    possessionStatus: "Pending",
    rrStatus: "Not applicable",
  },
  {
    id: "PAR-UP-LKO-2026-10843",
    project: "Purvanchal Expressway Extension",
    projectType: "Highway",
    surveyNumber: "212/2A",
    village: "Chinhat",
    district: "Lucknow",
    state: "Uttar Pradesh",
    classification: "Homestead",
    areaAcres: 1.1,
    currentStage: 1, // "Notification Issued (Sec 11)"
    compensation: {
      baseMarketValuePerAcre: 410000,
      multiplier: 2,
      assetValue: 902000,
      solatium: 902000,
      totalCompensation: 1804000,
      disbursed: 0,
      installments: [],
    },
    possessionStatus: "Not started",
    rrStatus: "Assessment in progress",
  },
];

export const initialNotifications = [
  {
    id: "N-1001",
    type: "success",
    title: "Compensation instalment credited",
    message:
      "₹13,47,840 has been credited to your linked bank account for parcel PAR-UP-LKO-2026-10842 (Instalment 2 of 3).",
    date: "2026-05-28",
    read: false,
  },
  {
    id: "N-1002",
    type: "info",
    title: "Award declared",
    message:
      "The Land Acquisition Officer has declared the award for parcel PAR-UP-LKO-2026-10842 under Section 23.",
    date: "2026-02-14",
    read: true,
  },
  {
    id: "N-1003",
    type: "warning",
    title: "Document verification pending",
    message:
      "Please upload your updated Khatauni copy for parcel PAR-UP-LKO-2026-10843 to avoid delay in the notification stage.",
    date: "2026-08-02",
    read: false,
  },
  {
    id: "N-1004",
    type: "complaint",
    title: "Complaint status updated",
    message:
      "Your complaint CMP-3341 regarding survey boundary discrepancy has moved to 'Under Review'.",
    date: "2026-08-19",
    read: false,
  },
  {
    id: "N-1005",
    type: "info",
    title: "Public hearing scheduled",
    message:
      "A public hearing for the Purvanchal Expressway Extension corridor is scheduled at the Tehsil office on 21 Sep 2026.",
    date: "2026-09-05",
    read: true,
  },
];

export const initialComplaints = [
  {
    id: "CMP-3341",
    category: "Survey / Boundary Error",
    parcelId: "PAR-UP-LKO-2026-10842",
    subject: "Boundary marker placed incorrectly",
    description:
      "The boundary marker for the acquired portion appears to be about 6 feet inside my remaining land. Requesting a re-survey.",
    status: "Under Review",
    priority: "High",
    dateFiled: "2026-08-05",
    lastUpdate: "2026-08-19",
  },
  {
    id: "CMP-3298",
    category: "Compensation Discrepancy",
    parcelId: "PAR-UP-LKO-2026-10842",
    subject: "Multiplier applied seems incorrect",
    description:
      "As per the district rate circular, rural agricultural land near a notified highway should attract a 2.5x multiplier, not 2x.",
    status: "Resolved",
    priority: "Medium",
    dateFiled: "2026-04-02",
    lastUpdate: "2026-04-22",
  },
];

export const COMPLAINT_CATEGORIES = [
  "Compensation Discrepancy",
  "Survey / Boundary Error",
  "Possession Dispute",
  "Documentation Issue",
  "R&R Entitlement",
  "Delay in Process",
  "Other",
];

export const documents = [
  {
    id: "DOC-1",
    name: "Section 11 Notification Copy",
    parcelId: "PAR-UP-LKO-2026-10842",
    status: "Available",
    date: "2025-11-02",
  },
  {
    id: "DOC-2",
    name: "Award Copy (Section 23)",
    parcelId: "PAR-UP-LKO-2026-10842",
    status: "Available",
    date: "2026-02-14",
  },
  {
    id: "DOC-3",
    name: "Compensation Receipt — Instalment 1",
    parcelId: "PAR-UP-LKO-2026-10842",
    status: "Available",
    date: "2026-03-12",
  },
  {
    id: "DOC-4",
    name: "Compensation Receipt — Instalment 2",
    parcelId: "PAR-UP-LKO-2026-10842",
    status: "Available",
    date: "2026-05-28",
  },
  {
    id: "DOC-5",
    name: "Possession Certificate",
    parcelId: "PAR-UP-LKO-2026-10842",
    status: "Pending",
    date: null,
  },
  {
    id: "DOC-6",
    name: "Section 11 Notification Copy",
    parcelId: "PAR-UP-LKO-2026-10843",
    status: "Pending",
    date: null,
  },
];
