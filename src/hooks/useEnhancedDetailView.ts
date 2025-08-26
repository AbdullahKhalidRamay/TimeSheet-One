import { useState, useMemo } from 'react';
import { getTimeEntries } from '@/services/storage';
import { User, Team, Project, Product, Department, TimeEntry } from '@/validation/index';

export interface ExtendedUser extends User {
  actualHours?: number;
  availableHours?: number;
  billableHours?: number;
  approvedEntries?: number;
  pendingEntries?: number;
  totalEntries?: number;
}

export interface ExtendedTimeEntry extends TimeEntry {
  description?: string;
  userRole?: string;
}

export type DetailData = Team | ExtendedUser | ExtendedTimeEntry;

export interface DetailViewProps {
  data: DetailData | null;
  isOpen: boolean;
  onClose: () => void;
  teamMembers?: User[];
  projects?: Project[];
  products?: Product[];
  departments?: Department[];
}

export const useEnhancedDetailView = (data: DetailData | null) => {
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);

  // Type guards
  const isTeam = (data: DetailData): data is Team => {
    return data && 'memberIds' in data;
  };

  const isTimeEntry = (data: DetailData): data is ExtendedTimeEntry => {
    return data && 'projectDetails' in data;
  };

  const isExtendedUser = (data: DetailData): data is ExtendedUser => {
    return data && 'email' in data && !('projectDetails' in data);
  };

  // Calculate team statistics
  const teamStats = useMemo(() => {
    if (!isTeam(data)) return null;

    const timeEntries = getTimeEntries();
    const teamMemberEntries = timeEntries.filter(entry => 
      data.memberIds.includes(entry.userId)
    );

    const totalActualHours = teamMemberEntries.reduce((sum, entry) => 
      sum + (entry.actualHours || 0), 0
    );
    const totalBillableHours = teamMemberEntries.reduce((sum, entry) => 
      sum + (entry.billableHours || 0), 0
    );

    // Group hours by project/product/department
    const hoursByProject: { [key: string]: { actual: number; billable: number } } = {};
    
    teamMemberEntries.forEach(entry => {
      const projectKey = `${entry.projectDetails.category}:${entry.projectDetails.name}`;
      if (!hoursByProject[projectKey]) {
        hoursByProject[projectKey] = { actual: 0, billable: 0 };
      }
      hoursByProject[projectKey].actual += entry.actualHours || 0;
      hoursByProject[projectKey].billable += entry.billableHours || 0;
    });

    return {
      totalActualHours,
      totalBillableHours,
      hoursByProject,
      memberCount: data.memberIds.length,
      totalEntries: teamMemberEntries.length,
    };
  }, [data]);

  // Calculate user statistics
  const userStats = useMemo(() => {
    if (!isExtendedUser(data)) return null;

    const timeEntries = getTimeEntries();
    const userEntries = timeEntries.filter(entry => entry.userId === data.id);

    const actualHours = userEntries.reduce((sum, entry) => 
      sum + (entry.actualHours || 0), 0
    );
    const billableHours = userEntries.reduce((sum, entry) => 
      sum + (entry.billableHours || 0), 0
    );
    const availableHours = userEntries.reduce((sum, entry) => 
      sum + (entry.availableHours || 0), 0
    );

    const approvedEntries = userEntries.filter(entry => entry.status === 'approved').length;
    const pendingEntries = userEntries.filter(entry => entry.status === 'pending').length;
    const totalEntries = userEntries.length;

    return {
      actualHours,
      billableHours,
      availableHours,
      approvedEntries,
      pendingEntries,
      totalEntries,
    };
  }, [data]);

  // Filter associated projects/products/departments
  const getAssociatedProjects = (projects: Project[] = [], teamData?: Team) => {
    if (!teamData) return projects;
    return projects.filter(project => 
      teamData.projectIds?.includes(project.id) || 
      teamData.memberIds.some(memberId => 
        project.teamIds?.includes(memberId)
      )
    );
  };

  const getAssociatedProducts = (products: Product[] = [], teamData?: Team) => {
    if (!teamData) return products;
    return products.filter(product => 
      teamData.productIds?.includes(product.id) || 
      teamData.memberIds.some(memberId => 
        product.teamIds?.includes(memberId)
      )
    );
  };

  const getAssociatedDepartments = (departments: Department[] = [], teamData?: Team) => {
    if (!teamData) return departments;
    return departments.filter(department => 
      teamData.departmentIds?.includes(department.id) || 
      teamData.memberIds.some(memberId => 
        department.teamIds?.includes(memberId)
      )
    );
  };

  const openDetailView = () => setIsDetailViewOpen(true);
  const closeDetailView = () => setIsDetailViewOpen(false);

  return {
    isDetailViewOpen,
    openDetailView,
    closeDetailView,
    isTeam,
    isTimeEntry,
    isExtendedUser,
    teamStats,
    userStats,
    getAssociatedProjects,
    getAssociatedProducts,
    getAssociatedDepartments,
  };
};
