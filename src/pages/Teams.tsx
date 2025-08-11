import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Users, UserPlus, ChevronDown, Search, Edit, Trash2 } from "lucide-react";
import Header from "@/components/dashboard/Header";
import { getAllUsers, getCurrentUser } from "@/lib/auth";
import { User } from "@/validation/index";
import { rolePermissions, Team } from "@/validation/index";
import { getTeams, getProjects, getProducts, getDepartments, deleteTeam, addMemberToTeam } from "@/services/storage";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import CreateTeamForm from "@/components/users/CreateTeamForm";

export default function Teams() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isCreateTeamOpen, setCreateTeamOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
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
      user.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || statusFilter === 'active'; // Assume all users are active for now
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const getJobTitleColor = (role: string) => {
    switch (role) {
      case "owner": return "bg-role-owner text-white";
      case "manager": return "bg-role-manager text-white";
      case "employee": return "bg-role-employee text-white";
      default: return "bg-muted";
    }
  };

  const getJobTitleLabel = (jobTitle: string) => {
    return jobTitle;
  };

  const [teams, setTeams] = useState<Team[]>([]);
  const permissions = rolePermissions[currentUser?.role || 'employee'];

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = () => {
    setTeams(getTeams());
  };

  const handleDeleteTeam = (teamId: string) => {
    if (confirm('Are you sure you want to delete this team?')) {
      deleteTeam(teamId);
      loadTeams();
    }
  };

  return (
    <div className="dashboard-layout">
      <Header 
        title="Teams"
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

      <div className="dashboard-content">
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
                  <p className="text-sm font-medium text-muted-foreground">Owners</p>
                  <p className="text-3xl font-bold text-role-owner">
                    {users.filter(u => u.role === 'owner').length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-role-owner" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar and Filters */}
        <div className="space-y-4">
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
            <span className="text-sm text-muted-foreground">{filteredUsers.length} members</span>
          </div>
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
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Teams Overview */}
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
                  <TableHead>Associated Products</TableHead>
                  <TableHead>Associated Departments</TableHead>
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
                        {team.associatedProducts && team.associatedProducts.length > 0 ? (
                          team.associatedProducts.map(productId => {
                            const product = getProducts().find(p => p.id === productId);
                            return product ? (
                              <Badge key={product.id} variant="outline" className="mr-1 bg-purple-50 text-purple-700 border-purple-200">{product.name}</Badge>
                            ) : null;
                          })
                        ) : (
                          <span className="text-muted-foreground text-sm">No products assigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {team.associatedDepartments && team.associatedDepartments.length > 0 ? (
                          team.associatedDepartments.map(departmentId => {
                            const department = getDepartments().find(d => d.id === departmentId);
                            return department ? (
                              <Badge key={department.id} variant="outline" className="mr-1 bg-orange-50 text-orange-700 border-orange-200">{department.name}</Badge>
                            ) : null;
                          })
                        ) : (
                          <span className="text-muted-foreground text-sm">No departments assigned</span>
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
                      <div className="flex items-center space-x-2">
                        {permissions.canManageTeams && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingTeam(team);
                              setCreateTeamOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {teams.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
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
                  <TableHead>Role</TableHead>
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
                    <TableCell>
                      <Badge className={getJobTitleColor(user.role)}>
                        {getJobTitleLabel(user.jobTitle)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {permissions.canManageTeams && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add to Team
                                <ChevronDown className="h-4 w-4 ml-2" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {teams.length > 0 ? (
                                teams.map((team) => (
                                  <DropdownMenuItem
                                    key={team.id}
                                    onClick={() => {
                                      if (addMemberToTeam(team.id, user.id)) {
                                        loadTeams();
                                      }
                                    }}
                                  >
                                    {team.name}
                                  </DropdownMenuItem>
                                ))
                              ) : (
                                <DropdownMenuItem disabled>
                                  No teams available
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      <CreateTeamForm 
        isOpen={isCreateTeamOpen} 
        onClose={() => {
          setCreateTeamOpen(false);
          setEditingTeam(null);
        }} 
        onSuccess={() => {
          loadUsers();
          loadTeams();
          setEditingTeam(null);
        }}
        editing={editingTeam}
      />
    </div>
  );
}
