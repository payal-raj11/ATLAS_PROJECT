import { useState } from "react";
import { ShieldIcon } from "./Icons";

export default function Profile({ landowner, darkMode, onToggleDarkMode, onSaveProfile }) {
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(landowner.phone);
  const [email, setEmail] = useState(landowner.email);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [prefs, setPrefs] = useState({
    smsAlerts: true,
    emailAlerts: true,
    hearingReminders: true,
  });

  function togglePref(key) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      if (onSaveProfile) await onSaveProfile({ phone, email });
      setEditing(false);
    } catch (err) {
      setSaveError(err.message || "Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Profile</h1>
        <p>Your identity, contact, and bank details on record with the acquiring authority.</p>
      </div>

      <section className="card">
        <div className="card-header">
          <h2>Identity</h2>
          <button type="button" className="btn-secondary" onClick={() => setEditing((e) => !e)}>
            {editing ? "Cancel" : "Edit contact details"}
          </button>
        </div>

        <div className="profile-header">
          <span className="user-avatar user-avatar-lg">{landowner.photoInitials}</span>
          <div>
            <strong>{landowner.name}</strong>
            <span>{landowner.fatherName}</span>
            <span>{landowner.role}</span>
          </div>
        </div>

        <dl className="detail-grid">
          <div>
            <dt>Landowner ID</dt>
            <dd>{landowner.id}</dd>
          </div>
          <div>
            <dt>Village / District / State</dt>
            <dd>
              {landowner.village}, {landowner.district}, {landowner.state}
            </dd>
          </div>
          <div>
            <dt>Aadhaar (masked)</dt>
            <dd>XXXX XXXX {landowner.aadhaarLast4}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>
              {editing ? (
                <input value={phone} onChange={(e) => setPhone(e.target.value)} />
              ) : (
                phone
              )}
            </dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>
              {editing ? (
                <input value={email} onChange={(e) => setEmail(e.target.value)} />
              ) : (
                email
              )}
            </dd>
          </div>
        </dl>

        {editing && (
          <div className="form-actions form-actions-column">
            {saveError && <div className="inline-alert inline-alert-danger">{saveError}</div>}
            <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        )}
      </section>

      <section className="card">
        <div className="card-header">
          <h2>
            <ShieldIcon width={16} height={16} style={{ marginRight: 6, verticalAlign: -3 }} />
            Bank account for compensation (DBT)
          </h2>
        </div>
        <dl className="detail-grid">
          <div>
            <dt>Account number</dt>
            <dd>{landowner.bankAccountMasked}</dd>
          </div>
          <div>
            <dt>IFSC</dt>
            <dd>{landowner.ifsc}</dd>
          </div>
        </dl>
        <p className="card-footnote">
          To update bank details, visit your nearest Tehsil office with an original passbook copy —
          this cannot be changed online for security reasons.
        </p>
      </section>

      <section className="card">
        <div className="card-header">
          <h2>Preferences</h2>
        </div>

        <div className="pref-row">
          <div>
            <strong>SMS alerts</strong>
            <span>Instalment credits and hearing dates via SMS</span>
          </div>
          <Toggle checked={prefs.smsAlerts} onChange={() => togglePref("smsAlerts")} />
        </div>
        <div className="pref-row">
          <div>
            <strong>Email alerts</strong>
            <span>Weekly digest of case status changes</span>
          </div>
          <Toggle checked={prefs.emailAlerts} onChange={() => togglePref("emailAlerts")} />
        </div>
        <div className="pref-row">
          <div>
            <strong>Public hearing reminders</strong>
            <span>Reminders 48 hours before a scheduled hearing</span>
          </div>
          <Toggle checked={prefs.hearingReminders} onChange={() => togglePref("hearingReminders")} />
        </div>
        <div className="pref-row">
          <div>
            <strong>Dark mode</strong>
            <span>Switch the portal's colour theme</span>
          </div>
          <Toggle checked={darkMode} onChange={onToggleDarkMode} />
        </div>
      </section>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`toggle ${checked ? "toggle-on" : ""}`}
      onClick={onChange}
    >
      <span className="toggle-knob" />
    </button>
  );
}
