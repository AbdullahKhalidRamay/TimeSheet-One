import React, { useState } from 'react';
import { getAllUsers } from '../lib/auth';
import { getTeams, getTimeEntries, getProjects, getProducts, getDepartments } from '../services/storage';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Users, Clock, DollarSign, BarChart3, Calendar, Building } from 'lucide-react';
import { User, Team } from '../validation';

const Reports = () => {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const users = getAllUsers();
  const teams = getTeams();
  const timeEntries = getTimeEntries();
  const projects = getProjects();
  const products = getProducts();
  const departments = getDepartments();

  const handleShowDetails = (teamId: string) => {
    setSelectedTeamId((prevId) => (prevId === teamId ? null : teamId));
  };

  const getUserStats = (userId: string) => {
    const userEntries = timeEntries.filter(entry => entry.userId === userId);
    const billableHours = userEntries.reduce((sum, entry) => sum + (entry.isBillable ? entry.totalHours : 0), 0);
    const totalHours = userEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
    const approvedEntries = userEntries.filter(entry => entry.status === 'approved');
    const pendingEntries = userEntries.filter(entry => entry.status === 'pending');
    
    return {
      totalHours: totalHours.toFixed(1),
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
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <BarChart3 className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Reports</h1>
      </div>

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

        <TabsContent value="members" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => {
              const stats = getUserStats(user.id);
              return (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{user.name}</CardTitle>
                      <Badge variant={user.role === 'owner' ? 'default' : user.role === 'manager' ? 'secondary' : 'outline'}>
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Total Hours</p>
                          <p className="font-semibold">{stats.totalHours}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Billable Hours</p>
                          <p className="font-semibold text-green-600">{stats.billableHours}</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-medium">{stats.totalEntries}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Approved</p>
                        <p className="font-medium text-green-600">{stats.approvedEntries}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pending</p>
                        <p className="font-medium text-orange-600">{stats.pendingEntries}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <div className="space-y-6">
            {teams.map((team) => {
              const { teamProjects, teamProducts, teamDepartments } = getTeamProjects(team);
              const teamLeader = users.find(user => user.id === team.leaderId);
              
              return (
                <Card key={team.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">{team.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{team.description}</p>
                        {teamLeader && (
                          <p className="text-sm font-medium">Team Leader: {teamLeader.name}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">
                          {team.memberIds.length} member{team.memberIds.length !== 1 ? 's' : ''}
                        </Badge>
                        <Button
                          variant={selectedTeamId === team.id ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => handleShowDetails(team.id)}
                          className="ml-2"
                        >
                          {selectedTeamId === team.id ? 'Hide Details' : 'Show Details'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Associated Projects/Products/Departments */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Projects ({teamProjects.length})</h4>
                        <div className="space-y-1">
                          {teamProjects.map(project => (
                            <Badge key={project.id} variant="outline" className="text-xs">
                              {project.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Products ({teamProducts.length})</h4>
                        <div className="space-y-1">
                          {teamProducts.map(product => (
                            <Badge key={product.id} variant="outline" className="text-xs">
                              {product.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Departments ({teamDepartments.length})</h4>
                        <div className="space-y-1">
                          {teamDepartments.map(department => (
                            <Badge key={department.id} variant="outline" className="text-xs">
                              {department.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Team Member Details */}
                    {selectedTeamId === team.id && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-3 flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>Team Members</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {team.memberIds.map((memberId) => {
                            const member = users.find((user) => user.id === memberId);
                            if (!member) return null;

                            const stats = getUserStats(member.id);

                            return (
                              <Card key={member.id} className="bg-muted/50">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <div>
                                      <h5 className="font-medium">{member.name}</h5>
                                      <p className="text-sm text-muted-foreground">{member.email}</p>
                                    </div>
                                    <Badge variant={member.id === team.leaderId ? 'default' : 'secondary'} className="text-xs">
                                      {member.id === team.leaderId ? 'Leader' : member.role}
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center space-x-2">
                                      <Clock className="h-3 w-3 text-blue-600" />
                                      <div>
                                        <p className="text-xs text-muted-foreground">Total Hours</p>
                                        <p className="font-medium">{stats.totalHours}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <DollarSign className="h-3 w-3 text-green-600" />
                                      <div>
                                        <p className="text-xs text-muted-foreground">Billable</p>
                                        <p className="font-medium text-green-600">{stats.billableHours}</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                                    <span>Entries: {stats.totalEntries}</span>
                                    <span>Approved: {stats.approvedEntries}</span>
                                    <span>Pending: {stats.pendingEntries}</span>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;

