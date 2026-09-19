function Field({ label, value }) {
  return (
    <div>
      <span className="profile-field-label">{label}</span>
      <span className="profile-field-value">{value}</span>
    </div>
  );
}


function Profile() {

  return (

    <div className="central-dashboard tabbed-module">

      <div className="tabbed-module-header">
        <h2>Profile</h2>
        <p>Who you are and what you're authorized to access. Your current projects and work belong on the Dashboard, not here.</p>
      </div>


      <div className="profile-header">
        <div className="profile-avatar">RK</div>
        <div>
          <div className="profile-header-name">Rajesh Kumar</div>
          <div className="profile-header-role">District Authority — Cuddalore</div>
        </div>
        <div className="profile-header-actions">
          <button type="button" className="settings-btn">Change Photo</button>
          <button type="button" className="settings-btn">Edit Profile</button>
        </div>
      </div>


      {/* ---------- PERSONAL INFORMATION ---------- */}
      <div className="settings-section">
        <div className="settings-section-header">
          <h3>Personal Information</h3>
        </div>
        <div className="profile-field-grid">
          <Field label="Full Name" value="Rajesh Kumar" />
          <Field label="Employee / User ID" value="ATLAS-U-10482" />
          <Field label="Designation" value="District Land Acquisition Officer" />
          <Field label="Department" value="Revenue Department" />
          <Field label="Organization" value="Government of Tamil Nadu" />
          <Field label="Official Email" value="rajesh.kumar@tn.gov.in" />
          <Field label="Contact Number" value="+91 98•••••210" />
        </div>
      </div>


      {/* ---------- ROLE & ACCESS ---------- */}
      <div className="settings-section">
        <div className="settings-section-header">
          <h3>Role &amp; Access</h3>
        </div>
        <div className="profile-field-grid">
          <Field label="User Role" value="District Authority" />
          <Field label="Access Level" value="Read / Write — assigned jurisdiction" />
          <Field label="Assigned Region" value="Cuddalore District, Tamil Nadu" />
          <Field label="Assigned Department" value="Revenue Department — Land Acquisition Wing" />
        </div>
        <div style={{ marginTop: "0.9rem" }}>
          <button type="button" className="settings-btn">View Access Permissions</button>
        </div>
      </div>


      {/* ---------- ACCOUNT INFORMATION ---------- */}
      <div className="settings-section">
        <div className="settings-section-header">
          <h3>Account Information</h3>
        </div>
        <div className="profile-field-grid">
          <Field label="Account Status" value={<span className="status-pill"><span className="status-pill-dot" />Active</span>} />
          <Field label="Date Joined" value="14 Mar 2023" />
          <Field label="Last Login" value="Today, 09:42 IST" />
          <Field label="Verification Status" value={<span className="status-pill"><span className="status-pill-dot" />Verified</span>} />
        </div>
      </div>


      {/* ---------- PROFILE ACTIONS ---------- */}
      <div className="settings-section">
        <div className="settings-section-header">
          <h3>Profile Actions</h3>
        </div>
        <div className="land-summary-links" style={{ marginTop: 0 }}>
          <button type="button" className="settings-btn">Edit Profile</button>
          <button type="button" className="settings-btn">Change Profile Photo</button>
          <button type="button" className="settings-btn">Change Password</button>
          <button type="button" className="settings-btn">View Access Permissions</button>
        </div>
      </div>

    </div>

  );

}

export default Profile;
