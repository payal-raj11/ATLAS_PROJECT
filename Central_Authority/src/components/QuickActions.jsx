import { Link } from "react-router-dom";


function QuickActions({ actions }) {

  return (

    <div className="quick-actions">

      {actions.map((action) => (

        <Link
          key={action.to}
          to={action.to}
          className="quick-action-btn"
        >

          <span className="quick-action-icon">
            {action.icon}
          </span>

          <span>
            {action.label}
          </span>

        </Link>

      ))}

    </div>

  );

}


export default QuickActions;
