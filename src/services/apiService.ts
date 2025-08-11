import { TimeEntry, Project, Product, Department, Notification, ApprovalAction, Team, User } from '@/validation/index';

const API_BASE_URL = 'https://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Helper function to make API calls
const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// Authentication API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await apiCall<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('currentUser', JSON.stringify(response.user));
    return response;
  },

  register: async (userData: any) => {
    return await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  },

  getCurrentUser: async () => {
    return await apiCall<User>('/auth/me');
  },
};

// Time Entries API
export const timeEntriesAPI = {
  getAll: async (): Promise<TimeEntry[]> => {
    return await apiCall<TimeEntry[]>('/timeentries');
  },

  getById: async (id: string): Promise<TimeEntry> => {
    return await apiCall<TimeEntry>(`/timeentries/${id}`);
  },

  create: async (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<TimeEntry> => {
    return await apiCall<TimeEntry>('/timeentries', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },

  update: async (id: string, entry: Partial<TimeEntry>): Promise<TimeEntry> => {
    return await apiCall<TimeEntry>(`/timeentries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entry),
    });
  },

  delete: async (id: string): Promise<void> => {
    await apiCall(`/timeentries/${id}`, {
      method: 'DELETE',
    });
  },

  approve: async (id: string, comments?: string): Promise<void> => {
    await apiCall(`/timeentries/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comments }),
    });
  },

  reject: async (id: string, comments?: string): Promise<void> => {
    await apiCall(`/timeentries/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comments }),
    });
  },

  bulkApprove: async (ids: string[], comments?: string): Promise<void> => {
    await apiCall('/timeentries/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ timeEntryIds: ids, comments }),
    });
  },

  getByDateRange: async (startDate: string, endDate: string, userId?: string): Promise<TimeEntry[]> => {
    const params = new URLSearchParams({ startDate, endDate });
    if (userId) params.append('userId', userId);
    return await apiCall<TimeEntry[]>(`/timeentries/range?${params}`);
  },

  getByDate: async (date: string, userId?: string): Promise<TimeEntry[]> => {
    const params = new URLSearchParams({ date });
    if (userId) params.append('userId', userId);
    return await apiCall<TimeEntry[]>(`/timeentries/date?${params}`);
  },

  getStatistics: async (userId?: string): Promise<any> => {
    const params = userId ? `?userId=${userId}` : '';
    return await apiCall(`/timeentries/statistics${params}`);
  },
};

// Projects API
export const projectsAPI = {
  getAll: async (): Promise<Project[]> => {
    return await apiCall<Project[]>('/projects');
  },

  getById: async (id: string): Promise<Project> => {
    return await apiCall<Project>(`/projects/${id}`);
  },

  create: async (project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> => {
    return await apiCall<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  },

  update: async (id: string, project: Partial<Project>): Promise<Project> => {
    return await apiCall<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    });
  },

  delete: async (id: string): Promise<void> => {
    await apiCall(`/projects/${id}`, {
      method: 'DELETE',
    });
  },

  getLevels: async (projectId: string): Promise<any[]> => {
    return await apiCall<any[]>(`/projects/${projectId}/levels`);
  },

  createLevel: async (projectId: string, level: any): Promise<any> => {
    return await apiCall(`/projects/${projectId}/levels`, {
      method: 'POST',
      body: JSON.stringify(level),
    });
  },

  getTasks: async (levelId: string): Promise<any[]> => {
    return await apiCall<any[]>(`/projects/levels/${levelId}/tasks`);
  },

  createTask: async (levelId: string, task: any): Promise<any> => {
    return await apiCall(`/projects/levels/${levelId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(task),
    });
  },

  getSubtasks: async (taskId: string): Promise<any[]> => {
    return await apiCall<any[]>(`/projects/tasks/${taskId}/subtasks`);
  },

  createSubtask: async (taskId: string, subtask: any): Promise<any> => {
    return await apiCall(`/projects/tasks/${taskId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify(subtask),
    });
  },
};

// Products API
export const productsAPI = {
  getAll: async (): Promise<Product[]> => {
    return await apiCall<Product[]>('/products');
  },

  getById: async (id: string): Promise<Product> => {
    return await apiCall<Product>(`/products/${id}`);
  },

  create: async (product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> => {
    return await apiCall<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  update: async (id: string, product: Partial<Product>): Promise<Product> => {
    return await apiCall<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  },

  delete: async (id: string): Promise<void> => {
    await apiCall(`/products/${id}`, {
      method: 'DELETE',
    });
  },
};

// Departments API
export const departmentsAPI = {
  getAll: async (): Promise<Department[]> => {
    return await apiCall<Department[]>('/departments');
  },

  getById: async (id: string): Promise<Department> => {
    return await apiCall<Department>(`/departments/${id}`);
  },

  create: async (department: Omit<Department, 'id' | 'createdAt'>): Promise<Department> => {
    return await apiCall<Department>('/departments', {
      method: 'POST',
      body: JSON.stringify(department),
    });
  },

  update: async (id: string, department: Partial<Department>): Promise<Department> => {
    return await apiCall<Department>(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(department),
    });
  },

  delete: async (id: string): Promise<void> => {
    await apiCall(`/departments/${id}`, {
      method: 'DELETE',
    });
  },
};

// Teams API
export const teamsAPI = {
  getAll: async (): Promise<Team[]> => {
    return await apiCall<Team[]>('/teams');
  },

  getById: async (id: string): Promise<Team> => {
    return await apiCall<Team>(`/teams/${id}`);
  },

  create: async (team: Omit<Team, 'id' | 'createdAt'>): Promise<Team> => {
    return await apiCall<Team>('/teams', {
      method: 'POST',
      body: JSON.stringify(team),
    });
  },

  update: async (id: string, team: Partial<Team>): Promise<Team> => {
    return await apiCall<Team>(`/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(team),
    });
  },

  delete: async (id: string): Promise<void> => {
    await apiCall(`/teams/${id}`, {
      method: 'DELETE',
    });
  },

  addMember: async (teamId: string, userId: string): Promise<void> => {
    await apiCall(`/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  removeMember: async (teamId: string, userId: string): Promise<void> => {
    await apiCall(`/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
    });
  },

  getMembers: async (teamId: string): Promise<User[]> => {
    return await apiCall<User[]>(`/teams/${teamId}/members`);
  },

  getUserTeams: async (userId: string): Promise<Team[]> => {
    return await apiCall<Team[]>(`/teams/user/${userId}`);
  },
};

