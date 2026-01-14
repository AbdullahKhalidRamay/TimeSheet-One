import { useEffect, useState, useCallback } from "react";
import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { getCurrentUser, initializeAuth } from "@/lib/auth";
import { initializeSampleData } from "@/store/sampleData";

export default function Layout() {
  const currentUser = getCurrentUser();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    initializeAuth();
    initializeSampleData();
  }, []);

  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }



  return (
    <div className="flex h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={handleSidebarToggle} />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Outlet />
      </div>
    </div>
  );
}
