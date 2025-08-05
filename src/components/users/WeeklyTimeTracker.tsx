import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Save, Check, Clock, AlertCircle } from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, isFuture, isToday } from "date-fns";
import DailyTrackerForm from "./DailyTrackerForm";
import { getCurrentUser } from "@/lib/auth";
import { getTimeEntryStatusForDate, getUserAssociatedProjects, saveTimeEntry, generateId, getTimeEntries } from "@/services/storage";
import { Project, TimeEntry, ProjectDetail } from "@/validation/index";

interface WeeklyHours {
  billable: number;
  actual: number;
}

interface ProjectWeekData {
  [projectId: string]: {
    [dayKey: string]: WeeklyHours;
  };
}

interface DailyAvailableHours {
  [dayKey: string]: number;
}

export default function WeeklyTimeTracker() {
  const currentUser = getCurrentUser();
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDateForEntry, setSelectedDateForEntry] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [weeklyData, setWeeklyData] = useState<ProjectWeekData>({});
  const [dailyAvailableHours, setDailyAvailableHours] = useState<DailyAvailableHours>({});

  // Load user projects only once
  useEffect(() => {
    if (currentUser) {
      const userProjects = getUserAssociatedProjects(currentUser.id);
      setProjects(userProjects);
    }
  }, [currentUser]);

  // Initialize weekly data when projects or week changes, but preserve existing data
  useEffect(() => {
    if (projects.length > 0) {
      setWeeklyData(prevData => {
        const newData: ProjectWeekData = { ...prevData };
        
        projects.forEach(project => {
          if (!newData[project.id]) {
            newData[project.id] = {};
          }
          
          for (let i = 0; i < 7; i++) {
            const dayKey = format(addDays(startOfWeek(selectedWeek, { weekStartsOn: 1 }), i), 'yyyy-MM-dd');
            if (!newData[project.id][dayKey]) {
              newData[project.id][dayKey] = {
                billable: 0,
                actual: 0
              };
            }
          }
        });
        
        return newData;
      });
    }
  }, [projects, selectedWeek]);

  const handlePreviousWeek = () => {
    setSelectedWeek(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    const nextWeek = addWeeks(selectedWeek, 1);
    const nextWeekStart = startOfWeek(nextWeek, { weekStartsOn: 1 });
    
    // Only allow if the week start is not in the future
    if (!isFuture(nextWeekStart) || isToday(nextWeekStart)) {
      setSelectedWeek(nextWeek);
    }
  };

  const canGoToNextWeek = () => {
    const nextWeek = addWeeks(selectedWeek, 1);
    const nextWeekStart = startOfWeek(nextWeek, { weekStartsOn: 1 });
    return !isFuture(nextWeekStart) || isToday(nextWeekStart);
  };

  const updateHours = (projectId: string, dayKey: string, type: 'billable' | 'actual', value: number) => {
    setWeeklyData(prev => {
      // Ensure the project exists in the data
      if (!prev[projectId]) {
        prev[projectId] = {};
      }
      
      // Ensure the day exists for this project
      if (!prev[projectId][dayKey]) {
        prev[projectId][dayKey] = { billable: 0, actual: 0 };
      }
      
      return {
        ...prev,
        [projectId]: {
          ...prev[projectId],
          [dayKey]: {
            ...prev[projectId][dayKey],
            [type]: value
          }
        }
      };
    });
  };

  const saveWeeklyData = () => {
    if (!currentUser) return;
    
    Object.entries(weeklyData).forEach(([projectId, projectData]) => {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;
      
      Object.entries(projectData).forEach(([dayKey, hours]) => {
        if (hours.actual > 0 || hours.billable > 0) {
          const timeEntry: TimeEntry = {
            id: generateId(),
            userId: currentUser.id,
            userName: currentUser.name,
            date: dayKey,
            actualHours: hours.actual,
            billableHours: hours.billable,
            totalHours: hours.actual + hours.billable,
            availableHours: dailyAvailableHours[dayKey] || 0,
            task: `Weekly entry for ${project.name}`,
            projectDetails: {
              category: 'project',
              name: project.name,
              level: '',
              task: '',
              subtask: '',
              description: `Weekly time entry for ${project.name}`
            } as ProjectDetail,
            isBillable: hours.billable > 0,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          saveTimeEntry(timeEntry);
        }
      });
    });
    
    alert('Weekly time entries saved successfully!');
    setRefreshKey(prev => prev + 1); // Force re-render to show updated status indicators
  };

  // Helper function to check if entries exist for a specific date
  const hasEntriesForDate = (date: Date): boolean => {
    if (!currentUser) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    const allEntries = getTimeEntries();
    return allEntries.some(entry => entry.date === dateStr && entry.userId === currentUser.id);
  };

  // Get status information for a specific date
  const getDateStatus = (date: Date) => {
    if (!currentUser) return null;
    const dateStr = format(date, 'yyyy-MM-dd');
    return getTimeEntryStatusForDate(dateStr, currentUser.id);
  };

  // Get status icon and color based on entry status
  const getStatusIndicator = (date: Date) => {
    const dateStatus = getDateStatus(date);
    if (!dateStatus || !dateStatus.hasEntries) {
      return null;
    }

    const hasApproved = dateStatus.statuses.includes('approved');
    const hasPending = dateStatus.statuses.includes('pending');
    const hasRejected = dateStatus.statuses.includes('rejected');

    if (hasApproved && !hasPending && !hasRejected) {
      return {
        icon: Check,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        tooltip: `${dateStatus.entriesCount} approved entries (${dateStatus.totalHours}h)`
      };
    } else if (hasPending) {
      return {
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        tooltip: `${dateStatus.entriesCount} entries pending approval (${dateStatus.totalHours}h)`
      };
    } else if (hasRejected) {
      return {
        icon: AlertCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        tooltip: `${dateStatus.entriesCount} rejected entries (${dateStatus.totalHours}h)`
      };
    }
    return null;
  };

  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-6">
      {/* Date Filter Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>Weekly Time Tracker</span>
            </CardTitle>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousWeek}
                className="flex items-center space-x-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>
              <Badge variant="secondary" className="px-3 py-1">
                {format(weekStart, "MMM dd")} - {format(weekEnd, "MMM dd, yyyy")}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextWeek}
                disabled={!canGoToNextWeek()}
                className="flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Status Legend */}
      <Card className="bg-gray-50 dark:bg-gray-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <span className="text-gray-700 dark:text-gray-300">Approved</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-100">
                <Clock className="w-3 h-3 text-yellow-600" />
              </div>
              <span className="text-gray-700 dark:text-gray-300">Pending</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100">
                <AlertCircle className="w-3 h-3 text-red-600" />
              </div>
              <span className="text-gray-700 dark:text-gray-300">Rejected</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid for Projects and Days */}
      <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Projects</th>
              {weekDays.map(day => {
                const statusIndicator = getStatusIndicator(day);
                return (
                  <th key={day.toString()} className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <span>{format(day, 'E, MMM d')}</span>
                      {statusIndicator && (
                        <div 
                          className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${statusIndicator.bgColor}`}
                          title={statusIndicator.tooltip}
                        >
                          <statusIndicator.icon className={`w-3 h-3 ${statusIndicator.color}`} />
                        </div>
                      )}
                    </div>
                    <div className="flex justify-around text-xs text-gray-600 dark:text-gray-400">
                      <span>B</span>
                      <span>A</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {projects.map(project => (
              <tr key={project.id} className="odd:bg-white dark:odd:bg-gray-900 even:bg-gray-50 dark:even:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
                <td className="py-3 px-4 border border-gray-200 dark:border-gray-700 font-medium text-left text-gray-900 dark:text-gray-100">{project.name}</td>
                {weekDays.map(day => {
                  const dayKey = format(day, 'yyyy-MM-dd');
                  const hours = weeklyData[project.id]?.[dayKey] || { billable: 0, actual: 0 };
                  const isFutureDay = day.getTime() > new Date().getTime();
                  return (
                    <td key={dayKey} className="py-2 px-2 border border-gray-200 dark:border-gray-700">
                      <div className="flex justify-around items-center gap-1">
                        <Input 
                          type="number" step="0.5" min="0" max="24"
                          value={hours.billable === 0 ? '' : hours.billable.toString()}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            const value = inputValue === '' ? 0 : (isNaN(parseFloat(inputValue)) ? 0 : parseFloat(inputValue));
                            updateHours(project.id, dayKey, 'billable', value);
                          }}
                          className="w-16 text-xs h-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&[type=number]]:[-moz-appearance:textfield]"
                          disabled={!project.isBillable || isFutureDay}
                          placeholder="0"
                        />
                        <Input 
                          type="number" step="0.5" min="0" max="24"
                          value={hours.actual === 0 ? '' : hours.actual.toString()}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            const value = inputValue === '' ? 0 : (isNaN(parseFloat(inputValue)) ? 0 : parseFloat(inputValue));
                            updateHours(project.id, dayKey, 'actual', value);
                          }}
                          className="w-16 text-xs h-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&[type=number]]:[-moz-appearance:textfield]"
                          disabled={isFutureDay}
                          placeholder="0"
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Available Hours Row */}
            <tr className="bg-blue-50 dark:bg-blue-900/20 border-t-2 border-blue-200 dark:border-blue-700">
              <td className="py-3 px-4 border border-gray-200 dark:border-gray-700 font-semibold text-blue-800 dark:text-blue-400">Available Hours</td>
              {weekDays.map(day => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const isFutureDay = day.getTime() > new Date().getTime();
                const availableHours = dailyAvailableHours[dayKey] || 0;
                return (
                  <td key={dayKey} className="py-2 px-2 border border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex justify-center">
                      <Input 
                        type="number" 
                        step="0.5" 
                        min="0" 
                        max="24"
                        value={availableHours === 0 ? '' : availableHours.toString()}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          const value = inputValue === '' ? 0 : (isNaN(parseFloat(inputValue)) ? 0 : parseFloat(inputValue));
                          setDailyAvailableHours(prev => ({
                            ...prev,
                            [dayKey]: value
                          }));
                        }}
                        className="w-20 text-center text-sm h-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-blue-300 dark:border-blue-600 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&[type=number]]:[-moz-appearance:textfield]"
                        disabled={isFutureDay}
                        placeholder="0"
                      />
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={saveWeeklyData} className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded shadow-lg transition-colors">
          <Save className="mr-2 h-4 w-4" />
          Save Week
        </Button>
      </div>

      {/* Daily Tracker Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Add Time Entry for {selectedDateForEntry ? format(selectedDateForEntry, "EEEE, MMMM dd, yyyy") : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <DailyTrackerForm 
              initialDate={selectedDateForEntry ? format(selectedDateForEntry, 'yyyy-MM-dd') : undefined}
              onClose={() => {
                setIsDialogOpen(false);
                setRefreshKey(prev => prev + 1); // Force re-render to show updated status
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
