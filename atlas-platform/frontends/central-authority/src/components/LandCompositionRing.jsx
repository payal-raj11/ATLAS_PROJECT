import useInViewOnce from "../hooks/useInViewOnce";


function polar(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}


// Leader-line ring chart for the Dashboard's Land Composition panel —
// segments sweep in, then a leader line draws out to a label showing
// the category, its share, and the real hectare figure. Replaces the
// old stat-callout + horizontal-bars layout with something closer to
// a proper infographic while keeping the same underlying ownership
// split data.
function LandCompositionRing({ data, totalValue, totalLabel, unit = "ha" }) {

  const [chartRef, inView] = useInViewOnce();

  const cx = 280;
  const cy = 150;
  const r = 78;
  const strokeWidth = 30;
  const circumference = 2 * Math.PI * r;

  let cumFraction = 0;

  const labelSlots = [
    { x: cx + 190, y: cy - 95, anchor: "start" },
    { x: cx + 205, y: cy + 15, anchor: "start" },
    { x: cx - 190, y: cy + 95, anchor: "end" },
    { x: cx - 205, y: cy - 25, anchor: "end" },
  ];

  const segments = data.map((d, i) => {

    const fraction = d.value / 100;
    const startAngle = cumFraction * 360;
    const midAngle = startAngle + (fraction * 360) / 2;
    cumFraction += fraction;

    const dash = fraction * circumference;
    const gap = circumference - dash;
    const offset = circumference * 0.25 - (startAngle / 360) * circumference;

    const outerPoint = polar(cx, cy, r + strokeWidth / 2 + 4, midAngle);
    const slot = labelSlots[i % labelSlots.length];
    const bendPoint = { x: outerPoint.x + (slot.x > cx ? 26 : -26), y: outerPoint.y };

    return { ...d, dash, gap, offset, outerPoint, bendPoint, slot, index: i };

  });

  return (

    <div className="land-ring-wrap" ref={chartRef}>

      <svg viewBox={`0 0 ${cx * 2} ${cy * 2}`} className="land-ring-svg">

        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--gridline)" strokeWidth={strokeWidth} />

        {segments.map((s) => (

          <circle
            key={`seg-${s.label}`}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={s.offset}
            className={inView ? "land-ring-segment" : "land-ring-segment-pending"}
            style={{ animationDelay: `${s.index * 150}ms`, color: s.color }}
          >
            <title>{`${s.label}: ${s.value}%`}</title>
          </circle>

        ))}

        {segments.map((s) => (

          <g key={`leader-${s.label}`}>

            <polyline
              points={`${s.outerPoint.x},${s.outerPoint.y} ${s.bendPoint.x},${s.bendPoint.y} ${s.slot.x},${s.bendPoint.y}`}
              fill="none"
              stroke={s.color}
              strokeWidth="1.4"
              className={inView ? "land-ring-leader" : "land-ring-leader-pending"}
              style={{ animationDelay: `${580 + s.index * 150}ms` }}
            />

            <circle cx={s.outerPoint.x} cy={s.outerPoint.y} r="4" fill={s.color} opacity={inView ? 1 : 0} />

            <g
              className={inView ? "land-ring-label-group" : "land-ring-label-group-pending"}
              style={{ animationDelay: `${740 + s.index * 150}ms` }}
            >

              <text
                x={s.slot.x}
                y={s.bendPoint.y - 4}
                textAnchor={s.slot.anchor}
                className="land-ring-label-title"
              >
                {s.label}
              </text>

              <text
                x={s.slot.x}
                y={s.bendPoint.y + 11}
                textAnchor={s.slot.anchor}
                className="land-ring-label-sub"
              >
                {s.value}% · {Math.round((totalValue * s.value) / 100).toLocaleString("en-IN")} {unit}
              </text>

            </g>

          </g>

        ))}

        <text x={cx} y={cy - 4} textAnchor="middle" className="land-ring-center-value">
          {totalValue.toLocaleString("en-IN")} {unit}
        </text>

        <text x={cx} y={cy + 14} textAnchor="middle" className="land-ring-center-label">
          {totalLabel}
        </text>

      </svg>

    </div>

  );

}


export default LandCompositionRing;
