function ThemeToggle({
  darkMode,
  setDarkMode
}) {

  return (

    <button
      className="theme-btn"
      onClick={() => setDarkMode(!darkMode)}
      title={
        darkMode
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
    >

      <span className="dot"></span>

      {darkMode
        ? "Dark"
        : "Light"
      }

    </button>

  );

}


export default ThemeToggle;