import { useState } from "react";
import { Outlet } from "react-router-dom";
import { ThemeProvider } from "../ThemeProvider";
import Sidebar from "./Sidebar";

export default function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(prev => !prev);
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="timeflow-theme">
      <div className="dashboard-layout animate-fade-in">
        <Sidebar collapsed={sidebarCollapsed} onToggle={handleSidebarToggle} />
        <div className={sidebarCollapsed ? "flex flex-col flex-1 ml-16" : "flex flex-col flex-1 ml-64"}>
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
