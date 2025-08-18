import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, AlertCircle } from "lucide-react";
import { format, startOfWeek, endOfWeek, addDays, isFuture, isToday, differenceInDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-picker";
import QuickTaskForm from "./QuickTaskForm";
import WeeklyView from "./WeeklyView";
import MonthlyView from "./MonthlyView";
import DailyView from "./DailyView";
import { getCurrentUser } from "@/lib/auth";
import { getTimeEntryStatusForDate, getUserAssociatedProjects, getUserAssociatedProducts, getUserAssociatedDepartments, saveTimeEntry, generateId, getTimeEntries } from "@/services/storage";
import { Project, Product, Department, TimeEntry, ProjectDetail } from "@/validation/index";

interface WeeklyHours {
  billable: number;
  actual: number;
  task?: string;
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

// Remove the shared daily description interface since we'll use individual task descriptions
// interface DailyDescription {
//   [dayKey: string]: string;
// }

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
  const [isQuickTaskDialogOpen, setIsQuickTaskDialogOpen] = useState(false);
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
  // Remove the shared daily descriptions state since we'll use individual task descriptions
  // const [dailyDescriptions, setDailyDescriptions] = useState<DailyDescription>({});

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

  // Load existing time entries when data is available
  useEffect(() => {
    if (currentUser && (projects.length > 0 || products.length > 0 || departments.length > 0)) {
      // Add a small delay to ensure data is fully loaded
      const timer = setTimeout(() => {
        loadExistingEntries();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentUser, projects.length, products.length, departments.length]);

  // Load existing entries for the current week
  const loadExistingEntries = useCallback(() => {
    if (!currentUser) return;
    
    const allEntries = getTimeEntries();
    const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
    
    const newWeeklyData: ProjectWeekData = {};
    const newProductWeeklyData: ProductWeekData = {};
    const newDepartmentWeeklyData: DepartmentWeekData = {};
    
    let processedEntries = 0;
    
    allEntries.forEach(entry => {
      const entryDate = new Date(entry.date);
      if (entryDate >= weekStart && entryDate <= weekEnd && entry.userId === currentUser.id) {
        processedEntries++;
        const dayKey = format(entryDate, 'yyyy-MM-dd');

        // Load hours data based on category
        if (entry.projectDetails?.category === 'project') {
          // Try to find project by name
          const project = projects.find(p => p.name === entry.projectDetails.name);
          if (project) {
            if (!newWeeklyData[project.id]) {
              newWeeklyData[project.id] = {};
            }
            newWeeklyData[project.id][dayKey] = {
              billable: entry.billableHours,
              actual: entry.actualHours,
              task: entry.projectDetails.task || entry.task || ''
            };
          } else {
            console.log('Project not found:', entry.projectDetails.name);
          }
        } else if (entry.projectDetails?.category === 'product') {
          // Try to find product by name
          const product = products.find(p => p.name === entry.projectDetails.name);
          if (product) {
            if (!newProductWeeklyData[product.id]) {
              newProductWeeklyData[product.id] = {};
            }
            newProductWeeklyData[product.id][dayKey] = {
              billable: entry.billableHours,
              actual: entry.actualHours,
              task: entry.projectDetails.task || entry.task || ''
            };
          } else {
            console.log('Product not found:', entry.projectDetails.name);
          }
        } else if (entry.projectDetails?.category === 'department') {
          // Try to find department by name
          const department = departments.find(d => d.name === entry.projectDetails.name);
          if (department) {
            if (!newDepartmentWeeklyData[department.id]) {
              newDepartmentWeeklyData[department.id] = {};
            }
            newDepartmentWeeklyData[department.id][dayKey] = {
              billable: entry.billableHours,
              actual: entry.actualHours,
              task: entry.projectDetails.task || entry.task || ''
            };
          } else {
            console.log('Department not found:', entry.projectDetails.name);
          }
        }
      }
    });
    
    setWeeklyData(newWeeklyData);
    setProductWeeklyData(newProductWeeklyData);
    setDepartmentWeeklyData(newDepartmentWeeklyData);
  }, [currentUser, selectedWeek, projects, products, departments]);

  // Load existing entries when week changes
  useEffect(() => {
    if (currentUser && (projects.length > 0 || products.length > 0 || departments.length > 0)) {
      loadExistingEntries();
    }
  }, [selectedWeek, loadExistingEntries]);



  // Initialize weekly data when projects/products/departments or week changes, but preserve existing data
  useEffect(() => {
    if (projects.length > 0) {
      setWeeklyData(prevData => {
        const newData: ProjectWeekData = { ...prevData };
        
        projects.forEach(project => {
          if (!newData[project.id]) {
            newData[project.id] = {};
          }
          
          // Only initialize days that don't already have data
          for (let i = 0; i < 7; i++) {
            const dayKey = format(addDays(startOfWeek(selectedWeek, { weekStartsOn: 1 }), i), 'yyyy-MM-dd');
            if (!newData[project.id][dayKey]) {
              newData[project.id][dayKey] = {
                billable: 0,
                actual: 0,
                task: ''
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
          
          // Only initialize days that don't already have data
          for (let i = 0; i < 7; i++) {
            const dayKey = format(addDays(startOfWeek(selectedWeek, { weekStartsOn: 1 }), i), 'yyyy-MM-dd');
            if (!newData[product.id][dayKey]) {
              newData[product.id][dayKey] = {
                billable: 0,
                actual: 0,
                task: ''
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
          
          // Only initialize days that don't already have data
          for (let i = 0; i < 7; i++) {
            const dayKey = format(addDays(startOfWeek(selectedWeek, { weekStartsOn: 1 }), i), 'yyyy-MM-dd');
            if (!newData[department.id][dayKey]) {
              newData[department.id][dayKey] = {
                billable: 0,
                actual: 0,
                task: ''
              };
            }
          }
        });
        
        return newData;
      });
    }
  }, [projects, products, departments, selectedWeek]);



  const updateHours = (projectId: string, dayKey: string, type: 'billable' | 'actual', value: number) => {
    setWeeklyData(prev => {
      // Ensure the project exists in the data
      if (!prev[projectId]) {
        prev[projectId] = {};
      }
      
      // Ensure the day exists for this project
      if (!prev[projectId][dayKey]) {
        prev[projectId][dayKey] = { billable: 0, actual: 0, task: '' };
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
  
  const updateProjectData = (dayKey: string, projectId: string, field: 'task' | 'billable' | 'actual', value: string | number) => {
    setWeeklyData(prev => {
      // Ensure the project exists in the data
      if (!prev[projectId]) {
        prev[projectId] = {};
      }
      
      // Ensure the day exists for this project
      if (!prev[projectId][dayKey]) {
        prev[projectId][dayKey] = { billable: 0, actual: 0, task: '' };
      }
      
      return {
        ...prev,
        [projectId]: {
          ...prev[projectId],
          [dayKey]: {
            ...prev[projectId][dayKey],
            [field]: value
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
        prev[productId][dayKey] = { billable: 0, actual: 0, task: '' };
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
  
  const updateProductData = (dayKey: string, productId: string, field: 'task' | 'billable' | 'actual', value: string | number) => {
    setProductWeeklyData(prev => {
      // Ensure the product exists in the data
      if (!prev[productId]) {
        prev[productId] = {};
      }
      
      // Ensure the day exists for this product
      if (!prev[productId][dayKey]) {
        prev[productId][dayKey] = { billable: 0, actual: 0, task: '' };
      }
      
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          [dayKey]: {
            ...prev[productId][dayKey],
            [field]: value
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
        prev[departmentId][dayKey] = { billable: 0, actual: 0, task: '' };
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
  
  const updateDepartmentData = (dayKey: string, departmentId: string, field: 'task' | 'billable' | 'actual', value: string | number) => {
    setDepartmentWeeklyData(prev => {
      // Ensure the department exists in the data
      if (!prev[departmentId]) {
        prev[departmentId] = {};
      }
      
      // Ensure the day exists for this department
      if (!prev[departmentId][dayKey]) {
        prev[departmentId][dayKey] = { billable: 0, actual: 0, task: '' };
      }
      
      return {
        ...prev,
        [departmentId]: {
          ...prev[departmentId],
          [dayKey]: {
            ...prev[departmentId][dayKey],
            [field]: value
          }
        }
      };
    });
  };

  // Function to get existing task description for the selected project and date
  const getExistingTaskDescription = () => {
    if (!selectedProject || !selectedDateForQuickTask) return '';
    
    const dayKey = format(selectedDateForQuickTask, 'yyyy-MM-dd');
    
    // Check for existing description based on project type
    if ('levels' in selectedProject) { // Project
      return weeklyData[selectedProject.id]?.[dayKey]?.task || '';
    } else if ('stages' in selectedProject) { // Product
      return productWeeklyData[selectedProject.id]?.[dayKey]?.task || '';
    } else if ('functions' in selectedProject) { // Department
      return departmentWeeklyData[selectedProject.id]?.[dayKey]?.task || '';
    }
    
    return '';
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
    } else if (selectedDates.length === 2) {
      // Third date selected - remove the second date and make third date the new first date
      setSelectedDates([date]);
    }
  };

  // Remove the shared description update function since we'll use individual task descriptions
  // const updateDescription = (dayKey: string, description: string) => {
  //   setDailyDescriptions(prev => ({
  //     ...prev,
  //     [dayKey]: description
  //   }));
  // };

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
            task: hours.task || `Weekly entry for ${project.name}`,
            projectDetails: {
              category: 'project',
              name: project.name,
              level: '',
              task: hours.task || '',
              subtask: '',
              description: hours.task || `Weekly time entry for ${project.name}`
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
            task: hours.task || `Weekly entry for ${product.name}`,
            projectDetails: {
              category: 'product',
              name: product.name,
              stage: '',
              task: hours.task || '',
              subtask: '',
              description: hours.task || `Weekly time entry for ${product.name}`
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
            task: hours.task || `Weekly entry for ${department.name}`,
            projectDetails: {
              category: 'department',
              name: department.name,
              function: '',
              task: hours.task || '',
              subtask: '',
              description: hours.task || `Weekly time entry for ${department.name}`
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
  }, [currentViewMode, projects, products, departments, dateRange]);

  // Load existing entries for monthly view
  useEffect(() => {
    if (currentViewMode === 'monthly' && currentUser) {
      const allEntries = getTimeEntries();
      const monthlyDates = getMonthlyDates();
      
      setMonthlyData((prevData) => {
        const updatedData = { ...prevData };
        
        monthlyDates.forEach((date) => {
          const dateKey = format(date, 'yyyy-MM-dd');
          const dayEntries = allEntries.filter(entry => 
            entry.date === dateKey && entry.userId === currentUser.id
          );
          
          dayEntries.forEach(entry => {
            if (entry.projectDetails?.category === 'project') {
              const projectId = projects.find(p => p.name === entry.projectDetails.name)?.id;
              if (projectId && updatedData[dateKey]?.[projectId]) {
                updatedData[dateKey][projectId] = {
                  task: entry.projectDetails.task || entry.task || '',
                  availableHours: entry.availableHours || 0,
                  actualHours: entry.actualHours || 0,
                  billableHours: entry.billableHours || 0,
                };
              }
            } else if (entry.projectDetails?.category === 'product') {
              const productId = products.find(p => p.name === entry.projectDetails.name)?.id;
              if (productId && updatedData[dateKey]?.[productId]) {
                updatedData[dateKey][productId] = {
                  task: entry.projectDetails.task || entry.task || '',
                  availableHours: entry.availableHours || 0,
                  actualHours: entry.actualHours || 0,
                  billableHours: entry.billableHours || 0,
                };
              }
            } else if (entry.projectDetails?.category === 'department') {
              const departmentId = departments.find(d => d.name === entry.projectDetails.name)?.id;
              if (departmentId && updatedData[dateKey]?.[departmentId]) {
                updatedData[dateKey][departmentId] = {
                  task: entry.projectDetails.task || entry.task || '',
                  availableHours: entry.availableHours || 0,
                  actualHours: entry.actualHours || 0,
                  billableHours: entry.billableHours || 0,
                };
              }
            }
          });
        });
        
        return updatedData;
      });
    }
  }, [currentViewMode, currentUser, projects, products, departments, dateRange]);

  // Monthly view helper functions
  const updateMonthlyProjectData = (dateKey: string, projectId: string, field: keyof DailyProjectData, value: string | number) => {
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

  const updateMonthlyProductData = (dateKey: string, productId: string, field: keyof DailyProductData, value: string | number) => {
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

  const updateMonthlyDepartmentData = (dateKey: string, departmentId: string, field: keyof DailyDepartmentData, value: string | number) => {
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

  // Debug: Monitor data changes - Commented out to prevent console log loops
  // useEffect(() => {
  //   console.log('WeeklyTimeTracker: Data changed', {
  //     weeklyDataKeys: Object.keys(weeklyData),
  //     productWeeklyDataKeys: Object.keys(productWeeklyData),
  //     departmentWeeklyDataKeys: Object.keys(departmentWeeklyData),
  //     weeklyData,
  //     productWeeklyData,
  //     departmentWeeklyData
  //   });
  // }, [weeklyData, productWeeklyData, departmentWeeklyData]);

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
          initialDescription={getExistingTaskDescription()}
          onSuccess={(taskDescription: string) => {
            const dayKey = format(selectedDateForQuickTask, 'yyyy-MM-dd');
            
            // Remove the shared daily descriptions update since we'll use individual task descriptions
            // setDailyDescriptions(prev => ({
            //   ...prev,
            //   [dayKey]: taskDescription
            // }));
            
            // Update the task description in the appropriate data structure based on project type
            if ('levels' in selectedProject) { // Project
              updateProjectData(dayKey, selectedProject.id, 'task', taskDescription);
            } else if ('stages' in selectedProject) { // Product
              updateProductData(dayKey, selectedProject.id, 'task', taskDescription);
            } else if ('functions' in selectedProject) { // Department
              updateDepartmentData(dayKey, selectedProject.id, 'task', taskDescription);
            }
            
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
        <WeeklyView
          selectedWeek={selectedWeek}
          onWeekChange={setSelectedWeek}
          weeklyData={weeklyData}
          productWeeklyData={productWeeklyData}
          departmentWeeklyData={departmentWeeklyData}
          dailyAvailableHours={dailyAvailableHours}
          projects={projects}
          products={products}
          departments={departments}
          onUpdateHours={updateHours}
          onUpdateProjectData={updateProjectData}
          onUpdateProductHours={updateProductHours}
          onUpdateProductData={updateProductData}
          onUpdateDepartmentHours={updateDepartmentHours}
          onUpdateDepartmentData={updateDepartmentData}
          onUpdateAvailableHours={(dayKey, value) => setDailyAvailableHours(prev => ({ ...prev, [dayKey]: value }))}
          onQuickTaskClick={(project, date) => {
            setSelectedProject(project);
            setSelectedDateForQuickTask(date);
            setIsQuickTaskDialogOpen(true);
          }}
          onSaveWeeklyData={saveWeeklyData}
          selectedDates={selectedDates}
          onDateSelection={handleDateSelection}
        />
      )}

      {/* Monthly View */}
      {/* Monthly View */}
      {currentViewMode === 'monthly' && (
        <MonthlyView
          monthlyData={monthlyData}
          projects={projects}
          products={products}
          departments={departments}
          onUpdateMonthlyProjectData={updateMonthlyProjectData}
          onUpdateMonthlyProductData={updateMonthlyProductData}
          onUpdateMonthlyDepartmentData={updateMonthlyDepartmentData}
          onSaveEntryForDate={saveEntryForDate}
          onSaveEntireRange={saveEntireRange}
          getMonthlyDates={getMonthlyDates}
        />
      )}

      {/* Daily View */}
      {currentViewMode === 'daily' && (
        <DailyView
          monthlyData={monthlyData}
          projects={projects}
          products={products}
          departments={departments}
          onUpdateMonthlyProjectData={updateMonthlyProjectData}
          onUpdateMonthlyProductData={updateMonthlyProductData}
          onUpdateMonthlyDepartmentData={updateMonthlyDepartmentData}
          onSaveEntryForDate={saveEntryForDate}
          getMonthlyDates={getMonthlyDates}
        />
      )}
    </div>
  );
}
