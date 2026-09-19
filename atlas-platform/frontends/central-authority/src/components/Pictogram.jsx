import { useState } from "react";
import { useNavigate } from "react-router-dom";


// A 10x10 waffle grid — each square is one percentage point.
// Reads as "40 out of 100 verified" at a glance, and unlike a ring
// it can label an exact count per square on hover.
function Pictogram({ percent, breakdown }) {

  const navigate = useNavigate();

  const [hoverIndex, setHoverIndex] = useState(null);

  const filled = Math.round(percent);

  const verifiedSegment = breakdown.find((b) => b.key === "verified");
  const pendingSegment = breakdown.find((b) => b.key === "pending");

  const squares = Array.from({ length: 100 }, (_, i) => i < filled);

  return (

    <div className="pictogram">

      <div className="pictogram-grid">

        {squares.map((isVerified, i) => (

          <div
            key={i}
            className="pictogram-cell"
            style={{
              backgroundColor: isVerified ? verifiedSegment?.color : pendingSegment?.color,
              opacity: hoverIndex === null ? 1 : (isVerified === (hoverIndex < filled) ? 1 : 0.35),
            }}
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
            onClick={() => navigate(isVerified ? verifiedSegment?.to : pendingSegment?.to)}
            title={isVerified ? verifiedSegment?.label : pendingSegment?.label}
          />

        ))}

      </div>

      <ul className="pictogram-legend">

        {breakdown.map((segment) => (

          <li
            key={segment.key}
            className="pictogram-legend-item"
            onMouseEnter={() => setHoverIndex(segment.key === "verified" ? 0 : filled)}
            onMouseLeave={() => setHoverIndex(null)}
            onClick={() => navigate(segment.to)}
          >

            <span
              className="pictogram-swatch"
              style={{ backgroundColor: segment.color }}
            />

            <span>{segment.label}</span>

            <strong>{segment.value}</strong>

          </li>

        ))}

      </ul>

    </div>

  );

}


export default Pictogram;
