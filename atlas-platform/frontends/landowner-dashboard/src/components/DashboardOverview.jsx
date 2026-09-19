import { LIFECYCLE_STAGES } from "../data/mockData";
import StageTimeline from "./StageTimeline";
import StatusBadge from "./StatusBadge";
import { WalletIcon, MapPinIcon, FlagIcon, BellIcon, ChevronRightIcon } from "./Icons";

function formatINR(value) {
  return `₹${(value || 0).toLocaleString("en-IN")}`;
}

export default function DashboardOverview({
  landowner,
  parcels,
  notifications,
  complaints,
  onNavigate,
}) {
  const parcelList = Array.isArray(parcels) ? parcels : [];
  const complaintList = Array.isArray(complaints) ? complaints : [];
  const notificationList = Array.isArray(notifications) ? notifications : [];

  const totalCompensation = parcelList.reduce(
    (s, p) =>
      s +
      (p?.compensation?.totalCompensation ??
        p?.valuation?.totalCompensation ??
        p?.totalCompensation ??
        0),
    0
  );

  const totalDisbursed = parcelList.reduce(
    (s, p) =>
      s +
      (p?.compensation?.disbursed ??
        p?.disbursed ??
        ((p?.compensationPercentage || 0) / 100) *
          (p?.totalCompensation || p?.valuation?.totalCompensation || 0)),
    0
  );

  const disbursedPct =
    totalCompensation > 0 ? Math.round((totalDisbursed / totalCompensation) * 100) : 0;

  const openComplaints = complaintList.filter((c) => c?.status !== "Resolved").length;
  const unreadNotifications = notificationList.filter((n) => !n?.read).length;

  const primaryParcel = parcels[0];

  const recentNotifications = notifications.slice(0, 3);
  const recentComplaints = complaints.slice(0, 2);

  return (
    <div className="page">
      <div className="welcome-banner">
        <div>
          <span className="welcome-eyebrow">Welcome back,</span>
          <h1>{landowner.name}</h1>
          <p>
            {landowner.village}, {landowner.district}, {landowner.state} · Landowner ID{" "}
            <strong>{landowner.id}</strong>
          </p>
        </div>
        <div className="welcome-parcel-chip">
          <MapPinIcon width={15} height={15} />
          {parcels.length} land parcel{parcels.length > 1 ? "s" : ""} under acquisition
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi-card">
          <span className="kpi-icon kpi-icon-brand">
            <WalletIcon />
          </span>
          <div>
            <span className="kpi-label">Compensation disbursed</span>
            <strong className="kpi-value">{formatINR(totalDisbursed)}</strong>
            <span className="kpi-sub">of {formatINR(totalCompensation)} assessed</span>
          </div>
        </div>

        <div className="kpi-card">
          <span className="kpi-icon kpi-icon-info">
            <MapPinIcon />
          </span>
          <div>
            <span className="kpi-label">Parcels in process</span>
            <strong className="kpi-value">{parcels.length}</strong>
            <span className="kpi-sub">across {new Set(parcels.map((p) => p.project)).size} project(s)</span>
          </div>
        </div>

        <div className="kpi-card kpi-clickable" onClick={() => onNavigate("complaints")}>
          <span className="kpi-icon kpi-icon-warn">
            <FlagIcon />
          </span>
          <div>
            <span className="kpi-label">Open complaints</span>
            <strong className="kpi-value">{openComplaints}</strong>
            <span className="kpi-sub">of {complaints.length} total filed</span>
          </div>
        </div>

        <div className="kpi-card kpi-clickable" onClick={() => onNavigate("notifications")}>
          <span className="kpi-icon kpi-icon-brand">
            <BellIcon />
          </span>
          <div>
            <span className="kpi-label">Unread notifications</span>
            <strong className="kpi-value">{unreadNotifications}</strong>
            <span className="kpi-sub">out of {notifications.length} recent updates</span>
          </div>
        </div>
      </div>

      <div className="two-col">
        <section className="card">
          <div className="card-header">
            <h2>Acquisition progress — {primaryParcel.project}</h2>
            <StatusBadge status={LIFECYCLE_STAGES[primaryParcel.currentStage]} tone="info" />
          </div>
          <p className="card-subtext">
            Parcel {primaryParcel.id} · Survey {primaryParcel.surveyNumber} ·{" "}
            {primaryParcel.areaAcres} acres
          </p>
          <StageTimeline stages={LIFECYCLE_STAGES} currentStage={primaryParcel.currentStage} />

          <div className="compensation-mini">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${disbursedPct}%` }} />
            </div>
            <div className="compensation-mini-legend">
              <span>{disbursedPct.toFixed(0)}% of total compensation disbursed</span>
              <button type="button" className="link-btn" onClick={() => onNavigate("compensation")}>
                View full breakdown <ChevronRightIcon width={14} height={14} />
              </button>
            </div>
          </div>
        </section>

        <section className="card stack-card">
          <div className="card-header">
            <h2>Recent notifications</h2>
            <button type="button" className="link-btn" onClick={() => onNavigate("notifications")}>
              View all <ChevronRightIcon width={14} height={14} />
            </button>
          </div>
          <ul className="mini-list">
            {recentNotifications.map((n) => (
              <li key={n.id} className={!n.read ? "mini-list-unread" : ""}>
                <span className={`dot dot-${n.type}`} />
                <div>
                  <strong>{n.title}</strong>
                  <span>{n.date}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="card-header card-header-tight">
            <h2>Recent complaints</h2>
            <button type="button" className="link-btn" onClick={() => onNavigate("complaints")}>
              View all <ChevronRightIcon width={14} height={14} />
            </button>
          </div>
          <ul className="mini-list">
            {recentComplaints.map((c) => (
              <li key={c.id}>
                <StatusBadge status={c.status} />
                <div>
                  <strong>{c.subject}</strong>
                  <span>{c.id} · filed {c.dateFiled}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
