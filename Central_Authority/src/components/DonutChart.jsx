import { useNavigate } from "react-router-dom";


function DonutChart({
  data,
  centerLabel,
  centerValue,
}) {

  const navigate = useNavigate();

  const total = data.reduce((sum, d) => sum + d.value, 0);

  const radius = 60;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;

  let offsetSoFar = 0;

  const handleClick = (segment) => {
    if (segment.to) {
      navigate(segment.to);
    }
  };

  return (

    <div className="donut-chart">

      <div className="donut-svg-wrap">

        <svg
          viewBox="0 0 160 160"
          width="180"
          height="180"
        >

          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="var(--gridline)"
            strokeWidth={strokeWidth}
          />

          {data.map((segment) => {

            const fraction = total > 0 ? segment.value / total : 0;
            const dash = fraction * circumference;
            const gap = circumference - dash;

            const dashOffset =
              circumference * 0.25 - offsetSoFar;

            offsetSoFar += dash;

            return (

              <circle
                key={segment.label}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 80 80)"
                strokeLinecap="butt"
                className={segment.to ? "donut-segment-clickable" : undefined}
                onClick={() => handleClick(segment)}
              >
                <title>
                  {`${segment.label}: ${segment.value}`}
                </title>
              </circle>

            );

          })}

        </svg>

        <div className="donut-center">

          <span className="donut-center-value">
            {centerValue}
          </span>

          <span className="donut-center-label">
            {centerLabel}
          </span>

        </div>

      </div>


      <ul className="donut-legend">

        {data.map((segment) => (

          <li
            key={segment.label}
            className={segment.to ? "donut-legend-clickable" : undefined}
            onClick={() => handleClick(segment)}
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

    </div>

  );

}


export default DonutChart;
