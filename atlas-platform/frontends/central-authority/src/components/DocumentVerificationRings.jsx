import { useNavigate } from "react-router-dom";
import useInViewOnce from "../hooks/useInViewOnce";


// Stacked (concentric) donut for the Dashboard's Document
// Verification panel — one ring per document status, each an
// independent progress ring against the full project count. Replaces
// the pictogram grid and surfaces the real three-way split
// (Verified / Pending Review / Incomplete) instead of collapsing the
// latter two into one "Pending" bucket.
function DocumentVerificationRings({ rings, centerValue, centerLabel }) {

  const navigate = useNavigate();
  const [chartRef, inView] = useInViewOnce();

  const cx = 110;
  const cy = 110;
  const radii = [92, 74, 56];
  const strokeWidth = 14;

  return (

    <div className="doc-rings-wrap" ref={chartRef}>

      <svg viewBox={`0 0 ${cx * 2} ${cy * 2}`} className="doc-rings-svg">

        {rings.map((ring, i) => {

          const r = radii[i] ?? radii[radii.length - 1];
          const circumference = 2 * Math.PI * r;
          const dash = (ring.pct / 100) * circumference;
          const gap = circumference - dash;

          return (

            <g key={ring.key}>

              <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--gridline)" strokeWidth={strokeWidth} />

              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={ring.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={circumference * 0.25}
                className={inView ? "doc-ring-arc" : "doc-ring-arc-pending"}
                style={{
                  animationDelay: `${i * 200}ms`,
                  color: ring.color,
                  cursor: ring.to ? "pointer" : "default",
                }}
                onClick={() => ring.to && navigate(ring.to)}
              >
                <title>{`${ring.label}: ${ring.count} (${ring.pct}%)`}</title>
              </circle>

            </g>

          );

        })}

        <text x={cx} y={cy - 3} textAnchor="middle" className="doc-rings-center-value">
          {centerValue}
        </text>

        <text x={cx} y={cy + 15} textAnchor="middle" className="doc-rings-center-label">
          {centerLabel}
        </text>

      </svg>

      <div className="doc-rings-legend">

        {rings.map((ring) => (

          <div
            key={ring.key}
            className="doc-rings-legend-row"
            style={{ cursor: ring.to ? "pointer" : "default" }}
            onClick={() => ring.to && navigate(ring.to)}
          >

            <span className="doc-rings-legend-dot" style={{ backgroundColor: ring.color }} />

            <span className="doc-rings-legend-text">
              {ring.label}
              <span className="doc-rings-legend-sub">{ring.sub}</span>
            </span>

            <span className="doc-rings-legend-count" style={{ color: ring.color }}>
              {ring.count}
            </span>

          </div>

        ))}

      </div>

    </div>

  );

}


export default DocumentVerificationRings;
