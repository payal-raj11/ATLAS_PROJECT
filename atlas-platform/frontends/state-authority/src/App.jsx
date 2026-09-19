import { useState } from "react";

import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() =>
          setSidebarCollapsed((value) => !value)
        }
      />

      <div
        className={
          sidebarCollapsed
            ? "app-content app-content-collapsed"
            : "app-content"
        }
      >
        <Header />

        <AppRoutes />
      </div>
    </>
  );
}