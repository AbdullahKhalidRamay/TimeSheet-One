import { useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getTimeEntries } from "@/services/storage";

export default function TimesheetTest() {
  const [status, setStatus] = useState("Loading...");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    try {
      console.log("TimesheetTest: Starting component load");
      
      const currentUser = getCurrentUser();
      console.log("TimesheetTest: Current user:", currentUser);
      
      const timeEntries = getTimeEntries();
      console.log("TimesheetTest: Time entries:", timeEntries);
      
      setData({
        user: currentUser,
        entriesCount: timeEntries.length,
        entries: timeEntries
      });
      
      setStatus("Loaded successfully");
      console.log("TimesheetTest: Component loaded successfully");
      
    } catch (error) {
      console.error("TimesheetTest: Error loading component:", error);
      setStatus("Error: " + error);
    }
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Timesheet Test Page</h1>
      <div className="space-y-4">
        <div>
          <strong>Status:</strong> {status}
        </div>
        {data && (
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-bold mb-2">Debug Data:</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
