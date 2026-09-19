import { useState } from "react";


// A bullet chart: a qualitative range (light -> dark bands, "how
// far along should this be") behind a single measure bar, with a
// tick marking the target. Replaces a plain progress bar with the
// standard form for "actual vs. target" on one axis.
function BulletChart({ data }) {

  const [activeLabel, setActiveLabel] = useState(null);

  return (

    <div className="bullet-chart">

      {data.map((row) => {

        const max = row.max ?? Math.max(row.value, row.target, 1);
        const valuePct = Math.min(100, (row.value / max) * 100);
        const targetPct = Math.min(100, (row.target / max) * 100);
        const isActive = activeLabel === row.label;

        return (

          <div
            className="bullet-row"
            key={row.label}
            onMouseEnter={() => setActiveLabel(row.label)}
            onMouseLeave={() => setActiveLabel((cur) => (cur === row.label ? null : cur))}
            onClick={() => setActiveLabel((cur) => (cur === row.label ? null : row.label))}
          >

            <div className="bullet-row-top">

              <span className="bullet-row-label">
                {row.label}
              </span>

              <span className="bullet-row-value">
                {row.displayValue}
              </span>

            </div>

            <div className="bullet-track">

              <div className="bullet-band bullet-band-1" />
              <div className="bullet-band bullet-band-2" />
              <div className="bullet-band bullet-band-3" />

              <div
                className="bullet-measure"
                style={{
                  width: `${valuePct}%`,
                  backgroundColor: row.color,
                }}
              />

              <div
                className="bullet-target"
                style={{ left: `${targetPct}%` }}
              />

            </div>

            {isActive && (

              <div className="bullet-row-detail">
                {row.detail ??
                  `${Math.round((row.value / row.target) * 100)}% of target`}
              </div>

            )}

          </div>

        );

      })}

    </div>

  );

}


export default BulletChart;
