import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Save, Check, Clock, AlertCircle, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, isFuture, isToday, differenceInDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import DailyTrackerForm from "./DailyTrackerForm";
import QuickTaskForm from "./QuickTaskForm";
import { getCurrentUser } from "@/lib/auth";
import { getTimeEntryStatusForDate, getUserAssociatedProjects, getUserAssociatedProducts, getUserAssociatedDepartments, saveTimeEntry, generateId, getTimeEntries } from "@/services/storage";
import { Project, Product, Department, TimeEntry, ProjectDetail } from "@/validation/index";

interface WeeklyHours {
  billable: number;
  actual: number;
}

interface ProjectWeekData {
  [projectId: string]: {
    [dayKey: string]: WeeklyHours;
  };
}

interface ProductWeekData {
  [productId: string]: {
    [dayKey: string]: WeeklyHours;
  };
}

interface DepartmentWeekData {
  [departmentId: string]: {
    [dayKey: string]: WeeklyHours;
  };
}

interface DailyAvailableHours {
  [dayKey: string]: number;
}

// Add description interface
interface DailyDescription {
  [dayKey: string]: string;
}

// Monthly view interfaces
interface DailyProjectData {
  task: string;
  availableHours: number;
  actualHours: number;
  billableHours: number;
}

interface DailyProductData {
  task: string;
  availableHours: number;
  actualHours: number;
  billableHours: number;
}

interface DailyDepartmentData {
  task: string;
  availableHours: number;
  actualHours: number;
  billableHours: number;
}

interface MonthlyData {
  [dateKey: string]: {
    [id: string]: DailyProjectData | DailyProductData | DailyDepartmentData;
  };
}

interface SelectedProjects {
  [dateKey: string]: string[]; // array of projectIds
}

interface SelectedProducts {
  [dateKey: string]: string[]; // array of productIds
}

interface SelectedDepartments {
  [dateKey: string]: string[]; // array of departmentIds
}

