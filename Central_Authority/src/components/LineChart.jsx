function LineChart({ data, color = "var(--series-1)", valueSuffix = "" }) {

  const width = 560;
  const height = 180;
  const padding = 28;

  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = max - min || 1;

  const stepX = (width - padding * 2) / Math.max(data.length - 1, 1);

  const points = data.map((d, i) => {
    const x = padding + i * stepX;
    const y =
      height - padding - ((d.value - min) / range) * (height - padding * 2);
    return { x, y, ...d };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaPath =
    `${linePath} L ${points[points.length - 1].x} ${height - padding} ` +
    `L ${points[0].x} ${height - padding} Z`;

  return (

    <div className="line-chart">

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="line-chart-svg"
        preserveAspectRatio="none"
      >

        {/* baseline */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="var(--gridline)"
          strokeWidth="1"
        />

        <path
          d={areaPath}
          fill={color}
          fillOpacity="0.12"
          stroke="none"
        />

        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((p) => (

          <circle
            key={p.label}
            cx={p.x}
            cy={p.y}
            r="3.5"
            fill={color}
            stroke="var(--bg-card)"
            strokeWidth="1.5"
          >
            <title>{`${p.label}: ${p.value.toLocaleString("en-IN")}${valueSuffix}`}</title>
          </circle>

        ))}

      </svg>

      <div className="line-chart-labels">

        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}

      </div>

    </div>

  );

}


export default LineChart;
