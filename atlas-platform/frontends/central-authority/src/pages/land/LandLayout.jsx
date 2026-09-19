import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import ModuleTabs from "../../components/ModuleTabs";

import LandOverview from "./LandOverview";
import LandGisMap from "./LandGisMap";
import LandOwnership from "./LandOwnership";
import LandImpactOverview from "./LandImpactOverview";
import LandImpactAssessment from "./LandImpactAssessment";


const TABS = [
  { key: "overview", label: "Land Overview" },
  { key: "gis", label: "GIS Land Map" },
  { key: "ownership", label: "Ownership & Affected Parties" },
  { key: "impact", label: "Impact Overview" },
  { key: "assessment", label: "Impact Assessment" },
];


function LandLayout() {

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab");

  const [active, setActive] = useState(
    TABS.some((t) => t.key === initialTab) ? initialTab : "overview"
  );

  const handleChange = (key) => {
    setActive(key);
    // Keep any other query params (status/state used by the GIS tab)
    // but move `tab` to whatever was just clicked.
    const next = new URLSearchParams(searchParams);
    next.set("tab", key);
    setSearchParams(next, { replace: true });
  };

  return (

    <div className="central-dashboard tabbed-module">

      <div className="tabbed-module-header">
        <h2>Land &amp; Impact</h2>
        <p>
          What land is being acquired, where it is, who it affects, and the
          consequences of acquiring it. Project management, funding and
          compensation processing live in their own modules — this one
          references them by Project ID / Parcel ID rather than duplicating
          their data.
        </p>
      </div>

      <ModuleTabs tabs={TABS} active={active} onChange={handleChange} />

      {active === "overview" && <LandOverview onOpenTab={handleChange} />}
      {active === "gis" && <LandGisMap />}
      {active === "ownership" && <LandOwnership />}
      {active === "impact" && <LandImpactOverview />}
      {active === "assessment" && <LandImpactAssessment />}

    </div>

  );

}

export default LandLayout;
