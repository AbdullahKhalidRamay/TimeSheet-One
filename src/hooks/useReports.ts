import { useState, useCallback, useMemo } from 'react';
import { getTimeEntries, getTeams, getProjects, getProducts, getDepartments } from '@/services/storage';
import { getAllUsers } from '@/lib/auth';
import { User, Team, Project, Product, Department, TimeEntry } from '@/validation/index';

export interface TeamReport {
  team: Team;
  totalMembers: number;
  totalActualHours: number;
  totalBillableHours: number;
  totalEntries: number;
  approvedEntries: number;
  pendingEntries: number;
}

export interface MemberReport {
  user: User;
  actualHours: number;
  availableHours: number;
  billableHours: number;
  approvedEntries: number;
  pendingEntries: number;
  totalEntries: number;
}

export const useReports = () => {
  const [activeTab, setActiveTab] = useState<'teams' | 'members'>('teams');
  const [viewingTeam, setViewingTeam] = useState<Team | null>(null);
  const [viewingMember, setViewingMember] = useState<User | null>(null);

  // Get all data
  const teams = useMemo(() => getTeams(), []);
  const projects = useMemo(() => getProjects(), []);
  const products = useMemo(() => getProducts(), []);
  const departments = useMemo(() => getDepartments(), []);
  const users = useMemo(() => getAllUsers(), []);
  const timeEntries = useMemo(() => getTimeEntries(), []);

  // Calculate team reports
  const teamReports = useMemo((): TeamReport[] => {
    return teams.map(team => {
      const teamMemberEntries = timeEntries.filter(entry => 
        team.memberIds.includes(entry.userId)
      );

      const totalActualHours = teamMemberEntries.reduce((sum, entry) => 
        sum + (entry.actualHours || 0), 0
      );
      const totalBillableHours = teamMemberEntries.reduce((sum, entry) => 
        sum + (entry.billableHours || 0), 0
      );
      const totalEntries = teamMemberEntries.length;
      const approvedEntries = teamMemberEntries.filter(entry => entry.status === 'approved').length;
      const pendingEntries = teamMemberEntries.filter(entry => entry.status === 'pending').length;

      return {
        team,
        totalMembers: team.memberIds.length,
        totalActualHours,
        totalBillableHours,
        totalEntries,
        approvedEntries,
        pendingEntries,
      };
    });
  }, [teams, timeEntries]);

  // Calculate member reports
  const memberReports = useMemo((): MemberReport[] => {
    return users.map(user => {
      const userEntries = timeEntries.filter(entry => entry.userId === user.id);

      const actualHours = userEntries.reduce((sum, entry) => 
        sum + (entry.actualHours || 0), 0
      );
      const billableHours = userEntries.reduce((sum, entry) => 
        sum + (entry.billableHours || 0), 0
      );
      const availableHours = userEntries.reduce((sum, entry) => 
        sum + (entry.availableHours || 0), 0
      );
      const totalEntries = userEntries.length;
      const approvedEntries = userEntries.filter(entry => entry.status === 'approved').length;
      const pendingEntries = userEntries.filter(entry => entry.status === 'pending').length;

      return {
        user,
        actualHours,
        availableHours,
        billableHours,
        approvedEntries,
        pendingEntries,
        totalEntries,
      };
    });
  }, [users, timeEntries]);

  // Get user statistics for detail view
  const getUserStats = useCallback((userId: string) => {
    const userEntries = timeEntries.filter(entry => entry.userId === userId);
    
    const actualHours = userEntries.reduce((sum, entry) => 
      sum + (entry.actualHours || 0), 0
    );
    const billableHours = userEntries.reduce((sum, entry) => 
      sum + (entry.billableHours || 0), 0
    );
    const availableHours = userEntries.reduce((sum, entry) => 
      sum + (entry.availableHours || 0), 0
    );
    const totalEntries = userEntries.length;
    const approvedEntries = userEntries.filter(entry => entry.status === 'approved').length;
    const pendingEntries = userEntries.filter(entry => entry.status === 'pending').length;

    return {
      actualHours,
      availableHours,
      billableHours,
      approvedEntries,
      pendingEntries,
      totalEntries,
    };
  }, [timeEntries]);

  // Get team projects
  const getTeamProjects = useCallback((team: Team) => {
    return projects.filter(project => 
      team.projectIds?.includes(project.id) || 
      team.memberIds.some(memberId => 
        project.teamIds?.includes(memberId)
      )
    );
  }, [projects]);

  // Get team products
  const getTeamProducts = useCallback((team: Team) => {
    return products.filter(product => 
      team.productIds?.includes(product.id) || 
      team.memberIds.some(memberId => 
        product.teamIds?.includes(memberId)
      )
    );
  }, [products]);

  // Get team departments
  const getTeamDepartments = useCallback((team: Team) => {
    return departments.filter(department => 
      team.departmentIds?.includes(department.id) || 
      team.memberIds.some(memberId => 
        department.teamIds?.includes(memberId)
      )
    );
  }, [departments]);

  // Handle team view
  const handleViewTeam = useCallback((team: Team) => {
    setViewingTeam(team);
  }, []);

  // Handle member view
  const handleViewMember = useCallback((user: User) => {
    const stats = getUserStats(user.id);
    setViewingMember({
      ...user,
      ...stats,
    } as User & typeof stats);
  }, [getUserStats]);

  // Close detail views
  const closeTeamView = useCallback(() => {
    setViewingTeam(null);
  }, []);

  const closeMemberView = useCallback(() => {
    setViewingMember(null);
  }, []);

  return {
    // State
    activeTab,
    viewingTeam,
    viewingMember,
    teamReports,
    memberReports,
    teams,
    projects,
    products,
    departments,
    users,
    timeEntries,

    // Actions
    setActiveTab,
    handleViewTeam,
    handleViewMember,
    closeTeamView,
    closeMemberView,
    getUserStats,
    getTeamProjects,
    getTeamProducts,
    getTeamDepartments,
  };
};
