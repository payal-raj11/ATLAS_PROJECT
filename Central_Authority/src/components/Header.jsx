import ThemeToggle from "./ThemeToggle";


function Header({
  darkMode,
  setDarkMode
}) {

  return (

    <header className="authority-header">

      {/* BRAND */}

      <div className="authority-brand">

        <div className="authority-logo">
          AT
        </div>


        <div className="authority-brand-text">

          <h1>
            ATLAS
          </h1>

          <p>
            Acquisition Tracking & Land Analysis System
          </p>

        </div>

      </div>


      {/* HEADER RIGHT */}

      <div className="authority-header-right">


        {/* SEARCH */}

        <div className="header-search">

          <span>
            ⌕
          </span>

          <input
            type="text"
            placeholder="Search projects, land records..."
          />

        </div>


        {/* THEME */}

        <ThemeToggle
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />


        {/* USER */}

        <div className="header-user">

          <div className="user-avatar">
            CG
          </div>


          <div className="user-details">

            <strong>
              Central Government
            </strong>

            <span>
              Central Authority
            </span>

          </div>

        </div>

      </div>

    </header>

  );

}


export default Header;