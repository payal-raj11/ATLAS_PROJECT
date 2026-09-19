function DeadlineList({ items }) {

  return (

    <ul className="deadline-list">

      {items.map((item, index) => (

        <li
          className="deadline-item"
          key={index}
        >

          <span className="deadline-date">
            {item.date}
          </span>

          <div className="deadline-content">

            <span className="deadline-label">
              {item.label}
            </span>

            <span className="deadline-project">
              {item.project}
            </span>

          </div>

        </li>

      ))}

    </ul>

  );

}


export default DeadlineList;