// Users API
export const usersAPI = {
  getAll: async (): Promise<User[]> => {
    return await apiCall<User[]>('/users');
  },

  getById: async (id: string): Promise<User> => {
    return await apiCall<User>(`/users/${id}`);
  },

  create: async (user: Omit<User, 'id'>): Promise<User> => {
    return await apiCall<User>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  },

  update: async (id: string, user: Partial<User>): Promise<User> => {
    return await apiCall<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  },

  delete: async (id: string): Promise<void> => {
    await apiCall(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  getTimesheet: async (id: string, startDate: string, endDate: string): Promise<any> => {
    const params = new URLSearchParams({ startDate, endDate });
    return await apiCall(`/users/${id}/timesheet?${params}`);
  },
};

// Notifications API
export const notificationsAPI = {
  getAll: async (): Promise<Notification[]> => {
    return await apiCall<Notification[]>('/notifications');
  },

  getById: async (id: string): Promise<Notification> => {
    return await apiCall<Notification>(`/notifications/${id}`);
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiCall(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  markAllAsRead: async (): Promise<void> => {
    await apiCall('/notifications/mark-all-read', {
      method: 'PUT',
    });
  },

  getUnreadCount: async (): Promise<number> => {
    return await apiCall<number>('/notifications/unread-count');
  },
};

// Reports API
export const reportsAPI = {
  getTimesheetReport: async (startDate: string, endDate: string, userId?: string, projectId?: string): Promise<any> => {
    const params = new URLSearchParams({ startDate, endDate });
    if (userId) params.append('userId', userId);
    if (projectId) params.append('projectId', projectId);
    return await apiCall(`/reports/timesheet?${params}`);
  },

  getDepartmentReport: async (departmentId: string, startDate: string, endDate: string): Promise<any> => {
    const params = new URLSearchParams({ startDate, endDate });
    return await apiCall(`/reports/department/${departmentId}?${params}`);
  },

  getTeamReport: async (teamId: string, startDate: string, endDate: string): Promise<any> => {
    const params = new URLSearchParams({ startDate, endDate });
    return await apiCall(`/reports/team/${teamId}?${params}`);
  },

  getProjectReport: async (projectId: string, startDate: string, endDate: string): Promise<any> => {
    const params = new URLSearchParams({ startDate, endDate });
    return await apiCall(`/reports/project/${projectId}?${params}`);
  },
};

// Settings API
export const settingsAPI = {
  getUserSettings: async (): Promise<any> => {
    return await apiCall('/settings/user');
  },

  updateUserSettings: async (settings: any): Promise<any> => {
    return await apiCall('/settings/user', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  getSystemSettings: async (): Promise<any[]> => {
    return await apiCall('/settings/system');
  },

  updateSystemSetting: async (key: string, value: string): Promise<any> => {
    return await apiCall('/settings/system', {
      method: 'PUT',
      body: JSON.stringify({ key, value }),
    });
  },
};

// Error handling
export const handleApiError = (error: any): void => {
  console.error('API Error:', error);
  
  if (error.message.includes('401')) {
    // Unauthorized - redirect to login
    authAPI.logout();
    window.location.href = '/login';
  }
  
  // You can add more error handling logic here
};

// Export all APIs
export const api = {
  auth: authAPI,
  timeEntries: timeEntriesAPI,
  projects: projectsAPI,
  products: productsAPI,
  departments: departmentsAPI,
  teams: teamsAPI,
  users: usersAPI,
  notifications: notificationsAPI,
  reports: reportsAPI,
  settings: settingsAPI,
  handleError: handleApiError,
};
