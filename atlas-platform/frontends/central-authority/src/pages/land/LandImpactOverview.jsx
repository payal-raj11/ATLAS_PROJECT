import { useLandParcels, computeLandStats } from "../../data/landData";


function formatNumber(value) {
  return Math.round(value).toLocaleString("en-IN");
}


function Fact({ label, value, untracked }) {
  return (
    <li className="impact-fact">
      <span className="impact-fact-label">{label}</span>
      <span className={`impact-fact-value ${untracked ? "untracked" : ""}`}>{value}</span>
    </li>
  );
}


function LandImpactOverview() {

  const features = useLandParcels();
  const stats = computeLandStats(features);

  if (!stats) {
    return <div className="land-loading">Loading impact data…</div>;
  }

  const residential = stats.byClassification.Residential?.count || 0;
  const commercial = stats.byClassification.Commercial?.count || 0;
  const agriAcres =
    (stats.byClassification.Agricultural?.acres || 0) +
    (stats.byClassification["Multi-crop"]?.acres || 0);

  const estPeople = Math.round(stats.totalFamilies * 4.8);

  return (

    <div className="land-impact-overview">

      <div className="module-note">
        Quick summary only — what's shown here is either computed from real
        parcel records or explicitly marked as not yet tracked. See{" "}
        <strong>Impact Assessment</strong> for severity, risk and mitigation
        detail.
      </div>

      <div className="impact-category-grid">

        <div className="impact-category-card">
          <div className="impact-category-title"><span className="impact-category-icon">👥</span>Social Impact</div>
          <ul className="impact-fact-list">
            <Fact label="Households affected" value={formatNumber(stats.totalFamilies)} />
            <Fact label="People affected (estimate)" value={`~${formatNumber(estPeople)}`} untracked />
            <Fact label="Residential structures affected" value={formatNumber(residential)} />
            <Fact label="Schools / hospitals affected" value="Not yet tracked" untracked />
            <Fact label="Vulnerable groups affected" value="Not yet tracked" untracked />
          </ul>
        </div>

        <div className="impact-category-card">
          <div className="impact-category-title"><span className="impact-category-icon">🌾</span>Economic Impact</div>
          <ul className="impact-fact-list">
            <Fact label="Agricultural land affected" value={`${formatNumber(agriAcres)} ac`} />
            <Fact label="Commercial-use parcels affected" value={formatNumber(commercial)} />
            <Fact label="Employment / livelihoods affected" value="Not yet tracked" untracked />
            <Fact label="Estimated livelihood loss" value="Not yet tracked" untracked />
          </ul>
        </div>

        <div className="impact-category-card">
          <div className="impact-category-title"><span className="impact-category-icon">🌳</span>Environmental Impact</div>
          <ul className="impact-fact-list">
            <Fact label="Forest area affected" value="Not yet tracked" untracked />
            <Fact label="Water bodies affected" value="Not yet tracked" untracked />
            <Fact label="Ecologically sensitive areas" value="Not yet tracked" untracked />
            <Fact label="Trees / vegetation affected" value="Not yet tracked" untracked />
          </ul>
        </div>

        <div className="impact-category-card">
          <div className="impact-category-title"><span className="impact-category-icon">🛣️</span>Infrastructure Impact</div>
          <ul className="impact-fact-list">
            <Fact label="Railway corridor parcels" value={formatNumber(stats.byProjectType.Railway || 0)} />
            <Fact label="Highway corridor parcels" value={formatNumber(stats.byProjectType.Highway || 0)} />
            <Fact label="Transmission corridor parcels" value={formatNumber(stats.byProjectType.Transmission || 0)} />
            <Fact label="Public infrastructure affected" value="Not yet tracked" untracked />
          </ul>
        </div>

      </div>

    </div>

  );

}

export default LandImpactOverview;
