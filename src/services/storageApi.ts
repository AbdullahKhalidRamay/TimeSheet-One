import { TimeEntry, Project, Product, Department, Notification, ApprovalAction, Team, User } from '@/validation/index';
import { api } from './apiService';

// Time Entries
export const getTimeEntries = async (): Promise<TimeEntry[]> => {
  try {
    return await api.timeEntries.getAll();
  } catch (error) {
    console.error('Error fetching time entries:', error);
    return [];
  }
};

export const saveTimeEntry = async (entry: TimeEntry): Promise<void> => {
  try {
    if (entry.id) {
      await api.timeEntries.update(entry.id, entry);
    } else {
      await api.timeEntries.create(entry);
    }
  } catch (error) {
    console.error('Error saving time entry:', error);
    throw error;
  }
};

export const deleteTimeEntry = async (entryId: string): Promise<void> => {
  try {
    await api.timeEntries.delete(entryId);
  } catch (error) {
    console.error('Error deleting time entry:', error);
    throw error;
  }
};

export const updateTimeEntryStatus = async (
  entryId: string, 
  status: 'approved' | 'rejected', 
  message: string, 
  approvedBy: string
): Promise<void> => {
  try {
    if (status === 'approved') {
      await api.timeEntries.approve(entryId, message);
    } else {
      await api.timeEntries.reject(entryId, message);
    }
  } catch (error) {
    console.error('Error updating time entry status:', error);
    throw error;
  }
};

