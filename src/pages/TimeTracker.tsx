import Header from "@/components/dashboard/Header";
import WeeklyTimeTracker from "@/components/users/WeeklyTimeTracker";

export default function Tracker() {
  return (
    <div className="dashboard-layout">
      <Header title="Tracker" />

      <div className="dashboard-content">
        <WeeklyTimeTracker />
      </div>
    </div>
  );
}
