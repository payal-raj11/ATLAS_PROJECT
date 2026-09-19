import { useState } from "react";
import { useNavigate } from "react-router-dom";


function DotPlot({ data, total }) {

  const navigate = useNavigate();

  const [activeKey, setActiveKey] = useState(null);

  const max = Math.max(...data.map((d) => d.value), 1);

  return (

    <div className="dot-plot">

      {data.map((item) => {

        const pct = (item.value / max) * 100;
        const shareOfTotal = total ? Math.round((item.value / total) * 100) : null;
        const isActive = activeKey === item.key;

        return (

          <div
            className={`dot-plot-row ${item.to ? "dot-plot-row-clickable" : ""}`}
            key={item.key}
            onMouseEnter={() => setActiveKey(item.key)}
            onMouseLeave={() => setActiveKey((cur) => (cur === item.key ? null : cur))}
            onClick={() => {
              if (item.to) navigate(item.to);
              else setActiveKey((cur) => (cur === item.key ? null : item.key));
            }}
          >

            <span className="dot-plot-label">
              {item.label}
            </span>

            <div className="dot-plot-track">

              <div
                className="dot-plot-line"
                style={{ width: `${pct}%`, backgroundColor: item.color }}
              />

              <div
                className="dot-plot-dot"
                style={{
                  left: `${pct}%`,
                  backgroundColor: item.color,
                  width: isActive ? "14px" : "10px",
                  height: isActive ? "14px" : "10px",
                }}
              />

            </div>

            <span className="dot-plot-value">
              {item.value}
              {isActive && shareOfTotal !== null && (
                <span className="dot-plot-share"> ({shareOfTotal}%)</span>
              )}
            </span>

          </div>

        );

      })}

    </div>

  );

}


export default DotPlot;
