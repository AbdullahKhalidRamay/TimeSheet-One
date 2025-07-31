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