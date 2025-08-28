import { toast } from "@/components/ui/sonner";
import { getCurrentUser } from "@/lib/auth";
import { rolePermissions, UserRole } from "@/validation/index";

export interface PermissionCheck {
  canViewAllTimesheets: boolean;
  canEditOthersTimesheets: boolean;
  canViewBillableRates: boolean;
  canManageProjects: boolean;
  canManageTeams: boolean;
  canApproveEntries: boolean;
  canViewApprovalHistory: boolean;
  canReapprove: boolean;
}

export const checkPermission = (permission: keyof PermissionCheck): boolean => {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  const permissions = rolePermissions[currentUser.role as UserRole];
  return permissions[permission];
};

export const checkPermissionWithToast = (
  permission: keyof PermissionCheck, 
  action: string,
  requiredRole?: UserRole
): boolean => {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    toast.error("You must be logged in to perform this action");
    return false;
  }
  
  const hasPermission = checkPermission(permission);
  
  if (!hasPermission) {
    const roleMessage = requiredRole 
      ? `This action requires ${requiredRole} role or higher`
      : "You don't have permission to perform this action";
    
    toast.error(`${roleMessage}. ${action} is not available for your current role.`);
    return false;
  }
  
  return true;
};

export const checkTimeEntryPermission = (
  entryUserId: string,
  entryStatus: string,
  action: 'edit' | 'delete'
): boolean => {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    toast.error("You must be logged in to perform this action");
    return false;
  }
  
  // Owner can do anything
  if (currentUser.role === 'owner') return true;
  
  // Manager can edit/delete pending entries
  if (currentUser.role === 'manager' && entryStatus === 'pending') return true;
  
  // Users can only edit/delete their own pending entries
  if (entryUserId === currentUser.id && entryStatus === 'pending') return true;
  
  const actionText = action === 'edit' ? 'edit' : 'delete';
  const statusText = entryStatus === 'pending' ? 'pending' : 'approved/rejected';
  
  if (entryUserId !== currentUser.id) {
    toast.error(`You can only ${actionText} your own time entries`);
  } else if (entryStatus !== 'pending') {
    toast.error(`You can only ${actionText} ${statusText} entries`);
  } else {
    toast.error(`You don't have permission to ${actionText} this entry`);
  }
  
  return false;
};

export const getPermissionMessage = (permission: keyof PermissionCheck): string => {
  const permissionMessages: Record<keyof PermissionCheck, string> = {
    canViewAllTimesheets: "View all timesheets",
    canEditOthersTimesheets: "Edit others' timesheets",
    canViewBillableRates: "View billable rates",
    canManageProjects: "Manage projects",
    canManageTeams: "Manage teams",
    canApproveEntries: "Approve time entries",
    canViewApprovalHistory: "View approval history",
    canReapprove: "Reapprove entries"
  };
  
  return permissionMessages[permission];
};
