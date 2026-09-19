import { Link } from "react-router-dom";


function KpiCard({
  icon,
  iconTone,
  label,
  value,
  note,
  tone = "default",
  to,
}) {

  const Wrapper = to ? Link : "div";

  return (

    <Wrapper
      className={`kpi-card kpi-${tone} ${to ? "kpi-clickable" : ""}`}
      {...(to ? { to } : {})}
    >

      {icon && (
        <div className={`kpi-icon ${iconTone ? `kpi-icon-circle kpi-icon-${iconTone}` : ""}`}>
          {icon}
        </div>
      )}

      <div className="kpi-body">

        <span className="kpi-label">
          {label}
        </span>

        <span className="kpi-value">
          {value}
        </span>

        {note && (
          <span className="kpi-note">
            {note}
          </span>
        )}

      </div>

    </Wrapper>

  );

}


export default KpiCard;
