import { CheckIcon } from "./Icons";

// currentStage is a 0-based index into `stages`.
export default function StageTimeline({ stages, currentStage, compact = false }) {
  return (
    <div className={`stage-timeline ${compact ? "stage-timeline-compact" : ""}`}>
      {stages.map((label, i) => {
        const done = i < currentStage;
        const active = i === currentStage;
        return (
          <div
            className={`stage-step ${done ? "stage-done" : ""} ${active ? "stage-active" : ""}`}
            key={label}
          >
            <div className="stage-node">
              {done ? <CheckIcon width={13} height={13} /> : <span>{i + 1}</span>}
            </div>
            {!compact && <span className="stage-label">{label}</span>}
            {i < stages.length - 1 && <div className="stage-connector" />}
          </div>
        );
      })}
    </div>
  );
}
