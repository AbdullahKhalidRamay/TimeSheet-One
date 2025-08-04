import { useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { getCurrentUser, initializeAuth } from "@/lib/auth";
import { initializeSampleData } from "@/store/sampleData";

export default function Layout() {
  const currentUser = getCurrentUser();

  useEffect(() => {
    initializeAuth();
    initializeSampleData();
  }, []);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
