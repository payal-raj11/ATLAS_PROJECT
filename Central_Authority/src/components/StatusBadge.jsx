function StatusBadge({ status }) {

  let className = "status-pending";


  if (status === "Approved") {
    className = "status-approved";
  }

  else if (status === "Completed") {
    className = "status-completed";
  }

  else if (status === "Under Review") {
    className = "status-review";
  }

  else if (
    status.includes("Correction")
  ) {
    className = "status-correction";
  }


  return (

    <span
      className={`project-status ${className}`}
    >
      {status}
    </span>

  );

}


export default StatusBadge;