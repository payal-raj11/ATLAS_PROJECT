import { useState } from "react";

const VIBRANT_PALETTE = [
  "#3987e5",
  "#f5921b",
  "#1baf7a",
  "#e0439a",
  "#8b5cf6",
  "#eab308",
];


// Simple animated vertical column chart. Each bar grows in on mount
// (shares the app's chart-bar-grow keyframe) and pops a value label
// on hover. `data` is [{ label, value, color? }]; colors fall back
// to the shared vibrant palette so callers don't have to hand-pick
// one per category.
function ColumnChart({
  data,
  valueSuffix = "",
  height = 170,
}) {

  const [hoverIndex, setHoverIndex] = useState(null);

  const max = Math.max(...data.map((d) => d.value), 1);

  return (

    <div className="column-chart" style={{ height: height + 46 }}>

      <div className="column-chart-plot" style={{ height }}>

        {data.map((d, i) => {

          const pct = max > 0 ? (d.value / max) * 100 : 0;
          const color = d.color || VIBRANT_PALETTE[i % VIBRANT_PALETTE.length];
          const isHovered = hoverIndex === i;

          return (

            <div
              key={d.label}
              className="column-chart-col"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            >

              <span className="column-chart-value" style={{ opacity: isHovered ? 1 : 0 }}>
                {d.value.toLocaleString("en-IN")}{valueSuffix}
              </span>

              <div className="column-chart-track">
                <div
                  className="column-chart-fill chart-bar-grow"
                  style={{
                    height: `${pct}%`,
                    backgroundColor: color,
                    boxShadow: isHovered ? `0 0 12px ${color}99` : "none",
                    animationDelay: `${i * 70}ms`,
                  }}
                  title={`${d.label}: ${d.value.toLocaleString("en-IN")}${valueSuffix}`}
                />
              </div>

            </div>

          );

        })}

      </div>

      <div className="column-chart-labels">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>

    </div>

  );

}


export default ColumnChart;
