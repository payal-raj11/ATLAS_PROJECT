import { Link } from "react-router-dom";


// "Proposal", "Compensation", "Funding" and "Monitoring" aren't
// backed by any status in data/projects.js yet (see
// dashboardData.js) — their nodes stay static so a click doesn't
// land on a suspiciously-empty filtered list.
const CLICKABLE_STAGES = new Set([
  "Verification",
  "Survey",
  "Acquisition",
  "Approval",
]);


function WorkflowStrip({ stages }) {

  return (

    <div className="workflow-strip">

      {stages.map((stage, index) => {

        const clickable = CLICKABLE_STAGES.has(stage.label);

        const Node = clickable ? Link : "div";

        return (

          <div
            className="workflow-stage"
            key={stage.label}
          >

            <Node
              className={`workflow-node ${clickable ? "workflow-node-clickable" : ""}`}
              {...(clickable
                ? { to: `/projects?stage=${encodeURIComponent(stage.label)}` }
                : {})}
            >

              <span className="workflow-count">
                {stage.count}
              </span>

              <span className="workflow-label">
                {stage.label}
              </span>

            </Node>

            {index < stages.length - 1 && (
              <span className="workflow-arrow">
                →
              </span>
            )}

          </div>

        );

      })}

    </div>

  );

}


export default WorkflowStrip;
