export type UserRole = 'employee' | 'finance_manager' | 'manager' | 'owner';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  billableRate?: number;
  totalHours: number;
  totalBillableHours: number;
}

export interface TimeEntry {
  id: string;
  userId: string;
  userName: string;
  date: string;
  clockIn: string;
  clockOut: string;
  breakTime: number;
  totalHours: number;
  task: string;
  projectDetails: ProjectDetail;
  isBillable: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetail {
  category: 'project' | 'product' | 'department';
  name: string;
  level?: string;
  stage?: string;
  function?: string;
  task: string;
  subtask?: string;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  levels: ProjectLevel[];
  isBillable: boolean;
  createdBy: string;
  createdAt: string;
}

export interface ProjectLevel {
  id: string;
  name: string;
  tasks: ProjectTask[];
}

export interface ProjectTask {
  id: string;
  name: string;
  description: string;
  subtasks: ProjectSubtask[];
}

export interface ProjectSubtask {
  id: string;
  name: string;
  description: string;
}

export interface Product {
  id: string;
  name: string;
  stages: ProductStage[];
  isBillable: boolean;
  createdBy: string;
  createdAt: string;
}

export interface ProductStage {
  id: string;
  name: string;
  tasks: ProductTask[];
}

export interface ProductTask {
  id: string;
  name: string;
  description: string;
  subtasks: ProductSubtask[];
}

export interface ProductSubtask {
  id: string;
  name: string;
  description: string;
}

export interface Department {
  id: string;
  name: string;
  functions: DepartmentFunction[];
  isBillable: boolean;
  createdBy: string;
  createdAt: string;
}

export interface DepartmentFunction {
  id: string;
  name: string;
  duties: DepartmentDuty[];
}

export interface DepartmentDuty {
  id: string;
  name: string;
  description: string;
  subduties: DepartmentSubduty[];
}

export interface DepartmentSubduty {
  id: string;
  name: string;
  description: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  memberIds: string[];
  leaderId?: string;
  associatedProjects: string[];
  associatedProducts: string[];
  associatedDepartments: string[];
  createdBy: string;
  createdAt: string;
}

export interface TeamMember {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  joinedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'status_change' | 'approval' | 'rejection' | 'daily_reminder' | 'weekly_reminder';
  isRead: boolean;
  createdAt: string;
  relatedEntryId?: string;
}

export interface ApprovalAction {
  id: string;
  entryId: string;
  previousStatus: string;
  newStatus: 'approved' | 'rejected';
  message: string;
  approvedBy: string;
  approvedAt: string;
}

export interface RolePermissions {
  canViewAllTimesheets: boolean;
  canEditOthersTimesheets: boolean;
  canViewBillableRates: boolean;
  canManageProjects: boolean;
  canManageTeams: boolean;
  canApproveEntries: boolean;
  canViewApprovalHistory: boolean;
  canReapprove: boolean;
}

export const rolePermissions: Record<UserRole, RolePermissions> = {
  employee: {
    canViewAllTimesheets: false,
    canEditOthersTimesheets: false,
    canViewBillableRates: false,
    canManageProjects: false,
    canManageTeams: false,
    canApproveEntries: false,
    canViewApprovalHistory: false,
    canReapprove: false,
  },
  finance_manager: {
    canViewAllTimesheets: true,
    canEditOthersTimesheets: false,
    canViewBillableRates: true,
    canManageProjects: true,
    canManageTeams: true,
    canApproveEntries: false,
    canViewApprovalHistory: false,
    canReapprove: false,
  },
  manager: {
    canViewAllTimesheets: true,
    canEditOthersTimesheets: false,
    canViewBillableRates: false,
    canManageProjects: true,
    canManageTeams: true,
    canApproveEntries: true,
    canViewApprovalHistory: true,
    canReapprove: false,
  },
  owner: {
    canViewAllTimesheets: true,
    canEditOthersTimesheets: true,
    canViewBillableRates: true,
    canManageProjects: true,
    canManageTeams: true,
    canApproveEntries: true,
    canViewApprovalHistory: true,
    canReapprove: true,
  },
};