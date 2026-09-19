import { useState } from "react";
import { useNavigate } from "react-router-dom";


function DonutChart({
  data,
  centerLabel,
  centerValue,
}) {

  const navigate = useNavigate();
  const [hoveredKey, setHoveredKey] = useState(null);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  const radius = 60;
  const strokeWidth = 20;
  const hoverStrokeWidth = 24;
  const popDistance = 7;
  const circumference = 2 * Math.PI * radius;

  let offsetSoFar = 0;
  let fractionSoFar = 0;

  const handleClick = (segment) => {
    if (segment.to) {
      navigate(segment.to);
    }
  };

  const hoveredSegment = data.find((d) => d.label === hoveredKey) || null;
  const hoveredPct = hoveredSegment && total > 0
    ? Math.round((hoveredSegment.value / total) * 100)
    : null;

  return (

    <div className="donut-chart">

      <div className="donut-svg-wrap">

        <svg
          viewBox="0 0 160 160"
          width="180"
          height="180"
          className="donut-svg-vibrant"
        >

          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="var(--gridline)"
            strokeWidth={strokeWidth}
          />

          {data.map((segment, segIndex) => {

            const fraction = total > 0 ? segment.value / total : 0;
            const dash = fraction * circumference;
            const gap = circumference - dash;

            const dashOffset =
              circumference * 0.25 - offsetSoFar;

            offsetSoFar += dash;

            const isHovered = hoveredKey === segment.label;

            // Mid-angle of this segment in the final, post-rotation
            // visual frame (clockwise from 12 o'clock) — used to pop
            // the hovered wedge radially outward on hover.
            const midFraction = fractionSoFar + fraction / 2;
            fractionSoFar += fraction;
            const theta = midFraction * 2 * Math.PI;
            const dx = isHovered ? popDistance * Math.sin(theta) : 0;
            const dy = isHovered ? -popDistance * Math.cos(theta) : 0;

            return (

              <g
                key={segment.label}
                transform={`translate(${dx} ${dy}) rotate(-90 80 80)`}
                style={{ transition: "transform 0.18s ease" }}
              >

                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={isHovered ? hoverStrokeWidth : strokeWidth}
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="butt"
                  opacity={hoveredKey && !isHovered ? 0.55 : 1}
                  style={{
                    transition: "stroke-width 0.18s ease, opacity 0.18s ease",
                    animationDelay: `${segIndex * 100}ms`,
                    filter: isHovered ? `drop-shadow(0 0 7px ${segment.color})` : "none",
                  }}
                  className={`donut-ring-pop ${segment.to ? "donut-segment-clickable" : ""}`}
                  onClick={() => handleClick(segment)}
                  onMouseEnter={() => setHoveredKey(segment.label)}
                  onMouseLeave={() => setHoveredKey(null)}
                >
                  <title>
                    {`${segment.label}: ${segment.value}`}
                  </title>
                </circle>

              </g>

            );

          })}

        </svg>

        <div className="donut-center">

          <span className="donut-center-value">
            {hoveredSegment ? hoveredSegment.value : centerValue}
          </span>

          <span className="donut-center-label">
            {hoveredSegment ? hoveredSegment.label : centerLabel}
          </span>

        </div>

      </div>


      <div className="donut-legend-wrap">

        <ul className="donut-legend">

          {data.map((segment) => (

            <li
              key={segment.label}
              className={segment.to ? "donut-legend-clickable" : undefined}
              onClick={() => handleClick(segment)}
              onMouseEnter={() => setHoveredKey(segment.label)}
              onMouseLeave={() => setHoveredKey(null)}
            >

              <span
                className="donut-swatch"
                style={{ backgroundColor: segment.color }}
              />

              <span className="donut-legend-label">
                {segment.label}
              </span>

              <span className="donut-legend-value">
                {segment.value}
              </span>

            </li>

          ))}

        </ul>

        <div className="donut-chart-detail">

          {hoveredSegment ? (
            <>
              <strong>{hoveredSegment.label}</strong>
              <span>
                {hoveredSegment.value.toLocaleString("en-IN")} of {total.toLocaleString("en-IN")} ({hoveredPct}%)
                {hoveredSegment.to ? " — click to view on the map" : ""}
              </span>
            </>
          ) : (
            <span>Hover a segment for details</span>
          )}

        </div>

      </div>

    </div>

  );

}


export default DonutChart;
