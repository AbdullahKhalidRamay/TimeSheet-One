import { API_CONFIG, buildApiUrl, getAuthHeaders } from '@/config/api';

// Types for API responses
export interface ApiResponse<T> {
  isSuccess: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    jobTitle: string;
    availableHours: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export interface TimeEntry {
  id: string;
  date: string;
  actualHours: number;
  billableHours: number;
  task: string;
  projectDetails: {
    category: string;
    name: string;
    task: string;
    description: string;
  };
  isBillable: boolean;
  userId: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  projectType: string;
  isBillable: boolean;
  status: string;
  clientName: string;
  clientEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  departmentId: string;
  leaderId: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  jobTitle: string;
  availableHours: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<ApiResponse<T>> {
  const url = buildApiUrl(endpoint);
  const headers = getAuthHeaders(token);
  
  const config: RequestInit = {
    headers,
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Authentication Service
export const authService = {
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return apiRequest<LoginResponse>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async logout(refreshToken: string, accessToken: string): Promise<ApiResponse<void>> {
    return apiRequest<void>(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }, accessToken);
  },

  async refreshToken(refreshToken: string): Promise<ApiResponse<LoginResponse>> {
    return apiRequest<LoginResponse>(API_CONFIG.ENDPOINTS.AUTH.REFRESH, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  async getCurrentUser(accessToken: string): Promise<ApiResponse<User>> {
    return apiRequest<User>(API_CONFIG.ENDPOINTS.AUTH.ME, {
      method: 'GET',
    }, accessToken);
  },
};

// Time Entries Service
export const timeEntriesService = {
  async getAll(accessToken: string): Promise<ApiResponse<TimeEntry[]>> {
    return apiRequest<TimeEntry[]>(API_CONFIG.ENDPOINTS.TIME_ENTRIES.LIST, {
      method: 'GET',
    }, accessToken);
  },

  async getById(id: string, accessToken: string): Promise<ApiResponse<TimeEntry>> {
    return apiRequest<TimeEntry>(API_CONFIG.ENDPOINTS.TIME_ENTRIES.BY_ID(id), {
      method: 'GET',
    }, accessToken);
  },

  async create(timeEntry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>, accessToken: string): Promise<ApiResponse<TimeEntry>> {
    return apiRequest<TimeEntry>(API_CONFIG.ENDPOINTS.TIME_ENTRIES.CREATE, {
      method: 'POST',
      body: JSON.stringify(timeEntry),
    }, accessToken);
  },

  async update(id: string, timeEntry: Partial<TimeEntry>, accessToken: string): Promise<ApiResponse<TimeEntry>> {
    return apiRequest<TimeEntry>(API_CONFIG.ENDPOINTS.TIME_ENTRIES.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(timeEntry),
    }, accessToken);
  },

  async delete(id: string, accessToken: string): Promise<ApiResponse<void>> {
    return apiRequest<void>(API_CONFIG.ENDPOINTS.TIME_ENTRIES.DELETE(id), {
      method: 'DELETE',
    }, accessToken);
  },

  async getByDate(date: string, accessToken: string): Promise<ApiResponse<TimeEntry[]>> {
    return apiRequest<TimeEntry[]>(API_CONFIG.ENDPOINTS.TIME_ENTRIES.BY_DATE(date), {
      method: 'GET',
    }, accessToken);
  },

  async getByUser(userId: string, accessToken: string): Promise<ApiResponse<TimeEntry[]>> {
    return apiRequest<TimeEntry[]>(API_CONFIG.ENDPOINTS.TIME_ENTRIES.BY_USER(userId), {
      method: 'GET',
    }, accessToken);
  },

  async getByProject(projectId: string, accessToken: string): Promise<ApiResponse<TimeEntry[]>> {
    return apiRequest<TimeEntry[]>(API_CONFIG.ENDPOINTS.TIME_ENTRIES.BY_PROJECT(projectId), {
      method: 'GET',
    }, accessToken);
  },

  async search(query: string, accessToken: string): Promise<ApiResponse<TimeEntry[]>> {
    const url = `${API_CONFIG.ENDPOINTS.TIME_ENTRIES.SEARCH}?q=${encodeURIComponent(query)}`;
    return apiRequest<TimeEntry[]>(url, {
      method: 'GET',
    }, accessToken);
  },
};

// Projects Service
export const projectsService = {
  async getAll(accessToken: string): Promise<ApiResponse<Project[]>> {
    return apiRequest<Project[]>(API_CONFIG.ENDPOINTS.PROJECTS.LIST, {
      method: 'GET',
    }, accessToken);
  },

  async getById(id: string, accessToken: string): Promise<ApiResponse<Project>> {
    return apiRequest<Project>(API_CONFIG.ENDPOINTS.PROJECTS.BY_ID(id), {
      method: 'GET',
    }, accessToken);
  },

  async create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>, accessToken: string): Promise<ApiResponse<Project>> {
    return apiRequest<Project>(API_CONFIG.ENDPOINTS.PROJECTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(project),
    }, accessToken);
  },

  async update(id: string, project: Partial<Project>, accessToken: string): Promise<ApiResponse<Project>> {
    return apiRequest<Project>(API_CONFIG.ENDPOINTS.PROJECTS.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(project),
    }, accessToken);
  },

  async delete(id: string, accessToken: string): Promise<ApiResponse<void>> {
    return apiRequest<void>(API_CONFIG.ENDPOINTS.PROJECTS.DELETE(id), {
      method: 'DELETE',
    }, accessToken);
  },
};

// Teams Service
export const teamsService = {
  async getAll(accessToken: string): Promise<ApiResponse<Team[]>> {
    return apiRequest<Team[]>(API_CONFIG.ENDPOINTS.TEAMS.LIST, {
      method: 'GET',
    }, accessToken);
  },

  async getById(id: string, accessToken: string): Promise<ApiResponse<Team>> {
    return apiRequest<Team>(API_CONFIG.ENDPOINTS.TEAMS.BY_ID(id), {
      method: 'GET',
    }, accessToken);
  },

  async create(team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>, accessToken: string): Promise<ApiResponse<Team>> {
    return apiRequest<Team>(API_CONFIG.ENDPOINTS.TEAMS.CREATE, {
      method: 'POST',
      body: JSON.stringify(team),
    }, accessToken);
  },

  async update(id: string, team: Partial<Team>, accessToken: string): Promise<ApiResponse<Team>> {
    return apiRequest<Team>(API_CONFIG.ENDPOINTS.TEAMS.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(team),
    }, accessToken);
  },

  async delete(id: string, accessToken: string): Promise<ApiResponse<void>> {
    return apiRequest<void>(API_CONFIG.ENDPOINTS.TEAMS.DELETE(id), {
      method: 'DELETE',
    }, accessToken);
  },
};

// Users Service
export const usersService = {
  async getAll(accessToken: string): Promise<ApiResponse<User[]>> {
    return apiRequest<User[]>(API_CONFIG.ENDPOINTS.USERS.LIST, {
      method: 'GET',
    }, accessToken);
  },

  async getById(id: string, accessToken: string): Promise<ApiResponse<User>> {
    return apiRequest<User>(API_CONFIG.ENDPOINTS.USERS.BY_ID(id), {
      method: 'GET',
    }, accessToken);
  },
};

// Export all services
export const apiService = {
  auth: authService,
  timeEntries: timeEntriesService,
  projects: projectsService,
  teams: teamsService,
  users: usersService,
};
