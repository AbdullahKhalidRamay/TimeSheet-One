import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { startReminderService } from "@/services/reminderService";
import "@/utils/resetData"; // Import for development utilities
import { ThemeProvider } from "@/components/ThemeProvider";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Login from "./pages/Login";
import Timesheet from "./pages/Timesheet";
import TimeTracker from "./pages/TimeTracker";
import Projects from "./pages/Projects";
import Teams from "./pages/Teams";
import Notifications from "./pages/Notifications";
import ApprovalWorkflow from "./pages/ApprovalWorkflow";
import Reports from "./pages/Reports";
import MemberDetail from "./pages/MemberDetail";
import TeamDetail from "./pages/TeamDetail";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App = () => {
  useEffect(() => {
    // Start the reminder service for time entry notifications
    startReminderService();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <AuthProvider>
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
                    <Route path="members/:memberId" element={<ErrorBoundary><MemberDetail /></ErrorBoundary>} />
                    <Route path="teams/:teamId" element={<ErrorBoundary><TeamDetail /></ErrorBoundary>} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
