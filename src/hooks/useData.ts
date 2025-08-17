import { useState, useEffect, useCallback, useMemo } from 'react';
import { getTimeEntries, getProjects, getProducts, getDepartments, getTeams, getNotifications, getApprovalHistory } from '@/services/storage';
import { getAllUsers } from '@/lib/auth';
import { TimeEntry, Project, Product, Department, Team, User, Notification, ApprovalAction } from '@/validation';

// Cache for storing data to avoid repeated localStorage reads
let timeEntriesCache: TimeEntry[] | null = null;
let projectsCache: Project[] | null = null;
let productsCache: Product[] | null = null;
let departmentsCache: Department[] | null = null;
let teamsCache: Team[] | null = null;
let usersCache: User[] | null = null;
let notificationsCache: { [userId: string]: Notification[] } = {};
let approvalHistoryCache: ApprovalAction[] | null = null;

// Cache invalidation function
export const invalidateCache = (type?: 'timeEntries' | 'projects' | 'products' | 'departments' | 'teams' | 'users' | 'notifications' | 'approvalHistory') => {
  if (!type) {
    // Invalidate all caches
    timeEntriesCache = null;
    projectsCache = null;
    productsCache = null;
    departmentsCache = null;
    teamsCache = null;
    usersCache = null;
    notificationsCache = {};
    approvalHistoryCache = null;
  } else {
    // Invalidate specific cache
    switch (type) {
      case 'timeEntries':
        timeEntriesCache = null;
        break;
      case 'projects':
        projectsCache = null;
        break;
      case 'products':
        productsCache = null;
        break;
      case 'departments':
        departmentsCache = null;
        break;
      case 'teams':
        teamsCache = null;
        break;
      case 'users':
        usersCache = null;
        break;
      case 'notifications':
        notificationsCache = {};
        break;
      case 'approvalHistory':
        approvalHistoryCache = null;
        break;
    }
  }
};

// Global cache invalidation function accessible from anywhere
if (typeof window !== 'undefined') {
  (window as any).invalidateCache = invalidateCache;
}

// Custom hook for time entries
export const useTimeEntries = () => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTimeEntries = useCallback(() => {
    if (timeEntriesCache === null) {
      timeEntriesCache = getTimeEntries();
    }
    setTimeEntries(timeEntriesCache);
    setLoading(false);
  }, []);

  const refreshTimeEntries = useCallback(() => {
    timeEntriesCache = null;
    loadTimeEntries();
  }, [loadTimeEntries]);

  useEffect(() => {
    loadTimeEntries();
  }, [loadTimeEntries]);

  return { timeEntries, loading, refreshTimeEntries };
};

// Custom hook for projects
export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = useCallback(() => {
    if (projectsCache === null) {
      projectsCache = getProjects();
    }
    setProjects(projectsCache);
    setLoading(false);
  }, []);

  const refreshProjects = useCallback(() => {
    projectsCache = null;
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return { projects, loading, refreshProjects };
};

// Custom hook for products
export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(() => {
    if (productsCache === null) {
      productsCache = getProducts();
    }
    setProducts(productsCache);
    setLoading(false);
  }, []);

  const refreshProducts = useCallback(() => {
    productsCache = null;
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return { products, loading, refreshProducts };
};

// Custom hook for departments
export const useDepartments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDepartments = useCallback(() => {
    if (departmentsCache === null) {
      departmentsCache = getDepartments();
    }
    setDepartments(departmentsCache);
    setLoading(false);
  }, []);

  const refreshDepartments = useCallback(() => {
    departmentsCache = null;
    loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  return { departments, loading, refreshDepartments };
};

// Custom hook for teams
export const useTeams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTeams = useCallback(() => {
    if (teamsCache === null) {
      teamsCache = getTeams();
    }
    setTeams(teamsCache);
    setLoading(false);
  }, []);

  const refreshTeams = useCallback(() => {
    teamsCache = null;
    loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  return { teams, loading, refreshTeams };
};

// Custom hook for users
export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(() => {
    if (usersCache === null) {
      usersCache = getAllUsers();
    }
    setUsers(usersCache);
    setLoading(false);
  }, []);

  const refreshUsers = useCallback(() => {
    usersCache = null;
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return { users, loading, refreshUsers };
};

// Custom hook for notifications
export const useNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(() => {
    if (!notificationsCache[userId]) {
      notificationsCache[userId] = getNotifications(userId);
    }
    setNotifications(notificationsCache[userId]);
    setLoading(false);
  }, [userId]);

  const refreshNotifications = useCallback(() => {
    delete notificationsCache[userId];
    loadNotifications();
  }, [userId, loadNotifications]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return { notifications, loading, refreshNotifications };
};

// Custom hook for approval history
export const useApprovalHistory = () => {
  const [approvalHistory, setApprovalHistory] = useState<ApprovalAction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadApprovalHistory = useCallback(() => {
    if (approvalHistoryCache === null) {
      approvalHistoryCache = getApprovalHistory();
    }
    setApprovalHistory(approvalHistoryCache);
    setLoading(false);
  }, []);

  const refreshApprovalHistory = useCallback(() => {
    approvalHistoryCache = null;
    loadApprovalHistory();
  }, [loadApprovalHistory]);

  useEffect(() => {
    loadApprovalHistory();
  }, [loadApprovalHistory]);

  return { approvalHistory, loading, refreshApprovalHistory };
};

// Combined hook for all data
export const useAllData = () => {
  const timeEntries = useTimeEntries();
  const projects = useProjects();
  const products = useProducts();
  const departments = useDepartments();
  const teams = useTeams();
  const users = useUsers();

  const loading = timeEntries.loading || projects.loading || products.loading || 
                  departments.loading || teams.loading || users.loading;

  const refreshAll = useCallback(() => {
    timeEntries.refreshTimeEntries();
    projects.refreshProjects();
    products.refreshProducts();
    departments.refreshDepartments();
    teams.refreshTeams();
    users.refreshUsers();
  }, [timeEntries, projects, products, departments, teams, users]);

  return {
    timeEntries: timeEntries.timeEntries,
    projects: projects.projects,
    products: products.products,
    departments: departments.departments,
    teams: teams.teams,
    users: users.users,
    loading,
    refreshAll
  };
};
