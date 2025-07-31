import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, DollarSign, UserPlus } from "lucide-react";
import Header from "@/components/layout/Header";
import { getAllUsers, getCurrentUser } from "@/utils/auth";
import { User } from "@/types";
import { rolePermissions } from "@/types";
import CreateTeamForm from "@/components/forms/CreateTeamForm";

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

  const permissions = rolePermissions[currentUser?.role || 'employee'];

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
      
      <CreateTeamForm 
        isOpen={isCreateTeamOpen} 
        onClose={() => setCreateTeamOpen(false)} 
        onSuccess={loadUsers} 
      />
    </div>
  );
}
