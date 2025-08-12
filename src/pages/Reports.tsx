import React, { useState, useEffect } from 'react';
import { getAllUsers } from '@/lib/auth';
import { teamsAPI, timeEntriesAPI, projectsAPI, productsAPI, departmentsAPI } from '@/services/api';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DateRangePicker } from '@/components/ui/date-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Clock, DollarSign, Building, Download, Search, Trash2 } from 'lucide-react';
import { User, Team, TimeEntry, Project, Product, Department } from '@/validation';
import Header from '@/components/dashboard/Header';
import { DateRange } from 'react-day-picker';

const Reports = () => {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const users = getAllUsers();

  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [teamsData, timeEntriesData, projectsData, productsData, departmentsData] = await Promise.all([
          teamsAPI.getAll(),
          timeEntriesAPI.getAll(),
          projectsAPI.getAll(),
          productsAPI.getAll(),
          departmentsAPI.getAll()
        ]);
        
        setTeams(teamsData);
        setTimeEntries(timeEntriesData);
        setProjects(projectsData);
        setProducts(productsData);
        setDepartments(departmentsData);
      } catch (error) {
        console.error('Error loading reports data:', error);
        // Fallback to empty arrays if API fails
        setTeams([]);
        setTimeEntries([]);
        setProjects([]);
        setProducts([]);
        setDepartments([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery ||
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesTeam = teamFilter === 'all' || teams.some(team => team.memberIds.includes(user.id) && team.id === teamFilter);

    return matchesSearch && matchesRole && matchesTeam;
  });

  const handleShowDetails = (teamId: string) => {
    setSelectedTeamId((prevId) => (prevId === teamId ? null : teamId));
  };

  const handleDeleteTeam = async (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team && confirm(`Are you sure you want to delete the team "${team.name}"? This action cannot be undone.`)) {
      try {
        await teamsAPI.delete(teamId);
        // Update local state
        setTeams(prev => prev.filter(t => t.id !== teamId));
        // Close details if this team was expanded
        if (selectedTeamId === teamId) {
          setSelectedTeamId(null);
        }
        // Reset team filter if this team was selected
        if (teamFilter === teamId) {
          setTeamFilter('all');
        }
      } catch (error) {
        console.error('Error deleting team:', error);
        alert('Failed to delete team. Please try again.');
      }
    }
  };

  const getUserStats = (userId: string) => {
    let userEntries = timeEntries.filter(entry => entry.userId === userId);
    
    // Apply date filter if set
    if (dateRange && dateRange.from) {
      userEntries = userEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        const startDate = new Date(dateRange.from!);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateRange.to || dateRange.from);
        endDate.setHours(23, 59, 59, 999);
        return entryDate >= startDate && entryDate <= endDate;
      });
    }
    
    const actualHours = userEntries.reduce((sum, entry) => sum + (entry.actualHours || 0), 0);
    const billableHours = userEntries.reduce((sum, entry) => sum + (entry.isBillable ? (entry.billableHours || 0) : 0), 0);
    const availableHours = userEntries.length > 0 ? users.find(u => u.id === userId)?.availableHours || 0 : 0;
    const approvedEntries = userEntries.filter(entry => entry.status === 'approved');
    const pendingEntries = userEntries.filter(entry => entry.status === 'pending');
    
    return {
      actualHours: actualHours.toFixed(1),
      availableHours: availableHours.toFixed(1),
      billableHours: billableHours.toFixed(1),
      approvedEntries: approvedEntries.length,
      pendingEntries: pendingEntries.length,
      totalEntries: userEntries.length
    };
  };

  // Team-specific stats - only hours on team's projects/products/departments
  const getTeamUserStats = (userId: string, team: Team) => {
    const { teamProjects, teamProducts, teamDepartments } = getTeamProjects(team);
    
    // Get all project/product/department names associated with this team
    const teamProjectNames = teamProjects.map(p => p.name);
    const teamProductNames = teamProducts.map(p => p.name);
    const teamDepartmentNames = teamDepartments.map(d => d.name);
    
    let userEntries = timeEntries.filter(entry => {
      if (entry.userId !== userId) return false;
      
      // Check if the time entry is for a project/product/department associated with this team
      const projectName = entry.projectDetails.name;
      const category = entry.projectDetails.category;
      
      switch (category) {
        case 'project':
          return teamProjectNames.includes(projectName);
        case 'product':
          return teamProductNames.includes(projectName);
        case 'department':
          return teamDepartmentNames.includes(projectName);
        default:
          return false;
      }
    });
    
    // Apply date filter if set
    if (dateRange && dateRange.from) {
      userEntries = userEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        const startDate = new Date(dateRange.from!);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateRange.to || dateRange.from);
        endDate.setHours(23, 59, 59, 999);
        return entryDate >= startDate && entryDate <= endDate;
      });
    }
    
    const actualHours = userEntries.reduce((sum, entry) => sum + (entry.actualHours || 0), 0);
    const billableHours = userEntries.reduce((sum, entry) => sum + (entry.isBillable ? (entry.billableHours || 0) : 0), 0);
    const availableHours = userEntries.length > 0 ? users.find(u => u.id === userId)?.availableHours || 0 : 0;
    const approvedEntries = userEntries.filter(entry => entry.status === 'approved');
    const pendingEntries = userEntries.filter(entry => entry.status === 'pending');
    
    return {
      actualHours: actualHours.toFixed(1),
      availableHours: availableHours.toFixed(1),
      billableHours: billableHours.toFixed(1),
      approvedEntries: approvedEntries.length,
      pendingEntries: pendingEntries.length,
      totalEntries: userEntries.length
    };
  };

  const getTeamProjects = (team: Team) => {
    const teamProjects = projects.filter(p => team.associatedProjects.includes(p.id));
    const teamProducts = products.filter(p => team.associatedProducts.includes(p.id));
    const teamDepartments = departments.filter(d => team.associatedDepartments.includes(d.id));
    
    return { teamProjects, teamProducts, teamDepartments };
  };

  return (
    <div className="dashboard-layout">
      <Header 
        title="Reports"
      >
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </Header>

      <div className="dashboard-content">
        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="members" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Members</span>
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>Teams</span>
            </TabsTrigger>
          </TabsList>

        {/* Search Bar and Filters */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Date Range:</span>
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
                placeholder="Select date range"
                className="w-60"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <span className="text-sm text-muted-foreground">{filteredUsers.length} results</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Role:</span>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Team:</span>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map(team => (
                    <SelectItem value={team.id} key={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Members Report</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actual Hours</TableHead>
                    <TableHead className="text-right">Billable Hours</TableHead>
                    <TableHead className="text-right">Available Hours</TableHead>
                    <TableHead className="text-center">Entries</TableHead>
                    <TableHead className="text-center">Approved</TableHead>
                    <TableHead className="text-center">Pending</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const stats = getUserStats(user.id);
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'owner' ? 'default' : user.role === 'manager' ? 'secondary' : 'outline'}>
                            {user.role.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Clock className="h-3 w-3 text-orange-600" />
                            <span className="font-medium">{stats.actualHours}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <DollarSign className="h-3 w-3 text-green-600" />
                            <span className="font-medium text-green-600">{stats.billableHours}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Clock className="h-3 w-3 text-blue-600" />
                            <span className="font-medium">{user.availableHours ? user.availableHours.toFixed(1) : '0.0'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{stats.totalEntries}</TableCell>
                        <TableCell className="text-center">
                          <span className="text-green-600 font-medium">{stats.approvedEntries}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-orange-600 font-medium">{stats.pendingEntries}</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teams Report</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Leader</TableHead>
                    <TableHead className="text-center">Members</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Departments</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team) => {
                    const { teamProjects, teamProducts, teamDepartments } = getTeamProjects(team);
                    const teamLeader = users.find(user => user.id === team.leaderId);
                    
                    return (
                      <TableRow key={team.id}>
                        <TableCell>
                          <div className="font-medium">{team.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground max-w-xs truncate">
                            {team.description || 'No description'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {teamLeader ? (
                            <div className="flex items-center space-x-2">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                {teamLeader.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                              <span className="text-sm">{teamLeader.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No leader</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {team.memberIds.length}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {teamProjects.length > 0 ? (
                              teamProjects.slice(0, 2).map(project => (
                                <Badge key={project.id} variant="outline" className="text-xs">
                                  {project.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">None</span>
                            )}
                            {teamProjects.length > 2 && (
                              <Badge variant="outline" className="text-xs">+{teamProjects.length - 2}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {teamProducts.length > 0 ? (
                              teamProducts.slice(0, 2).map(product => (
                                <Badge key={product.id} variant="outline" className="text-xs">
                                  {product.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">None</span>
                            )}
                            {teamProducts.length > 2 && (
                              <Badge variant="outline" className="text-xs">+{teamProducts.length - 2}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {teamDepartments.length > 0 ? (
                              teamDepartments.slice(0, 2).map(department => (
                                <Badge key={department.id} variant="outline" className="text-xs">
                                  {department.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">None</span>
                            )}
                            {teamDepartments.length > 2 && (
                              <Badge variant="outline" className="text-xs">+{teamDepartments.length - 2}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              variant={selectedTeamId === team.id ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => handleShowDetails(team.id)}
                            >
                              {selectedTeamId === team.id ? 'Hide' : 'Details'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteTeam(team.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {/* Team Member Details - Show below table when expanded */}
              {selectedTeamId && (
                <div className="mt-6 border-t pt-6">
                  {teams.filter(team => team.id === selectedTeamId).map(team => (
                    <div key={team.id}>
                      <h4 className="font-semibold mb-4 flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>Team Members - {team.name}</span>
                      </h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actual Hours</TableHead>
                            <TableHead className="text-right">Billable Hours</TableHead>
                            <TableHead className="text-right">Available Hours</TableHead>
                            <TableHead className="text-center">Entries</TableHead>
                            <TableHead className="text-center">Approved</TableHead>
                            <TableHead className="text-center">Pending</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {team.memberIds.map((memberId) => {
                            const member = users.find((user) => user.id === memberId);
                            if (!member) return null;

                            const stats = getTeamUserStats(member.id, team);

                            return (
                              <TableRow key={member.id}>
                                <TableCell>
                                  <div className="flex items-center space-x-3">
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                      {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </div>
                                    <span className="font-medium">{member.name}</span>
                                    {member.id === team.leaderId && (
                                      <Badge variant="default" className="text-xs ml-2">Leader</Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{member.email}</TableCell>
                                <TableCell>
                                  <Badge variant={member.role === 'owner' ? 'default' : member.role === 'manager' ? 'secondary' : 'outline'}>
                                    {member.role}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end space-x-1">
                                    <Clock className="h-3 w-3 text-orange-600" />
                                    <span className="font-medium">{stats.actualHours}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end space-x-1">
                                    <DollarSign className="h-3 w-3 text-green-600" />
                                    <span className="font-medium text-green-600">{stats.billableHours}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end space-x-1">
                                    <Clock className="h-3 w-3 text-blue-600" />
                                    <span className="font-medium">{stats.availableHours}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">{stats.totalEntries}</TableCell>
                                <TableCell className="text-center">
                                  <span className="text-green-600 font-medium">{stats.approvedEntries}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="text-orange-600 font-medium">{stats.pendingEntries}</span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default Reports;

