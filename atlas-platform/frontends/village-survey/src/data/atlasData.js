// Central mock data store for ATLAS
// This will later be replaced/connected to the backend database.

export const village = {
  name: "Malhaur",
  tehsil: "Mohanlalganj",
  district: "Lucknow",
  state: "Uttar Pradesh",
  totalPlots: 432,
  verifiedParcels: 318,
  pendingScrutiny: 87,
  activeDisputes: 6,
};

// --------------------------------------------------
// LAND PARCELS
// --------------------------------------------------

export const parcels = [
  {
    surveyNo: "107",
    owner: "Anil Kumar",
    area: "0.620 Ha",
    classification: "Agricultural",
    recordStatus: "Verified",
    scrutinyStatus: "Verified",
    handoverStatus: "Ready",
    disputeStatus: "None",
  },
  {
    surveyNo: "110",
    owner: "Mohan Lal",
    area: "0.510 Ha",
    classification: "Agricultural",
    recordStatus: "Verified",
    scrutinyStatus: "Verified",
    handoverStatus: "Ready",
    disputeStatus: "None",
  },
  {
    surveyNo: "112",
    owner: "Ram Prakash",
    area: "0.582 Ha",
    classification: "Agricultural",
    recordStatus: "Verified",
    scrutinyStatus: "Verified",
    handoverStatus: "Ready",
    disputeStatus: "None",
  },
  {
    surveyNo: "113",
    owner: "Sushila Devi",
    area: "0.410 Ha",
    classification: "Residential",
    recordStatus: "Missing RoR",
    scrutinyStatus: "Pending",
    handoverStatus: "Documents Pending",
    disputeStatus: "None",
  },
  {
    surveyNo: "114",
    owner: "Abdul Rahman",
    area: "0.635 Ha",
    classification: "Agricultural",
    recordStatus: "Verified",
    scrutinyStatus: "Verified",
    handoverStatus: "Ready",
    disputeStatus: "None",
  },
  {
    surveyNo: "115",
    owner: "Ramesh Yadav",
    area: "0.900 Ha",
    classification: "Agricultural",
    recordStatus: "Verified",
    scrutinyStatus: "Verified",
    handoverStatus: "Dispute Hold",
    disputeStatus: "Boundary Clash",
  },
  {
    surveyNo: "116",
    owner: "Sushila Devi",
    area: "0.430 Ha",
    classification: "Residential",
    recordStatus: "Verified",
    scrutinyStatus: "Pending",
    handoverStatus: "Documents Pending",
    disputeStatus: "None",
  },
  {
    surveyNo: "117",
    owner: "Geeta Singh",
    area: "0.750 Ha",
    classification: "Agricultural",
    recordStatus: "Verified",
    scrutinyStatus: "Pending",
    handoverStatus: "Ready",
    disputeStatus: "Access Dispute",
  },
  {
    surveyNo: "118",
    owner: "Vijay Pal",
    area: "0.920 Ha",
    classification: "Residential",
    recordStatus: "Verified",
    scrutinyStatus: "Verified",
    handoverStatus: "Ready",
    disputeStatus: "None",
  },
  {
    surveyNo: "119",
    owner: "Sunita Devi",
    area: "0.680 Ha",
    classification: "Agricultural",
    recordStatus: "Verified",
    scrutinyStatus: "Verified",
    handoverStatus: "Ready",
    disputeStatus: "None",
  },
  {
    surveyNo: "120",
    owner: "Mohd. Arif",
    area: "0.570 Ha",
    classification: "Agricultural",
    recordStatus: "Verified",
    scrutinyStatus: "Verified",
    handoverStatus: "Ready",
    disputeStatus: "Compensation",
  },
  {
    surveyNo: "121",
    owner: "Vijay Pal",
    area: "0.920 Ha",
    classification: "Residential",
    recordStatus: "Verified",
    scrutinyStatus: "Verified",
    handoverStatus: "Ready",
    disputeStatus: "None",
  },
];

// --------------------------------------------------
// SURVEY OFFICERS
// --------------------------------------------------

export const surveyOfficers = [
  {
    id: "SO-001",
    name: "Ramesh Kumar",
    role: "Senior Survey Officer",
    assigned: 25,
    completed: 20,
    progress: 80,
    status: "Active",
    phone: "+91 98765 43210",
    lastVisit: "12 Sep 2025",
  },
  {
    id: "SO-002",
    name: "Savitri Devi",
    role: "Survey Officer",
    assigned: 20,
    completed: 12,
    progress: 60,
    status: "Active",
    phone: "+91 98765 12345",
    lastVisit: "11 Sep 2025",
  },
  {
    id: "SO-003",
    name: "Iqbal Khan",
    role: "Survey Officer",
    assigned: 20,
    completed: 10,
    progress: 50,
    status: "Field Visit",
    phone: "+91 98765 67890",
    lastVisit: "12 Sep 2025",
  },
];

// --------------------------------------------------
// PUBLIC OBJECTIONS
// --------------------------------------------------

