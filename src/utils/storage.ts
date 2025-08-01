import { TimeEntry, Project, Product, Department, Notification, ApprovalAction, Team } from '@/types';

// Storage keys
const TIME_ENTRIES_KEY = 'timeEntries';
const PROJECTS_KEY = 'projects';
const PRODUCTS_KEY = 'products';
const DEPARTMENTS_KEY = 'departments';
const NOTIFICATIONS_KEY = 'notifications';
const APPROVAL_HISTORY_KEY = 'approvalHistory';
const TEAMS_KEY = 'teams';

// Time Entries
export const getTimeEntries = (): TimeEntry[] => {
  const entriesStr = localStorage.getItem(TIME_ENTRIES_KEY);
  return entriesStr ? JSON.parse(entriesStr) : [];
};

export const saveTimeEntry = (entry: TimeEntry): void => {
  const entries = getTimeEntries();
  const existingIndex = entries.findIndex(e => e.id === entry.id);
  
  if (existingIndex !== -1) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  
  localStorage.setItem(TIME_ENTRIES_KEY, JSON.stringify(entries));
};

export const deleteTimeEntry = (entryId: string): void => {
  const entries = getTimeEntries();
  const filteredEntries = entries.filter(e => e.id !== entryId);
  localStorage.setItem(TIME_ENTRIES_KEY, JSON.stringify(filteredEntries));
};

export const updateTimeEntryStatus = (entryId: string, status: 'approved' | 'rejected', message: string, approvedBy: string): void => {
  const entries = getTimeEntries();
  const entry = entries.find(e => e.id === entryId);
  
  if (entry) {
    const previousStatus = entry.status;
    entry.status = status;
    entry.updatedAt = new Date().toISOString();
    
    saveTimeEntry(entry);
    
    // Save approval action
    const approvalAction: ApprovalAction = {
      id: Date.now().toString(),
      entryId,
      previousStatus,
      newStatus: status,
      message,
      approvedBy,
      approvedAt: new Date().toISOString(),
    };
    saveApprovalAction(approvalAction);
    
    // Create notification
    const notification: Notification = {
      id: Date.now().toString(),
      userId: entry.userId,
      title: `Timesheet ${status}`,
      message: `Your timesheet entry for ${entry.date} has been ${status}. ${message}`,
      type: status === 'approved' ? 'approval' : 'rejection',
      isRead: false,
      createdAt: new Date().toISOString(),
      relatedEntryId: entryId,
    };
    saveNotification(notification);
  }
};

// Projects
export const getProjects = (): Project[] => {
  const projectsStr = localStorage.getItem(PROJECTS_KEY);
  return projectsStr ? JSON.parse(projectsStr) : [];
};

export const saveProject = (project: Project): void => {
  const projects = getProjects();
  const existingIndex = projects.findIndex(p => p.id === project.id);
  
  if (existingIndex !== -1) {
    projects[existingIndex] = project;
  } else {
    projects.push(project);
  }
  
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
};

// Products
export const getProducts = (): Product[] => {
  const productsStr = localStorage.getItem(PRODUCTS_KEY);
  return productsStr ? JSON.parse(productsStr) : [];
};

export const saveProduct = (product: Product): void => {
  const products = getProducts();
  const existingIndex = products.findIndex(p => p.id === product.id);
  
  if (existingIndex !== -1) {
    products[existingIndex] = product;
  } else {
    products.push(product);
  }
  
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
};

// Departments
export const getDepartments = (): Department[] => {
  const departmentsStr = localStorage.getItem(DEPARTMENTS_KEY);
  return departmentsStr ? JSON.parse(departmentsStr) : [];
};

export const saveDepartment = (department: Department): void => {
  const departments = getDepartments();
  const existingIndex = departments.findIndex(d => d.id === department.id);
  
  if (existingIndex !== -1) {
    departments[existingIndex] = department;
  } else {
    departments.push(department);
  }
  
  localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(departments));
};

