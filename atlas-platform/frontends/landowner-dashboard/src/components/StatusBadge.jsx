const TONE_BY_STATUS = {
  // compensation / lifecycle
  Paid: "success",
  Disbursed: "success",
  Available: "success",
  Resolved: "success",
  Verified: "success",
  Pending: "warning",
  "Not started": "neutral",
  "Not applicable": "neutral",
  "In Progress": "info",
  "Under Review": "info",
  "Assessment in progress": "info",
  Submitted: "info",
  Rejected: "danger",
  Disputed: "danger",
  High: "danger",
  Medium: "warning",
  Low: "neutral",
};

export default function StatusBadge({ status, tone }) {
  const resolvedTone = tone || TONE_BY_STATUS[status] || "neutral";
  return <span className={`badge badge-${resolvedTone}`}>{status}</span>;
}
