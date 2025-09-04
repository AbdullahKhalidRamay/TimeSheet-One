// API Configuration for TimeTraceOne Backend
export const API_CONFIG = {
  // Base URL for the TimeTraceOne backend
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5155',
  
  // API Endpoints
  ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout',
      REFRESH: '/api/auth/refresh',
      ME: '/api/auth/me',
    },
    
    // Users
    USERS: {
      LIST: '/api/users',
      BY_ID: (id: string) => `/api/users/${id}`,
      CREATE: '/api/users',
      UPDATE: (id: string) => `/api/users/${id}`,
      DELETE: (id: string) => `/api/users/${id}`,
      STATISTICS: (id: string) => `/api/users/${id}/statistics`,
      REPORTS: (id: string) => `/api/users/${id}/reports`,
      PROJECTS: (id: string) => `/api/users/${id}/projects`,
    },
    
    // Time Entries
    TIME_ENTRIES: {
      LIST: '/api/timeentries',
      BY_ID: (id: string) => `/api/timeentries/${id}`,
      CREATE: '/api/timeentries',
      UPDATE: (id: string) => `/api/timeentries/${id}`,
      DELETE: (id: string) => `/api/timeentries/${id}`,
      BY_DATE: (date: string) => `/api/timeentries/date/${date}`,
      BY_USER: (userId: string) => `/api/timeentries/user/${userId}`,
      BY_PROJECT: (projectId: string) => `/api/timeentries/project/${projectId}`,
      BY_RANGE: '/api/timeentries/range',
      STATUS: (date: string) => `/api/timeentries/status/${date}`,
      SEARCH: '/api/timeentries/search',
      FILTER: '/api/timeentries/filter',
      WEEKLY_UPDATE: (date: string) => `/api/timeentries/weekly/${date}`,
    },
    
    // Projects
    PROJECTS: {
      LIST: '/api/projects',
      BY_ID: (id: string) => `/api/projects/${id}`,
      CREATE: '/api/projects',
      UPDATE: (id: string) => `/api/projects/${id}`,
      DELETE: (id: string) => `/api/projects/${id}`,
      STATISTICS: (id: string) => `/api/projects/${id}/statistics`,
      TEAM: (id: string) => `/api/projects/${id}/team`,
      ADD_TEAM: (id: string) => `/api/projects/${id}/teams`,
      REMOVE_TEAM: (id: string, teamId: string) => `/api/projects/${id}/teams/${teamId}`,
    },
    
    // Teams
    TEAMS: {
      LIST: '/api/teams',
      BY_ID: (id: string) => `/api/teams/${id}`,
      CREATE: '/api/teams',
      UPDATE: (id: string) => `/api/teams/${id}`,
      DELETE: (id: string) => `/api/teams/${id}`,
      ADD_MEMBER: (id: string) => `/api/teams/${id}/members`,
      REMOVE_MEMBER: (id: string, userId: string) => `/api/teams/${id}/members/${userId}`,
      UPDATE_LEADER: (id: string) => `/api/teams/${id}/leader`,
      ASSOCIATE_PROJECT: (id: string) => `/api/teams/${id}/projects`,
      ASSOCIATE_PRODUCT: (id: string) => `/api/teams/${id}/products`,
      ASSOCIATE_DEPARTMENT: (id: string) => `/api/teams/${id}/departments`,
    },
    
    // Products
    PRODUCTS: {
      LIST: '/api/products',
      BY_ID: (id: string) => `/api/products/${id}`,
      CREATE: '/api/products',
      UPDATE: (id: string) => `/api/products/${id}`,
      DELETE: (id: string) => `/api/products/${id}`,
      STATISTICS: (id: string) => `/api/products/${id}/statistics`,
    },
    
    // Departments
    DEPARTMENTS: {
      LIST: '/api/departments',
      BY_ID: (id: string) => `/api/departments/${id}`,
      CREATE: '/api/departments',
      UPDATE: (id: string) => `/api/departments/${id}`,
      DELETE: (id: string) => `/api/departments/${id}`,
    },
    
    // Reports
    REPORTS: {
      USERS: '/api/reports/users',
      TEAMS: '/api/reports/teams',
      SYSTEM: '/api/reports/system',
      DEPARTMENT_PERFORMANCE: (id: string) => `/api/reports/departments/${id}`,
      PROJECT_PERFORMANCE: (id: string) => `/api/reports/projects/${id}`,
      EXPORT_CSV: '/api/reports/export/csv',
      EXPORT_PDF: '/api/reports/export/pdf',
      SEARCH: '/api/reports/search',
      TOP_PROJECTS: (id: string) => `/api/reports/departments/${id}/top-projects`,
    },
    
    // Notifications
    NOTIFICATIONS: {
      LIST: '/api/notifications',
      BY_ID: (id: string) => `/api/notifications/${id}`,
      CREATE: '/api/notifications',
      MARK_READ: (id: string) => `/api/notifications/${id}/read`,
      MARK_ALL_READ: '/api/notifications/read-all',
      DELETE: (id: string) => `/api/notifications/${id}`,
    },
    
    // Validation
    VALIDATION: {
      TIME_ENTRY: '/api/validation/time-entry',
      AVAILABLE_HOURS: (id: string) => `/api/validation/available-hours/${id}`,
      USER_ACCESS: (id: string) => `/api/validation/user-access/${id}`,
      TEAM_ACCESS: (id: string) => `/api/validation/team-access/${id}`,
      PROJECT_ACCESS: (id: string) => `/api/validation/project-access/${id}`,
    },
  },
  
  // Request timeout (30 seconds)
  TIMEOUT: 30000,
  
  // Default headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get auth headers
export const getAuthHeaders = (token?: string): Record<string, string> => {
  const headers = { ...API_CONFIG.DEFAULT_HEADERS };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};
