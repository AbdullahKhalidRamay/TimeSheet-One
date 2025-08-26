import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Users, Building, Award, Calendar, User, Clock, DollarSign, Download } from "lucide-react";
import Header from "@/components/dashboard/Header";
import { useUsers, useTeams, useTimeEntries, useProjects, useProducts, useDepartments } from "@/hooks/useData";
import { format } from "date-fns";

export default function TeamDetail() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();

  const { users } = useUsers();
  const { teams } = useTeams();
  const { timeEntries } = useTimeEntries();
  const { projects } = useProjects();
  const { products } = useProducts();
  const { departments } = useDepartments();

  const team = useMemo(() => {
    return teams.find(t => t.id === teamId);
  }, [teams, teamId]);

  const teamMembers = useMemo(() => {
    if (!team) return [];
    return users.filter(user => team.memberIds.includes(user.id));
  }, [users, team]);

  const teamLeader = useMemo(() => {
    if (!team?.leaderId) return null;
    return users.find(user => user.id === team.leaderId);
  }, [users, team]);

  const teamStats = useMemo(() => {
    if (!team || !teamMembers.length) return {
      totalActualHours: 0,
      totalBillableHours: 0,
      totalEntries: 0,
      averageHoursPerMember: 0
    };

    const memberIds = team.memberIds;
    const memberEntries = timeEntries.filter(entry => memberIds.includes(entry.userId));
    
    const totalActualHours = memberEntries.reduce((sum, entry) => sum + entry.actualHours, 0);
    const totalBillableHours = memberEntries.reduce((sum, entry) => sum + entry.billableHours, 0);
    const totalEntries = memberEntries.length;
    const averageHoursPerMember = teamMembers.length > 0 ? totalActualHours / teamMembers.length : 0;

    return {
      totalActualHours,
      totalBillableHours,
      totalEntries,
      averageHoursPerMember
    };
  }, [team, teamMembers, timeEntries]);

  const memberHoursBreakdown = useMemo(() => {
    if (!team || !teamMembers.length) return [];

    return teamMembers.map(member => {
      const memberEntries = timeEntries.filter(entry => entry.userId === member.id);
      
      // Group hours by project/product/department
      const hoursByProject = memberEntries.reduce((acc, entry) => {
        const projectName = entry.projectDetails.name;
        const category = entry.projectDetails.category;
        const key = `${category}:${projectName}`;
        
        if (!acc[key]) {
          acc[key] = {
            name: projectName,
            category: category,
            actualHours: 0,
            billableHours: 0
          };
        }
        
        acc[key].actualHours += entry.actualHours;
        acc[key].billableHours += entry.billableHours;
        
        return acc;
      }, {} as Record<string, { name: string; category: string; actualHours: number; billableHours: number }>);

      const totalActualHours = memberEntries.reduce((sum, entry) => sum + entry.actualHours, 0);
      const totalBillableHours = memberEntries.reduce((sum, entry) => sum + entry.billableHours, 0);

      return {
        member,
        totalActualHours,
        totalBillableHours,
        totalEntries: memberEntries.length,
        hoursBreakdown: Object.values(hoursByProject)
      };
    });
  }, [team, teamMembers, timeEntries]);

  if (!team) {
    return (
      <div className="dashboard-layout">
        <Header title="Team Not Found">
          <Button onClick={() => navigate('/reports')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Button>
        </Header>
        <div className="dashboard-content">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-lg text-muted-foreground">Team not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Header title={`${team.name} - Team Details`}>
        <Button onClick={() => navigate('/reports')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reports
        </Button>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </Header>

      <div className="dashboard-content">
        {/* Team Info Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{team.name}</h2>
                <p className="text-muted-foreground">{team.description || 'No description available'}</p>
                <div className="flex items-center space-x-4 mt-2">
                  {teamLeader && (
                    <Badge variant="outline">
                      <User className="mr-1 h-3 w-3" />
                      Leader: {teamLeader.name}
                    </Badge>
                  )}
                  <Badge variant="outline">
                    <Users className="mr-1 h-3 w-3" />
                    {teamMembers.length} members
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                  <p className="text-2xl font-bold">{teamStats.totalActualHours.toFixed(1)}h</p>
                  <p className="text-xs text-muted-foreground">{teamStats.totalEntries} entries</p>
                </div>
                <Clock className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Billable Hours</p>
                  <p className="text-2xl font-bold text-green-600">{teamStats.totalBillableHours.toFixed(1)}h</p>
                  <p className="text-xs text-muted-foreground">
                    {teamStats.totalActualHours > 0 ? `${Math.round((teamStats.totalBillableHours / teamStats.totalActualHours) * 100)}%` : '0%'} of total
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Hours/Member</p>
                  <p className="text-2xl font-bold text-orange-600">{teamStats.averageHoursPerMember.toFixed(1)}h</p>
                  <p className="text-xs text-muted-foreground">Per team member</p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Team Members</p>
                  <p className="text-2xl font-bold">{teamMembers.length}</p>
                  <p className="text-xs text-muted-foreground">Active members</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Associated Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Associated Projects</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {team.associatedProjects && team.associatedProjects.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {team.associatedProjects.map((projectId) => {
                    const project = projects.find(p => p.id === projectId);
                    return project ? (
                      <Badge key={projectId} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {project.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No projects assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Associated Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Associated Products</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {team.associatedProducts && team.associatedProducts.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {team.associatedProducts.map((productId) => {
                    const product = products.find(p => p.id === productId);
                    return product ? (
                      <Badge key={productId} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {product.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No products assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Associated Departments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Associated Departments</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {team.associatedDepartments && team.associatedDepartments.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {team.associatedDepartments.map((deptId) => {
                    const department = departments.find(d => d.id === deptId);
                    return department ? (
                      <Badge key={deptId} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        {department.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No departments assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Creation Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Creation Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created By</p>
                <p className="text-sm">{users.find(u => u.id === team.createdBy)?.name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created At</p>
                <p className="text-sm">{format(new Date(team.createdAt), 'PPP')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members with Hour Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Team Members with Hour Reports</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {memberHoursBreakdown.map((memberData) => (
                <div key={memberData.member.id} className="border rounded-lg p-4">
                  {/* Member Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {memberData.member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold">{memberData.member.name}</h3>
                        <p className="text-sm text-muted-foreground">{memberData.member.email}</p>
                        <p className="text-xs text-muted-foreground">Role: {memberData.member.role} • {memberData.member.jobTitle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        <p className="text-blue-600">Total Actual: {memberData.totalActualHours.toFixed(1)}h</p>
                        <p className="text-green-600">Total Billable: {memberData.totalBillableHours.toFixed(1)}h</p>
                        <p className="text-muted-foreground">{memberData.totalEntries} entries</p>
                      </div>
                    </div>
                  </div>

                  {/* Hours Breakdown by Project/Product/Department */}
                  {memberData.hoursBreakdown.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-700">Hours by Project/Product/Department:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {memberData.hoursBreakdown.map((project, index) => (
                          <div key={index} className="flex justify-between items-center text-sm bg-gray-50 p-3 rounded-lg border">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded text-white text-xs font-bold ${
                                project.category === 'project' ? 'bg-blue-600' :
                                project.category === 'product' ? 'bg-green-600' :
                                'bg-purple-600'
                              }`}>
                                {project.category === 'project' ? 'PROJECT' : 
                                 project.category === 'product' ? 'PRODUCT' : 'DEPT'}
                              </span>
                              <span className="font-medium">{project.name}</span>
                            </div>
                            <div className="flex space-x-3">
                              <span className="text-blue-700">Actual: {project.actualHours.toFixed(1)}h</span>
                              <span className="text-green-700">Billable: {project.billableHours.toFixed(1)}h</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded-lg">
                      No time entries found for this member
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
