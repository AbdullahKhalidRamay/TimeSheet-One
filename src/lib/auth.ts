import { User, UserRole } from '@/validation/index';

const CURRENT_USER_KEY = 'currentUser';
const USERS_KEY = 'users';

// Default users for demo
const defaultUsers: User[] = [
  // 3 Owners
  {
    id: '1',
    name: 'John Mitchell',
    email: 'ceo@company.com',
    role: 'owner',
    jobTitle: 'CEO',
    billableRate: 200,
    availableHours: 8,
    totalBillableHours: 0,
  },
  {
    id: '2',
    name: 'Sarah Williams',
    email: 'president@company.com',
    role: 'owner',
    jobTitle: 'President',
    billableRate: 180,
    availableHours: 8,
    totalBillableHours: 0,
  },
  {
    id: '3',
    name: 'Michael Chen',
    email: 'vp@company.com',
    role: 'owner',
    jobTitle: 'VP',
    billableRate: 170,
    availableHours: 8,
    totalBillableHours: 0,
  },
  // 6 Managers
  {
    id: '4',
    name: 'Jessica Rodriguez',
    email: 'finance.manager@company.com',
    role: 'manager',
    jobTitle: 'Finance Manager',
    billableRate: 120,
    availableHours: 8,
    totalBillableHours: 0,
  },
  {
    id: '5',
    name: 'David Thompson',
    email: 'it.manager@company.com',
    role: 'manager',
    jobTitle: 'IT Manager',
    billableRate: 130,
    availableHours: 8,
    totalBillableHours: 0,
  },
  {
    id: '6',
    name: 'Lisa Anderson',
    email: 'sales.manager@company.com',
    role: 'manager',
    jobTitle: 'Sales Manager',
    billableRate: 110,
    availableHours: 8,
    totalBillableHours: 0,
  },
  {
    id: '7',
    name: 'Robert Johnson',
    email: 'marketing.manager@company.com',
    role: 'manager',
    jobTitle: 'Marketing Manager',
    billableRate: 115,
    availableHours: 8,
    totalBillableHours: 0,
  },
  {
    id: '8',
    name: 'Amanda Davis',
    email: 'hr.manager@company.com',
    role: 'manager',
    jobTitle: 'HR Manager',
    billableRate: 105,
    availableHours: 8,
    totalBillableHours: 0,
  },
  {
    id: '9',
    name: 'Kevin Brown',
    email: 'team.lead@company.com',
    role: 'manager',
    jobTitle: 'Team Lead',
    billableRate: 95,
    availableHours: 8,
    totalBillableHours: 0,
  },
  // 10 Employees
  {
    id: '10',
    name: 'Emily Wilson',
    email: 'emily.wilson@company.com',
    role: 'employee',
    jobTitle: 'IT Employee',
    billableRate: 75,
    availableHours: 8,
    totalBillableHours: 0,
  },
  {
    id: '11',
    name: 'James Garcia',
    email: 'james.garcia@company.com',
    role: 'employee',
    jobTitle: 'Sales Employee',
    billableRate: 65,
    availableHours: 8,
    totalBillableHours: 0,
  },
  {
    id: '12',
    name: 'Maria Lopez',
    email: 'maria.lopez@company.com',
    role: 'employee',
    jobTitle: 'Marketing Employee',
    billableRate: 70,
    availableHours: 8,
    totalBillableHours: 0,
  },
  {
    id: '13',
    name: 'Christopher Taylor',
    email: 'chris.taylor@company.com',
    role: 'employee',
    jobTitle: 'HR Employee',
    billableRate: 60,
    availableHours: 8,
    totalBillableHours: 0,
  },
  {
    id: '14',
    name: 'Jennifer Martinez',
    email: 'jennifer.martinez@company.com',
    role: 'employee',
    jobTitle: 'Finance Employee',
    billableRate: 68,
    availableHours: 8,
    totalBillableHours: 0,
  },
  {
    id: '15',
    name: 'Daniel White',
    email: 'daniel.white@company.com',
    role: 'employee',
    jobTitle: 'Customer Service Employee',
    billableRate: 50,
    availableHours: 8,
    totalBillableHours: 0,
  },
  {
    id: '16',
    name: 'Ashley Jackson',
    email: 'ashley.jackson@company.com',
    role: 'employee',
    jobTitle: 'Operations Employee',
    billableRate: 55,
    availableHours: 8,
    totalBillableHours: 0,
  },
  {
    id: '17',
    name: 'Matthew Harris',
    email: 'matthew.harris@company.com',
    role: 'employee',
    jobTitle: 'Data Analyst',
    billableRate: 80,
    availableHours: 8,
    totalBillableHours: 0,
  },
  {
    id: '18',
    name: 'Nicole Clark',
    email: 'nicole.clark@company.com',
    role: 'employee',
    jobTitle: 'Software Developer',
    billableRate: 85,
    availableHours: 8,
    totalBillableHours: 0,
  },
  {
    id: '19',
    name: 'Ryan Lewis',
    email: 'ryan.lewis@company.com',
    role: 'employee',
    jobTitle: 'Business Analyst',
    billableRate: 78,
    availableHours: 8,
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
  try {
    // Check if we have users and if they have the new jobTitle field
    const usersStr = localStorage.getItem(USERS_KEY);
    let users = usersStr ? JSON.parse(usersStr) : [];
    
    // Check if users have the new jobTitle field, if not, reset the data
    if (users.length > 0 && !users[0].jobTitle) {
      console.log('Migrating user data to new structure with jobTitle...');
      localStorage.removeItem(USERS_KEY);
      localStorage.removeItem(CURRENT_USER_KEY);
      users = [];
    }
    
    // Check if users have zero availableHours (old data), if so, reset the data
    if (users.length > 0 && users[0].availableHours === 0) {
      console.log('Migrating user data to new structure with availableHours...');
      localStorage.removeItem(USERS_KEY);
      localStorage.removeItem(CURRENT_USER_KEY);
      users = [];
    }
    
    // Initialize with default users if none exist or after migration
    if (users.length === 0) {
      localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
      users = defaultUsers;
    }
    
    // Set first user as current user for demo if none is set
    const currentUser = getCurrentUser();
    if (!currentUser && users.length > 0) {
      setCurrentUser(users[0]);
    }
    
    console.log(`Initialized with ${users.length} users`);
  } catch (error) {
    console.error('Error initializing auth:', error);
    // If there's any error, reset everything
    localStorage.removeItem(USERS_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    setCurrentUser(defaultUsers[0]);
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
