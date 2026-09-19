import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { stateDistricts } from "../data/stateDistricts";
import { api } from "../services/apiClient";
import "../styles/add-proposal.css";

// Only states with an onboarded State Authority account should be
// selectable here -- picking a state with no account means nobody
// can ever log in to accept/reject the project. Add a state here
// only once a real State Authority user exists for it (see the
// backend seed script / README for how those accounts get created).
const ONBOARDED_STATES = ["Bihar", "Tamil Nadu", "Uttar Pradesh", "Maharashtra"];

function AddProposal() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    // STEP 1
    projectName: "",
    projectType: "",
    description: "",
    objective: "",
    priority: "Medium",
    estimatedCost: "",
    startDate: "",
    completionDate: "",

    // STEP 2
    state: "",
    district: "",
    tehsil: "",
    villages: "",
    landRequired: "",
    privateLand: "",
    governmentLand: "",
    forestLand: "",
    otherLand: "",

    // STEP 3
    department: "",
    authority: "",
    stateAuthority: "",
    nodalOfficer: "",
    contact: "",
    fundingSource: "",
    landAcquisitionCost: "",
    fundingAllocation: "",

    // STEP 4
    projectProposal: null,
    dpr: null,
    landStatement: null,
    environmentalClearance: null,
    surveyReport: null,
    feasibilityReport: null,
    administrativeApproval: null,
    otherDocuments: null,
  });

  const [errors, setErrors] = useState({});

  const steps = [
    {
      number: 1,
      title: "Project Information",
      subtitle: "Basic project details",
    },
    {
      number: 2,
      title: "Location & Land",
      subtitle: "Project location and land requirement",
    },
    {
      number: 3,
      title: "Authority & Funding",
      subtitle: "Implementing authority and funding",
    },
    {
      number: 4,
      title: "Documents",
      subtitle: "Upload supporting documents",
    },
    {
      number: 5,
      title: "Review & Submit",
      subtitle: "Verify proposal details",
    },
  ];

  // ----------------------------------
  // STATE → DISTRICT
  // ----------------------------------

  const districts = useMemo(() => {
    if (!formData.state) return [];

    return stateDistricts[formData.state] || [];
  }, [formData.state]);

  // ----------------------------------
  // LAND TOTAL
  // ----------------------------------

  const totalLand =
    Number(formData.privateLand || 0) +
    Number(formData.governmentLand || 0) +
    Number(formData.forestLand || 0) +
    Number(formData.otherLand || 0);

  // ----------------------------------
  // UPDATE FIELD
  // ----------------------------------

  const updateField = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: "",
    }));
  };

  // ----------------------------------
  // STATE CHANGE
  // ----------------------------------

  const handleStateChange = (event) => {
    const state = event.target.value;

    setFormData((previous) => ({
      ...previous,
      state,
      district: "",
      tehsil: "",
    }));

    setErrors((previous) => ({
      ...previous,
      state: "",
      district: "",
    }));
  };

  // ----------------------------------
  // FILE CHANGE
  // ----------------------------------

  const handleFileChange = (field, event) => {
    const file = event.target.files?.[0] || null;

    updateField(field, file);
  };

  // ----------------------------------
  // VALIDATION
  // ----------------------------------

  const validateStep = () => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.projectName.trim()) {
        newErrors.projectName = "Project name is required.";
      }

      if (!formData.projectType) {
        newErrors.projectType = "Select a project type.";
      }

      if (!formData.description.trim()) {
        newErrors.description = "Project description is required.";
      }

      if (!formData.objective.trim()) {
        newErrors.objective = "Project objective is required.";
      }

      if (!formData.estimatedCost.trim()) {
        newErrors.estimatedCost = "Enter estimated project cost.";
      }
    }

    if (currentStep === 2) {
      if (!formData.state) {
        newErrors.state = "Select a state.";
      }

      if (!formData.district) {
        newErrors.district = "Select a district.";
      }

      if (!formData.landRequired.trim()) {
        newErrors.landRequired = "Enter total land required.";
      }
    }

    if (currentStep === 3) {
      if (!formData.department) {
        newErrors.department = "Select a department.";
      }

      if (!formData.authority.trim()) {
        newErrors.authority = "Enter implementing authority.";
      }

      if (!formData.fundingSource) {
        newErrors.fundingSource = "Select a funding source.";
      }
    }

    if (currentStep === 4) {
      if (!formData.projectProposal) {
        newErrors.projectProposal =
          "Project proposal document is required.";
      }

      if (!formData.dpr) {
        newErrors.dpr = "DPR document is required.";
      }

      if (!formData.landStatement) {
        newErrors.landStatement =
          "Land requirement statement is required.";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ----------------------------------
  // NEXT
  // ----------------------------------

  const handleNext = () => {
    if (!validateStep()) return;

    setCurrentStep((previous) =>
      Math.min(previous + 1, 5)
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ----------------------------------
  // BACK
  // ----------------------------------

  const handleBack = () => {
    setCurrentStep((previous) =>
      Math.max(previous - 1, 1)
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ----------------------------------
  // SUBMIT
  // ----------------------------------

  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitError("");
    setSubmitting(true);
    try {
      await api.projects.create({
        name: formData.projectName,
        projectType: formData.projectType,
        description: formData.description,
        state: formData.state,
        districts: formData.district ? [formData.district] : [],
        department: formData.department,
        fundingSource: formData.fundingSource,
        nodalOfficer: formData.nodalOfficer,
        estimatedCostCr: formData.estimatedCost ? Number(formData.estimatedCost) : null,
        landRequiredHa: formData.landRequired ? Number(formData.landRequired) : null,
        risk: "Medium",
        priority: formData.priority,
        issueDate: formData.startDate || null,
        deadlineDate: formData.completionDate || null,
      });

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSubmitError(err.message || "Failed to submit proposal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetProposal = () => {
    navigate("/projects");
  };

  // ----------------------------------
  // SUCCESS SCREEN
  // ----------------------------------

  if (submitted) {
    return (
      <div className="proposal-page">
        <div className="proposal-success">

          <div className="success-icon">
            ✓
          </div>

          <span className="eyebrow">
            PROPOSAL SUBMITTED
          </span>

          <h1>
            Proposal submitted successfully
          </h1>

          <p>
            Your project proposal has been recorded and
            is now waiting for verification.
          </p>

          <div className="proposal-id-card">

            <span>
              Proposal ID
            </span>

            <strong>
              ATLAS-PROP-001
            </strong>

            <div className="proposal-status">
              <span className="status-dot"></span>
              Pending Verification
            </div>

          </div>

          <div className="success-actions">

            <button
              className="primary-btn"
              onClick={resetProposal}
            >
              View All Projects
            </button>

            <button
              className="secondary-btn"
              onClick={() =>
                window.location.reload()
              }
            >
              Create Another Proposal
            </button>

          </div>

        </div>
      </div>
    );
  }

  // ----------------------------------
  // MAIN PAGE
  // ----------------------------------

  return (
    <div className="proposal-page">

      {/* =========================================
          HEADER
      ========================================= */}

      <div className="proposal-top">

        <div>

          <div className="proposal-breadcrumb">

            <Link to="/dashboard">
              Dashboard
            </Link>

            <span>/</span>

            <Link to="/projects">
              Projects
            </Link>

            <span>/</span>

            <span>
              New Proposal
            </span>

          </div>

          <div className="proposal-heading">

            <span className="proposal-heading-icon">
              ＋
            </span>

            <div>

              <span className="eyebrow">
                PROJECT REGISTRATION
              </span>

              <h1>
                Add New Proposal
              </h1>

              <p>
                Submit a new project proposal for
                review and verification.
              </p>

            </div>

          </div>

        </div>

        <div className="draft-badge">
          <span className="draft-dot"></span>
          Draft
        </div>

      </div>

      {/* =========================================
          STEPPER
      ========================================= */}

      <div className="proposal-stepper">

        {steps.map((step, index) => {

          const isActive =
            currentStep === step.number;

          const isCompleted =
            currentStep > step.number;

          return (
            <div
              className={`step-item ${
                isActive ? "active" : ""
              } ${
                isCompleted ? "completed" : ""
              }`}
              key={step.number}
            >

              <div className="step-number">
                {isCompleted
                  ? "✓"
                  : step.number}
              </div>

              <div className="step-info">

                <strong>
                  {step.title}
                </strong>

                <span>
                  {step.subtitle}
                </span>

              </div>

              {index !== steps.length - 1 && (
                <div className="step-line"></div>
              )}

            </div>
          );
        })}

      </div>

      {/* =========================================
          FORM
      ========================================= */}

      <div className="proposal-content">

        {/* =====================================
            STEP 1
        ===================================== */}

        {currentStep === 1 && (

          <section className="proposal-section">

            <SectionHeader
              number="01"
              title="Project Information"
              description="Provide the basic details of the proposed project."
            />

            <div className="form-grid">

              <FormField
                label="Project Name"
                required
                error={errors.projectName}
                full
              >

                <input
                  type="text"
                  placeholder="Enter project name"
                  value={formData.projectName}
                  onChange={(e) =>
                    updateField(
                      "projectName",
                      e.target.value
                    )
                  }
                />

              </FormField>

              <FormField
                label="Project Type"
                required
                error={errors.projectType}
              >

                <select
                  value={formData.projectType}
                  onChange={(e) =>
                    updateField(
                      "projectType",
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Select project type
                  </option>

                  <option value="Highway">
                    Highway
                  </option>

                  <option value="Railway">
                    Railway
                  </option>

                  <option value="Metro">
                    Metro
                  </option>

                  <option value="Irrigation">
                    Irrigation
                  </option>

                  <option value="Renewable Energy">
                    Renewable Energy
                  </option>

                  <option value="Industrial">
                    Industrial
                  </option>

                  <option value="Connectivity">
                    Connectivity
                  </option>

                  <option value="Environmental">
                    Environmental
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

              </FormField>

              <FormField label="Priority">

                <select
                  value={formData.priority}
                  onChange={(e) =>
                    updateField(
                      "priority",
                      e.target.value
                    )
                  }
                >

                  <option value="Low">
                    Low
                  </option>

                  <option value="Medium">
                    Medium
                  </option>

                  <option value="High">
                    High
                  </option>

                </select>

              </FormField>

              {/* MANUAL COST ENTRY */}

              <FormField
                label="Estimated Project Cost"
                required
                error={errors.estimatedCost}
              >

                <div className="input-prefix">

                  <span>₹</span>

                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Enter amount"
                    value={formData.estimatedCost}
                    onChange={(e) =>
                      updateField(
                        "estimatedCost",
                        e.target.value
                      )
                    }
                  />

                  <small>
                    Cr
                  </small>

                </div>

              </FormField>

              <FormField label="Proposed Start Date">

                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    updateField(
                      "startDate",
                      e.target.value
                    )
                  }
                />

              </FormField>

              <FormField label="Expected Completion Date">

                <input
                  type="date"
                  value={formData.completionDate}
                  onChange={(e) =>
                    updateField(
                      "completionDate",
                      e.target.value
                    )
                  }
                />

              </FormField>

              <FormField
                label="Project Description"
                required
                error={errors.description}
                full
              >

                <textarea
                  rows="5"
                  placeholder="Describe the proposed project, its scope and major components..."
                  value={formData.description}
                  onChange={(e) =>
                    updateField(
                      "description",
                      e.target.value
                    )
                  }
                />

              </FormField>

              <FormField
                label="Project Objective"
                required
                error={errors.objective}
                full
              >

                <textarea
                  rows="4"
                  placeholder="Describe the objective and expected outcome of the project..."
                  value={formData.objective}
                  onChange={(e) =>
                    updateField(
                      "objective",
                      e.target.value
                    )
                  }
                />

              </FormField>

            </div>

          </section>
        )}

        {/* =====================================
            STEP 2
        ===================================== */}

        {currentStep === 2 && (

          <section className="proposal-section">

            <SectionHeader
              number="02"
              title="Location & Land Requirement"
              description="Specify where the project will be developed and the land required."
            />

            <div className="form-grid">

              <FormField
                label="State"
                required
                error={errors.state}
              >

                <select
                  value={formData.state}
                  onChange={handleStateChange}
                >

                  <option value="">
                    Select state
                  </option>

                  {ONBOARDED_STATES.map(
                    (state) => (
                      <option
                        key={state}
                        value={state}
                      >
                        {state}
                      </option>
                    )
                  )}

                </select>

              </FormField>

              <FormField
                label="District"
                required
                error={errors.district}
              >

                <select
                  value={formData.district}
                  disabled={!formData.state}
                  onChange={(e) =>
                    updateField(
                      "district",
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    {formData.state
                      ? "Select district"
                      : "Select state first"}
                  </option>

                  {districts.map(
                    (district) => (
                      <option
                        key={district}
                        value={district}
                      >
                        {district}
                      </option>
                    )
                  )}

                </select>

              </FormField>

              <FormField label="Sub-District / Tehsil">

                <input
                  type="text"
                  placeholder="Enter tehsil / sub-district"
                  value={formData.tehsil}
                  onChange={(e) =>
                    updateField(
                      "tehsil",
                      e.target.value
                    )
                  }
                />

              </FormField>

              <FormField label="Village(s)">

                <input
                  type="text"
                  placeholder="Enter village names"
                  value={formData.villages}
                  onChange={(e) =>
                    updateField(
                      "villages",
                      e.target.value
                    )
                  }
                />

              </FormField>

              {/* MANUAL LAND ENTRY */}

              <FormField
                label="Total Land Required"
                required
                error={errors.landRequired}
                full
              >

                <div className="input-suffix">

                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Enter total land requirement"
                    value={formData.landRequired}
                    onChange={(e) =>
                      updateField(
                        "landRequired",
                        e.target.value
                      )
                    }
                  />

                  <span>
                    hectares
                  </span>

                </div>

              </FormField>

            </div>

            {/* LAND BREAKDOWN */}

            <div className="land-breakdown">

              <div className="subsection-heading">

                <div>

                  <h3>
                    Land Classification
                  </h3>

                  <p>
                    Provide the estimated distribution
                    of the required land.
                  </p>

                </div>

                <div className="land-total">

                  <span>
                    Calculated Total
                  </span>

                  <strong>
                    {totalLand.toLocaleString()} ha
                  </strong>

                </div>

              </div>

              <div className="land-grid">

                <LandInput
                  label="Private Land"
                  value={formData.privateLand}
                  onChange={(value) =>
                    updateField(
                      "privateLand",
                      value
                    )
                  }
                />

                <LandInput
                  label="Government Land"
                  value={formData.governmentLand}
                  onChange={(value) =>
                    updateField(
                      "governmentLand",
                      value
                    )
                  }
                />

                <LandInput
                  label="Forest / Protected Land"
                  value={formData.forestLand}
                  onChange={(value) =>
                    updateField(
                      "forestLand",
                      value
                    )
                  }
                />

                <LandInput
                  label="Other Land"
                  value={formData.otherLand}
                  onChange={(value) =>
                    updateField(
                      "otherLand",
                      value
                    )
                  }
                />

              </div>

            </div>

          </section>
        )}

        {/* =====================================
            STEP 3
        ===================================== */}

        {currentStep === 3 && (

          <section className="proposal-section">

            <SectionHeader
              number="03"
              title="Authority & Funding"
              description="Provide the responsible authority and proposed funding details."
            />

            <div className="form-grid">

              <FormField
                label="Ministry / Department"
                required
                error={errors.department}
              >

                <select
                  value={formData.department}
                  onChange={(e) =>
                    updateField(
                      "department",
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Select department
                  </option>

                  <option value="Ministry of Road Transport">
                    Ministry of Road Transport & Highways
                  </option>

                  <option value="Ministry of Railways">
                    Ministry of Railways
                  </option>

                  <option value="Ministry of Jal Shakti">
                    Ministry of Jal Shakti
                  </option>

                  <option value="Ministry of Power">
                    Ministry of Power
                  </option>

                  <option value="Ministry of Environment">
                    Ministry of Environment
                  </option>

                  <option value="State Government">
                    State Government Department
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

              </FormField>

              <FormField
                label="Implementing Authority"
                required
                error={errors.authority}
              >

                <input
                  type="text"
                  placeholder="Enter implementing authority"
                  value={formData.authority}
                  onChange={(e) =>
                    updateField(
                      "authority",
                      e.target.value
                    )
                  }
                />

              </FormField>

              <FormField label="State Authority">

                <input
                  type="text"
                  placeholder="Enter state-level authority"
                  value={formData.stateAuthority}
                  onChange={(e) =>
                    updateField(
                      "stateAuthority",
                      e.target.value
                    )
                  }
                />

              </FormField>

              <FormField label="Nodal Officer">

                <input
                  type="text"
                  placeholder="Enter nodal officer name"
                  value={formData.nodalOfficer}
                  onChange={(e) =>
                    updateField(
                      "nodalOfficer",
                      e.target.value
                    )
                  }
                />

              </FormField>

              <FormField label="Official Contact">

                <input
                  type="text"
                  placeholder="Official email / phone"
                  value={formData.contact}
                  onChange={(e) =>
                    updateField(
                      "contact",
                      e.target.value
                    )
                  }
                />

              </FormField>

            </div>

            {/* FUNDING */}

            <div className="funding-block">

              <div className="subsection-heading">

                <div>

                  <h3>
                    Funding Details
                  </h3>

                  <p>
                    Specify the proposed source and
                    allocation of funds.
                  </p>

                </div>

              </div>

              <div className="form-grid">

                <FormField
                  label="Funding Source"
                  required
                  error={errors.fundingSource}
                >

                  <select
                    value={formData.fundingSource}
                    onChange={(e) =>
                      updateField(
                        "fundingSource",
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      Select funding source
                    </option>

                    <option value="Central Government">
                      Central Government
                    </option>

                    <option value="State Government">
                      State Government
                    </option>

                    <option value="Centrally Sponsored Scheme">
                      Centrally Sponsored Scheme
                    </option>

                    <option value="Public Private Partnership">
                      Public-Private Partnership
                    </option>

                    <option value="Other">
                      Other
                    </option>

                  </select>

                </FormField>

                {/* MANUAL ACQUISITION COST */}

                <FormField label="Land Acquisition Cost">

                  <div className="input-prefix">

                    <span>
                      ₹
                    </span>

                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Enter amount"
                      value={
                        formData.landAcquisitionCost
                      }
                      onChange={(e) =>
                        updateField(
                          "landAcquisitionCost",
                          e.target.value
                        )
                      }
                    />

                    <small>
                      Cr
                    </small>

                  </div>

                </FormField>

                {/* MANUAL FUNDING ALLOCATION */}

                <FormField label="Funding Allocation">

                  <div className="input-prefix">

                    <span>
                      ₹
                    </span>

                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Enter allocated amount"
                      value={
                        formData.fundingAllocation
                      }
                      onChange={(e) =>
                        updateField(
                          "fundingAllocation",
                          e.target.value
                        )
                      }
                    />

                    <small>
                      Cr
                    </small>

                  </div>

                </FormField>

              </div>

            </div>

          </section>
        )}

        {/* =====================================
            STEP 4
        ===================================== */}

        {currentStep === 4 && (

          <section className="proposal-section">

            <SectionHeader
              number="04"
              title="Documents"
              description="Upload the documents required for proposal verification."
            />

            <div className="document-note">

              <span>ⓘ</span>

              <div>

                <strong>
                  Document verification
                </strong>

                <p>
                  Required documents are marked with *.
                  Uploaded documents will be processed
                  during the verification stage.
                </p>

              </div>

            </div>

            <div className="documents-grid">

              <DocumentUpload
                title="Project Proposal"
                required
                value={formData.projectProposal}
                error={errors.projectProposal}
                onChange={(e) =>
                  handleFileChange(
                    "projectProposal",
                    e
                  )
                }
              />

              <DocumentUpload
                title="Detailed Project Report (DPR)"
                required
                value={formData.dpr}
                error={errors.dpr}
                onChange={(e) =>
                  handleFileChange("dpr", e)
                }
              />

              <DocumentUpload
                title="Land Requirement Statement"
                required
                value={formData.landStatement}
                error={errors.landStatement}
                onChange={(e) =>
                  handleFileChange(
                    "landStatement",
                    e
                  )
                }
              />

              <DocumentUpload
                title="Environmental Clearance"
                value={
                  formData.environmentalClearance
                }
                onChange={(e) =>
                  handleFileChange(
                    "environmentalClearance",
                    e
                  )
                }
              />

              <DocumentUpload
                title="Survey Report"
                value={formData.surveyReport}
                onChange={(e) =>
                  handleFileChange(
                    "surveyReport",
                    e
                  )
                }
              />

              <DocumentUpload
                title="Feasibility Report"
                value={formData.feasibilityReport}
                onChange={(e) =>
                  handleFileChange(
                    "feasibilityReport",
                    e
                  )
                }
              />

              <DocumentUpload
                title="Administrative Approval"
                value={
                  formData.administrativeApproval
                }
                onChange={(e) =>
                  handleFileChange(
                    "administrativeApproval",
                    e
                  )
                }
              />

              <DocumentUpload
                title="Other Supporting Documents"
                value={formData.otherDocuments}
                onChange={(e) =>
                  handleFileChange(
                    "otherDocuments",
                    e
                  )
                }
              />

            </div>

          </section>
        )}

        {/* =====================================
            STEP 5
        ===================================== */}

        {currentStep === 5 && (

          <section className="proposal-section">

            <SectionHeader
              number="05"
              title="Review & Submit"
              description="Review the information before submitting the proposal."
            />

            {/* PROJECT INFORMATION */}

            <ReviewBlock title="Project Information">

              <ReviewRow
                label="Project Name"
                value={
                  formData.projectName
                }
              />

              <ReviewRow
                label="Project Type"
                value={
                  formData.projectType
                }
              />

              <ReviewRow
                label="Priority"
                value={
                  formData.priority
                }
              />

              <ReviewRow
                label="Estimated Cost"
                value={
                  formData.estimatedCost
                    ? `₹ ${formData.estimatedCost} Cr`
                    : "—"
                }
              />

              <ReviewRow
                label="Proposed Start"
                value={
                  formData.startDate || "—"
                }
              />

              <ReviewRow
                label="Expected Completion"
                value={
                  formData.completionDate || "—"
                }
              />

              <ReviewRow
                label="Description"
                value={
                  formData.description || "—"
                }
                full
              />

              <ReviewRow
                label="Objective"
                value={
                  formData.objective || "—"
                }
                full
              />

            </ReviewBlock>

            {/* LOCATION */}

            <ReviewBlock title="Location & Land">

              <ReviewRow
                label="State"
                value={
                  formData.state
                }
              />

              <ReviewRow
                label="District"
                value={
                  formData.district
                }
              />

              <ReviewRow
                label="Tehsil"
                value={
                  formData.tehsil || "—"
                }
              />

              <ReviewRow
                label="Village(s)"
                value={
                  formData.villages || "—"
                }
              />

              <ReviewRow
                label="Total Land Required"
                value={
                  formData.landRequired
                    ? `${formData.landRequired} hectares`
                    : "—"
                }
              />

              <ReviewRow
                label="Private Land"
                value={`${formData.privateLand || 0} ha`}
              />

              <ReviewRow
                label="Government Land"
                value={`${formData.governmentLand || 0} ha`}
              />

              <ReviewRow
                label="Forest / Protected"
                value={`${formData.forestLand || 0} ha`}
              />

              <ReviewRow
                label="Other Land"
                value={`${formData.otherLand || 0} ha`}
              />

            </ReviewBlock>

            {/* AUTHORITY & FUNDING */}

            <ReviewBlock title="Authority & Funding">

              <ReviewRow
                label="Ministry / Department"
                value={
                  formData.department
                }
              />

              <ReviewRow
                label="Implementing Authority"
                value={
                  formData.authority
                }
              />

              <ReviewRow
                label="State Authority"
                value={
                  formData.stateAuthority || "—"
                }
              />

              <ReviewRow
                label="Nodal Officer"
                value={
                  formData.nodalOfficer || "—"
                }
              />

              <ReviewRow
                label="Official Contact"
                value={
                  formData.contact || "—"
                }
              />

              <ReviewRow
                label="Funding Source"
                value={
                  formData.fundingSource
                }
              />

              <ReviewRow
                label="Land Acquisition Cost"
                value={
                  formData.landAcquisitionCost
                    ? `₹ ${formData.landAcquisitionCost} Cr`
                    : "—"
                }
              />

              <ReviewRow
                label="Funding Allocation"
                value={
                  formData.fundingAllocation
                    ? `₹ ${formData.fundingAllocation} Cr`
                    : "—"
                }
              />

            </ReviewBlock>

            {/* DOCUMENTS */}

            <ReviewBlock title="Documents">

              <div className="review-documents">

                {[
                  [
                    "Project Proposal",
                    formData.projectProposal,
                  ],
                  [
                    "Detailed Project Report",
                    formData.dpr,
                  ],
                  [
                    "Land Requirement Statement",
                    formData.landStatement,
                  ],
                  [
                    "Environmental Clearance",
                    formData.environmentalClearance,
                  ],
                  [
                    "Survey Report",
                    formData.surveyReport,
                  ],
                  [
                    "Feasibility Report",
                    formData.feasibilityReport,
                  ],
                  [
                    "Administrative Approval",
                    formData.administrativeApproval,
                  ],
                  [
                    "Other Documents",
                    formData.otherDocuments,
                  ],
                ].map(([label, file]) => (

                  <div
                    className="review-document"
                    key={label}
                  >

                    <span
                      className={
                        file
                          ? "file-check"
                          : "file-empty"
                      }
                    >
                      {file ? "✓" : "—"}
                    </span>

                    <div>

                      <strong>
                        {label}
                      </strong>

                      <span>
                        {file
                          ? file.name
                          : "Not uploaded"}
                      </span>

                    </div>

                  </div>

                ))}

              </div>

            </ReviewBlock>

            {/* SUBMIT WARNING */}

            <div className="submit-warning">

              <span>!</span>

              <div>

                <strong>
                  Ready to submit?
                </strong>

                <p>
                  Once submitted, this proposal will
                  enter the verification workflow. In
                  the current frontend-only version,
                  the submission is simulated.
                </p>

              </div>

            </div>

          </section>
        )}

      </div>

      {/* =========================================
          FOOTER ACTIONS
      ========================================= */}

      <div className="proposal-actions">

        <button
          className="secondary-btn"
          onClick={
            currentStep === 1
              ? () => navigate("/projects")
              : handleBack
          }
        >
          ←{" "}
          {currentStep === 1
            ? "Cancel"
            : "Back"}
        </button>

        <div className="action-right">

          <span className="step-counter">
            Step {currentStep} of 5
          </span>

          {submitError && (
            <p style={{ color: "var(--danger, #dc2626)", marginBottom: "8px" }}>
              {submitError}
            </p>
          )}

          {currentStep < 5 ? (

            <button
              className="primary-btn"
              onClick={handleNext}
            >
              Continue →
            </button>

          ) : (

            <button
              className="primary-btn submit-btn"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "✓ Submit Proposal"}
            </button>

          )}

        </div>

      </div>

    </div>
  );
}

/* =========================================
   SECTION HEADER
========================================= */

function SectionHeader({
  number,
  title,
  description,
}) {
  return (
    <div className="section-header">

      <span className="section-number">
        {number}
      </span>

      <div>

        <h2>
          {title}
        </h2>

        <p>
          {description}
        </p>

      </div>

    </div>
  );
}

/* =========================================
   FORM FIELD
========================================= */

function FormField({
  label,
  required = false,
  error,
  full = false,
  children,
}) {
  return (
    <div
      className={`form-field ${
        full ? "full-width" : ""
      }`}
    >

      <label>

        {label}

        {required && (
          <span className="required">
            *
          </span>
        )}

      </label>

      {children}

      {error && (
        <small className="field-error">
          {error}
        </small>
      )}

    </div>
  );
}

/* =========================================
   LAND INPUT
   ========================================= */

function LandInput({
  label,
  value,
  onChange,
}) {
  return (
    <div className="land-input">

      <label>
        {label}
      </label>

      <div>

        <input
          type="text"
          inputMode="decimal"
          placeholder="0"
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
        />

        <span>
          ha
        </span>

      </div>

    </div>
  );
}

/* =========================================
   DOCUMENT UPLOAD
========================================= */

function DocumentUpload({
  title,
  required = false,
  value,
  error,
  onChange,
}) {
  return (
    <div
      className={`document-upload ${
        error ? "has-error" : ""
      }`}
    >

      <div className="document-upload-icon">
        ▧
      </div>

      <div className="document-upload-info">

        <label>

          {title}

          {required && (
            <span className="required">
              *
            </span>
          )}

        </label>

        <span>
          {value
            ? value.name
            : "PDF, DOC or DOCX · Max 10 MB"}
        </span>

        {error && (
          <small className="field-error">
            {error}
          </small>
        )}

      </div>

      <label className="upload-btn">

        {value
          ? "Replace"
          : "Upload"}

        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={onChange}
          hidden
        />

      </label>

    </div>
  );
}

/* =========================================
   REVIEW BLOCK
========================================= */

function ReviewBlock({
  title,
  children,
}) {
  return (
    <div className="review-block">

      <div className="review-block-header">

        <h3>
          {title}
        </h3>

      </div>

      <div className="review-grid">
        {children}
      </div>

    </div>
  );
}

/* =========================================
   REVIEW ROW
========================================= */

function ReviewRow({
  label,
  value,
  full = false,
}) {
  return (
    <div
      className={`review-row ${
        full ? "review-full" : ""
      }`}
    >

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

export default AddProposal;