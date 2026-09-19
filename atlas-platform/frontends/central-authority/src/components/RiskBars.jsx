import { useNavigate } from "react-router-dom";


// Risk level keeps the app's existing risk-badge semantics
// (green/amber/red) rather than inventing a new categorical hue —
// this is a "status" encoding, not an identity one, so it's
// reserved rather than reused elsewhere on the dashboard.
const RISK_COLOR = {
  Low: "var(--accent-green)",
  Medium: "#f59e0b",
  High: "#ef4444",
};

// Cost tier is ordinal (Low < Medium < High), so it's encoded as a
// lightness/opacity step on the row's own risk color instead of a
// second set of hues — a sequential encoding layered on a status one.
const COST_OPACITY = {
  Low: 0.35,
  Medium: 0.65,
  High: 1,
};


function RiskBars({ data }) {

  const navigate = useNavigate();

  const { costTiers, rows } = data;

  const maxTotal = Math.max(...rows.map((row) => row.total), 1);

  return (

    <div className="risk-bars">

      <div className="risk-bars-legend">

        <span className="risk-bars-legend-title">
          Cost impact:
        </span>

        {costTiers.map((tier) => (

          <span
            className="risk-bars-legend-item"
            key={tier}
          >

            <span
              className="risk-bars-legend-swatch"
              style={{ opacity: COST_OPACITY[tier] }}
            />

            {tier}

          </span>

        ))}

      </div>


      <div className="risk-bars-rows">

        {rows.map((row) => (

          <div
            className={`risk-bars-row ${row.to ? "risk-bars-row-clickable" : ""}`}
            key={row.risk}
            onClick={row.to ? () => navigate(row.to) : undefined}
          >

            <span
              className="risk-bars-row-label"
              style={{ color: RISK_COLOR[row.risk] }}
            >
              {row.risk} risk
            </span>

            <div className="risk-bars-track">

              <div
                className="risk-bars-fill"
                style={{ width: `${(row.total / maxTotal) * 100}%` }}
              >

                {row.segments
                  .filter((segment) => segment.value > 0)
                  .map((segment) => (

                    <div
                      key={segment.tier}
                      className="risk-bars-segment"
                      style={{
                        flexGrow: segment.value,
                        backgroundColor: RISK_COLOR[row.risk],
                        opacity: COST_OPACITY[segment.tier],
                      }}
                      title={`${row.risk} risk × ${segment.tier} cost: ${segment.value} project${segment.value === 1 ? "" : "s"}`}
                    />

                  ))}

              </div>

            </div>

            <span className="risk-bars-row-total">
              {row.total}
            </span>

          </div>

        ))}

      </div>

    </div>

  );

}


export default RiskBars;
