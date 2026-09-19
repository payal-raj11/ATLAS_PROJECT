import { useState } from "react";

const PALETTE = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-6)",
];


function buildPoints(data, plotTop, plotBottom, plotHeight, padding, width, min, range) {
  const stepX = (width - padding * 2) / Math.max(data.length - 1, 1);
  return data.map((d, i) => {
    const x = padding + i * stepX;
    const y = plotBottom - ((d.value - min) / range) * plotHeight;
    return { x, y, ...d };
  });
}


// Single-series line, with an optional array of `dotColors` cycled
// per-point so the markers pick up the app's categorical palette
// ("colorful like the dots") while the fill/line stay on the panel's
// single accent color — keeps the chart consistent with the rest of
// ATLAS rather than turning it into a rainbow chart.
//
// Pass `series` (an array of { label, color, points }) instead of
// `data`/`color` for a genuine multi-metric chart. In multi mode,
// hovering any point along the x-axis drops a guide line and
// highlights every series at that index at once, with a detail line
// below reading out each series' value.
function LineChart({
  data,
  color = "var(--series-1)",
  valueSuffix = "",
  dotColors,
  series,
}) {

  const [hoverIndex, setHoverIndex] = useState(null);

  const width = 560;
  const height = 190;
  const padding = 28;
  const topPadding = 34; // extra room for the last-point value label

  const plotTop = topPadding;
  const plotBottom = height - padding;
  const plotHeight = plotBottom - plotTop;

  const isMulti = Array.isArray(series) && series.length > 0;

  const allValues = isMulti
    ? series.flatMap((s) => s.points.map((p) => p.value))
    : data.map((d) => d.value);

  const max = Math.max(...allValues, 1);
  const min = Math.min(...allValues, 0);
  const range = max - min || 1;

  const axisLabels = isMulti ? series[0].points.map((p) => p.label) : data.map((d) => d.label);

  const gradientId = "line-chart-fill";
  const strokeGradientId = "line-chart-stroke";

  const seriesList = isMulti
    ? series
    : [{ label: null, color, points: data }];

  const renderedSeries = seriesList.map((s, sIndex) => {
    const points = buildPoints(s.points, plotTop, plotBottom, plotHeight, padding, width, min, range);
    const linePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");
    const areaPath =
      `${linePath} L ${points[points.length - 1].x} ${plotBottom} ` +
      `L ${points[0].x} ${plotBottom} Z`;
    return { ...s, points, linePath, areaPath, seriesColor: s.color || PALETTE[sIndex % PALETTE.length] };
  });

  const primary = renderedSeries[0];
  const lastPoint = primary.points[primary.points.length - 1];
  const activeIndex = hoverIndex ?? primary.points.length - 1;

  const guideLines = [0.25, 0.5, 0.75].map((fraction) => plotTop + plotHeight * fraction);

  const hoverX = primary.points[activeIndex]?.x;

  return (

    <div className="line-chart">

      {isMulti && (
        <ul className="line-chart-legend">
          {renderedSeries.map((s) => (
            <li key={s.label}>
              <span className="line-chart-legend-swatch" style={{ backgroundColor: s.seriesColor }} />
              {s.label}
            </li>
          ))}
        </ul>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="line-chart-svg"
        preserveAspectRatio="none"
        onMouseLeave={() => setHoverIndex(null)}
      >

        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primary.seriesColor} stopOpacity="0.28" />
            <stop offset="100%" stopColor={primary.seriesColor} stopOpacity="0.02" />
          </linearGradient>

          {!isMulti && dotColors && dotColors.length > 0 && (
            <linearGradient id={strokeGradientId} x1="0" y1="0" x2="1" y2="0">
              {primary.points.map((p, i) => (
                <stop
                  key={p.label}
                  offset={`${(i / Math.max(primary.points.length - 1, 1)) * 100}%`}
                  stopColor={dotColors[i % dotColors.length]}
                />
              ))}
            </linearGradient>
          )}
        </defs>

        {/* light reference guides */}
        {guideLines.map((y) => (
          <line
            key={y}
            x1={padding}
            y1={y}
            x2={width - padding}
            y2={y}
            stroke="var(--gridline)"
            strokeWidth="1"
            strokeDasharray="3 4"
            opacity="0.6"
          />
        ))}

        {/* baseline */}
        <line
          x1={padding}
          y1={plotBottom}
          x2={width - padding}
          y2={plotBottom}
          stroke="var(--gridline)"
          strokeWidth="1"
        />

        {!isMulti && (
          <path
            d={primary.areaPath}
            fill={`url(#${gradientId})`}
            stroke="none"
            className="chart-area-grow"
          />
        )}

        {isMulti && renderedSeries.map((s, sIndex) => (
          <path
            key={`area-${s.label}`}
            d={s.areaPath}
            fill={s.seriesColor}
            opacity="0.06"
            stroke="none"
            className="chart-area-grow"
            style={{ animationDelay: `${sIndex * 120}ms` }}
          />
        ))}

        {/* hover guide */}
        {isMulti && hoverX !== undefined && (
          <line
            x1={hoverX}
            y1={plotTop}
            x2={hoverX}
            y2={plotBottom}
            stroke="var(--text-muted)"
            strokeWidth="1"
            strokeDasharray="2 3"
            opacity="0.6"
          />
        )}

        {renderedSeries.map((s, sIndex) => (
          <path
            key={s.label || "line"}
            d={s.linePath}
            fill="none"
            stroke={!isMulti && dotColors && dotColors.length > 0 ? `url(#${strokeGradientId})` : s.seriesColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="1"
            className="chart-line-draw"
            style={{ strokeDasharray: 1, strokeDashoffset: 1, animationDelay: `${sIndex * 150}ms` }}
          />
        ))}

        {renderedSeries.map((s, sIndex) => s.points.map((p, i) => {

          const isLast = p === s.points[s.points.length - 1];
          const isActive = isMulti && i === activeIndex;
          const dotColor = !isMulti && dotColors && dotColors.length > 0
            ? dotColors[i % dotColors.length]
            : s.seriesColor;

          return (

            <circle
              key={`${s.label || "s"}-${p.label}`}
              cx={p.x}
              cy={p.y}
              r={isActive ? "5.5" : isLast ? "5" : "3.5"}
              fill={dotColor}
              stroke="var(--bg-card)"
              strokeWidth={isActive || isLast ? "2" : "1.5"}
              className="chart-dot-pop"
              style={{ animationDelay: `${sIndex * 150 + i * 35}ms` }}
            >
              <title>{`${p.label}: ${p.value.toLocaleString("en-IN")}${valueSuffix}`}</title>
            </circle>

          );

        }))}

        {/* invisible hover-capture columns, multi-series only */}
        {isMulti && primary.points.map((p, i) => {
          const colWidth = (width - padding * 2) / primary.points.length;
          return (
            <rect
              key={`hover-${p.label}`}
              x={padding + i * colWidth}
              y={plotTop}
              width={colWidth}
              height={plotHeight}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
              style={{ cursor: "pointer" }}
            />
          );
        })}

        {/* direct label on the most recent point (single-series only —
            multi-series reads out via the detail line below instead) */}
        {!isMulti && (
          <text
            x={lastPoint.x}
            y={Math.max(lastPoint.y - 14, 12)}
            textAnchor="end"
            className="line-chart-last-label"
          >
            {`${lastPoint.value.toLocaleString("en-IN")}${valueSuffix}`}
          </text>
        )}

      </svg>

      <div className="line-chart-labels">

        {axisLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}

      </div>

      {isMulti && (
        <div className="line-chart-detail">
          <strong>{primary.points[activeIndex]?.label}</strong>
          <span>
            {renderedSeries.map((s, i) => (
              <span key={s.label} style={{ color: s.seriesColor, fontWeight: 600 }}>
                {i > 0 ? "  ·  " : ""}{s.label}: {s.points[activeIndex]?.value.toLocaleString("en-IN")}{valueSuffix}
              </span>
            ))}
          </span>
        </div>
      )}

    </div>

  );

}


export default LineChart;