// Notifications
export const getNotifications = (userId: string): Notification[] => {
  const notificationsStr = localStorage.getItem(NOTIFICATIONS_KEY);
  const allNotifications = notificationsStr ? JSON.parse(notificationsStr) : [];
  return allNotifications.filter((n: Notification) => n.userId === userId);
};

export const saveNotification = (notification: Notification): void => {
  const notificationsStr = localStorage.getItem(NOTIFICATIONS_KEY);
  const notifications = notificationsStr ? JSON.parse(notificationsStr) : [];
  notifications.push(notification);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
};

export const markNotificationAsRead = (notificationId: string): void => {
  const notificationsStr = localStorage.getItem(NOTIFICATIONS_KEY);
  const notifications = notificationsStr ? JSON.parse(notificationsStr) : [];
  
  const notification = notifications.find((n: Notification) => n.id === notificationId);
  if (notification) {
    notification.isRead = true;
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }
};

// Approval History
export const getApprovalHistory = (): ApprovalAction[] => {
  const historyStr = localStorage.getItem(APPROVAL_HISTORY_KEY);
  return historyStr ? JSON.parse(historyStr) : [];
};

export const saveApprovalAction = (action: ApprovalAction): void => {
  const history = getApprovalHistory();
  history.push(action);
  localStorage.setItem(APPROVAL_HISTORY_KEY, JSON.stringify(history));
};

// Teams
export const getTeams = (): Team[] => {
  const teamsStr = localStorage.getItem(TEAMS_KEY);
  return teamsStr ? JSON.parse(teamsStr) : [];
};

export const saveTeam = (team: Team): void => {
  const teams = getTeams();
  const existingIndex = teams.findIndex(t => t.id === team.id);
  
  if (existingIndex !== -1) {
    teams[existingIndex] = team;
  } else {
    teams.push(team);
  }
  
  localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
};

export const deleteTeam = (teamId: string): void => {
  const teams = getTeams();
  const filteredTeams = teams.filter(t => t.id !== teamId);
  localStorage.setItem(TEAMS_KEY, JSON.stringify(filteredTeams));
};

export const addMemberToTeam = (teamId: string, userId: string): boolean => {
  const teams = getTeams();
  const team = teams.find(t => t.id === teamId);
  
  if (team && !team.memberIds.includes(userId)) {
    team.memberIds.push(userId);
    saveTeam(team);
    return true;
  }
  
  return false;
};

export const removeMemberFromTeam = (teamId: string, userId: string): boolean => {
  const teams = getTeams();
  const team = teams.find(t => t.id === teamId);
  
  if (team) {
    team.memberIds = team.memberIds.filter(id => id !== userId);
    saveTeam(team);
    return true;
  }
  
  return false;
};

export const getUserTeams = (userId: string): Team[] => {
  const teams = getTeams();
  return teams.filter(team => team.memberIds.includes(userId));
};

export const associateTeamWithProject = (teamId: string, projectId: string): boolean => {
  const teams = getTeams();
  const team = teams.find(t => t.id === teamId);
  
  if (team && !team.associatedProjects.includes(projectId)) {
    team.associatedProjects.push(projectId);
    saveTeam(team);
    return true;
  }
  
  return false;
};

export const associateTeamWithProduct = (teamId: string, productId: string): boolean => {
  const teams = getTeams();
  const team = teams.find(t => t.id === teamId);
  
  if (team && !team.associatedProducts.includes(productId)) {
    team.associatedProducts.push(productId);
    saveTeam(team);
    return true;
  }
  
  return false;
};

export const associateTeamWithDepartment = (teamId: string, departmentId: string): boolean => {
  const teams = getTeams();
  const team = teams.find(t => t.id === teamId);
  
  if (team && !team.associatedDepartments.includes(departmentId)) {
    team.associatedDepartments.push(departmentId);
    saveTeam(team);
    return true;
  }
  
  return false;
};

