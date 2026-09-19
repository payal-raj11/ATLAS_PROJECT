import { useState } from "react";


function Toggle({ checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" />
    </label>
  );
}


function Row({ label, note, control }) {
  return (
    <div className="settings-row">
      <div>
        <div className="settings-row-label">{label}</div>
        {note && <div className="settings-row-note">{note}</div>}
      </div>
      <div className="settings-row-control">{control}</div>
    </div>
  );
}


function Settings() {

  const [twoFactor, setTwoFactor] = useState(true);
  const [notif, setNotif] = useState({
    email: true,
    inApp: true,
    projectUpdates: true,
    approvals: true,
    funding: false,
    deadlines: true,
    riskAlerts: true,
  });
  const [display, setDisplay] = useState({
    language: "English",
    dateFormat: "DD/MM/YYYY",
    currency: "INR (₹)",
  });
  const [mapPrefs, setMapPrefs] = useState({
    defaultView: "India (all states)",
    mapType: "Street",
    units: "Acres",
    labels: true,
  });
  const [privacy, setPrivacy] = useState({
    shareActivity: false,
    dataSharing: false,
  });

  const setNotifField = (key) => (val) => setNotif((n) => ({ ...n, [key]: val }));

  return (

    <div className="central-dashboard tabbed-module">

      <div className="tabbed-module-header">
        <h2>Settings</h2>
        <p>How ATLAS should behave for you. This is preference only — land, funding and project data live in their own modules.</p>
      </div>


      {/* ---------- ACCOUNT & SECURITY ---------- */}
      <div className="settings-section">
        <div className="settings-section-header">
          <h3>Account &amp; Security</h3>
          <span>Password, sign-in, active sessions</span>
        </div>

        <Row label="Password" note="Last changed 42 days ago" control={<button type="button" className="settings-btn">Change Password</button>} />
        <Row label="Two-factor authentication" note="Require a one-time code at sign-in" control={<Toggle checked={twoFactor} onChange={setTwoFactor} />} />
        <Row label="Active sessions" note="2 devices signed in" control={<button type="button" className="settings-btn">Manage Sessions</button>} />
        <Row label="Log out of all devices" control={<button type="button" className="settings-btn settings-btn-danger">Log Out Everywhere</button>} />
      </div>


      {/* ---------- NOTIFICATIONS ---------- */}
      <div className="settings-section">
        <div className="settings-section-header">
          <h3>Notifications</h3>
          <span>What you receive, and how</span>
        </div>

        <Row label="Email notifications" control={<Toggle checked={notif.email} onChange={setNotifField("email")} />} />
        <Row label="In-app notifications" control={<Toggle checked={notif.inApp} onChange={setNotifField("inApp")} />} />
        <Row label="Project updates" control={<Toggle checked={notif.projectUpdates} onChange={setNotifField("projectUpdates")} />} />
        <Row label="Approval alerts" control={<Toggle checked={notif.approvals} onChange={setNotifField("approvals")} />} />
        <Row label="Funding alerts" control={<Toggle checked={notif.funding} onChange={setNotifField("funding")} />} />
        <Row label="Deadline reminders" control={<Toggle checked={notif.deadlines} onChange={setNotifField("deadlines")} />} />
        <Row label="Risk / critical alerts" control={<Toggle checked={notif.riskAlerts} onChange={setNotifField("riskAlerts")} />} />
      </div>


      {/* ---------- DISPLAY ---------- */}
      <div className="settings-section">
        <div className="settings-section-header">
          <h3>Display</h3>
          <span>Theme is toggled from the header — everything else lives here</span>
        </div>

        <Row
          label="Language"
          control={
            <select className="settings-select" value={display.language} onChange={(e) => setDisplay((d) => ({ ...d, language: e.target.value }))}>
              <option>English</option>
              <option>Hindi</option>
              <option>Tamil</option>
            </select>
          }
        />
        <Row
          label="Date format"
          control={
            <select className="settings-select" value={display.dateFormat} onChange={(e) => setDisplay((d) => ({ ...d, dateFormat: e.target.value }))}>
              <option>DD/MM/YYYY</option>
              <option>MM/DD/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          }
        />
        <Row
          label="Currency format"
          control={
            <select className="settings-select" value={display.currency} onChange={(e) => setDisplay((d) => ({ ...d, currency: e.target.value }))}>
              <option>INR (₹)</option>
              <option>INR — Lakh/Crore</option>
            </select>
          }
        />
      </div>


      {/* ---------- MAP PREFERENCES ---------- */}
      <div className="settings-section">
        <div className="settings-section-header">
          <h3>Map Preferences</h3>
          <span>Defaults for the GIS Land Map — actual land data stays in Land &amp; Impact</span>
        </div>

        <Row
          label="Default map view"
          control={
            <select className="settings-select" value={mapPrefs.defaultView} onChange={(e) => setMapPrefs((m) => ({ ...m, defaultView: e.target.value }))}>
              <option>India (all states)</option>
              <option>My assigned state</option>
              <option>My assigned district</option>
            </select>
          }
        />
        <Row
          label="Default map type"
          control={
            <select className="settings-select" value={mapPrefs.mapType} onChange={(e) => setMapPrefs((m) => ({ ...m, mapType: e.target.value }))}>
              <option>Street</option>
              <option>Satellite</option>
              <option>Hybrid</option>
            </select>
          }
        />
        <Row
          label="Measurement units"
          control={
            <select className="settings-select" value={mapPrefs.units} onChange={(e) => setMapPrefs((m) => ({ ...m, units: e.target.value }))}>
              <option>Acres</option>
              <option>Hectares</option>
              <option>Sq. meters</option>
            </select>
          }
        />
        <Row label="Show map labels" control={<Toggle checked={mapPrefs.labels} onChange={(v) => setMapPrefs((m) => ({ ...m, labels: v }))} />} />
      </div>


      {/* ---------- DATA & PRIVACY ---------- */}
      <div className="settings-section">
        <div className="settings-section-header">
          <h3>Data &amp; Privacy</h3>
          <span>Access permissions and activity history</span>
        </div>

        <Row label="Share my activity with my department" control={<Toggle checked={privacy.shareActivity} onChange={(v) => setPrivacy((p) => ({ ...p, shareActivity: v }))} />} />
        <Row label="Allow data sharing with connected government sources" control={<Toggle checked={privacy.dataSharing} onChange={(v) => setPrivacy((p) => ({ ...p, dataSharing: v }))} />} />
        <Row label="Activity history" note="View your recent sign-ins and actions" control={<button type="button" className="settings-btn">View History</button>} />
        <Row label="Connected data sources" note="1 of 1 API connections active" control={<span className="status-pill"><span className="status-pill-dot" />Connected</span>} />
      </div>


      {/* ---------- SYSTEM PREFERENCES (admin) ---------- */}
      <div className="settings-section">
        <div className="settings-section-header">
          <h3>System Preferences</h3>
          <span>Administrators only</span>
        </div>

        <Row label="Data synchronization" note="Sync with state land records every 6 hours" control={<button type="button" className="settings-btn">Configure</button>} />
        <Row label="API connection status" control={<span className="status-pill"><span className="status-pill-dot" />All systems normal</span>} />
        <Row label="Default reporting preferences" control={<button type="button" className="settings-btn">Configure</button>} />
      </div>

    </div>

  );

}

export default Settings;
