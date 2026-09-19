import {
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Eye,
  ClipboardCheck,
  Map,
  IndianRupee,
  FileText,
  Upload,
  ArrowRight,
} from "lucide-react";

const project = {
  name: "NH-44 Highway Expansion",
  id: "PRJ-PB-044",
  status: "DRAFT",
  readiness: 82,
};

const projectInfo = [
  "Project Details Submitted",
  "Project Location / District Verified",
  "Land Requirement Details",
  "Implementing Agency Details",
];

const acquisitionItems = [
  "Land Identification",
  "Land Ownership Verification",
  "Land Survey Completed",
  "Land Area Verification",
  "Affected Landowner List",
  "Acquisition Notification",
];

const surveyItems = [
  "Preliminary Survey",
  "Detailed Survey",
  "GIS Boundary Verification",
  "Drone Survey",
];

const compensationItems = [
  "Compensation Assessment",
  "Beneficiary Verification",
];

const documents = [
  {
    name: "Land Acquisition Proposal",
    type: "PDF",
    status: "completed",
  },
  {
    name: "Land Records",
    type: "PDF",
    status: "completed",
  },
  {
    name: "Survey Report",
    type: "PDF",
    status: "completed",
  },
  {
    name: "GIS Map",
    type: "PDF",
    status: "completed",
  },
  {
    name: "Landowner List",
    type: "Excel",
    status: "completed",
  },
  {
    name: "Compensation Report",
    type: "PDF",
    status: "completed",
  },
  {
    name: "Final District Verification Certificate",
    type: "Required",
    status: "pending",
  },
];

function CompletedItem({ children }) {
  return (
    <div className="district-check-item completed">
      <CheckCircle2 size={17} />
      <span>{children}</span>
    </div>
  );
}

function PendingItem({ children, value }) {
  return (
    <div className="district-check-item pending">
      <Clock3 size={17} />
      <span>{children}</span>
      {value && <strong>{value}</strong>}
    </div>
  );
}

function WarningItem({ children }) {
  return (
    <div className="district-check-item warning">
      <AlertTriangle size={17} />
      <span>{children}</span>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="district-section-header">
      <div className="district-section-title">
        <Icon size={19} />
        <h2>{title}</h2>
      </div>
    </div>
  );
}

export default function ProjectsToDistrict() {
  return (
    <div className="district-page">
      {/* Page Header */}
      <div className="district-page-header">
        <div>
          <div className="district-breadcrumb">
            District Projects
          </div>

          <h1>Project Readiness</h1>
          <p>
            Review project prerequisites and forward eligible projects to
            the State Authority.
          </p>
        </div>

        <div className="district-authority">
          <span>State Authority</span>
        </div>
      </div>

      {/* Project Summary */}
      <section className="district-project-summary">
        <div className="district-project-heading">
          <div>
            <span className="district-label">Project</span>
            <h2>{project.name}</h2>
            <span className="district-project-id">
              Project ID: {project.id}
            </span>
          </div>

          <div className="district-project-status">
            <span>Status</span>
            <strong>{project.status}</strong>
          </div>
        </div>

        <div className="district-readiness">
          <div className="district-readiness-top">
            <div>
              <span>PROJECT READINESS</span>
            </div>

            <strong>{project.readiness}%</strong>
          </div>

          <div className="district-progress-track">
            <div
              className="district-progress-fill"
              style={{ width: `${project.readiness}%` }}
            />
          </div>

          <p>
            Complete all prerequisites before forwarding to State Authority.
          </p>
        </div>
      </section>

      {/* Project Information */}
      <section className="district-card">
        <SectionHeader
          icon={ClipboardCheck}
          title="PROJECT INFORMATION"
        />

        <div className="district-check-list">
          {projectInfo.map((item) => (
            <CompletedItem key={item}>{item}</CompletedItem>
          ))}
        </div>

        <div className="district-card-footer">
          <button className="district-secondary-button">
            <Eye size={16} />
            View Details
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* Land Acquisition */}
      <section className="district-card">
        <SectionHeader
          icon={ClipboardCheck}
          title="LAND ACQUISITION CHECKLIST"
        />

        <div className="district-check-list">
          {acquisitionItems.map((item) => (
            <CompletedItem key={item}>{item}</CompletedItem>
          ))}

          <PendingItem value="18 / 25 resolved">
            Objection Resolution
          </PendingItem>
        </div>

        <div className="district-card-footer">
          <button className="district-primary-button">
            Review Acquisition
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* Survey & GIS */}
      <section className="district-card">
        <SectionHeader
          icon={Map}
          title="SURVEY & GIS VERIFICATION"
        />

        <div className="district-check-list">
          {surveyItems.map((item) => (
            <CompletedItem key={item}>{item}</CompletedItem>
          ))}

          <WarningItem>Area Discrepancy Detected</WarningItem>
        </div>

        <div className="district-area-comparison">
          <div>
            <span>Official Record</span>
            <strong>10,000 m²</strong>
          </div>

          <div>
            <span>Surveyed Area</span>
            <strong>9,280 m²</strong>
          </div>

          <div className="district-difference">
            <span>Difference</span>
            <strong>720 m²</strong>
          </div>
        </div>

        <div className="district-card-footer">
          <button className="district-warning-button">
            <AlertTriangle size={16} />
            Resolve Discrepancy
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* Compensation */}
      <section className="district-card">
        <SectionHeader
          icon={IndianRupee}
          title="COMPENSATION"
        />

        <div className="district-check-list">
          {compensationItems.map((item) => (
            <CompletedItem key={item}>{item}</CompletedItem>
          ))}

          <PendingItem value="186 / 200 beneficiaries">
            Compensation Payment
          </PendingItem>

          <PendingItem>
            Payment Records Uploaded
          </PendingItem>
        </div>

        <div className="district-card-footer">
          <button className="district-secondary-button">
            <IndianRupee size={16} />
            View Compensation
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* Required Documents */}
      <section className="district-card">
        <SectionHeader
          icon={FileText}
          title="REQUIRED DOCUMENTS"
        />

        <div className="district-document-list">
          {documents.map((document) => (
            <div
              className={`district-document-row ${
                document.status === "pending" ? "pending" : ""
              }`}
              key={document.name}
            >
              <div className="district-document-name">
                {document.status === "completed" ? (
                  <CheckCircle2 size={17} />
                ) : (
                  <Clock3 size={17} />
                )}

                <span>{document.name}</span>
              </div>

              <span
                className={`district-document-type ${
                  document.status === "pending" ? "required" : ""
                }`}
              >
                {document.type}
              </span>
            </div>
          ))}
        </div>

        <div className="district-card-footer">
          <button className="district-primary-button">
            <Upload size={16} />
            Upload Document
            <ArrowRight size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}   