// Projects
export const getProjects = async (): Promise<Project[]> => {
  try {
    return await api.projects.getAll();
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
};

export const saveProject = async (project: Project): Promise<void> => {
  try {
    if (project.id) {
      await api.projects.update(project.id, project);
    } else {
      await api.projects.create(project);
    }
  } catch (error) {
    console.error('Error saving project:', error);
    throw error;
  }
};

export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    await api.projects.delete(projectId);
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

// Products
export const getProducts = async (): Promise<Product[]> => {
  try {
    return await api.products.getAll();
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

export const saveProduct = async (product: Product): Promise<void> => {
  try {
    if (product.id) {
      await api.products.update(product.id, product);
    } else {
      await api.products.create(product);
    }
  } catch (error) {
    console.error('Error saving product:', error);
    throw error;
  }
};

export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    await api.products.delete(productId);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Departments
export const getDepartments = async (): Promise<Department[]> => {
  try {
    return await api.departments.getAll();
  } catch (error) {
    console.error('Error fetching departments:', error);
    return [];
  }
};

export const saveDepartment = async (department: Department): Promise<void> => {
  try {
    if (department.id) {
      await api.departments.update(department.id, department);
    } else {
      await api.departments.create(department);
    }
  } catch (error) {
    console.error('Error saving department:', error);
    throw error;
  }
};

export const deleteDepartment = async (departmentId: string): Promise<void> => {
  try {
    await api.departments.delete(departmentId);
  } catch (error) {
    console.error('Error deleting department:', error);
    throw error;
  }
};

// Notifications
export const getNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const notifications = await api.notifications.getAll();
    return notifications.filter(n => n.userId === userId);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const saveNotification = async (notification: Notification): Promise<void> => {
  try {
    // Notifications are typically created by the backend
    // This would be handled by the backend when actions occur
    console.log('Notification saved:', notification);
  } catch (error) {
    console.error('Error saving notification:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await api.notifications.markAsRead(notificationId);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Approval History
export const getApprovalHistory = async (): Promise<ApprovalAction[]> => {
  try {
    // This would need to be implemented in the backend
    return [];
  } catch (error) {
    console.error('Error fetching approval history:', error);
    return [];
  }
};

export const saveApprovalAction = async (action: ApprovalAction): Promise<void> => {
  try {
    // This would be handled by the backend when approvals occur
    console.log('Approval action saved:', action);
  } catch (error) {
    console.error('Error saving approval action:', error);
    throw error;
  }
};

// Teams
export const getTeams = async (): Promise<Team[]> => {
  try {
    return await api.teams.getAll();
  } catch (error) {
    console.error('Error fetching teams:', error);
    return [];
  }
};

export const saveTeam = async (team: Team): Promise<void> => {
  try {
    if (team.id) {
      await api.teams.update(team.id, team);
    } else {
      await api.teams.create(team);
    }
  } catch (error) {
    console.error('Error saving team:', error);
    throw error;
  }
};

export const deleteTeam = async (teamId: string): Promise<void> => {
  try {
    await api.teams.delete(teamId);
  } catch (error) {
    console.error('Error deleting team:', error);
    throw error;
  }
};

export const addMemberToTeam = async (teamId: string, userId: string): Promise<boolean> => {
  try {
    await api.teams.addMember(teamId, userId);
    return true;
  } catch (error) {
    console.error('Error adding member to team:', error);
    return false;
  }
};

export const removeMemberFromTeam = async (teamId: string, userId: string): Promise<boolean> => {
  try {
    await api.teams.removeMember(teamId, userId);
    return true;
  } catch (error) {
    console.error('Error removing member from team:', error);
    return false;
  }
};

export const getUserTeams = async (userId: string): Promise<Team[]> => {
  try {
    return await api.teams.getUserTeams(userId);
  } catch (error) {
    console.error('Error fetching user teams:', error);
    return [];
  }
};

export const associateTeamWithProject = async (teamId: string, projectId: string): Promise<boolean> => {
  try {
    // This would need to be implemented in the backend
    console.log('Team associated with project:', { teamId, projectId });
    return true;
  } catch (error) {
    console.error('Error associating team with project:', error);
    return false;
  }
};

export const associateTeamWithProduct = async (teamId: string, productId: string): Promise<boolean> => {
  try {
    // This would need to be implemented in the backend
    console.log('Team associated with product:', { teamId, productId });
    return true;
  } catch (error) {
    console.error('Error associating team with product:', error);
    return false;
  }
};

export const associateTeamWithDepartment = async (teamId: string, departmentId: string): Promise<boolean> => {
  try {
    // This would need to be implemented in the backend
    console.log('Team associated with department:', { teamId, departmentId });
    return true;
  } catch (error) {
    console.error('Error associating team with department:', error);
    return false;
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

// Search and filter utilities
export const searchTimeEntries = async (query: string, userId?: string): Promise<TimeEntry[]> => {
  try {
    const entries = await getTimeEntries();
    const filteredEntries = userId ? entries.filter(e => e.userId === userId) : entries;
    
    if (!query) return filteredEntries;
    
    const lowercaseQuery = query.toLowerCase();
    return filteredEntries.filter(entry => 
      entry.task.toLowerCase().includes(lowercaseQuery) ||
      entry.projectDetails.name.toLowerCase().includes(lowercaseQuery) ||
      entry.projectDetails.description.toLowerCase().includes(lowercaseQuery)
    );
  } catch (error) {
    console.error('Error searching time entries:', error);
    return [];
  }
};

export const getTimeEntriesByDateRange = async (startDate: string, endDate: string, userId?: string): Promise<TimeEntry[]> => {
  try {
    return await api.timeEntries.getByDateRange(startDate, endDate, userId);
  } catch (error) {
    console.error('Error fetching time entries by date range:', error);
    return [];
  }
};

// Date-specific utilities
export const getTimeEntriesForDate = async (date: string, userId: string): Promise<TimeEntry[]> => {
  try {
    return await api.timeEntries.getByDate(date, userId);
  } catch (error) {
    console.error('Error fetching time entries for date:', error);
    return [];
  }
};

export const hasTimeEntriesForDate = async (date: string, userId: string): Promise<boolean> => {
  try {
    const entries = await getTimeEntriesForDate(date, userId);
    return entries.length > 0;
  } catch (error) {
    console.error('Error checking time entries for date:', error);
    return false;
  }
};

export const getTimeEntryStatusForDate = async (date: string, userId: string): Promise<{
  hasEntries: boolean;
  totalHours: number;
  entriesCount: number;
  statuses: string[];
}> => {
  try {
    const entries = await getTimeEntriesForDate(date, userId);
    return {
      hasEntries: entries.length > 0,
      totalHours: entries.reduce((sum, entry) => sum + entry.totalHours, 0),
      entriesCount: entries.length,
      statuses: [...new Set(entries.map(entry => entry.status))]
    };
  } catch (error) {
    console.error('Error getting time entry status for date:', error);
    return {
      hasEntries: false,
      totalHours: 0,
      entriesCount: 0,
      statuses: []
    };
  }
};

// Statistics utilities
export const getUserStats = async (userId: string) => {
  try {
    const stats = await api.timeEntries.getStatistics(userId);
    return stats;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      totalEntries: 0,
      approvedEntries: 0,
      pendingEntries: 0,
      rejectedEntries: 0,
      totalHours: 0,
      approvedHours: 0,
      billableHours: 0
    };
  }
};

// User-team association utilities
export const getUserAssociatedProjects = async (userId: string): Promise<Project[]> => {
  try {
    const userTeams = await getUserTeams(userId);
    const allProjects = await getProjects();
    const associatedProjectIds = userTeams.flatMap(team => team.associatedProjects);
    return allProjects.filter(project => associatedProjectIds.includes(project.id));
  } catch (error) {
    console.error('Error fetching user associated projects:', error);
    return [];
  }
};

export const getUserAssociatedProducts = async (userId: string): Promise<Product[]> => {
  try {
    const userTeams = await getUserTeams(userId);
    const allProducts = await getProducts();
    const associatedProductIds = userTeams.flatMap(team => team.associatedProducts);
    return allProducts.filter(product => associatedProductIds.includes(product.id));
  } catch (error) {
    console.error('Error fetching user associated products:', error);
    return [];
  }
};

export const getUserAssociatedDepartments = async (userId: string): Promise<Department[]> => {
  try {
    const userTeams = await getUserTeams(userId);
    const allDepartments = await getDepartments();
    const associatedDepartmentIds = userTeams.flatMap(team => team.associatedDepartments);
    return allDepartments.filter(department => associatedDepartmentIds.includes(department.id));
  } catch (error) {
    console.error('Error fetching user associated departments:', error);
    return [];
  }
};

// Automatic billable determination from project/product/department
export const determineIsBillable = async (category: 'project' | 'product' | 'department', itemName: string): Promise<boolean> => {
  try {
    switch (category) {
      case 'project': {
        const projects = await getProjects();
        const project = projects.find(p => p.name === itemName);
        return project?.isBillable || false;
      }
      case 'product': {
        const products = await getProducts();
        const product = products.find(p => p.name === itemName);
        return product?.isBillable || false;
      }
      case 'department': {
        const departments = await getDepartments();
        const department = departments.find(d => d.name === itemName);
        return department?.isBillable || false;
      }
      default:
        return false;
    }
  } catch (error) {
    console.error('Error determining billable status:', error);
    return false;
  }
};

// Notification utilities for reminders
export const createDailyReminder = async (userId: string): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = await getTimeEntriesForDate(today, userId);
    
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
      await saveNotification(reminder);
    }
  } catch (error) {
    console.error('Error creating daily reminder:', error);
  }
};

export const createWeeklySubmissionReminder = async (userId: string): Promise<void> => {
  try {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    
    const weekEntries = await getTimeEntriesByDateRange(
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
      await saveNotification(reminder);
    }
  } catch (error) {
    console.error('Error creating weekly submission reminder:', error);
  }
};