export default function WeeklyTimeTracker() {
  const currentUser = getCurrentUser();
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isQuickTaskDialogOpen, setIsQuickTaskDialogOpen] = useState(false);
  const [selectedDateForEntry, setSelectedDateForEntry] = useState<Date | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | Product | Department | null>(null);
  const [selectedDateForQuickTask, setSelectedDateForQuickTask] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [weeklyData, setWeeklyData] = useState<ProjectWeekData>({});
  const [productWeeklyData, setProductWeeklyData] = useState<ProductWeekData>({});
  const [departmentWeeklyData, setDepartmentWeeklyData] = useState<DepartmentWeekData>({});
  const [dailyAvailableHours, setDailyAvailableHours] = useState<DailyAvailableHours>({});
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({});
  const [selectedProjects, setSelectedProjects] = useState<SelectedProjects>({});
  const [selectedProducts, setSelectedProducts] = useState<SelectedProducts>({});
  const [selectedDepartments, setSelectedDepartments] = useState<SelectedDepartments>({});
  // Add description state
  const [dailyDescriptions, setDailyDescriptions] = useState<DailyDescription>({});

  // Determine the view mode based on the selected date range
  const getViewMode = () => {
    if (dateRange?.from && dateRange?.to) {
      const dayDifference = differenceInDays(dateRange.to, dateRange.from);
      if (dayDifference > 7) return 'monthly';
      if (dayDifference === 0) return 'daily';
      return 'weekly';
    }
    return 'weekly'; // Default to weekly view
  };

  // Load user projects, products, and departments only once
  useEffect(() => {
    if (currentUser) {
      const userProjects = getUserAssociatedProjects(currentUser.id);
      const userProducts = getUserAssociatedProducts(currentUser.id);
      const userDepartments = getUserAssociatedDepartments(currentUser.id);
      setProjects(userProjects);
      setProducts(userProducts);
      setDepartments(userDepartments);
    }
  }, [currentUser]);

  // Load existing time entries for the current week
  const loadExistingEntries = useCallback(() => {
    if (!currentUser) return;
    
    const allEntries = getTimeEntries();
    const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
    
    const newWeeklyData: ProjectWeekData = {};
    const newProductWeeklyData: ProductWeekData = {};
    const newDepartmentWeeklyData: DepartmentWeekData = {};
    const newDailyDescriptions: DailyDescription = {};
    
    // Initialize with existing data to preserve any unsaved changes
    Object.assign(newWeeklyData, weeklyData);
    Object.assign(newProductWeeklyData, productWeeklyData);
    Object.assign(newDepartmentWeeklyData, departmentWeeklyData);
    
    allEntries.forEach(entry => {
      const entryDate = new Date(entry.date);
      if (entryDate >= weekStart && entryDate <= weekEnd && entry.userId === currentUser.id) {
        const dayKey = format(entryDate, 'yyyy-MM-dd');
        
        // Load hours data based on category
        if (entry.projectDetails?.category === 'project') {
          const projectId = projects.find(p => p.name === entry.projectDetails.name)?.id;
          if (projectId) {
            if (!newWeeklyData[projectId]) {
              newWeeklyData[projectId] = {};
            }
            newWeeklyData[projectId][dayKey] = {
              billable: entry.billableHours,
              actual: entry.actualHours
            };
          }
        } else if (entry.projectDetails?.category === 'product') {
          const productId = products.find(p => p.name === entry.projectDetails.name)?.id;
          if (productId) {
            if (!newProductWeeklyData[productId]) {
              newProductWeeklyData[productId] = {};
            }
            newProductWeeklyData[productId][dayKey] = {
              billable: entry.billableHours,
              actual: entry.actualHours
            };
          }
        } else if (entry.projectDetails?.category === 'department') {
          const departmentId = departments.find(d => d.name === entry.projectDetails.name)?.id;
          if (departmentId) {
            if (!newDepartmentWeeklyData[departmentId]) {
              newDepartmentWeeklyData[departmentId] = {};
            }
            newDepartmentWeeklyData[departmentId][dayKey] = {
              billable: entry.billableHours,
              actual: entry.actualHours
            };
          }
        }
        
        // Load description data
        if (entry.projectDetails?.description && entry.projectDetails.description !== `Weekly time entry for ${entry.projectDetails?.name || 'Unknown'}`) {
          newDailyDescriptions[dayKey] = entry.projectDetails.description;
        }
      }
    });
    
    setWeeklyData(newWeeklyData);
    setProductWeeklyData(newProductWeeklyData);
    setDepartmentWeeklyData(newDepartmentWeeklyData);
    setDailyDescriptions(newDailyDescriptions);
  }, [currentUser, selectedWeek, projects, products, departments, weeklyData, productWeeklyData, departmentWeeklyData]);

  // Load existing entries when week changes or projects/products/departments are loaded
  useEffect(() => {
    if (projects.length > 0 && products.length > 0 && departments.length > 0) {
      loadExistingEntries();
    }
  }, [projects, products, departments, selectedWeek, loadExistingEntries]);

  // Initialize weekly data when projects/products/departments or week changes, but preserve existing data
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

    if (products.length > 0) {
      setProductWeeklyData(prevData => {
        const newData: ProductWeekData = { ...prevData };
        
        products.forEach(product => {
          if (!newData[product.id]) {
            newData[product.id] = {};
          }
          
          for (let i = 0; i < 7; i++) {
            const dayKey = format(addDays(startOfWeek(selectedWeek, { weekStartsOn: 1 }), i), 'yyyy-MM-dd');
            if (!newData[product.id][dayKey]) {
              newData[product.id][dayKey] = {
                billable: 0,
                actual: 0
              };
            }
          }
        });
        
        return newData;
      });
    }

    if (departments.length > 0) {
      setDepartmentWeeklyData(prevData => {
        const newData: DepartmentWeekData = { ...prevData };
        
        departments.forEach(department => {
          if (!newData[department.id]) {
            newData[department.id] = {};
          }
          
          for (let i = 0; i < 7; i++) {
            const dayKey = format(addDays(startOfWeek(selectedWeek, { weekStartsOn: 1 }), i), 'yyyy-MM-dd');
            if (!newData[department.id][dayKey]) {
              newData[department.id][dayKey] = {
                billable: 0,
                actual: 0
              };
            }
          }
        });
        
        return newData;
      });
    }
  }, [projects, products, departments, selectedWeek]);

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

  const updateProductHours = (productId: string, dayKey: string, type: 'billable' | 'actual', value: number) => {
    setProductWeeklyData(prev => {
      // Ensure the product exists in the data
      if (!prev[productId]) {
        prev[productId] = {};
      }
      
      // Ensure the day exists for this product
      if (!prev[productId][dayKey]) {
        prev[productId][dayKey] = { billable: 0, actual: 0 };
      }
      
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          [dayKey]: {
            ...prev[productId][dayKey],
            [type]: value
          }
        }
      };
    });
  };

  const updateDepartmentHours = (departmentId: string, dayKey: string, type: 'billable' | 'actual', value: number) => {
    setDepartmentWeeklyData(prev => {
      // Ensure the department exists in the data
      if (!prev[departmentId]) {
        prev[departmentId] = {};
      }
      
      // Ensure the day exists for this department
      if (!prev[departmentId][dayKey]) {
        prev[departmentId][dayKey] = { billable: 0, actual: 0 };
      }
      
      return {
        ...prev,
        [departmentId]: {
          ...prev[departmentId],
          [dayKey]: {
            ...prev[departmentId][dayKey],
            [type]: value
          }
        }
      };
    });
  };

  // Add function to handle date selection for descriptions
  const handleDateSelection = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    
    if (selectedDates.length === 0) {
      // First date selected
      setSelectedDates([date]);
    } else if (selectedDates.length === 1) {
      // Second date selected - set as range
      const firstDate = selectedDates[0];
      if (date.getTime() === firstDate.getTime()) {
        // Same date clicked - deselect
        setSelectedDates([]);
      } else {
        // Different date - set as range
        setSelectedDates([firstDate, date].sort((a, b) => a.getTime() - b.getTime()));
      }
    } else {
      // Third date selected - reset to new first date
      setSelectedDates([date]);
    }
  };

  // Add function to update description
  const updateDescription = (dayKey: string, description: string) => {
    setDailyDescriptions(prev => ({
      ...prev,
      [dayKey]: description
    }));
  };

  // Check if a date is selected
  const isDateSelected = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return selectedDates.some(d => format(d, 'yyyy-MM-dd') === dateKey);
  };

  // Check if a date is in the selected range
  const isDateInRange = (date: Date) => {
    if (selectedDates.length !== 2) return false;
    const dateKey = format(date, 'yyyy-MM-dd');
    const startKey = format(selectedDates[0], 'yyyy-MM-dd');
    const endKey = format(selectedDates[1], 'yyyy-MM-dd');
    return dateKey >= startKey && dateKey <= endKey;
  };

  const saveWeeklyData = () => {
    if (!currentUser) return;
    
    // Collect all days that have entries to save, organized by day and entry type
    const daysToSave = new Map<string, Set<string>>(); // dayKey -> Set of entry types to save
    
    // Check project entries
    Object.entries(weeklyData).forEach(([projectId, projectData]) => {
      Object.entries(projectData).forEach(([dayKey, hours]) => {
        if (hours.actual > 0 || hours.billable > 0) {
          if (!daysToSave.has(dayKey)) {
            daysToSave.set(dayKey, new Set());
          }
          daysToSave.get(dayKey)!.add('project');
        }
      });
    });
    
    // Check product entries
    Object.entries(productWeeklyData).forEach(([productId, productData]) => {
      Object.entries(productData).forEach(([dayKey, hours]) => {
        if (hours.actual > 0 || hours.billable > 0) {
          if (!daysToSave.has(dayKey)) {
            daysToSave.set(dayKey, new Set());
          }
          daysToSave.get(dayKey)!.add('product');
        }
      });
    });
    
    // Check department entries
    Object.entries(departmentWeeklyData).forEach(([departmentId, departmentData]) => {
      Object.entries(departmentData).forEach(([dayKey, hours]) => {
        if (hours.actual > 0 || hours.billable > 0) {
          if (!daysToSave.has(dayKey)) {
            daysToSave.set(dayKey, new Set());
          }
          daysToSave.get(dayKey)!.add('department');
        }
      });
    });
    
    if (daysToSave.size === 0) {
      alert('No entries to save. Please enter hours for at least one project, product, or department.');
      return;
    }
    
    // Check for existing entries and collect days that need confirmation
    const daysWithExistingEntries: string[] = [];
    const allEntries = getTimeEntries();
    
    daysToSave.forEach((entryTypes, dayKey) => {
      const existingEntries = allEntries.filter(entry => 
        entry.date === dayKey && entry.userId === currentUser.id
      );
      if (existingEntries.length > 0) {
        daysWithExistingEntries.push(dayKey);
      }
    });
    
    // If there are existing entries, ask for confirmation with more granular options
    if (daysWithExistingEntries.length > 0) {
      const dayList = daysWithExistingEntries.map(day => format(new Date(day), 'MMM dd, yyyy')).join(', ');
      const confirmMessage = `Entries already exist for the following days: ${dayList}\n\nDo you want to overwrite all entries for these days, or save only the new entries without overwriting existing ones?\n\nClick 'OK' to overwrite all entries, or 'Cancel' to save only new entries.`;
      
      const shouldOverwrite = confirm(confirmMessage);
      
      if (!shouldOverwrite) {
        // User chose to save only new entries - remove days with existing entries
        daysWithExistingEntries.forEach(dayKey => {
          daysToSave.delete(dayKey);
        });
      }
    }
    
    // Save project entries
    Object.entries(weeklyData).forEach(([projectId, projectData]) => {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;
      
      Object.entries(projectData).forEach(([dayKey, hours]) => {
        if ((hours.actual > 0 || hours.billable > 0) && daysToSave.has(dayKey) && daysToSave.get(dayKey)!.has('project')) {
          const timeEntry: TimeEntry = {
            id: generateId(),
            userId: currentUser.id,
            userName: currentUser.name,
            date: dayKey,
            actualHours: hours.actual,
            billableHours: hours.billable,
            totalHours: hours.actual + hours.billable,
            availableHours: dailyAvailableHours[dayKey] || 0,
            task: dailyDescriptions[dayKey] || `Weekly entry for ${project.name}`,
            projectDetails: {
              category: 'project',
              name: project.name,
              level: '',
              task: '',
              subtask: '',
              description: dailyDescriptions[dayKey] || `Weekly time entry for ${project.name}`
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

    // Save product entries
    Object.entries(productWeeklyData).forEach(([productId, productData]) => {
      const product = products.find(p => p.id === productId);
      if (!product) return;
      
      Object.entries(productData).forEach(([dayKey, hours]) => {
        if ((hours.actual > 0 || hours.billable > 0) && daysToSave.has(dayKey) && daysToSave.get(dayKey)!.has('product')) {
          const timeEntry: TimeEntry = {
            id: generateId(),
            userId: currentUser.id,
            userName: currentUser.name,
            date: dayKey,
            actualHours: hours.actual,
            billableHours: hours.billable,
            totalHours: hours.actual + hours.billable,
            availableHours: dailyAvailableHours[dayKey] || 0,
            task: dailyDescriptions[dayKey] || `Weekly entry for ${product.name}`,
            projectDetails: {
              category: 'product',
              name: product.name,
              stage: '',
              task: '',
              subtask: '',
              description: dailyDescriptions[dayKey] || `Weekly time entry for ${product.name}`
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

    // Save department entries
    Object.entries(departmentWeeklyData).forEach(([departmentId, departmentData]) => {
      const department = departments.find(d => d.id === departmentId);
      if (!department) return;
      
      Object.entries(departmentData).forEach(([dayKey, hours]) => {
        if ((hours.actual > 0 || hours.billable > 0) && daysToSave.has(dayKey) && daysToSave.get(dayKey)!.has('department')) {
          const timeEntry: TimeEntry = {
            id: generateId(),
            userId: currentUser.id,
            userName: currentUser.name,
            date: dayKey,
            actualHours: hours.actual,
            billableHours: hours.billable,
            totalHours: hours.actual + hours.billable,
            availableHours: dailyAvailableHours[dayKey] || 0,
            task: dailyDescriptions[dayKey] || `Weekly entry for ${department.name}`,
            projectDetails: {
              category: 'department',
              name: department.name,
              function: '',
              task: '',
              subtask: '',
              description: dailyDescriptions[dayKey] || `Weekly time entry for ${department.name}`
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
    
    const savedDaysCount = daysToSave.size;
    const skippedDaysCount = daysWithExistingEntries.length - savedDaysCount;
    
    let message = `Weekly time entries saved successfully!`;
    if (skippedDaysCount > 0) {
      message += `\n${skippedDaysCount} days were skipped due to existing entries.`;
    }
    
    alert(message);
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

  // Determine the current view mode
  const currentViewMode = getViewMode();

  // Get dates for monthly view based on selected date range
  const getMonthlyDates = useCallback(() => {
    if (!dateRange?.from || !dateRange?.to) return [];
    const dates = [];
    const currentDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);
    
    while (currentDate <= endDate) {
      if (!isFuture(currentDate) || isToday(currentDate)) {
        dates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  }, [dateRange]);

  // Initialize monthly data for selected date range
  useEffect(() => {
    if (currentViewMode === 'monthly' && (projects.length > 0 || products.length > 0 || departments.length > 0)) {
      const monthlyDates = getMonthlyDates();
      setMonthlyData((prevData) => {
        const updatedData = { ...prevData };

        monthlyDates.forEach((date) => {
          const dateKey = format(date, 'yyyy-MM-dd');
          if (!updatedData[dateKey]) {
            updatedData[dateKey] = {};
          }

          // Initialize projects
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

          // Initialize products
          products.forEach((product) => {
            if (!updatedData[dateKey][product.id]) {
              updatedData[dateKey][product.id] = {
                task: '',
                availableHours: 0,
                actualHours: 0,
                billableHours: 0,
              };
            }
          });

          // Initialize departments
          departments.forEach((department) => {
            if (!updatedData[dateKey][department.id]) {
              updatedData[dateKey][department.id] = {
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
    }
  }, [currentViewMode, projects, products, departments, dateRange, getMonthlyDates]);

  // Monthly view helper functions
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
            Math.min(Number(value), prevData[dateKey][projectId]?.availableHours || 0) :
            field === 'availableHours' ?
            Math.min(prevData[dateKey][projectId]?.actualHours || 0, Number(value)) :
            prevData[dateKey][projectId]?.billableHours || 0
        }
      }
    }));
  };

  const updateProductData = (dateKey: string, productId: string, field: keyof DailyProductData, value: string | number) => {
    setMonthlyData(prevData => ({
      ...prevData,
      [dateKey]: {
        ...prevData[dateKey],
        [productId]: {
          ...prevData[dateKey][productId],
          [field]: value,
          // Auto-calculate billable hours when actual hours or available hours change
          billableHours: field === 'actualHours' ? 
            Math.min(Number(value), prevData[dateKey][productId]?.availableHours || 0) :
            field === 'availableHours' ?
            Math.min(prevData[dateKey][productId]?.actualHours || 0, Number(value)) :
            prevData[dateKey][productId]?.billableHours || 0
        }
      }
    }));
  };

  const updateDepartmentData = (dateKey: string, departmentId: string, field: keyof DailyDepartmentData, value: string | number) => {
    setMonthlyData(prevData => ({
      ...prevData,
      [dateKey]: {
        ...prevData[dateKey],
        [departmentId]: {
          ...prevData[dateKey][departmentId],
          [field]: value,
          // Auto-calculate billable hours when actual hours or available hours change
          billableHours: field === 'actualHours' ? 
            Math.min(Number(value), prevData[dateKey][departmentId]?.availableHours || 0) :
            field === 'availableHours' ?
            Math.min(prevData[dateKey][departmentId]?.actualHours || 0, Number(value)) :
            prevData[dateKey][departmentId]?.billableHours || 0
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

  const addProductToDate = (dateKey: string, productId: string) => {
    setSelectedProducts(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), productId]
    }));
  };

  const removeProductFromDate = (dateKey: string, productId: string) => {
    setSelectedProducts(prev => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).filter(id => id !== productId)
    }));
  };

  const addDepartmentToDate = (dateKey: string, departmentId: string) => {
    setSelectedDepartments(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), departmentId]
    }));
  };

  const removeDepartmentFromDate = (dateKey: string, departmentId: string) => {
    setSelectedDepartments(prev => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).filter(id => id !== departmentId)
    }));
  };

  // Save entry for a specific date in monthly view
  const saveEntryForDate = (date: Date) => {
    if (!currentUser) return;
    
    const dateKey = format(date, 'yyyy-MM-dd');
    let savedEntries = 0;
    
    // Save project entries that have data
    projects.forEach(project => {
      const projectData = monthlyData[dateKey]?.[project.id];
      if (projectData && (projectData.actualHours > 0 || projectData.billableHours > 0 || projectData.task.trim())) {
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

    // Save product entries that have data
    products.forEach(product => {
      const productData = monthlyData[dateKey]?.[product.id];
      if (productData && (productData.actualHours > 0 || productData.billableHours > 0 || productData.task.trim())) {
        const timeEntry: TimeEntry = {
          id: generateId(),
          userId: currentUser.id,
          userName: currentUser.name,
          date: dateKey,
          actualHours: productData.actualHours,
          billableHours: productData.billableHours,
          totalHours: productData.actualHours + productData.billableHours,
          availableHours: productData.availableHours,
          task: productData.task || `Entry for ${product.name}`,
          projectDetails: {
            category: 'product',
            name: product.name,
            stage: '',
            task: productData.task || '',
            subtask: '',
            description: productData.task || `Monthly time entry for ${product.name}`
          } as ProjectDetail,
          isBillable: product.isBillable && productData.billableHours > 0,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        saveTimeEntry(timeEntry);
        savedEntries++;
      }
    });

    // Save department entries that have data
    departments.forEach(department => {
      const departmentData = monthlyData[dateKey]?.[department.id];
      if (departmentData && (departmentData.actualHours > 0 || departmentData.billableHours > 0 || departmentData.task.trim())) {
        const timeEntry: TimeEntry = {
          id: generateId(),
          userId: currentUser.id,
          userName: currentUser.name,
          date: dateKey,
          actualHours: departmentData.actualHours,
          billableHours: departmentData.billableHours,
          totalHours: departmentData.actualHours + departmentData.billableHours,
          availableHours: departmentData.availableHours,
          task: departmentData.task || `Entry for ${department.name}`,
          projectDetails: {
            category: 'department',
            name: department.name,
            function: '',
            task: departmentData.task || '',
            subtask: '',
            description: departmentData.task || `Monthly time entry for ${department.name}`
          } as ProjectDetail,
          isBillable: department.isBillable && departmentData.billableHours > 0,
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
      alert('No entries to save. Please enter hours or task description for at least one project, product, or department.');
    }
  };

  // Save entries for entire selected range
  const saveEntireRange = () => {
    if (!currentUser) return;
    
    let totalSavedEntries = 0;
    const monthlyDates = getMonthlyDates();
    
    monthlyDates.forEach(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const selectedProjectIds = selectedProjects[dateKey] || [];
      const selectedProductIds = selectedProducts[dateKey] || [];
      const selectedDepartmentIds = selectedDepartments[dateKey] || [];
      
      // Save project entries
      // Save project entries that have data
      projects.forEach(project => {
        const projectData = monthlyData[dateKey]?.[project.id];
        if (projectData && (projectData.actualHours > 0 || projectData.billableHours > 0 || projectData.task.trim())) {
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

      // Save product entries that have data
      products.forEach(product => {
        const productData = monthlyData[dateKey]?.[product.id];
        if (productData && (productData.actualHours > 0 || productData.billableHours > 0 || productData.task.trim())) {
          const timeEntry: TimeEntry = {
            id: generateId(),
            userId: currentUser.id,
            userName: currentUser.name,
            date: dateKey,
            actualHours: productData.actualHours,
            billableHours: productData.billableHours,
            totalHours: productData.actualHours + productData.billableHours,
            availableHours: productData.availableHours,
            task: productData.task || `Entry for ${product.name}`,
            projectDetails: {
              category: 'product',
              name: product.name,
              stage: '',
              task: productData.task || '',
              subtask: '',
              description: productData.task || `Monthly time entry for ${product.name}`
            } as ProjectDetail,
            isBillable: product.isBillable && productData.billableHours > 0,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          saveTimeEntry(timeEntry);
          totalSavedEntries++;
        }
      });

      // Save department entries that have data
      departments.forEach(department => {
        const departmentData = monthlyData[dateKey]?.[department.id];
        if (departmentData && (departmentData.actualHours > 0 || departmentData.billableHours > 0 || departmentData.task.trim())) {
          const timeEntry: TimeEntry = {
            id: generateId(),
            userId: currentUser.id,
            userName: currentUser.name,
            date: dateKey,
            actualHours: departmentData.actualHours,
            billableHours: departmentData.billableHours,
            totalHours: departmentData.actualHours + departmentData.billableHours,
            availableHours: departmentData.availableHours,
            task: departmentData.task || `Entry for ${department.name}`,
            projectDetails: {
              category: 'department',
              name: department.name,
              function: '',
              task: departmentData.task || '',
              subtask: '',
              description: departmentData.task || `Monthly time entry for ${department.name}`
            } as ProjectDetail,
            isBillable: department.isBillable && departmentData.billableHours > 0,
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
      const rangeText = `${format(dateRange?.from || new Date(), 'MMM dd')} - ${format(dateRange?.to || new Date(), 'MMM dd, yyyy')}`;
      alert(`Successfully saved ${totalSavedEntries} time entries for ${rangeText}!`);
      setRefreshKey(prev => prev + 1);
    } else {
      alert('No entries to save. Please enter hours for at least one project, product, or department.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Task Form */}
      {selectedProject && selectedDateForQuickTask && (
        <QuickTaskForm 
          isOpen={isQuickTaskDialogOpen}
          onClose={() => {
            setIsQuickTaskDialogOpen(false);
            setSelectedProject(null);
            setSelectedDateForQuickTask(null);
          }}
          project={selectedProject}
          selectedDate={selectedDateForQuickTask}
          onSuccess={(taskDescription: string) => {
            const dayKey = format(selectedDateForQuickTask, 'yyyy-MM-dd');
            setDailyDescriptions(prev => ({
              ...prev,
              [dayKey]: taskDescription
            }));
            setRefreshKey(prev => prev + 1);
          }}
        />
      )}

      {/* Date Range Picker */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Label className="text-sm font-medium">Date Filter:</Label>
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                placeholder="Select date range or leave empty for current week"
                className="w-80"
              />
            </div>
            <Badge variant="outline" className="px-3 py-1">
              {currentViewMode === 'daily' && 'Daily View'}
              {currentViewMode === 'weekly' && 'Weekly View'}
              {currentViewMode === 'monthly' && 'Monthly View'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Show default weekly navigation when no date range is selected */}
      {!dateRange?.from && (
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
      )}

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

      {/* Conditional rendering based on view mode */}
      {currentViewMode === 'weekly' && (
        /* Weekly View - Grid for Projects and Days */
        <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Projects/Products/Departments</th>
                {weekDays.map(day => {
                  const statusIndicator = getStatusIndicator(day);
                  return (
                    <th 
                      key={day.toString()} 
                      className={`py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${(isDateSelected(day) || isDateInRange(day)) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                      onClick={() => handleDateSelection(day)}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <div className="flex items-center justify-center space-x-2">
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
                        {/* B/A Labels Row */}
                        <div className="flex justify-around items-center gap-1 text-xs">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="w-16 h-6 flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded cursor-help font-medium">
                                B
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Billable Hours</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="w-16 h-6 flex items-center justify-center bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded cursor-help font-medium">
                                A
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Actual Hours</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {/* Projects Section */}
              {projects.map(project => (
                <tr key={`project-${project.id}`} className="odd:bg-white dark:odd:bg-gray-900 even:bg-gray-50 dark:even:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <td className="py-3 px-4 border border-gray-200 dark:border-gray-700 font-medium text-left text-gray-900 dark:text-gray-100">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">Project</span>
                            <span className="font-semibold">{project.name}</span>
                          </div>
                          {project.department && (
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              Department: {project.department}
                            </span>
                          )}
                          {project.associatedProducts && project.associatedProducts.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {project.associatedProducts.map((product, index) => (
                                <span key={index} className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                                  {product}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  </td>
                  {weekDays.map(day => {
                    const dayKey = format(day, 'yyyy-MM-dd');
                    const hours = weeklyData[project.id]?.[dayKey] || { billable: 0, actual: 0 };
                    const isFutureDay = day.getTime() > new Date().getTime();
                    const isSelected = isDateSelected(day);
                    const isInRange = isDateInRange(day);
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProject(project);
                              setSelectedDateForQuickTask(day);
                              setIsQuickTaskDialogOpen(true);
                            }}
                            className="h-6 w-6 p-0"
                            title="Quick add task"
                            disabled={isFutureDay}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        {/* Description row for selected dates */}
                        {(isSelected || isInRange) && (
                          <div className="mt-2">
                            <Textarea
                              value={dailyDescriptions[dayKey] || ''}
                              onChange={(e) => updateDescription(dayKey, e.target.value)}
                              placeholder="Add description..."
                              className="w-full text-xs h-16 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                              disabled={isFutureDay}
                            />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Products Section */}
              {products.map(product => (
                <tr key={`product-${product.id}`} className="odd:bg-white dark:odd:bg-gray-900 even:bg-gray-50 dark:even:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <td className="py-3 px-4 border border-gray-200 dark:border-gray-700 font-medium text-left text-gray-900 dark:text-gray-100">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">Product</span>
                            <span className="font-semibold">{product.name}</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  </td>
                  {weekDays.map(day => {
                    const dayKey = format(day, 'yyyy-MM-dd');
                    const hours = productWeeklyData[product.id]?.[dayKey] || { billable: 0, actual: 0 };
                    const isFutureDay = day.getTime() > new Date().getTime();
                    const isSelected = isDateSelected(day);
                    const isInRange = isDateInRange(day);
                    return (
                      <td key={dayKey} className="py-2 px-2 border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-around items-center gap-1">
                          <Input 
                            type="number" step="0.5" min="0" max="24"
                            value={hours.billable === 0 ? '' : hours.billable.toString()}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              const value = inputValue === '' ? 0 : (isNaN(parseFloat(inputValue)) ? 0 : parseFloat(inputValue));
                              updateProductHours(product.id, dayKey, 'billable', value);
                            }}
                            className="w-16 text-xs h-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&[type=number]]:[-moz-appearance:textfield]"
                            disabled={!product.isBillable || isFutureDay}
                            placeholder="0"
                          />
                          <Input 
                            type="number" step="0.5" min="0" max="24"
                            value={hours.actual === 0 ? '' : hours.actual.toString()}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              const value = inputValue === '' ? 0 : (isNaN(parseFloat(inputValue)) ? 0 : parseFloat(inputValue));
                              updateProductHours(product.id, dayKey, 'actual', value);
                            }}
                            className="w-16 text-xs h-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&[type=number]]:[-moz-appearance:textfield]"
                            disabled={isFutureDay}
                            placeholder="0"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProject(product);
                              setSelectedDateForQuickTask(day);
                              setIsQuickTaskDialogOpen(true);
                            }}
                            className="h-6 w-6 p-0"
                            title="Quick add task"
                            disabled={isFutureDay}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        {/* Description row for selected dates */}
                        {(isSelected || isInRange) && (
                          <div className="mt-2">
                            <Textarea
                              value={dailyDescriptions[dayKey] || ''}
                              onChange={(e) => updateDescription(dayKey, e.target.value)}
                              placeholder="Add description..."
                              className="w-full text-xs h-16 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                              disabled={isFutureDay}
                            />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Departments Section */}
              {departments.map(department => (
                <tr key={`department-${department.id}`} className="odd:bg-white dark:odd:bg-gray-900 even:bg-gray-50 dark:even:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <td className="py-3 px-4 border border-gray-200 dark:border-gray-700 font-medium text-left text-gray-900 dark:text-gray-100">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">Department</span>
                            <span className="font-semibold">{department.name}</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  </td>
                  {weekDays.map(day => {
                    const dayKey = format(day, 'yyyy-MM-dd');
                    const hours = departmentWeeklyData[department.id]?.[dayKey] || { billable: 0, actual: 0 };
                    const isFutureDay = day.getTime() > new Date().getTime();
                    const isSelected = isDateSelected(day);
                    const isInRange = isDateInRange(day);
                    return (
                      <td key={dayKey} className="py-2 px-2 border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-around items-center gap-1">
                          <Input 
                            type="number" step="0.5" min="0" max="24"
                            value={hours.billable === 0 ? '' : hours.billable.toString()}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              const value = inputValue === '' ? 0 : (isNaN(parseFloat(inputValue)) ? 0 : parseFloat(inputValue));
                              updateDepartmentHours(department.id, dayKey, 'billable', value);
                            }}
                            className="w-16 text-xs h-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&[type=number]]:[-moz-appearance:textfield]"
                            disabled={!department.isBillable || isFutureDay}
                            placeholder="0"
                          />
                          <Input 
                            type="number" step="0.5" min="0" max="24"
                            value={hours.actual === 0 ? '' : hours.actual.toString()}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              const value = inputValue === '' ? 0 : (isNaN(parseFloat(inputValue)) ? 0 : parseFloat(inputValue));
                              updateDepartmentHours(department.id, dayKey, 'actual', value);
                            }}
                            className="w-16 text-xs h-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&[type=number]]:[-moz-appearance:textfield]"
                            disabled={isFutureDay}
                            placeholder="0"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProject(department);
                              setSelectedDateForQuickTask(day);
                              setIsQuickTaskDialogOpen(true);
                            }}
                            className="h-6 w-6 p-0"
                            title="Quick add task"
                            disabled={isFutureDay}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        {/* Description row for selected dates */}
                        {(isSelected || isInRange) && (
                          <div className="mt-2">
                            <Textarea
                              value={dailyDescriptions[dayKey] || ''}
                              onChange={(e) => updateDescription(dayKey, e.target.value)}
                              placeholder="Add description..."
                              className="w-full text-xs h-16 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                              disabled={isFutureDay}
                            />
                          </div>
                        )}
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
      )}

      {/* Monthly View */}
      {currentViewMode === 'monthly' && (
        <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-center border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Date</th>
                <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Entry Details</th>
                <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Task</th>
                <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Available Hours</th>
                <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Actual Hours</th>
                <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Billable Hours</th>
                <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {getMonthlyDates().flatMap(currentDate => {
                const formattedDate = format(currentDate, 'dd/MM/yyyy');
                const day = format(currentDate, "EEEE");
                const currentUser = getCurrentUser();
                const statusData = currentUser ? getTimeEntryStatusForDate(format(currentDate, 'yyyy-MM-dd'), currentUser.id) : null;
                const isFutureDate = isFuture(currentDate) && !isToday(currentDate);
                const dateKey = format(currentDate, 'yyyy-MM-dd');

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

                // Create all entries for this date
                const allEntries = [];

                // Add all projects
                projects.forEach((project, index) => {
                  const projectData = monthlyData[dateKey]?.[project.id] || {
                    task: '',
                    availableHours: 0,
                    actualHours: 0,
                    billableHours: 0
                  };

                  allEntries.push({
                    type: 'project',
                    id: project.id,
                    data: project,
                    entryData: projectData,
                    index
                  });
                });

                // Add all products
                products.forEach((product, index) => {
                  const productData = monthlyData[dateKey]?.[product.id] || {
                    task: '',
                    availableHours: 0,
                    actualHours: 0,
                    billableHours: 0
                  };

                  allEntries.push({
                    type: 'product',
                    id: product.id,
                    data: product,
                    entryData: productData,
                    index
                  });
                });

                // Add all departments
                departments.forEach((department, index) => {
                  const departmentData = monthlyData[dateKey]?.[department.id] || {
                    task: '',
                    availableHours: 0,
                    actualHours: 0,
                    billableHours: 0
                  };

                  allEntries.push({
                    type: 'department',
                    id: department.id,
                    data: department,
                    entryData: departmentData,
                    index
                  });
                });

                // If no entries exist, show a message
                if (allEntries.length === 0) {
                  return [
                    <tr key={currentDate.toString()} className={`odd:bg-white dark:odd:bg-gray-900 even:bg-gray-50 dark:even:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 ${isFutureDate ? 'opacity-50' : ''}`}>
                      <td className="py-3 px-4 border border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-gray-100">
                        <div className="flex flex-col items-center">
                          <span className="text-sm">{day}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">No projects, products, or departments available</span>
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

                // Show rows for each entry
                return allEntries.map((entry, entryIndex) => {
                  const { type, id, data, entryData } = entry;
                  const isFirstEntry = entryIndex === 0;

                  return (
                    <tr key={`${dateKey}-${type}-${id}`} className={`odd:bg-white dark:odd:bg-gray-900 even:bg-gray-50 dark:even:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 ${isFutureDate ? 'opacity-50' : ''}`}>
                      <td className="py-3 px-4 border border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-gray-100">
                        {isFirstEntry ? (
                          <div className="flex flex-col items-center">
                            <span className="text-sm">{day}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</span>
                          </div>
                        ) : null}
                      </td>
                      <td className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-sm">
                        <span className={`text-xs px-2 py-1 rounded ${
                          type === 'project' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                          type === 'product' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                          'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                        }`}>
                          {type === 'project' ? 'Project' : type === 'product' ? 'Product' : 'Department'}: {data.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 border border-gray-200 dark:border-gray-700">
                        <Input
                          type="text"
                          value={entryData.task}
                          onChange={(e) => {
                            if (type === 'project') updateProjectData(dateKey, id, 'task', e.target.value);
                            else if (type === 'product') updateProductData(dateKey, id, 'task', e.target.value);
                            else updateDepartmentData(dateKey, id, 'task', e.target.value);
                          }}
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
                          value={entryData.availableHours || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            if (type === 'project') updateProjectData(dateKey, id, 'availableHours', value);
                            else if (type === 'product') updateProductData(dateKey, id, 'availableHours', value);
                            else updateDepartmentData(dateKey, id, 'availableHours', value);
                          }}
                          placeholder="0"
                          disabled={isFutureDate}
                          className="w-20 text-xs h-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 [ &::-webkit-outer-spin-button]:appearance-none [ &::-webkit-inner-spin-button]:appearance-none [ &[type=number]]:[-moz-appearance:textfield]"
                        />
                      </td>
                      <td className="py-3 px-4 border border-gray-200 dark:border-gray-700">
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          value={entryData.actualHours || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            if (type === 'project') updateProjectData(dateKey, id, 'actualHours', value);
                            else if (type === 'product') updateProductData(dateKey, id, 'actualHours', value);
                            else updateDepartmentData(dateKey, id, 'actualHours', value);
                          }}
                          placeholder="0"
                          disabled={isFutureDate}
                          className="w-20 text-xs h-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 [ &::-webkit-outer-spin-button]:appearance-none [ &::-webkit-inner-spin-button]:appearance-none [ &[type=number]]:[-moz-appearance:textfield]"
                        />
                      </td>
                      <td className="py-3 px-4 border border-gray-200 dark:border-gray-700">
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          value={entryData.billableHours || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            if (type === 'project') updateProjectData(dateKey, id, 'billableHours', value);
                            else if (type === 'product') updateProductData(dateKey, id, 'billableHours', value);
                            else updateDepartmentData(dateKey, id, 'billableHours', value);
                          }}
                          placeholder="0"
                          disabled={!data.isBillable || isFutureDate}
                          className={`w-20 text-xs h-8 ${!data.isBillable ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'} border-gray-300 dark:border-gray-600 [ &::-webkit-outer-spin-button]:appearance-none [ &::-webkit-inner-spin-button]:appearance-none [ &[type=number]]:[-moz-appearance:textfield]`}
                        />
                      </td>
                      <td className="py-3 px-4 border border-gray-200 dark:border-gray-700">
                        {isFirstEntry ? (
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
      )}

      {/* Daily View */}
      {currentViewMode === 'daily' && (
        <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-center border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Date</th>
                <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Entry Details</th>
                <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Task</th>
                <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Available Hours</th>
                <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Actual Hours</th>
                <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Billable Hours</th>
                <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {getMonthlyDates().flatMap(currentDate => {
                const formattedDate = format(currentDate, 'dd/MM/yyyy');
                const day = format(currentDate, "EEEE");
                const statusData = currentUser ? getTimeEntryStatusForDate(format(currentDate, 'yyyy-MM-dd'), currentUser.id) : null;
                const isFutureDate = isFuture(currentDate) && !isToday(currentDate);
                const dateKey = format(currentDate, 'yyyy-MM-dd');

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

                // Create all entries for this date
                const allEntries = [];

                // Add all projects
                projects.forEach((project, index) => {
                  const projectData = monthlyData[dateKey]?.[project.id] || {
                    task: '',
                    availableHours: 0,
                    actualHours: 0,
                    billableHours: 0
                  };

                  allEntries.push({
                    type: 'project',
                    id: project.id,
                    data: project,
                    entryData: projectData,
                    index
                  });
                });

                // Add all products
                products.forEach((product, index) => {
                  const productData = monthlyData[dateKey]?.[product.id] || {
                    task: '',
                    availableHours: 0,
                    actualHours: 0,
                    billableHours: 0
                  };

                  allEntries.push({
                    type: 'product',
                    id: product.id,
                    data: product,
                    entryData: productData,
                    index
                  });
                });

                // Add all departments
                departments.forEach((department, index) => {
                  const departmentData = monthlyData[dateKey]?.[department.id] || {
                    task: '',
                    availableHours: 0,
                    actualHours: 0,
                    billableHours: 0
                  };

                  allEntries.push({
                    type: 'department',
                    id: department.id,
                    data: department,
                    entryData: departmentData,
                    index
                  });
                });

                // If no entries exist, show a message
                if (allEntries.length === 0) {
                  return [
                    <tr key={currentDate.toString()} className={`odd:bg-white dark:odd:bg-gray-900 even:bg-gray-50 dark:even:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 ${isFutureDate ? 'opacity-50' : ''}`}>
                      <td className="py-3 px-4 border border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-gray-100">
                        <div className="flex flex-col items-center">
                          <span className="text-sm">{day}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">No projects, products, or departments available</span>
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

                // Show rows for each entry
                return allEntries.map((entry, entryIndex) => {
                  const { type, id, data, entryData } = entry;
                  const isFirstEntry = entryIndex === 0;

                  return (
                    <tr key={`${dateKey}-${type}-${id}`} className={`odd:bg-white dark:odd:bg-gray-900 even:bg-gray-50 dark:even:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 ${isFutureDate ? 'opacity-50' : ''}`}>
                      <td className="py-3 px-4 border border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-gray-100">
                        {isFirstEntry ? (
                          <div className="flex flex-col items-center">
                            <span className="text-sm">{day}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</span>
                          </div>
                        ) : null}
                      </td>
                      <td className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-sm">
                        <span className={`text-xs px-2 py-1 rounded ${
                          type === 'project' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                          type === 'product' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                          'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                        }`}>
                          {type === 'project' ? 'Project' : type === 'product' ? 'Product' : 'Department'}: {data.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 border border-gray-200 dark:border-gray-700">
                        <Input
                          type="text"
                          value={entryData.task}
                          onChange={(e) => {
                            if (type === 'project') updateProjectData(dateKey, id, 'task', e.target.value);
                            else if (type === 'product') updateProductData(dateKey, id, 'task', e.target.value);
                            else updateDepartmentData(dateKey, id, 'task', e.target.value);
                          }}
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
                          value={entryData.availableHours || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            if (type === 'project') updateProjectData(dateKey, id, 'availableHours', value);
                            else if (type === 'product') updateProductData(dateKey, id, 'availableHours', value);
                            else updateDepartmentData(dateKey, id, 'availableHours', value);
                          }}
                          placeholder="0"
                          disabled={isFutureDate}
                          className="w-20 text-xs h-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 [ &::-webkit-outer-spin-button]:appearance-none [ &::-webkit-inner-spin-button]:appearance-none [ &[type=number]]:[-moz-appearance:textfield]"
                        />
                      </td>
                      <td className="py-3 px-4 border border-gray-200 dark:border-gray-700">
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          value={entryData.actualHours || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            if (type === 'project') updateProjectData(dateKey, id, 'actualHours', value);
                            else if (type === 'product') updateProductData(dateKey, id, 'actualHours', value);
                            else updateDepartmentData(dateKey, id, 'actualHours', value);
                          }}
                          placeholder="0"
                          disabled={isFutureDate}
                          className="w-20 text-xs h-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 [ &::-webkit-outer-spin-button]:appearance-none [ &::-webkit-inner-spin-button]:appearance-none [ &[type=number]]:[-moz-appearance:textfield]"
                        />
                      </td>
                      <td className="py-3 px-4 border border-gray-200 dark:border-gray-700">
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          value={entryData.billableHours || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            if (type === 'project') updateProjectData(dateKey, id, 'billableHours', value);
                            else if (type === 'product') updateProductData(dateKey, id, 'billableHours', value);
                            else updateDepartmentData(dateKey, id, 'billableHours', value);
                          }}
                          placeholder="0"
                          disabled={!data.isBillable || isFutureDate}
                          className={`w-20 text-xs h-8 ${!data.isBillable ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'} border-gray-300 dark:border-gray-600 [ &::-webkit-outer-spin-button]:appearance-none [ &::-webkit-inner-spin-button]:appearance-none [ &[type=number]]:[-moz-appearance:textfield]`}
                        />
                      </td>
                      <td className="py-3 px-4 border border-gray-200 dark:border-gray-700">
                        {isFirstEntry ? (
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
      )}

      <div className="flex justify-end pt-4">
        {currentViewMode === 'weekly' && (
          <Button onClick={saveWeeklyData} className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded shadow-lg transition-colors">
            <Save className="mr-2 h-4 w-4" />
            Save Week
          </Button>
        )}
        {currentViewMode === 'monthly' && (
          <Button onClick={saveEntireRange} className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded shadow-lg transition-colors flex items-center space-x-2">
            <Save className="h-4 w-4" />
            <span>Save Entire Range</span>
          </Button>
        )}
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
