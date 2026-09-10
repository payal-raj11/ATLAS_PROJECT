import { Fragment } from "react";


function severityColor(rowIndex, colIndex) {

  const score = rowIndex + colIndex;

  if (score <= 1) return "var(--series-6)";   // low likelihood + low impact
  if (score <= 2) return "var(--series-4)";   // medium
  return "var(--series-5)";                   // high likelihood and/or impact

}


function RiskMatrix({ matrix }) {

  const { rows, cols, rowLabel, colLabel, grid } = matrix;

  const maxCount = Math.max(...grid.flat(), 1);

  return (

    <div className="risk-matrix">

      <div className="risk-matrix-col-label">
        {colLabel}
      </div>

      <div className="risk-matrix-grid-wrap">

        <div className="risk-matrix-row-label">
          {rowLabel}
        </div>

        <div className="risk-matrix-grid">

          <div className="risk-matrix-corner" />

          {cols.map((col) => (
            <div
              className="risk-matrix-axis-cell"
              key={`col-${col}`}
            >
              {col}
            </div>
          ))}

          {rows.map((row, rowIndex) => (

            <Fragment key={row}>

              <div className="risk-matrix-axis-cell">
                {row}
              </div>

              {cols.map((col, colIndex) => {

                const count = grid[rowIndex][colIndex];
                const size = count === 0 ? 0 : 10 + (count / maxCount) * 16;

                return (

                  <div
                    className="risk-matrix-cell"
                    key={`${row}-${col}`}
                    title={`${row} likelihood × ${col} impact: ${count} project${count === 1 ? "" : "s"}`}
                  >

                    {count > 0 && (

                      <span
                        className="risk-matrix-dot"
                        style={{
                          width: `${size}px`,
                          height: `${size}px`,
                          backgroundColor: severityColor(rowIndex, colIndex),
                        }}
                      >
                        {count}
                      </span>

                    )}

                  </div>

                );

              })}

            </Fragment>

          ))}

        </div>

      </div>

    </div>

  );

}


export default RiskMatrix;
