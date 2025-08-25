
import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, Edit2, Trash2 } from "lucide-react";
import { Department } from "@/validation/index";
import { getCurrentUser } from "@/lib/auth";
import { rolePermissions } from "@/validation/index";
import { useDepartments } from "@/hooks/useData";

interface DepartmentsTabProps {
  filterBySearch: <T extends { name: string }>(items: T[]) => T[];
  setDepartmentFormOpen: (open: boolean) => void;
  setEditingDepartment: (department: Department | null) => void;
  handleDeleteDepartment: (departmentId: string) => void;
}

export default function DepartmentsTab({
  filterBySearch,
  setDepartmentFormOpen,
  setEditingDepartment,
  handleDeleteDepartment,
}: DepartmentsTabProps) {
  const currentUser = getCurrentUser();
  const permissions = rolePermissions[currentUser?.role || 'employee'];

  const { departments, loading: departmentsLoading } = useDepartments();

  const handleEditDepartment = useCallback((department: Department) => {
    setEditingDepartment(department);
    setDepartmentFormOpen(true);
  }, [setEditingDepartment, setDepartmentFormOpen]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Departments</h2>
        <Button onClick={() => setDepartmentFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Department
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>All Departments</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Functions</TableHead>
                <TableHead>Total Duties</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departmentsLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : filterBySearch(departments).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">No departments found</TableCell>
                </TableRow>
              ) : filterBySearch(departments).map((department) => (
                <TableRow key={department.id}>
                  <TableCell className="font-medium">{department.name}</TableCell>
                  <TableCell>{department.functions?.length || 0}</TableCell>
                  <TableCell>
                    {department.functions?.reduce((sum, func) => sum + (func.duties?.length || 0), 0) || 0}
                  </TableCell>
                  <TableCell>{department.createdBy}</TableCell>
                  <TableCell>{new Date(department.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge className="bg-success text-success-foreground">Active</Badge>
                  </TableCell>
                  <TableCell>
                    {permissions.canManageProjects && (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditDepartment(department)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDepartment(department.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

