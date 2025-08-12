import { useState, useEffect } from "react";
import { timeEntriesAPI } from "@/services/api";
import { TimeEntry } from "@/validation/index";

export default function TimesheetTest() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTimeEntries = async () => {
      try {
        setLoading(true);
        const entries = await timeEntriesAPI.getAll();
        setTimeEntries(entries);
      } catch (error) {
        console.error('Error loading time entries:', error);
        setTimeEntries([]);
      } finally {
        setLoading(false);
      }
    };

    loadTimeEntries();
  }, []);

  if (loading) {
    return <div>Loading time entries...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Timesheet Test</h1>
      <div className="space-y-2">
        {timeEntries.map((entry) => (
          <div key={entry.id} className="border p-4 rounded">
            <p><strong>Date:</strong> {entry.date}</p>
            <p><strong>User:</strong> {entry.userName}</p>
            <p><strong>Task:</strong> {entry.task}</p>
            <p><strong>Hours:</strong> {entry.totalHours}</p>
            <p><strong>Status:</strong> {entry.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
