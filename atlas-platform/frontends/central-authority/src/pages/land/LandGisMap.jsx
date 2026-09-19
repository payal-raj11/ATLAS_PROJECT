import GISMap from "../../components/GISMap";


// The spatial view only — where the land is and what it looks like
// on the ground. Parcel-level facts (owner, compensation %,
// possession %, affected families) live in the click-through panel
// GISMap already renders; aggregate land statistics belong on the
// Land Overview tab, not repeated here.
function LandGisMap() {

  return (
    <div className="land-gis-tab">
      <GISMap title="GIS Land Map" />
    </div>
  );

}

export default LandGisMap;
