function ActivityFeed({ items }) {

  return (

    <ul className="activity-feed">

      {items.map((item, index) => (

        <li
          className="activity-item"
          key={index}
        >

          <span className="activity-dot" />

          <div className="activity-content">

            <span className="activity-time">
              {item.time}
            </span>

            <span className="activity-project">
              {item.project}
            </span>

            <span className="activity-desc">
              {item.description}
            </span>

          </div>

        </li>

      ))}

    </ul>

  );

}


export default ActivityFeed;
