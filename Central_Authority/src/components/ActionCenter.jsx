import { Link } from "react-router-dom";


function ActionCenter({ items }) {

  return (

    <ul className="action-center-list">

      {items.map((item) => (

        <li key={item.label}>

          <Link
            to={item.to}
            className="action-center-item"
          >

            <span className="action-center-icon">
              {item.icon}
            </span>

            <span className="action-center-text">
              <strong>{item.count}</strong> {item.label}
            </span>

            <span className="action-center-arrow">
              →
            </span>

          </Link>

        </li>

      ))}

    </ul>

  );

}


export default ActionCenter;