export const objections = [
  {
    id: "OBJ-2025-005",
    date: "12-09-2025",
    objector: "Mohd. Arif",
    surveyNo: "115",
    nature: "Boundary dispute",
    status: "Under Review",
  },
  {
    id: "OBJ-2025-004",
    date: "12-09-2025",
    objector: "Sita Devi",
    surveyNo: "120",
    nature: "Wrong ownership",
    status: "Forwarded",
  },
  {
    id: "OBJ-2025-003",
    date: "11-09-2025",
    objector: "Rajesh Kumar",
    surveyNo: "118",
    nature: "Compensation issue",
    status: "Pending",
  },
  {
    id: "OBJ-2025-002",
    date: "10-09-2025",
    objector: "Geeta Singh",
    surveyNo: "117",
    nature: "Access to land",
    status: "Resolved",
  },
  {
    id: "OBJ-2025-001",
    date: "09-09-2025",
    objector: "Ramesh Yadav",
    surveyNo: "116",
    nature: "Land classification",
    status: "Pending",
  },
];

// --------------------------------------------------
// DISPUTES
// --------------------------------------------------

export const disputes = [
  {
    id: "DSP-2025-006",
    landowner: "Ramesh Yadav",
    surveyNo: "115",
    type: "Boundary Clash",
    priority: "High",
    escalatedTo: "SDM Office",
    status: "Active",
  },
  {
    id: "DSP-2025-005",
    landowner: "Sushila Devi",
    surveyNo: "113",
    type: "Ownership Claim",
    priority: "Medium",
    escalatedTo: "Tehsil Revenue",
    status: "Active",
  },
  {
    id: "DSP-2025-004",
    landowner: "Geeta Singh",
    surveyNo: "117",
    type: "Access Dispute",
    priority: "Medium",
    escalatedTo: "Patwari",
    status: "Active",
  },
  {
    id: "DSP-2025-003",
    landowner: "Mohd. Arif",
    surveyNo: "120",
    type: "Compensation",
    priority: "Low",
    escalatedTo: "Revenue Inspector",
    status: "Active",
  },
];

// --------------------------------------------------
// FIELD VISITS
// --------------------------------------------------

export const fieldVisits = [
  {
    id: "FV-2025-021",
    date: "12-09-2025",
    officer: "Ramesh Kumar",
    surveyNo: "115",
    activity: "Boundary Measurement",
    status: "Completed",
    gps: true,
    evidenceCount: 4,
  },
  {
    id: "FV-2025-020",
    date: "12-09-2025",
    officer: "Savitri Devi",
    surveyNo: "118",
    activity: "Owner Verification",
    status: "Completed",
    gps: true,
    evidenceCount: 3,
  },
  {
    id: "FV-2025-019",
    date: "12-09-2025",
    officer: "Iqbal Khan",
    surveyNo: "120",
    activity: "Land-use Classification",
    status: "In Progress",
    gps: true,
    evidenceCount: 2,
  },
  {
    id: "FV-2025-018",
    date: "11-09-2025",
    officer: "Ramesh Kumar",
    surveyNo: "121",
    activity: "Field Photography",
    status: "Pending",
    gps: false,
    evidenceCount: 0,
  },
  {
    id: "FV-2025-017",
    date: "11-09-2025",
    officer: "Savitri Devi",
    surveyNo: "113",
    activity: "Document Verification",
    status: "Completed",
    gps: true,
    evidenceCount: 2,
  },
];

// --------------------------------------------------
// DOCUMENTS
// --------------------------------------------------

export const documents = [
  {
    id: "DOC-001",
    name: "Khasra Copy.pdf",
    type: "Khasra",
    surveyNo: "113",
    size: "1.2 MB",
    status: "Available",
  },
  {
    id: "DOC-002",
    name: "Field Photo 1.jpg",
    type: "Field Evidence",
    surveyNo: "113",
    size: "3.4 MB",
    status: "Available",
  },
  {
    id: "DOC-003",
    name: "Record of Rights.pdf",
    type: "RoR",
    surveyNo: "112",
    size: "820 KB",
    status: "Available",
  },
];

// --------------------------------------------------
// SYNC QUEUE
// --------------------------------------------------

export const syncQueue = [
  {
    id: "FV-2025-019",
    type: "Field Visit",
    reference: "Survey 120",
    size: "2.4 KB",
    status: "Pending",
  },
  {
    id: "FV-2025-018",
    type: "Field Evidence",
    reference: "Survey 121",
    size: "1.8 MB",
    status: "Pending",
  },
  {
    id: "SO-003",
    type: "Officer Activity",
    reference: "Iqbal Khan",
    size: "3.1 KB",
    status: "Pending",
  },
];

// --------------------------------------------------
// GRAM SABHA
// --------------------------------------------------

export const gramSabha = {
  meetingDate: "12-09-2025",
  venue: "Malhaur Panchayat Bhawan",
  chairperson: "Gram Pradhan — Smt. Kavita Singh",
  attendance: 78,
  minutes:
    "Discussed land acquisition proposal and addressed villagers' concerns.",
  nocStatus: "Pending",
  nocDeadline: "15-09-2025",
};

// --------------------------------------------------
// STATUTORY ALERTS
// --------------------------------------------------

export const statutoryAlerts = [
  {
    title: "Missing Records",
    description: "14 plots lack Record of Rights (RoR).",
    severity: "High",
  },
  {
    title: "NOC Countdown",
    description: "5 days remaining for Section 11 clearance.",
    severity: "Medium",
  },
  {
    title: "Dispute Holds",
    description: "3 injunctions currently freezing local activity.",
    severity: "High",
  },
];