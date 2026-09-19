import { useState } from "react";
import StatusBadge from "./StatusBadge";
import { COMPLAINT_CATEGORIES } from "../data/mockData";
import { PlusIcon } from "./Icons";

const emptyForm = {
  parcelId: "",
  category: COMPLAINT_CATEGORIES[0],
  subject: "",
  description: "",
  priority: "Medium",
};

export default function Complaints({ complaints, parcels, onFileComplaint }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm, parcelId: parcels[0]?.id || "" });
  const [justFiledId, setJustFiledId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      const created = await onFileComplaint(form);
      setJustFiledId(created?.id || null);
      setForm({ ...emptyForm, parcelId: parcels[0]?.id || "" });
      setShowForm(false);
      setTimeout(() => setJustFiledId(null), 4000);
    } catch (err) {
      setSubmitError(err.message || "Could not submit your complaint. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header page-header-row">
        <div>
          <h1>Complaints</h1>
          <p>Raise and track grievances related to your acquisition case.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          <PlusIcon width={15} height={15} />
          {showForm ? "Close form" : "File a new complaint"}
        </button>
      </div>

      {justFiledId && (
        <div className="inline-alert inline-alert-success">
          Complaint {justFiledId} has been submitted. You'll be notified as it progresses.
        </div>
      )}

      {showForm && (
        <section className="card">
          <div className="card-header">
            <h2>New complaint</h2>
          </div>
          {submitError && <div className="inline-alert inline-alert-danger">{submitError}</div>}
          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="field">
              <span>Related parcel</span>
              <select
                value={form.parcelId}
                onChange={(e) => updateField("parcelId", e.target.value)}
              >
                {parcels.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} — {p.project}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Category</span>
              <select
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
              >
                {COMPLAINT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Priority</span>
              <select
                value={form.priority}
                onChange={(e) => updateField("priority", e.target.value)}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>

            <label className="field field-span-2">
              <span>Subject</span>
              <input
                type="text"
                placeholder="Brief summary of the issue"
                value={form.subject}
                onChange={(e) => updateField("subject", e.target.value)}
                required
              />
            </label>

            <label className="field field-span-2">
              <span>Description</span>
              <textarea
                rows={4}
                placeholder="Describe the issue in detail — include dates, survey numbers, or officer names where relevant."
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                required
              />
            </label>

            <div className="field-span-2 form-actions">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit complaint"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="card">
        <div className="card-header">
          <h2>Your complaints ({complaints.length})</h2>
        </div>
        {complaints.length === 0 ? (
          <p className="empty-state">You haven't filed any complaints yet.</p>
        ) : (
          <div className="complaint-list">
            {complaints.map((c) => (
              <article className="complaint-item" key={c.id}>
                <div className="complaint-item-top">
                  <div>
                    <strong>{c.subject}</strong>
                    <span className="complaint-meta">
                      {c.id} · {c.category} · Parcel {c.parcelId}
                    </span>
                  </div>
                  <div className="complaint-badges">
                    <StatusBadge status={c.priority} />
                    <StatusBadge status={c.status} />
                  </div>
                </div>
                <p className="complaint-desc">{c.description}</p>
                <span className="complaint-dates">
                  Filed {c.dateFiled} · Last update {c.lastUpdate}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
