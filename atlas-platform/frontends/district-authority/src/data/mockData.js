export const getSurveyDossier = (districtKey) => {
  const prefix = districtKey === "puducherry" ? "PY" : districtKey === "karaikal" ? "KR" : "MH";
  return [
    {
      id: `${prefix}-DPR-01`,
      name: "Project Proposal / DPR",
      icon: "📝",
      scope: "Project purpose, location, scope, and reason for requiring land",
      date: "2026-08-10",
      status: "Verified",
      village: "Kalapet Corridor",
      surveyNos: "402/1, 402/2",
      area: "2.40 Hectares",
      landType: "Public Utility",
      officer: "K. Rajasekaran, Cadastral Officer"
    },
    {
      id: `${prefix}-LRS-02`,
      name: "Land Requirement Statement",
      icon: "📋",
      scope: "Required area, number of parcels, and purpose of acquisition",
      date: "2026-08-12",
      status: "Pending",
      village: "Kalapet Bypass",
      surveyNos: "402/3A, 402/3B",
      area: "1.15 Hectares",
      landType: "Ryotwari Dry",
      officer: "M. Balaji, Revenue Surveyor"
    },
    {
      id: `${prefix}-ROR-03`,
      name: "Record of Rights (RoR)",
      icon: "📜",
      scope: "Survey number, recorded owner/rights holder, land area, and land classification",
      date: "2026-08-15",
      status: "Verified",
      village: "Lawspet North",
      surveyNos: "108/4 to 108/9",
      area: "0.85 Hectares",
      landType: "Ryotwari Wet",
      officer: "P. Sundaram, Head Surveyor"
    },
    {
      id: `${prefix}-OTD-04`,
      name: "Ownership / Title Documents",
      icon: "🧾",
      scope: "Whether the claimed ownership/right corresponds with official records",
      date: "2026-08-16",
      status: "Pending",
      village: "Muthialpet Revenue Ward",
      surveyNos: "204/2B",
      area: "0.45 Hectares",
      landType: "Urban Patta",
      officer: "K. Rajasekaran, Cadastral Officer"
    },
    {
      id: `${prefix}-CSM-05`,
      name: "Cadastral / Survey Map",
      icon: "🗺️",
      scope: "Whether the identified survey numbers and parcels correspond to proposed land",
      date: "2026-08-18",
      status: "Pending",
      village: "Kalapet coastal strip",
      surveyNos: "402/10, 402/11",
      area: "1.80 Hectares",
      landType: "Coastal Buffer",
      officer: "M. Balaji, Revenue Surveyor"
    },
    {
      id: `${prefix}-LPS-06`,
      name: "Land Details / Parcel Schedule",
      icon: "📍",
      scope: "Village, survey number, sub-division number, area, and identifying details",
      date: "2026-08-20",
      status: "Verified",
      village: "Promenade Link",
      surveyNos: "12/1, 12/2",
      area: "0.32 Hectares",
      landType: "Poramboke Road Margin",
      officer: "P. Sundaram, Head Surveyor"
    },
    {
      id: `${prefix}-APS-07`,
      name: "Administrative / Project Sanction",
      icon: "🏛️",
      scope: "Whether the competent authority has formally authorized the project",
      date: "2026-08-21",
      status: "Verified",
      village: "Puducherry HQ",
      surveyNos: "Apex G.O. #492",
      area: "Sanctioned Capex",
      landType: "Public Utility",
      officer: "Secretary (Revenue), Govt. of Puducherry"
    },
    {
      id: `${prefix}-FBA-08`,
      name: "Funding / Budget Approval",
      icon: "💰",
      scope: "Whether dedicated exchequer funding provision exists for the acquisition",
      date: "2026-08-22",
      status: "Pending",
      village: "Head of Account 4059",
      surveyNos: "Sub-Head #108",
      area: "Escrow Cap: ₹ 5.80 Cr",
      landType: "Treasury Allocation",
      officer: "Director of Accounts & Treasuries"
    },
    {
      id: `${prefix}-NOC-09`,
      name: "NOCs / Statutory Clearances",
      icon: "📑",
      scope: "Whether applicable statutory permissions (CRZ, Environmental, PWD) have been obtained",
      date: "2026-08-25",
      status: "Pending",
      village: "Kalapet - Coastal Belt",
      surveyNos: "CRZ clearance Ref #88",
      area: "Tidal High Line Buffer",
      landType: "Environmental Zone",
      officer: "Member Secretary, PPCC"
    },
    {
      id: `${prefix}-RRD-10`,
      name: "Affected Family / R&R Documents",
      icon: "👨‍👩‍👧",
      scope: "Whether affected/displaced families have been correctly identified per R&R norms",
      date: "2026-08-28",
      status: districtKey === "mahe" ? "Verified" : "Pending",
      village: "Keezhaiyur / Kalapet",
      surveyNos: "18 Families Enumerated",
      area: "SIA Social Matrix",
      landType: "Rehabilitation Roster",
      officer: "R&R Administrator / Sub-Collector"
    }
  ];
};

