import { User, UserRole } from '@/types';

const CURRENT_USER_KEY = 'currentUser';
const USERS_KEY = 'users';

// Default users for demo
const defaultUsers: User[] = [
  {
    id: '1',
    name: 'John Owner',
    email: 'owner@company.com',
    role: 'owner',
    billableRate: 150,
    totalHours: 0,
    totalBillableHours: 0,
  },
  {
    id: '2',
    name: 'Jane Manager',
    email: 'manager@company.com',
    role: 'manager',
    billableRate: 100,
    totalHours: 0,
    totalBillableHours: 0,
  },
  {
    id: '3',
    name: 'Bob Finance',
    email: 'finance@company.com',
    role: 'finance_manager',
    billableRate: 80,
    totalHours: 0,
    totalBillableHours: 0,
  },
  {
    id: '4',
    name: 'Alice Employee',
    email: 'employee@company.com',
    role: 'employee',
    billableRate: 50,
    totalHours: 0,
    totalBillableHours: 0,
  },
];

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem(CURRENT_USER_KEY);
  if (!userStr) return null;
  return JSON.parse(userStr);
};

export const setCurrentUser = (user: User): void => {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
};

export const logout = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getAllUsers = (): User[] => {
  const usersStr = localStorage.getItem(USERS_KEY);
  if (!usersStr) {
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  return JSON.parse(usersStr);
};

export const updateUser = (user: User): void => {
  const users = getAllUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index !== -1) {
    users[index] = user;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};

export const initializeAuth = (): void => {
  // Initialize with default users if none exist
  const users = getAllUsers();
  if (users.length === 0) {
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  }
  
  // Set first user as current user for demo if none is set
  const currentUser = getCurrentUser();
  if (!currentUser && users.length > 0) {
    setCurrentUser(users[0]);
  }
};

// User settings and preferences
const USER_SETTINGS_KEY = 'userSettings';
const SESSION_KEY = 'userSession';

export interface UserSettings {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  defaultBreakTime: number;
  autoClockOut: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    approvals: boolean;
  };
}

export interface UserSession {
  userId: string;
  loginTime: string;
  lastActivity: string;
  expiresAt: string;
}

export const getUserSettings = (userId: string): UserSettings => {
  const settingsStr = localStorage.getItem(USER_SETTINGS_KEY);
  const allSettings = settingsStr ? JSON.parse(settingsStr) : {};
  
  return allSettings[userId] || {
    userId,
    theme: 'system',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    defaultBreakTime: 30,
    autoClockOut: false,
    notifications: {
      email: true,
      push: true,
      approvals: true
    }
  };
};

export const saveUserSettings = (settings: UserSettings): void => {
  try {
    const settingsStr = localStorage.getItem(USER_SETTINGS_KEY);
    const allSettings = settingsStr ? JSON.parse(settingsStr) : {};
    allSettings[settings.userId] = settings;
    localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(allSettings));
  } catch (error) {
    console.error('Error saving user settings:', error);
  }
};

// Session management
export const createSession = (userId: string): UserSession => {
  const session: UserSession = {
    userId,
    loginTime: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  };
  
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
};

export const getSession = (): UserSession | null => {
  try {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;
    
    const session = JSON.parse(sessionStr);
    
    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      clearSession();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error retrieving session:', error);
    return null;
  }
};

export const updateSessionActivity = (): void => {
  const session = getSession();
  if (session) {
    session.lastActivity = new Date().toISOString();
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
};

export const clearSession = (): void => {
  localStorage.removeItem(SESSION_KEY);
};

// Enhanced authentication
export const isAuthenticated = (): boolean => {
  const currentUser = getCurrentUser();
  const session = getSession();
  return !!(currentUser && session);
};

export const switchUser = (userId: string): boolean => {
  const users = getAllUsers();
  const user = users.find(u => u.id === userId);
  
  if (user) {
    setCurrentUser(user);
    createSession(userId);
    return true;
  }
  
  return false;
};

export const enhancedLogout = (): void => {
  logout();
  clearSession();
};

// User management utilities
export const addUser = (user: Omit<User, 'id'>): User => {
  const users = getAllUsers();
  const newUser: User = {
    ...user,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
  };
  
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return newUser;
};

export const deleteUser = (userId: string): boolean => {
  const users = getAllUsers();
  const filteredUsers = users.filter(u => u.id !== userId);
  
  if (filteredUsers.length < users.length) {
    localStorage.setItem(USERS_KEY, JSON.stringify(filteredUsers));
    
    // If deleting current user, logout
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      enhancedLogout();
    }
    
    return true;
  }
  
  return false;
};
