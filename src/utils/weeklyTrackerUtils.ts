import { format, startOfWeek, endOfWeek, addDays, isFuture, isToday, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { Project, Product, Department, TimeEntry, ProjectDetail } from "@/validation/index";

export interface WeeklyHours {
  billable: number;
  actual: number;
  task?: string;
}

export interface ProjectWeekData {
  [projectId: string]: {
    [dayKey: string]: WeeklyHours;
  };
}

export interface ProductWeekData {
  [productId: string]: {
    [dayKey: string]: WeeklyHours;
  };
}

export interface DepartmentWeekData {
  [departmentId: string]: {
    [dayKey: string]: WeeklyHours;
  };
}

export interface DailyAvailableHours {
  [dayKey: string]: number;
}

export interface DailyProjectData {
  task: string;
  availableHours: number;
  actualHours: number;
  billableHours: number;
}

export interface DailyProductData {
  task: string;
  availableHours: number;
  actualHours: number;
  billableHours: number;
}

export interface DailyDepartmentData {
  task: string;
  availableHours: number;
  actualHours: number;
  billableHours: number;
}

export interface MonthlyData {
  [dateKey: string]: {
    [id: string]: DailyProjectData | DailyProductData | DailyDepartmentData;
  };
}

export interface SelectedProjects {
  [dateKey: string]: string[];
}

export interface SelectedProducts {
  [dateKey: string]: string[];
}

export interface SelectedDepartments {
  [dateKey: string]: string[];
}

// Date utility functions
export const generateWeekDates = (weekStart: Date): Date[] => {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(addDays(weekStart, i));
  }
  return dates;
};

export const getDayKey = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const getWeekStart = (date: Date): Date => {
  return startOfWeek(date, { weekStartsOn: 1 });
};

export const getWeekEnd = (date: Date): Date => {
  return endOfWeek(date, { weekStartsOn: 1 });
};

export const getMonthStart = (date: Date): Date => {
  return startOfMonth(date);
};

export const getMonthEnd = (date: Date): Date => {
  return endOfMonth(date);
};

export const generateMonthDates = (monthStart: Date): Date[] => {
  const monthEnd = endOfMonth(monthStart);
  return eachDayOfInterval({ start: monthStart, end: monthEnd });
};

// Date validation functions
export const isDateInFuture = (date: Date): boolean => {
  return isFuture(date);
};

export const isDateToday = (date: Date): boolean => {
  return isToday(date);
};

export const getDaysUntil = (date: Date): number => {
  return differenceInDays(date, new Date());
};

// Data processing functions
export const calculateTotalHours = (hours: WeeklyHours): number => {
  return hours.actual + hours.billable;
};

export const calculateWeekTotal = (weekData: { [dayKey: string]: WeeklyHours }): number => {
  return Object.values(weekData).reduce((total, hours) => {
    return total + calculateTotalHours(hours);
  }, 0);
};

export const calculateProjectWeekTotal = (projectData: ProjectWeekData, projectId: string): number => {
  const projectWeek = projectData[projectId];
  if (!projectWeek) return 0;
  return calculateWeekTotal(projectWeek);
};

export const calculateProductWeekTotal = (productData: ProductWeekData, productId: string): number => {
  const productWeek = productData[productId];
  if (!productWeek) return 0;
  return calculateWeekTotal(productWeek);
};

export const calculateDepartmentWeekTotal = (departmentData: DepartmentWeekData, departmentId: string): number => {
  const departmentWeek = departmentData[departmentId];
  if (!departmentWeek) return 0;
  return calculateWeekTotal(departmentWeek);
};

// Time entry creation helpers
export const createTimeEntry = (
  userId: string,
  userName: string,
  date: Date,
  project: Project | Product | Department,
  actualHours: number,
  billableHours: number,
  availableHours: number,
  task: string,
  description: string
): TimeEntry => {
  const projectDetails: ProjectDetail = {
    category: 'project' in project ? 'project' : 'product' in project ? 'product' : 'department',
    name: project.name,
    task: task,
    description: description,
  };

  return {
    id: generateId(),
    userId,
    userName,
    date: format(date, 'yyyy-MM-dd'),
    actualHours,
    billableHours,
    availableHours,
    task,
    projectDetails,
    isBillable: project.isBillable,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

// Data validation functions
export const validateHours = (actualHours: number, billableHours: number): boolean => {
  return actualHours >= 0 && billableHours >= 0 && billableHours <= actualHours;
};

export const validateAvailableHours = (availableHours: number): boolean => {
  return availableHours >= 0 && availableHours <= 24;
};

// Formatting functions
export const formatHours = (hours: number): string => {
  return hours.toFixed(1);
};

export const formatDate = (date: Date): string => {
  return format(date, 'MMM dd, yyyy');
};

export const formatDayName = (date: Date): string => {
  return format(date, 'EEE');
};

export const formatMonthYear = (date: Date): string => {
  return format(date, 'MMMM yyyy');
};

// Navigation helpers
export const getPreviousWeek = (currentWeek: Date): Date => {
  return addDays(currentWeek, -7);
};

export const getNextWeek = (currentWeek: Date): Date => {
  return addDays(currentWeek, 7);
};

export const getPreviousMonth = (currentMonth: Date): Date => {
  return addDays(startOfMonth(currentMonth), -1);
};

export const getNextMonth = (currentMonth: Date): Date => {
  return addDays(endOfMonth(currentMonth), 1);
};
