import { useNavigate } from "react-router-dom";


function HorizontalBars({
  data,
  valueSuffix = "%",
  maxValue,
  color = "var(--series-1)",
  compact = false,
}) {

  const navigate = useNavigate();

  const max =
    maxValue ??
    Math.max(...data.map((d) => d.value), 1);

  return (

    <div className={`bar-list ${compact ? "bar-list-compact" : ""}`}>

      {data.map((item) => (

        <div
          className={`bar-row ${item.to ? "bar-row-clickable" : ""}`}
          key={item.label}
          onClick={item.to ? () => navigate(item.to) : undefined}
        >

          <span className="bar-row-label">
            {item.label}
          </span>

          <div className="bar-row-track">

            <div
              className="bar-row-fill"
              style={{
                width: `${Math.min(100, (item.value / max) * 100)}%`,
                backgroundColor: item.color || color,
              }}
            />

          </div>

          <span className="bar-row-value">
            {item.displayValue ?? `${item.value}${valueSuffix}`}
          </span>

        </div>

      ))}

    </div>

  );

}


export default HorizontalBars;
