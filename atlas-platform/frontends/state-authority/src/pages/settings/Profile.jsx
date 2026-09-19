import {
  UserCircle,
  CheckCircle2,
  Building2,
  MapPin,
  Pencil,
} from "lucide-react";

export default function Profile() {
  return (
    <div className="profile-page">
      {/* Page Header */}
      <div className="profile-page-header">
        <div>
          <h1>Profile</h1>
          <p>
            Manage your account and authority information
          </p>
        </div>
      </div>

      {/* Profile Overview */}
      <section className="profile-overview-card">
        <div className="profile-avatar">
          <UserCircle size={58} strokeWidth={1.5} />
        </div>

        <div className="profile-overview-content">
          <span className="profile-overview-label">
            Profile
          </span>

          <h2>STATE AUTHORITY</h2>

          <p>State Land Acquisition Department</p>

          <div className="profile-active-status">
            <CheckCircle2 size={15} />
            <span>Active Account</span>
          </div>
        </div>
      </section>

      {/* Authority Information */}
      <section className="profile-section">
        <div className="profile-section-title">
          <Building2 size={18} />
          <h2>AUTHORITY INFORMATION</h2>
        </div>

        <div className="profile-info-grid">
          <div className="profile-info-card">
            <span>Officer Name</span>
            <strong>Rajesh Kumar</strong>
          </div>

          <div className="profile-info-card">
            <span>Authority ID</span>
            <strong>STA-PB-00241</strong>
          </div>

          <div className="profile-info-card">
            <span>Designation</span>
            <strong>State Authority</strong>
          </div>

          <div className="profile-info-card">
            <span>Department</span>
            <strong>Land Acquisition Dept.</strong>
          </div>
        </div>
      </section>

      {/* Jurisdiction */}
      <section className="profile-section">
        <div className="profile-section-title">
          <MapPin size={18} />
          <h2>JURISDICTION</h2>
        </div>

        <div className="profile-info-grid">
          <div className="profile-info-card">
            <span>State</span>
            <strong>Punjab</strong>
          </div>

          <div className="profile-info-card">
            <span>Districts Under Authority</span>
            <strong>23 Districts</strong>
          </div>
        </div>
      </section>

      {/* Action */}
      <div className="profile-actions">
        <button className="profile-edit-button">
          <Pencil size={16} />
          Edit Profile
        </button>
      </div>
    </div>
  );
}