// Enhanced local storage retrieval function with error handling
const getData = (key: string): any[] => {
  try {
    const dataStr = localStorage.getItem(key);
    return dataStr ? JSON.parse(dataStr) : [];
  } catch (error) {
    console.error(`Error retrieving data from ${key}:`, error);
    return [];
  }
};

// Enhanced data saving with error handling
const saveData = (key: string, data: any[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving data to ${key}:`, error);
  }
};

// Utility functions
export const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

export const formatTime = (time: string): string => {
  if (!time) return '--:--';
  return time;
};

export const calculateHours = (clockIn: string, clockOut: string, breakTime: number = 0): number => {
  if (!clockIn || !clockOut) return 0;
  
  const start = new Date(`2000-01-01T${clockIn}`);
  const end = new Date(`2000-01-01T${clockOut}`);
  
  if (end < start) {
    // Handle next day scenario
    end.setDate(end.getDate() + 1);
  }
  
  const diffMs = end.getTime() - start.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return Math.max(0, diffHours - (breakTime / 60));
};

// Data management utilities
export const exportAllData = (): string => {
  const data = {
    timeEntries: getData(TIME_ENTRIES_KEY),
    projects: getData(PROJECTS_KEY),
    products: getData(PRODUCTS_KEY),
    departments: getData(DEPARTMENTS_KEY),
    notifications: getData(NOTIFICATIONS_KEY),
    approvalHistory: getData(APPROVAL_HISTORY_KEY),
    exportedAt: new Date().toISOString()
  };
  return JSON.stringify(data, null, 2);
};

export const importAllData = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData);
    
    if (data.timeEntries) saveData(TIME_ENTRIES_KEY, data.timeEntries);
    if (data.projects) saveData(PROJECTS_KEY, data.projects);
    if (data.products) saveData(PRODUCTS_KEY, data.products);
    if (data.departments) saveData(DEPARTMENTS_KEY, data.departments);
    if (data.notifications) saveData(NOTIFICATIONS_KEY, data.notifications);
    if (data.approvalHistory) saveData(APPROVAL_HISTORY_KEY, data.approvalHistory);
    
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};

export const clearAllData = (): void => {
  const keys = [
    TIME_ENTRIES_KEY,
    PROJECTS_KEY,
    PRODUCTS_KEY,
    DEPARTMENTS_KEY,
    NOTIFICATIONS_KEY,
    APPROVAL_HISTORY_KEY
  ];
  
  keys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error clearing ${key}:`, error);
    }
  });
};

// Search and filter utilities
export const searchTimeEntries = (query: string, userId?: string): TimeEntry[] => {
  const entries = getTimeEntries();
  const filteredEntries = userId ? entries.filter(e => e.userId === userId) : entries;
  
  if (!query) return filteredEntries;
  
  const lowercaseQuery = query.toLowerCase();
  return filteredEntries.filter(entry => 
    entry.task.toLowerCase().includes(lowercaseQuery) ||
    entry.projectDetails.name.toLowerCase().includes(lowercaseQuery) ||
    entry.projectDetails.description.toLowerCase().includes(lowercaseQuery)
  );
};

export const getTimeEntriesByDateRange = (startDate: string, endDate: string, userId?: string): TimeEntry[] => {
  const entries = getTimeEntries();
  const filteredEntries = userId ? entries.filter(e => e.userId === userId) : entries;
  
  return filteredEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return entryDate >= start && entryDate <= end;
  });
};

// Date-specific utilities
export const getTimeEntriesForDate = (date: string, userId: string): TimeEntry[] => {
  const entries = getTimeEntries();
  return entries.filter(entry => entry.date === date && entry.userId === userId);
};

export const hasTimeEntriesForDate = (date: string, userId: string): boolean => {
  const entries = getTimeEntriesForDate(date, userId);
  return entries.length > 0;
};

