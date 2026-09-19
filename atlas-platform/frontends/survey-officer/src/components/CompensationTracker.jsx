import { useState } from "react";

function formatINR(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function CompensationTracker({ parcels = [] }) {
  const parcelList = Array.isArray(parcels) ? parcels : [];
  const [selectedId, setSelectedId] = useState(parcelList[0]?.parcelId || parcelList[0]?.id || "");

  const activeParcel =
    parcelList.find((p) => (p.parcelId || p.id) === selectedId) || parcelList[0] || null;

  if (!activeParcel) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Compensation Tracker</h1>
          <p>No parcels found in the database.</p>
        </div>
      </div>
    );
  }

  // Normalize compensation values across both mock data and live DB/CSV models
  const totalComp =
    activeParcel.compensation?.totalCompensation ??
    activeParcel.valuation?.totalCompensation ??
    activeParcel.totalCompensation ??
    0;

  const baseMarket =
    activeParcel.compensation?.baseMarketValue ??
    activeParcel.valuation?.baseMarketValue ??
    activeParcel.baseMarketValue ??
    0;

  const multiplierVal =
    activeParcel.compensation?.multiplier ??
    activeParcel.valuation?.multiplier ??
    activeParcel.multiplier ??
    1;

  const solatiumVal =
    activeParcel.compensation?.solatium ??
    activeParcel.valuation?.solatium ??
    activeParcel.solatium ??
    0;

  const assetVal =
    activeParcel.compensation?.assetValue ??
    activeParcel.valuation?.assetValue ??
    activeParcel.assetValue ??
    0;

  const compPct =
    activeParcel.progress?.compensationPercentage ??
    activeParcel.compensationPercentage ??
    0;

  const disbursed =
    activeParcel.compensation?.disbursed ??
    activeParcel.disbursed ??
    (compPct / 100) * totalComp;

  const remaining = Math.max(0, totalComp - disbursed);
  const tranches = activeParcel.compensation?.tranches || activeParcel.tranches || [];

  return (
    <div className="page">
      <div className="page-header-row">
        <div className="page-header">
          <h1>Compensation Tracker</h1>
          <p>Monitor your award determinations, statutory solatium, and disbursement tranches.</p>
        </div>
        {parcelList.length > 1 && (
          <div className="field" style={{ minWidth: 220 }}>
            <label>Select Parcel</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {parcelList.map((p) => (
                <option key={p.parcelId || p.id} value={p.parcelId || p.id}>
                  {p.surveyNumber || p.parcelId || p.id} — {p.village || "Unknown"}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <h2>Disbursement Progress</h2>
            <span className="badge badge-info">{compPct}% Released</span>
          </div>
          <p className="card-subtext">
            Parcel: <strong>{activeParcel.surveyNumber || activeParcel.parcelId}</strong> ({activeParcel.village}, {activeParcel.district})
          </p>

          <div className="progress-track progress-track-lg">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(100, Math.max(0, compPct))}%` }}
            />
          </div>

          <div className="compensation-mini-legend" style={{ marginTop: 12 }}>
            <span>Disbursed: <strong>{formatINR(disbursed)}</strong></span>
            <span>Pending: <strong>{formatINR(remaining)}</strong></span>
          </div>

          <div className="breakdown-grid">
            <div className="breakdown-item">
              <span>Base Market Value</span>
              <strong>{formatINR(baseMarket)}</strong>
            </div>
            <div className="breakdown-item">
              <span>Market Multiplier</span>
              <strong>{multiplierVal}x</strong>
            </div>
            <div className="breakdown-item">
              <span>Asset Valuation</span>
              <strong>{formatINR(assetVal)}</strong>
            </div>
            <div className="breakdown-item">
              <span>100% Solatium</span>
              <strong>{formatINR(solatiumVal)}</strong>
            </div>
            <div className="breakdown-item breakdown-item-total" style={{ gridColumn: "span 2" }}>
              <span>Total Award Compensation</span>
              <strong>{formatINR(totalComp)}</strong>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Payment Schedule & Tranches</h2>
          </div>
          <p className="card-subtext">Recorded disbursement transactions</p>

          {tranches.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tranche</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tranches.map((t, idx) => (
                  <tr key={idx}>
                    <td>{t.name || `Tranche ${idx + 1}`}</td>
                    <td>{t.date || "—"}</td>
                    <td>{formatINR(t.amount)}</td>
                    <td>
                      <span className={`badge badge-${t.status === "Paid" ? "success" : "warning"}`}>
                        {t.status || "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              Direct disbursement pending under LARR Section 38 award schedule.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}