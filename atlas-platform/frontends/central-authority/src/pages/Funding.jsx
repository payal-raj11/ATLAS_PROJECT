import { useState } from "react";

import ModuleTabs from "../components/ModuleTabs";

import FundingOverview from "./funding/FundingOverview";
import FundingSources from "./funding/FundingSources";
import FundingAllocation from "./funding/FundingAllocation";
import FundingRelease from "./funding/FundingRelease";
import FundingMonitoring from "./funding/FundingMonitoring";


const TABS = [
  { key: "overview", label: "Funding Overview" },
  { key: "sources", label: "Funding Sources" },
  { key: "allocation", label: "Fund Allocation" },
  { key: "release", label: "Release & Utilization" },
  { key: "monitoring", label: "Financial Monitoring" },
];


function Funding() {

  const [active, setActive] = useState("overview");

  return (

    <div className="central-dashboard tabbed-module">

      <div className="tabbed-module-header">
        <h2>Funding</h2>
        <p>
          Where project money comes from, how much is allocated, how it's
          distributed, and how much has been used. Individual landowner
          compensation payments live in the Compensation module, not here.
        </p>
      </div>

      <ModuleTabs tabs={TABS} active={active} onChange={setActive} />

      {active === "overview" && <FundingOverview />}
      {active === "sources" && <FundingSources />}
      {active === "allocation" && <FundingAllocation />}
      {active === "release" && <FundingRelease />}
      {active === "monitoring" && <FundingMonitoring />}

    </div>

  );

}

export default Funding;