export const getTimeEntryStatusForDate = (date: string, userId: string): {
  hasEntries: boolean;
  totalHours: number;
  entriesCount: number;
  statuses: string[];
} => {
  const entries = getTimeEntriesForDate(date, userId);
  return {
    hasEntries: entries.length > 0,
    totalHours: entries.reduce((sum, entry) => sum + entry.totalHours, 0),
    entriesCount: entries.length,
    statuses: [...new Set(entries.map(entry => entry.status))]
  };
};

// Statistics utilities
export const getUserStats = (userId: string) => {
  const entries = getTimeEntries().filter(e => e.userId === userId);
  const approvedEntries = entries.filter(e => e.status === 'approved');
  const billableEntries = entries.filter(e => e.isBillable && e.status === 'approved');
  
  return {
    totalEntries: entries.length,
    approvedEntries: approvedEntries.length,
    pendingEntries: entries.filter(e => e.status === 'pending').length,
    rejectedEntries: entries.filter(e => e.status === 'rejected').length,
    totalHours: entries.reduce((sum, e) => sum + e.totalHours, 0),
    approvedHours: approvedEntries.reduce((sum, e) => sum + e.totalHours, 0),
    billableHours: billableEntries.reduce((sum, e) => sum + e.totalHours, 0)
  };
};

// User-team association utilities
export const getUserAssociatedProjects = (userId: string): Project[] => {
  const userTeams = getUserTeams(userId);
  const allProjects = getProjects();
  const associatedProjectIds = userTeams.flatMap(team => team.associatedProjects);
  return allProjects.filter(project => associatedProjectIds.includes(project.id));
};

export const getUserAssociatedProducts = (userId: string): Product[] => {
  const userTeams = getUserTeams(userId);
  const allProducts = getProducts();
  const associatedProductIds = userTeams.flatMap(team => team.associatedProducts);
  return allProducts.filter(product => associatedProductIds.includes(product.id));
};

export const getUserAssociatedDepartments = (userId: string): Department[] => {
  const userTeams = getUserTeams(userId);
  const allDepartments = getDepartments();
  const associatedDepartmentIds = userTeams.flatMap(team => team.associatedDepartments);
  return allDepartments.filter(department => associatedDepartmentIds.includes(department.id));
};

// Automatic billable determination from project/product/department
export const determineIsBillable = (category: 'project' | 'product' | 'department', itemName: string): boolean => {
  switch (category) {
    case 'project': {
      const project = getProjects().find(p => p.name === itemName);
      return project?.isBillable || false;
    }
    case 'product': {
      const product = getProducts().find(p => p.name === itemName);
      return product?.isBillable || false;
    }
    case 'department': {
      const department = getDepartments().find(d => d.name === itemName);
      return department?.isBillable || false;
    }
    default:
      return false;
  }
};

// Notification utilities for reminders
export const createDailyReminder = (userId: string): void => {
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = getTimeEntries().filter(e => 
    e.userId === userId && e.date === today
  );
  
  if (todayEntries.length === 0) {
    const reminder: Notification = {
      id: generateId(),
      userId,
      title: 'Daily Time Entry Reminder',
      message: 'Don\'t forget to log your time entry for today!',
      type: 'daily_reminder',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    saveNotification(reminder);
  }
};

export const createWeeklySubmissionReminder = (userId: string): void => {
  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
  
  const weekEntries = getTimeEntriesByDateRange(
    weekStart.toISOString().split('T')[0],
    weekEnd.toISOString().split('T')[0],
    userId
  );
  
  const pendingEntries = weekEntries.filter(e => e.status === 'pending');
  
  if (pendingEntries.length > 0) {
    const reminder: Notification = {
      id: generateId(),
      userId,
      title: 'Weekly Submission Reminder',
      message: `You have ${pendingEntries.length} pending time entries this week. Please submit them for approval.`,
      type: 'weekly_reminder',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    saveNotification(reminder);
  }
};
