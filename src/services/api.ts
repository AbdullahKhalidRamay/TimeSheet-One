import { TimeEntry, Project, Product, Department, Team, User, ProjectDetail, Notification } from '@/validation/index';
import { Reminder } from '@/services/reminderService';

const API_BASE_URL = 'http://localhost:5001/api';

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }
  return response.json();
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Authentication API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await handleResponse(response);
    localStorage.setItem('authToken', data.token);
    return data;
  },

  register: async (userData: { username: string; email: string; password: string }) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },

  logout: () => {
    localStorage.removeItem('authToken');
  }
};

// Projects API
export const projectsAPI = {
  getAll: async (): Promise<Project[]> => {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getById: async (id: string): Promise<Project> => {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  create: async (project: Partial<Project>): Promise<Project> => {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(project)
    });
    return handleResponse(response);
  },

  update: async (id: string, project: Partial<Project>): Promise<Project> => {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(project)
    });
    return handleResponse(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getLevels: async (projectId: string): Promise<ProjectLevel[]> => {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/levels`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getTasks: async (projectId: string, levelId: string): Promise<ProjectTask[]> => {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/levels/${levelId}/tasks`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getSubtasks: async (projectId: string, levelId: string, taskId: string): Promise<ProjectSubtask[]> => {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/levels/${levelId}/tasks/${taskId}/subtasks`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Products API
export const productsAPI = {
  getAll: async (): Promise<Product[]> => {
    const response = await fetch(`${API_BASE_URL}/products`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getById: async (id: string): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  create: async (product: Partial<Product>): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(product)
    });
    return handleResponse(response);
  },

  update: async (id: string, product: Partial<Product>): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(product)
    });
    return handleResponse(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getStages: async (productId: string): Promise<ProductStage[]> => {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/stages`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getTasks: async (productId: string, stageId: string): Promise<ProductTask[]> => {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/stages/${stageId}/tasks`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getSubtasks: async (productId: string, stageId: string, taskId: string): Promise<ProductSubtask[]> => {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/stages/${stageId}/tasks/${taskId}/subtasks`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Departments API
export const departmentsAPI = {
  getAll: async (): Promise<Department[]> => {
    const response = await fetch(`${API_BASE_URL}/departments`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getById: async (id: string): Promise<Department> => {
    const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  create: async (department: Partial<Department>): Promise<Department> => {
    const response = await fetch(`${API_BASE_URL}/departments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(department)
    });
    return handleResponse(response);
  },

  update: async (id: string, department: Partial<Department>): Promise<Department> => {
    const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(department)
    });
    return handleResponse(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getFunctions: async (departmentId: string): Promise<DepartmentFunction[]> => {
    const response = await fetch(`${API_BASE_URL}/departments/${departmentId}/functions`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getDuties: async (departmentId: string, functionId: string): Promise<DepartmentDuty[]> => {
    const response = await fetch(`${API_BASE_URL}/departments/${departmentId}/functions/${functionId}/duties`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getSubduties: async (departmentId: string, functionId: string, dutyId: string): Promise<DepartmentSubduty[]> => {
    const response = await fetch(`${API_BASE_URL}/departments/${departmentId}/functions/${functionId}/duties/${dutyId}/subduties`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Teams API
export const teamsAPI = {
  getAll: async (): Promise<Team[]> => {
    const response = await fetch(`${API_BASE_URL}/teams`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getById: async (id: string): Promise<Team> => {
    const response = await fetch(`${API_BASE_URL}/teams/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  create: async (team: Partial<Team>): Promise<Team> => {
    const response = await fetch(`${API_BASE_URL}/teams`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(team)
    });
    return handleResponse(response);
  },

  update: async (id: string, team: Partial<Team>): Promise<Team> => {
    const response = await fetch(`${API_BASE_URL}/teams/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(team)
    });
    return handleResponse(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/teams/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  assignProject: async (teamId: string, projectId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/projects/${projectId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  removeProject: async (teamId: string, projectId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/projects/${projectId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  assignProduct: async (teamId: string, productId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/products/${productId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  removeProduct: async (teamId: string, productId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/products/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  assignDepartment: async (teamId: string, departmentId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/departments/${departmentId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  removeDepartment: async (teamId: string, departmentId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/departments/${departmentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Time Entries API
export const timeEntriesAPI = {
  getAll: async (): Promise<TimeEntry[]> => {
    const response = await fetch(`${API_BASE_URL}/timeentries`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getById: async (id: string): Promise<TimeEntry> => {
    const response = await fetch(`${API_BASE_URL}/timeentries/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  create: async (timeEntry: Partial<TimeEntry>): Promise<TimeEntry> => {
    const response = await fetch(`${API_BASE_URL}/timeentries`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(timeEntry)
    });
    return handleResponse(response);
  },

  update: async (id: string, timeEntry: Partial<TimeEntry>): Promise<TimeEntry> => {
    const response = await fetch(`${API_BASE_URL}/timeentries/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(timeEntry)
    });
    return handleResponse(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/timeentries/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getByUser: async (userId: string): Promise<TimeEntry[]> => {
    const response = await fetch(`${API_BASE_URL}/timeentries/user/${userId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getByDateRange: async (startDate: string, endDate: string): Promise<TimeEntry[]> => {
    const response = await fetch(`${API_BASE_URL}/timeentries/range?startDate=${startDate}&endDate=${endDate}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Users API
export const usersAPI = {
  getAll: async (): Promise<User[]> => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getById: async (id: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  update: async (id: string, user: Partial<User>): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(user)
    });
    return handleResponse(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Reminders API
export const remindersAPI = {
  getAll: async (): Promise<Reminder[]> => {
    const response = await fetch(`${API_BASE_URL}/reminders`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getById: async (id: string): Promise<Reminder> => {
    const response = await fetch(`${API_BASE_URL}/reminders/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getUnread: async (userId?: string): Promise<Reminder[]> => {
    const url = userId ? `${API_BASE_URL}/reminders/unread?userId=${userId}` : `${API_BASE_URL}/reminders/unread`;
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  create: async (reminder: Partial<Reminder>): Promise<Reminder> => {
    const response = await fetch(`${API_BASE_URL}/reminders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(reminder)
    });
    return handleResponse(response);
  },

  update: async (id: string, reminder: Partial<Reminder>): Promise<Reminder> => {
    const response = await fetch(`${API_BASE_URL}/reminders/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(reminder)
    });
    return handleResponse(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/reminders/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  markAsRead: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/reminders/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  markAllAsRead: async (userId?: string): Promise<void> => {
    const url = userId ? `${API_BASE_URL}/reminders/mark-all-read?userId=${userId}` : `${API_BASE_URL}/reminders/mark-all-read`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Notifications API
export const notificationsAPI = {
  getAll: async (): Promise<Notification[]> => {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getById: async (id: string): Promise<Notification> => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getUnread: async (userId?: string): Promise<Notification[]> => {
    const url = userId ? `${API_BASE_URL}/notifications/unread?userId=${userId}` : `${API_BASE_URL}/notifications/unread`;
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  create: async (notification: Partial<Notification>): Promise<Notification> => {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(notification)
    });
    return handleResponse(response);
  },

  update: async (id: string, notification: Partial<Notification>): Promise<Notification> => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(notification)
    });
    return handleResponse(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  markAsRead: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  markAllAsRead: async (userId?: string): Promise<void> => {
    const url = userId ? `${API_BASE_URL}/notifications/mark-all-read?userId=${userId}` : `${API_BASE_URL}/notifications/mark-all-read`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};
