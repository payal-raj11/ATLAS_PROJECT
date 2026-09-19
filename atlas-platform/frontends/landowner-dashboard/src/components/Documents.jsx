import StatusBadge from "./StatusBadge";
import { DownloadIcon, FileIcon } from "./Icons";

export default function Documents({ documents, parcels }) {
  function parcelLabel(parcelId) {
    const p = parcels.find((p) => p.id === parcelId);
    return p ? `${p.id} — ${p.project}` : parcelId;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Documents</h1>
        <p>Official notices, awards, and receipts issued against your parcels.</p>
      </div>

      <section className="card">
        <ul className="document-list">
          {documents.map((doc) => (
            <li className="document-item" key={doc.id}>
              <span className="document-icon">
                <FileIcon width={16} height={16} />
              </span>
              <div className="document-meta">
                <strong>{doc.name}</strong>
                <span>{parcelLabel(doc.parcelId)}</span>
              </div>
              <span className="document-date">{doc.date || "—"}</span>
              <StatusBadge status={doc.status} />
              <button
                className="icon-text-btn"
                type="button"
                disabled={doc.status !== "Available"}
                title={doc.status === "Available" ? "Download document" : "Not yet issued"}
              >
                <DownloadIcon width={14} height={14} /> Download
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
