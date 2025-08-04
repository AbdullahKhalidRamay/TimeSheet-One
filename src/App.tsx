import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/dashboard/Layout";
import Login from "./pages/Login";
import Timesheet from "./pages/Timesheet";
import TimeTracker from "./pages/TimeTracker";
import Projects from "./pages/Projects";
import Teams from "./pages/Teams";
import Notifications from "./pages/Notifications";
import ApprovalWorkflow from "./pages/ApprovalWorkflow";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Timesheet />} />
            <Route path="timesheet" element={<Timesheet />} />
            <Route path="time-tracker" element={<TimeTracker />} />
            <Route path="projects" element={<Projects />} />
            <Route path="teams" element={<Teams />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="approval" element={<ApprovalWorkflow />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
