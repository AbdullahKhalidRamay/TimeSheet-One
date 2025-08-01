import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, DollarSign, UserPlus, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import Header from "@/components/layout/Header";
import { getAllUsers, getCurrentUser } from "@/utils/auth";
import { User } from "@/types";
import { rolePermissions, Team, Project } from "@/types";
import CreateTeamForm from "@/components/forms/CreateTeamForm";
import { getTeams, getProjects, deleteTeam } from "@/utils/storage";

export default function Teams() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isCreateTeamOpen, setCreateTeamOpen] = useState(false);
  const currentUser = getCurrentUser();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(getAllUsers());
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || statusFilter === 'active'; // Assume all users are active for now
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner": return "bg-role-owner text-white";
      case "manager": return "bg-role-manager text-white";
      case "finance_manager": return "bg-role-finance text-white";
      case "employee": return "bg-role-employee text-white";
      default: return "bg-muted";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "finance_manager": return "Finance Manager";
      case "manager": return "Manager";
      case "owner": return "Owner";
      case "employee": return "Employee";
      default: return role;
    }
  };

  const [teams, setTeams] = useState<Team[]>([]);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const permissions = rolePermissions[currentUser?.role || 'employee'];

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = () => {
    setTeams(getTeams());
  };

  const toggleTeam = (teamId: string) => {
    setExpandedTeamId(prev => (prev === teamId ? null : teamId));
  };

  const handleDeleteTeam = (teamId: string) => {
    if (confirm('Are you sure you want to delete this team?')) {
      deleteTeam(teamId);
      loadTeams();
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <Header 
        title="Teams"
        showSearch
        searchPlaceholder="Search by name or email..."
        onSearch={handleSearch}
      >
        {permissions.canManageTeams && (
          <Button onClick={() => setCreateTeamOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Create Team
          </Button>
        )}
        <Button variant="outline">
          <Users className="mr-2 h-4 w-4" />
          Export
        </Button>
      </Header>

      <div className="p-6 space-y-6">
        {/* Team Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                  <p className="text-3xl font-bold text-primary">{users.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Employees</p>
                  <p className="text-3xl font-bold text-role-employee">
                    {users.filter(u => u.role === 'employee').length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-role-employee" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Managers</p>
                  <p className="text-3xl font-bold text-role-manager">
                    {users.filter(u => u.role === 'manager').length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-role-manager" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                  <p className="text-3xl font-bold text-success">
                    {users.reduce((sum, user) => sum + user.totalHours, 0).toFixed(1)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Filter:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="finance_manager">Finance Manager</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <span className="text-sm text-muted-foreground">{filteredUsers.length} members</span>
        </div>

        {/* Members Table */}
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Role</TableHead>
                  {permissions.canViewBillableRates && (
                    <>
                      <TableHead>Billable Rate (USD)</TableHead>
                      <TableHead>Total Billable Hours</TableHead>
                    </>
                  )}
                  <TableHead>Group</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
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
                    <TableCell>{user.totalHours.toFixed(1)}h</TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    {permissions.canViewBillableRates && (
                      <>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <span className="text-muted-foreground">-</span>
                            <Button variant="link" size="sm" className="h-auto p-0 text-primary">
                              Change
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{user.totalBillableHours.toFixed(1)}h</TableCell>
                      </>
                    )}
                    <TableCell>
                      <Button variant="link" size="sm" className="h-auto p-0 text-primary">
                        + Group
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          Role
                        </Button>
                        {permissions.canManageTeams && (
                          <Button variant="ghost" size="sm" className="text-muted-foreground">
                            •••
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Teams Table */}
      <Card>
        <CardHeader>
          <CardTitle>Teams Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>Associated Projects</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map(team => (
                <TableRow key={team.id}>
                  <TableCell>
                    <div className="font-medium">{team.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {team.associatedProjects.length > 0 ? (
                        team.associatedProjects.map(projectId => {
                          const project = getProjects().find(p => p.id === projectId);
                          return project ? (
                            <Badge key={project.id} variant="secondary" className="mr-1">{project.name}</Badge>
                          ) : null;
                        })
                      ) : (
                        <span className="text-muted-foreground text-sm">No projects assigned</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {team.memberIds.length > 0 ? (
                        team.memberIds.map(memberId => {
                          const member = users.find(u => u.id === memberId);
                          return member ? (
                            <div key={member.id} className="flex items-center space-x-2">
                              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                              <span className="text-sm">{member.name}</span>
                            </div>
                          ) : null;
                        })
                      ) : (
                        <span className="text-muted-foreground text-sm">No members assigned</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {users.find(u => u.id === team.createdBy)?.name || 'Unknown'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(team.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {currentUser?.role === 'owner' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteTeam(team.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {teams.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-muted-foreground">
                      No teams created yet. Click "Create Team" to get started.
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateTeamForm 
        isOpen={isCreateTeamOpen} 
        onClose={() => setCreateTeamOpen(false)} 
        onSuccess={() => { loadUsers(); loadTeams(); }} 
      />
    </div>
  );
}
