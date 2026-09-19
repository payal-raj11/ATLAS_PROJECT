function RiskBadge({ risk }) {

  return (

    <span
      className={`risk risk-${risk.toLowerCase()}`}
    >

      <span className="risk-dot"></span>

      {risk}

    </span>

  );

}


export default RiskBadge;