export const initialDistricts = {
  puducherry: {
    title: "Puducherry District",
    center: [12.028, 79.858],
    zoom: 14,
    kpis: { projects: 14, delays: 2, comp: "₹ 5.8 Cr" },
    alerts: [
      "Survey Officer flagged 3 unverified coastal parcels along Kalapet bypass.",
      "ECR Road Widening DPR approved; awaiting final Coastal Zone NOC verification.",
      "Collectorate sanctioned ₹ 45,00,000 for Kalapet parcel acquisitions."
    ],
    projects: [
      { name: "Urban Smart Drainage System", progress: 75, target: 80, status: "On Track", delay: "0 Days" },
      { name: "ECR Highway Expansion", progress: 40, target: 70, status: "Delayed", delay: "18 Days" },
      { name: "Beach Promenade Renovation", progress: 90, target: 90, status: "On Track", delay: "0 Days" }
    ],
    compensation: [
      {
        id: "P-402",
        name: "Parcel #402 - Kalapet",
        beneficiary: "Thiru. S. Arumugam & 2 Others",
        surveyNos: "Survey #402/1A (0.45 Ha)",
        baseValue: "₹ 20,50,000",
        solatium: "₹ 20,50,000",
        interest: "₹ 4,00,000",
        amount: "₹ 45,00,000",
        stage: "Bank Approval",
        status: "Pending",
        bank: "State Bank of India (Kalapet)",
        ifsc: "SBIN0004921"
      },
      {
        id: "P-108",
        name: "Parcel #108 - Lawspet",
        beneficiary: "Tmt. V. Meenakshi Ammal",
        surveyNos: "Survey #108/4 (0.18 Ha)",
        baseValue: "₹ 5,80,000",
        solatium: "₹ 5,80,000",
        interest: "₹ 90,000",
        amount: "₹ 12,50,000",
        stage: "Disbursed",
        status: "Completed",
        bank: "Indian Bank (Lawspet)",
        ifsc: "IDIB000L012"
      },
      {
        id: "P-204",
        name: "Parcel #204 - Muthialpet",
        beneficiary: "K. Elumalai (Legal Heir)",
        surveyNos: "Survey #204/2B (0.24 Ha)",
        baseValue: "₹ 12,80,000",
        solatium: "₹ 12,80,000",
        interest: "₹ 2,40,000",
        amount: "₹ 28,00,000",
        stage: "Valuation Scrutiny",
        status: "Pending",
        bank: "UCO Bank (Puducherry Main)",
        ifsc: "UCBA0000084"
      }
    ],
    docs: getSurveyDossier("puducherry")
  },
  karaikal: {
    title: "Karaikal District",
    center: [10.925, 79.838],
    zoom: 14,
    kpis: { projects: 8, delays: 4, comp: "₹ 2.1 Cr" },
    alerts: [
      "Cadastral Map mismatches identified by Survey Officer on Port Link corridor.",
      "Affected Family R&R enumeration pending public grievance hearing in Keezhaiyur."
    ],
    projects: [
      { name: "Port Link Highway Expansion", progress: 30, target: 65, status: "Delayed", delay: "35 Days" },
      { name: "Coastal Defense Wall", progress: 85, target: 85, status: "On Track", delay: "0 Days" }
    ],
    compensation: [
      {
        id: "P-009",
        name: "Parcel #09 - Port Area",
        beneficiary: "Karaikal Coastal Trust Holdings",
        surveyNos: "Survey #09/1 to 09/4 (1.20 Ha)",
        baseValue: "₹ 36,50,000",
        solatium: "₹ 36,50,000",
        interest: "₹ 7,00,000",
        amount: "₹ 80,00,000",
        stage: "Verification",
        status: "Pending",
        bank: "Canara Bank (Karaikal)",
        ifsc: "CNRB0001092"
      }
    ],
    docs: getSurveyDossier("karaikal")
  },
  mahe: {
    title: "Mahe District",
    center: [11.701, 75.534],
    zoom: 15,
    kpis: { projects: 5, delays: 0, comp: "₹ 1.1 Cr" },
    alerts: [
      "All statutory survey documents validated; public works progressing per timeline."
    ],
    projects: [
      { name: "Riverside Promenade Renewal", progress: 85, target: 85, status: "On Track", delay: "0 Days" },
      { name: "Walkway Bridge Construction", progress: 60, target: 60, status: "On Track", delay: "0 Days" }
    ],
    compensation: [
      {
        id: "P-012",
        name: "Parcel #12 - Promenade",
        beneficiary: "C. H. Raghavan Nambiar",
        surveyNos: "Survey #12/B (0.15 Ha)",
        baseValue: "₹ 7,00,000",
        solatium: "₹ 7,00,000",
        interest: "₹ 1,00,000",
        amount: "₹ 15,00,000",
        stage: "Disbursed",
        status: "Completed",
        bank: "Kerala Gramin Bank (Mahe)",
        ifsc: "KLGB0040120"
      }
    ],
    docs: getSurveyDossier("mahe")
  }
};