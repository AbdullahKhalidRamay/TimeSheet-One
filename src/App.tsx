import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { initializeAuth, getCurrentUser } from "@/lib/auth";
import { startReminderService } from "@/services/reminderService";
import "@/utils/resetData"; // Import for development utilities
import { ThemeProvider } from "@/components/ThemeProvider";
import { SettingsProvider } from "@/contexts/SettingsContext";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Login from "./pages/Login";
import Timesheet from "./pages/Timesheet";
import TimeTracker from "./pages/TimeTracker";
import Projects from "./pages/Projects";
import Teams from "./pages/Teams";
import Notifications from "./pages/Notifications";
import ApprovalWorkflow from "./pages/ApprovalWorkflow";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const currentUser = getCurrentUser();
  return currentUser ? <>{children}</> : <Navigate to="/login" replace />;
};

const App = () => {
  useEffect(() => {
    // Initialize authentication system with default users
    initializeAuth();
    
    // Start the reminder service for time entry notifications
    startReminderService();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <SettingsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/tracker" replace />} />
                  <Route path="tracker" element={<ErrorBoundary><TimeTracker /></ErrorBoundary>} />
                   <Route path="timesheet" element={<ErrorBoundary><Timesheet /></ErrorBoundary>} />
                  <Route path="projects" element={<ErrorBoundary><Projects /></ErrorBoundary>} />
                  <Route path="teams" element={<ErrorBoundary><Teams /></ErrorBoundary>} />
                  <Route path="notifications" element={<ErrorBoundary><Notifications /></ErrorBoundary>} />
                  <Route path="approval" element={<ErrorBoundary><ApprovalWorkflow /></ErrorBoundary>} />
                  <Route path="reports" element={<ErrorBoundary><Reports /></ErrorBoundary>} />
                  <Route path="settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </SettingsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
