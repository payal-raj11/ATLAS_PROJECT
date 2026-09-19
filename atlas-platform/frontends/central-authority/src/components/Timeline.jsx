import { useState } from "react";
import { useNavigate } from "react-router-dom";


function Timeline({ items }) {

  const navigate = useNavigate();

  const [activeId, setActiveId] = useState(null);

  return (

    <div className="timeline">

      {items.map((item, index) => {

        const isActive = activeId === item.id;
        const clickable = Boolean(item.projectId);

        return (

          <div
            className={`timeline-row ${clickable ? "timeline-row-clickable" : ""} ${isActive ? "timeline-row-active" : ""}`}
            key={item.id}
            onMouseEnter={() => setActiveId(item.id)}
            onMouseLeave={() => setActiveId((cur) => (cur === item.id ? null : cur))}
            onClick={() => {
              if (clickable) navigate(`/projects/${item.projectId}`);
              else setActiveId((cur) => (cur === item.id ? null : item.id));
            }}
          >

            <div className="timeline-spine">

              <span className="timeline-dot" />

              {index < items.length - 1 && (
                <span className="timeline-line" />
              )}

            </div>

            <div className="timeline-body">

              <span className="timeline-when">
                {item.when}
              </span>

              <span className="timeline-title">
                {item.title}
              </span>

              <span className="timeline-subtitle">
                {item.subtitle}
              </span>

              {isActive && item.extra && (
                <span className="timeline-extra">
                  {item.extra}
                </span>
              )}

            </div>

          </div>

        );

      })}

    </div>

  );

}


export default Timeline;
