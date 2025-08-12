import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Save, Check, Clock, AlertCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, addDays, isFuture, isToday } from "date-fns";
import DailyTrackerForm from "./DailyTrackerForm";
import { getCurrentUser } from "@/lib/auth";
import { getTimeEntryStatusForDate, getUserAssociatedProjects, getTimeEntries, saveTimeEntry, generateId } from "@/services/storage";
import { Project, TimeEntry, ProjectDetail } from "@/validation/index";

interface DailyProjectData {
  task: string;
  availableHours: number;
  actualHours: number;
  billableHours: number;
}

interface MonthlyData {
  [dateKey: string]: {
    [projectId: string]: DailyProjectData;
  };
}

interface SelectedProjects {
  [dateKey: string]: string[]; // array of projectIds
}

export default function MonthlyTimeTracker() {
  const currentUser = getCurrentUser();
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDateForEntry, setSelectedDateForEntry] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<SelectedProjects>({});

  // Load user projects
  useEffect(() => {
    if (currentUser) {
      const userProjects = getUserAssociatedProjects(currentUser.id);
      setProjects(userProjects);
    }
  }, [currentUser]);

  useEffect(() => {
    // Generate the days of the selected month
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const monthDays = Array.from({ length: monthEnd.getDate() }, (_, i) => addDays(monthStart, i));

    // Filter out future dates
    const validDates = monthDays.filter(date => !isFuture(date) || isToday(date));
    setSelectedDates(validDates);
  }, [selectedMonth]);

  const handlePreviousMonth = () => {
    setSelectedMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(selectedMonth, 1);
    const nextMonthStart = startOfMonth(nextMonth);

    // Only allow if the month start is not in the future
    if (!isFuture(nextMonthStart) || isToday(nextMonthStart)) {
      setSelectedMonth(nextMonth);
    }
  };

  const handleAddEntry = (date: Date) => {
    setSelectedDateForEntry(date);
    setIsDialogOpen(true);
  };

  const canGoToNextMonth = () => {
    const nextMonth = addMonths(selectedMonth, 1);
    const nextMonthStart = startOfMonth(nextMonth);
    return !isFuture(nextMonthStart) || isToday(nextMonthStart);
  };

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  // Initialize monthly data for selected month
  useEffect(() => {
    setMonthlyData((prevData) => {
      const updatedData = { ...prevData };

      selectedDates.forEach((date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        if (!updatedData[dateKey]) {
          updatedData[dateKey] = {};
        }

        projects.forEach((project) => {
          if (!updatedData[dateKey][project.id]) {
            updatedData[dateKey][project.id] = {
              task: '',
              availableHours: 0,
              actualHours: 0,
              billableHours: 0,
            };
          }
        });
      });
      return updatedData;
    });
  }, [selectedDates, projects]);

  // Helper functions
  const updateProjectData = (dateKey: string, projectId: string, field: keyof DailyProjectData, value: string | number) => {
    setMonthlyData(prevData => ({
      ...prevData,
      [dateKey]: {
        ...prevData[dateKey],
        [projectId]: {
          ...prevData[dateKey][projectId],
          [field]: value,
          // Auto-calculate billable hours when actual hours or available hours change
          billableHours: field === 'actualHours' ? 
            Math.min(value, prevData[dateKey][projectId]?.availableHours || 0) :
            field === 'availableHours' ?
            Math.min(prevData[dateKey][projectId]?.actualHours || 0, value) :
            prevData[dateKey][projectId]?.billableHours || 0
        }
      }
    }));
  };

  const addProjectToDate = (dateKey: string, projectId: string) => {
    setSelectedProjects(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), projectId]
    }));
  };

  const removeProjectFromDate = (dateKey: string, projectId: string) => {
    setSelectedProjects(prev => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).filter(id => id !== projectId)
    }));
  };

  // Save entry for a specific date
  const saveEntryForDate = (date: Date) => {
    if (!currentUser) return;
    
    const dateKey = format(date, 'yyyy-MM-dd');
    const selectedProjectIds = selectedProjects[dateKey] || [];
    
    let savedEntries = 0;
    
    selectedProjectIds.forEach(projectId => {
      const project = projects.find(p => p.id === projectId);
      const projectData = monthlyData[dateKey]?.[projectId];
      
      if (project && projectData && (projectData.actualHours > 0 || projectData.billableHours > 0)) {
        const timeEntry: TimeEntry = {
          id: generateId(),
          userId: currentUser.id,
          userName: currentUser.name,
          date: dateKey,
          actualHours: projectData.actualHours,
          billableHours: projectData.billableHours,
          totalHours: projectData.actualHours + projectData.billableHours,
          availableHours: projectData.availableHours,
          task: projectData.task || `Entry for ${project.name}`,
          projectDetails: {
            category: 'project',
            name: project.name,
            level: '',
            task: projectData.task || '',
            subtask: '',
            description: projectData.task || `Monthly time entry for ${project.name}`
          } as ProjectDetail,
          isBillable: project.isBillable && projectData.billableHours > 0,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        saveTimeEntry(timeEntry);
        savedEntries++;
      }
    });
    
    if (savedEntries > 0) {
      alert(`Successfully saved ${savedEntries} time entries for ${format(date, 'MMM dd, yyyy')}!`);
      setRefreshKey(prev => prev + 1);
    } else {
      alert('No entries to save. Please enter hours for at least one project.');
    }
  };

  // Save entries for entire month
  const saveEntireMonth = () => {
    if (!currentUser) return;
    
    let totalSavedEntries = 0;
    
    selectedDates.forEach(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const selectedProjectIds = selectedProjects[dateKey] || [];
      
      selectedProjectIds.forEach(projectId => {
        const project = projects.find(p => p.id === projectId);
        const projectData = monthlyData[dateKey]?.[projectId];
        
        if (project && projectData && (projectData.actualHours > 0 || projectData.billableHours > 0)) {
          const timeEntry: TimeEntry = {
            id: generateId(),
            userId: currentUser.id,
            userName: currentUser.name,
            date: dateKey,
            actualHours: projectData.actualHours,
            billableHours: projectData.billableHours,
            totalHours: projectData.actualHours + projectData.billableHours,
            availableHours: projectData.availableHours,
            task: projectData.task || `Entry for ${project.name}`,
            projectDetails: {
              category: 'project',
              name: project.name,
              level: '',
              task: projectData.task || '',
              subtask: '',
              description: projectData.task || `Monthly time entry for ${project.name}`
            } as ProjectDetail,
            isBillable: project.isBillable && projectData.billableHours > 0,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          saveTimeEntry(timeEntry);
          totalSavedEntries++;
        }
      });
    });
    
    if (totalSavedEntries > 0) {
      alert(`Successfully saved ${totalSavedEntries} time entries for ${format(monthStart, 'MMM yyyy')}!`);
      setRefreshKey(prev => prev + 1);
    } else {
      alert('No entries to save. Please enter hours for at least one project.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Filter Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>Monthly Time Tracker</span>
            </CardTitle>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousMonth}
                className="flex items-center space-x-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>
              <Badge variant="secondary" className="px-3 py-1">
                {format(monthStart, "MMM yyyy")}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                disabled={!canGoToNextMonth()}
                className="flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Monthly Table View */}
      <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-center border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Date</th>
              <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Project Details</th>
              <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Task</th>
              <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Available Hours</th>
              <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Actual Hours</th>
              <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Billable Hours</th>
              <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {selectedDates.flatMap(currentDate => {
              const formattedDate = format(currentDate, 'dd/MM/yyyy');
              const day = format(currentDate, "EEEE");
              const currentUser = getCurrentUser();
              const statusData = currentUser ? getTimeEntryStatusForDate(format(currentDate, 'yyyy-MM-dd'), currentUser.id) : null;
              const isFutureDate = isFuture(currentDate) && !isToday(currentDate);
              const dateKey = format(currentDate, 'yyyy-MM-dd');
              const selectedProjectIds = selectedProjects[dateKey] || [];

              // Get status indicator
              const getStatusIndicator = () => {
                if (!statusData || !statusData.hasEntries) {
                  return {
                    text: 'No Entries',
                    color: 'text-gray-500 dark:text-gray-400',
                    icon: null
                  };
                }

                const hasApproved = statusData.statuses.includes('approved');
                const hasPending = statusData.statuses.includes('pending');
                const hasRejected = statusData.statuses.includes('rejected');

                if (hasApproved && !hasPending && !hasRejected) {
                  return {
                    text: `✓ Approved (${statusData.entriesCount} entries, ${statusData.totalHours.toFixed(1)}h)`,
                    color: 'text-green-600 dark:text-green-400',
                    icon: Check
                  };
                } else if (hasPending) {
                  return {
                    text: `⏳ Pending (${statusData.entriesCount} entries, ${statusData.totalHours.toFixed(1)}h)`,
                    color: 'text-yellow-600 dark:text-yellow-400',
                    icon: Clock
                  };
                } else if (hasRejected) {
                  return {
                    text: `❌ Rejected (${statusData.entriesCount} entries, ${statusData.totalHours.toFixed(1)}h)`,
                    color: 'text-red-600 dark:text-red-400',
                    icon: AlertCircle
                  };
                }
                return {
                  text: `✓ Done (${statusData.entriesCount} entries, ${statusData.totalHours.toFixed(1)}h)`,
                  color: 'text-green-600 dark:text-green-400',
                  icon: Check
                };
              };

              const statusIndicator = getStatusIndicator();

              // If no projects selected for this date, show a row with project selection
              if (selectedProjectIds.length === 0) {
                return [
                  <tr key={currentDate.toString()} className={`odd:bg-white dark:odd:bg-gray-900 even:bg-gray-50 dark:even:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 ${isFutureDate ? 'opacity-50' : ''}`}>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-gray-100">
                      <div className="flex flex-col items-center">
                        <span className="text-sm">{day}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-sm">
                      <Select
                        onValueChange={(projectId) => addProjectToDate(dateKey, projectId)}
                        disabled={isFutureDate}
                      >
                        <SelectTrigger className="w-full text-xs h-8">
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map(project => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700"></td>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700"></td>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700"></td>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700"></td>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col items-center">
                        <span className={`text-xs font-medium ${statusIndicator.color}`}>
                          {statusIndicator.text}
                        </span>
                        {!isFutureDate && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => saveEntryForDate(currentDate)}
                            className="mt-2 text-xs h-6 px-2 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Save Entry
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ];
              }

              // Show rows for each selected project
              return selectedProjectIds.map((projectId, index) => {
                const project = projects.find(p => p.id === projectId);
                const projectData = monthlyData[dateKey]?.[projectId] || {
                  task: '',
                  availableHours: 0,
                  actualHours: 0,
                  billableHours: 0
                };

                if (!project) return null;

                return (
                  <tr key={`${dateKey}-${projectId}`} className={`odd:bg-white dark:odd:bg-gray-900 even:bg-gray-50 dark:even:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 ${isFutureDate ? 'opacity-50' : ''}`}>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-gray-100">
                      {index === 0 ? (
                        <div className="flex flex-col items-center">
                          <span className="text-sm">{day}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</span>
                        </div>
                      ) : null}
                    </td>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-blue-800 dark:text-blue-200">
                          {project.name}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeProjectFromDate(dateKey, projectId)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          ×
                        </Button>
                      </div>
                      {index === selectedProjectIds.length - 1 && (
                        <Select
                          onValueChange={(newProjectId) => addProjectToDate(dateKey, newProjectId)}
                          disabled={isFutureDate}
                        >
                          <SelectTrigger className="w-full text-xs h-6 mt-1">
                            <SelectValue placeholder="+ Add project" />
                          </SelectTrigger>
                          <SelectContent>
                            {projects
                              .filter(p => !selectedProjectIds.includes(p.id))
                              .map(project => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700">
                      <Input
                        type="text"
                        value={projectData.task}
                        onChange={(e) => updateProjectData(dateKey, projectId, 'task', e.target.value)}
                        placeholder="Task Description"
                        disabled={isFutureDate}
                        className="w-full text-xs h-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                      />
                    </td>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700">
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        value={projectData.availableHours || ''}
                        onChange={(e) => updateProjectData(dateKey, projectId, 'availableHours', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        disabled={isFutureDate}
                        className="w-20 text-xs h-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&[type=number]]:[-moz-appearance:textfield]"
                      />
                    </td>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700">
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        value={projectData.actualHours || ''}
                        onChange={(e) => updateProjectData(dateKey, projectId, 'actualHours', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        disabled={isFutureDate}
                        className="w-20 text-xs h-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&[type=number]]:[-moz-appearance:textfield]"
                      />
                    </td>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700">
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        value={projectData.billableHours || ''}
                        onChange={(e) => updateProjectData(dateKey, projectId, 'billableHours', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        disabled={!project.isBillable || isFutureDate}
                        className={`w-20 text-xs h-8 ${!project.isBillable ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'} border-gray-300 dark:border-gray-600 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&[type=number]]:[-moz-appearance:textfield]`}
                      />
                    </td>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700">
                      {index === 0 ? (
                        <div className="flex flex-col items-center">
                          <span className={`text-xs font-medium ${statusIndicator.color}`}>
                            {statusIndicator.text}
                          </span>
                          {!isFutureDate && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => saveEntryForDate(currentDate)}
                              className="mt-2 text-xs h-6 px-2 bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Save Entry
                            </Button>
                          )}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>

      {/* Save Month Button */}
      <div className="flex justify-end pt-4">
        <Button 
          onClick={saveEntireMonth} 
          className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded shadow-lg transition-colors flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>Save Entire Month</span>
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
