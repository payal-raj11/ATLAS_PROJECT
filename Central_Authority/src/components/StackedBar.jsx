function StackedBar({ segments }) {

  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (

    <div className="stacked-bar-wrap">

      <div className="stacked-bar">

        {segments.map((segment) => (

          <div
            key={segment.label}
            className="stacked-bar-segment"
            style={{
              width: `${total > 0 ? (segment.value / total) * 100 : 0}%`,
              backgroundColor: segment.color,
            }}
            title={`${segment.label}: ${segment.value}%`}
          />

        ))}

      </div>

      <div className="stacked-bar-legend">

        {segments.map((segment) => (

          <span
            className="stacked-bar-legend-item"
            key={segment.label}
          >

            <span
              className="stacked-bar-swatch"
              style={{ backgroundColor: segment.color }}
            />

            {segment.label}
            <strong>{segment.value}%</strong>

          </span>

        ))}

      </div>

    </div>

  );

}


export default StackedBar;
