import { TimeEntry, Project, Product, Department, Notification, ApprovalAction } from '@/types';

// Storage keys
const TIME_ENTRIES_KEY = 'timeEntries';
const PROJECTS_KEY = 'projects';
const PRODUCTS_KEY = 'products';
const DEPARTMENTS_KEY = 'departments';
const NOTIFICATIONS_KEY = 'notifications';
const APPROVAL_HISTORY_KEY = 'approvalHistory';

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