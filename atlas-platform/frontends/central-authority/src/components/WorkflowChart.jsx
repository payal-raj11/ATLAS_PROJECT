import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useInViewOnce from "../hooks/useInViewOnce";


// "Proposal", "Compensation", "Funding" and "Monitoring" aren't
// backed by any status in data/projects.js yet (see
// dashboardData.js) — clicking one pins the highlight instead of
// navigating to a suspiciously-empty filtered list.
const CLICKABLE_STAGES = new Set([
  "Verification",
  "Survey",
  "Acquisition",
  "Approval",
]);

// One distinct, vibrant color per stage — replaces the old
// grey (illustrative) / blue (click-through) split. Which stages are
// click-through is still called out via the small ↗ mark on their
// count and the detail line below, so that information isn't lost.
const STAGE_COLORS = [
  "#3987e5",
  "#f5921b",
  "#1baf7a",
  "#e0439a",
  "#8b5cf6",
  "#eab308",
  "#22c1c3",
  "#ef4444",
];

// Bars are drawn on a compressed scale (a power curve, not linear)
// with a floor, so a stage with 2 projects doesn't render as a
// near-invisible sliver next to Monitoring's 8 — the previous
// straight linear scale looked disproportionate at these small,
// spiky counts.
const MIN_HEIGHT_FRACTION = 0.22;
const SCALE_EXPONENT = 0.62;

// Columns are drawn slim, centered inside their allotted slot, for a
// more elegant look — the slot itself still sets label/shadow/line
// spacing so nothing else has to change.
const BAR_WIDTH_RATIO = 0.4;


function WorkflowChart({ stages }) {

  const navigate = useNavigate();

  const [activeLabel, setActiveLabel] = useState(null);
  const [chartRef, inView] = useInViewOnce();

  const max = Math.max(...stages.map((s) => s.count), 1);

  const width = 760;
  const height = 220;
  const padding = 34;
  const barGap = 20;
  const plotBottom = height - padding - 6;
  const plotTop = 46;
  const plotHeight = plotBottom - plotTop;
  const barWidth =
    (width - padding * 2 - barGap * (stages.length - 1)) / stages.length;

  const heightFraction = (count) => {
    const norm = count / max;
    const eased = Math.pow(norm, SCALE_EXPONENT);
    return MIN_HEIGHT_FRACTION + eased * (1 - MIN_HEIGHT_FRACTION);
  };

  const drawWidth = barWidth * BAR_WIDTH_RATIO;
  const drawInset = (barWidth - drawWidth) / 2;

  const points = stages.map((stage, i) => {
    const slotX = padding + i * (barWidth + barGap);
    const x = slotX + drawInset;
    const barHeight = heightFraction(stage.count) * plotHeight;
    const y = plotBottom - barHeight;
    return { ...stage, slotX, x, y, barHeight, color: STAGE_COLORS[i % STAGE_COLORS.length] };
  });

  // the value line rides just above each bar's top edge, so it reads
  // as its own layer rather than tracking the bar top exactly
  const linePoints = points.map((p) => ({
    x: p.slotX + barWidth / 2,
    y: p.y - 14,
  }));

  const flowPath = linePoints
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
    .join(" ");

  const handleActivate = (stage) => {

    const clickable = CLICKABLE_STAGES.has(stage.label);

    if (clickable) {
      navigate(`/projects?stage=${encodeURIComponent(stage.label)}`);
      return;
    }

    // Not backed by real per-project data — a tap/click just pins
    // the highlight (useful on touch, where there's no hover) so
    // the flow line and count are easy to inspect without a mouse.
    setActiveLabel((current) => (current === stage.label ? null : stage.label));

  };

  const active = points.find((p) => p.label === activeLabel);

  return (

    <div className="workflow-chart" ref={chartRef}>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="workflow-chart-svg"
        preserveAspectRatio="none"
      >

        <line
          x1={padding}
          y1={plotBottom}
          x2={width - padding}
          y2={plotBottom}
          stroke="var(--gridline)"
          strokeWidth="1"
        />

        {points.map((p, i) => {

          const clickable = CLICKABLE_STAGES.has(p.label);
          const isActive = activeLabel === p.label;
          const isDimmed = activeLabel && !isActive;

          return (

            <g
              key={p.label}
              opacity={isDimmed ? 0.45 : 1}
              onMouseEnter={() => setActiveLabel(p.label)}
              onMouseLeave={() => setActiveLabel((cur) => (clickable ? null : cur))}
              onClick={() => handleActivate(p)}
              className="workflow-bar-2d"
              style={{ cursor: "pointer" }}
            >

              {/* soft contact shadow, revealed on hover via CSS */}
              <ellipse
                className="workflow-bar-shadow"
                cx={p.x + drawWidth / 2}
                cy={plotBottom + 7}
                rx={drawWidth / 2 + 4}
                ry="4"
                fill="#000"
              />

              {/* flat 2D column, slim and centered in its slot */}
              <rect
                className={inView ? "workflow-bar-face" : "workflow-bar-pending"}
                style={{ animationDelay: `${i * 90}ms` }}
                x={p.x}
                y={p.y}
                width={drawWidth}
                height={p.barHeight}
                rx={Math.min(4, drawWidth / 2)}
                fill={p.color}
                stroke={isActive ? "var(--text-primary)" : "none"}
                strokeWidth={isActive ? "1.5" : "0"}
              />

              <text
                x={p.slotX + barWidth / 2}
                y={p.y - 16}
                textAnchor="middle"
                className="workflow-chart-count"
              >
                {p.count}
                {clickable ? " ↗" : ""}
              </text>

              <text
                x={p.slotX + barWidth / 2}
                y={height - padding + 16}
                textAnchor="middle"
                className="workflow-chart-label"
              >
                {p.label}
              </text>

            </g>

          );

        })}

        {/* value line + dots, drawn AFTER the bars so they sit clearly
            on top instead of getting partly hidden behind the 3D faces */}
        <path
          d={flowPath}
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="6 5"
          opacity={inView ? "0.92" : "0"}
          className={inView ? "workflow-value-line" : "workflow-value-line-pending"}
        />

        {linePoints.map((pt, i) => (
          <circle
            key={points[i].label}
            cx={pt.x}
            cy={pt.y}
            r="4.5"
            fill="#ffffff"
            stroke={points[i].color}
            strokeWidth="2.5"
            className={inView ? "workflow-value-dot" : "workflow-value-dot-pending"}
            style={{ animationDelay: `${1100 + i * 80}ms` }}
          />
        ))}

      </svg>

      <div className="workflow-chart-legend">

        {points.map((p) => (
          <span key={p.label} className="workflow-chart-legend-item">
            <span className="workflow-chart-legend-dot" style={{ backgroundColor: p.color }} />
            {p.label}
          </span>
        ))}

      </div>

      <div className="workflow-chart-detail">

        {active ? (

          <>
            <strong>{active.label}</strong>
            <span>
              {active.count} project{active.count === 1 ? "" : "s"} currently at this stage
              {CLICKABLE_STAGES.has(active.label)
                ? " — click the bar to view them."
                : " — illustrative, not yet backed by per-project data."}
            </span>
          </>

        ) : (

          <span>
            Hover or tap a stage to see detail. Stages marked ↗ are click-through to Projects.
            The white line traces the same values across stages.
          </span>

        )}

      </div>

    </div>

  );

}


export default WorkflowChart;
