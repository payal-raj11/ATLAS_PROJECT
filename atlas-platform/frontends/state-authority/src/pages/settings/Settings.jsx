import {
  Settings as SettingsIcon,
  Palette,
  Bell,
  ChevronDown,
} from "lucide-react";

export default function Settings() {
  return (
    <div className="settings-page">
      {/* Page Header */}
      <div className="settings-page-header">
        <div>
          <h1>Settings</h1>
          <p>
            Manage your system preferences and account settings
          </p>
        </div>
      </div>

      {/* General Settings */}
      <section className="settings-card">
        <div className="settings-card-title">
          <SettingsIcon size={18} />
          <h2>GENERAL SETTINGS</h2>
        </div>

        <div className="settings-list">
          <div className="settings-row">
            <div className="settings-row-label">
              <span>Language</span>
            </div>

            <button className="settings-select">
              <span>English</span>
              <ChevronDown size={15} />
            </button>
          </div>

          <div className="settings-row">
            <div className="settings-row-label">
              <span>Time Zone</span>
            </div>

            <button className="settings-select">
              <span>IST (UTC+5:30)</span>
              <ChevronDown size={15} />
            </button>
          </div>

          <div className="settings-row">
            <div className="settings-row-label">
              <span>Date Format</span>
            </div>

            <button className="settings-select">
              <span>DD/MM/YYYY</span>
              <ChevronDown size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="settings-card">
        <div className="settings-card-title">
          <Palette size={18} />
          <h2>APPEARANCE</h2>
        </div>

        <div className="settings-list">
          <div className="settings-row settings-theme-row">
            <div className="settings-row-label">
              <span>Theme</span>
            </div>

            <div className="settings-theme-options">
              <button className="settings-theme-option active">
                <span className="settings-radio active"></span>
                Dark
              </button>

              <button className="settings-theme-option">
                <span className="settings-radio"></span>
                Light
              </button>

              <button className="settings-theme-option">
                <span className="settings-radio"></span>
                System
              </button>
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-label">
              <span>Compact Mode</span>
            </div>

            <button className="settings-switch active">
              <span></span>
              <strong>ON</strong>
            </button>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="settings-card">
        <div className="settings-card-title">
          <Bell size={18} />
          <h2>NOTIFICATIONS</h2>
        </div>

        <div className="settings-list">
          <div className="settings-row">
            <div className="settings-row-label">
              <span>Project Updates</span>
            </div>

            <button className="settings-switch active">
              <span></span>
              <strong>ON</strong>
            </button>
          </div>

          <div className="settings-row">
            <div className="settings-row-label">
              <span>Pending Prerequisites</span>
            </div>

            <button className="settings-switch active">
              <span></span>
              <strong>ON</strong>
            </button>
          </div>

          <div className="settings-row">
            <div className="settings-row-label">
              <span>Survey Alerts</span>
            </div>

            <button className="settings-switch active">
              <span></span>
              <strong>ON</strong>
            </button>
          </div>

          <div className="settings-row">
            <div className="settings-row-label">
              <span>ML High-Risk Alerts</span>
            </div>

            <button className="settings-switch active">
              <span></span>
              <strong>ON</strong>
            </button>
          </div>

          <div className="settings-row">
            <div className="settings-row-label">
              <span>State Authority Updates</span>
            </div>

            <button className="settings-switch active">
              <span></span>
              <strong>ON</strong>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}