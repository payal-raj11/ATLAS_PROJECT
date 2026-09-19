import useInViewOnce from "../hooks/useInViewOnce";

const COLORS = ["#5aa9e6", "#cfc9c6", "#f2793a", "#d9e100", "#c98a4b", "#7fd8c2"];


// Poster-style column chart for the Dashboard's Acquisition Trend
// panel: flat colored bars on a near-black card, a bold value label
// per bar, and a big growth headline computed from the real trend
// data (latest point vs. the one before it) rather than a fixed
// number — so the headline stays honest as `data` changes.
function AcquisitionTrendChart({ data, valueSuffix = "" }) {

  const [chartRef, inView] = useInViewOnce();

  const max = Math.max(...data.map((d) => d.value), 1);

  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const growth = prev && prev.value > 0
    ? Math.round(((last.value - prev.value) / prev.value) * 100)
    : null;

  return (

    <div className="poster-card" ref={chartRef}>

      <div className="poster-top">

        <div className="poster-tags">
          <span className="poster-tag poster-tag-fill">TREND</span>
          <span className="poster-tag">{new Date().getFullYear()}</span>
        </div>

        <div className="poster-mark">AT</div>

      </div>

      {growth !== null && (

        <>
          <div className="poster-headline">
            {growth >= 0 ? "+" : ""}{growth}%
          </div>

          <div className="poster-headline-sub">
            {last.label} vs {prev.label} · hectares acquired
          </div>
        </>

      )}

      <div className="poster-bars">

        {data.map((d, i) => {

          const pct = max > 0 ? (d.value / max) * 100 : 0;
          const color = COLORS[i % COLORS.length];
          const displayValue = d.value >= 1000
            ? `${(d.value / 1000).toFixed(1).replace(/\.0$/, "")}k`
            : d.value;

          return (

            <div key={d.label} className="poster-bar-col">

              <div
                className={`poster-bar ${inView ? "chart-bar-grow" : "poster-bar-pending"}`}
                style={{ height: `${pct}%`, backgroundColor: color, animationDelay: `${i * 70}ms` }}
                title={`${d.label}: ${d.value.toLocaleString("en-IN")}${valueSuffix}`}
              >
                <span className="poster-bar-value">{displayValue}</span>
              </div>

              <div className="poster-bar-label">{d.label}</div>

            </div>

          );

        })}

      </div>

    </div>

  );

}


export default AcquisitionTrendChart;
