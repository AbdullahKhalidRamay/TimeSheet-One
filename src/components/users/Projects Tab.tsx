import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderOpen, Edit2, Trash2 } from "lucide-react";
import { Project } from "@/validation/index";
import { getCurrentUser } from "@/lib/auth";
import { rolePermissions } from "@/validation/index";
import { useProjects } from "@/hooks/useData";

interface ProjectsTabProps {
  filterBySearch: <T extends { name: string }>(items: T[]) => T[];
  setProjectFormOpen: (open: boolean) => void;
  setEditingProject: (project: Project | null) => void;
  handleDeleteProject: (projectId: string) => void;
}

export default function ProjectsTab({
  filterBySearch,
  setProjectFormOpen,
  setEditingProject,
  handleDeleteProject,
}: ProjectsTabProps) {
  const currentUser = getCurrentUser();
  const permissions = rolePermissions[currentUser?.role || 'employee'];

  const { projects, loading: projectsLoading } = useProjects();

  const handleEditProject = useCallback((project: Project) => {
    setEditingProject(project);
    setProjectFormOpen(true);
  }, [setEditingProject, setProjectFormOpen]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Projects</h2>
        <Button onClick={() => setProjectFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Project
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FolderOpen className="h-5 w-5" />
            <span>All Projects</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Client Details</TableHead>
                <TableHead>Project Type</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectsLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : filterBySearch(projects).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">No projects found</TableCell>
                </TableRow>
              ) : filterBySearch(projects).map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>
                    {project.clientName ? `${project.clientName}${project.clientEmail ? `, ${project.clientEmail}` : ''}` : "N/A"}
                  </TableCell>
                  <TableCell>{project.projectType || "N/A"}</TableCell>
                  <TableCell>{project.createdBy}</TableCell>
                  <TableCell>{new Date(project.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge className="bg-success text-success-foreground">Active</Badge>
                  </TableCell>
                  <TableCell>
                    {permissions.canManageProjects && (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProject(project)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProject(project.id)}
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
