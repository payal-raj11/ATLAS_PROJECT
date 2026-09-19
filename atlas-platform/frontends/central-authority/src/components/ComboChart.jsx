import { useState } from "react";

// Bar + line combo — bars on the left axis, a derived "index" line
// (each bar as a % of the series' peak) on an implicit right axis.
// Hovering either a bar or the line highlights both at that index,
// and shows the real value + the index reading below.
function ComboChart({ bars, barLabel, unit = "", indexLabel = "Impact Index" }) {

  const [activeIndex, setActiveIndex] = useState(null);

  const width = 560;
  const height = 200;
  const padding = 32;
  const topPadding = 26;
  const barGap = 16;

  const maxBar = Math.max(...bars.map((b) => b.bar), 1);

  const plotBottom = height - padding;
  const plotTop = topPadding;
  const plotHeight = plotBottom - plotTop;

  const barWidth = (width - padding * 2 - barGap * (bars.length - 1)) / bars.length;

  const points = bars.map((b, i) => {
    const x = padding + i * (barWidth + barGap);
    const barHeight = (b.bar / maxBar) * plotHeight;
    const y = plotBottom - barHeight;
    const index = Math.round((b.bar / maxBar) * 100);
    const lineY = plotBottom - (index / 100) * plotHeight;
    return { ...b, x, y, barHeight, index, lineY, cx: x + barWidth / 2 };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.cx} ${p.lineY}`)
    .join(" ");

  const active = points[activeIndex] ?? points[points.length - 1];

  return (

    <div className="combo-chart">

      <div className="combo-chart-legend">
        <span><i className="combo-swatch combo-swatch-bar" />{barLabel}</span>
        <span><i className="combo-swatch combo-swatch-line" />{indexLabel}</span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="combo-chart-svg"
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

        {points.map((p, i) => (
          <rect
            key={`bar-${p.label}`}
            x={p.x}
            y={p.y}
            width={barWidth}
            height={p.barHeight}
            rx="4"
            fill="var(--series-1)"
            opacity={activeIndex === null || activeIndex === i ? 1 : 0.4}
            onMouseEnter={() => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(null)}
            style={{ cursor: "pointer", transition: "opacity 0.15s ease" }}
          />
        ))}

        <path
          d={linePath}
          fill="none"
          stroke="var(--accent-green)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((p, i) => (
          <circle
            key={`dot-${p.label}`}
            cx={p.cx}
            cy={p.lineY}
            r={activeIndex === i ? "5" : "3.5"}
            fill="var(--accent-green)"
            stroke="var(--bg-card)"
            strokeWidth="1.5"
            onMouseEnter={() => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(null)}
            style={{ cursor: "pointer" }}
          />
        ))}

        {points.map((p) => (
          <text
            key={`label-${p.label}`}
            x={p.cx}
            y={height - padding + 16}
            textAnchor="middle"
            className="column-chart-label"
          >
            {p.label}
          </text>
        ))}

      </svg>

      <div className="combo-chart-detail">
        <strong>{active.label}</strong>
        <span>
          {barLabel}: {active.bar.toLocaleString("en-IN")}{unit} — {indexLabel.toLowerCase()}: {active.index}
        </span>
      </div>

    </div>

  );

}


export default ComboChart;
