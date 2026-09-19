function ModuleTabs({ tabs, active, onChange }) {

  return (

    <div className="module-tabs" role="tablist">

      {tabs.map((tab) => (

        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={active === tab.key}
          className={`module-tab ${active === tab.key ? "module-tab-active" : ""}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>

      ))}

    </div>

  );

}

export default ModuleTabs;
