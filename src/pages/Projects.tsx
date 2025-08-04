import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CreateProjectForm from "@/components/users/CreateProjectForm";
import CreateProductForm from "@/components/users/CreateProductForm";
import CreateDepartmentForm from "@/components/users/CreateDepartmentForm";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Plus, Building2, Package, Users, Trash2, Edit2 } from "lucide-react";
import Header from "@/components/dashboard/Header";
import { getProjects, getProducts, getDepartments, deleteProject, deleteProduct, deleteDepartment } from "@/services/storage";
import { Project, Product, Department } from "@/validation/index";
import { getCurrentUser } from "@/lib/auth";
import { rolePermissions } from "@/validation/index";

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProjectFormOpen, setProjectFormOpen] = useState(false);
  const [isProductFormOpen, setProductFormOpen] = useState(false);
  const [isDepartmentFormOpen, setDepartmentFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  
  const currentUser = getCurrentUser();
  const permissions = rolePermissions[currentUser?.role || 'employee'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProjects(getProjects());
    setProducts(getProducts());
    setDepartments(getDepartments());
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filterBySearch = (items: any[]) => {
    if (!searchQuery) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleProjectSuccess = () => {
    setProjectFormOpen(false);
    loadData();
  };

  const handleProductSuccess = () => {
    setProductFormOpen(false);
    loadData();
  };

  const handleDepartmentSuccess = () => {
    setDepartmentFormOpen(false);
    setEditingDepartment(null);
    loadData();
  };

  // Edit handlers
  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductFormOpen(true);
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setDepartmentFormOpen(true);
  };

  // Delete handlers
  const handleDeleteProject = (projectId: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      deleteProject(projectId);
      loadData();
    }
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProduct(productId);
      loadData();
    }
  };

  const handleDeleteDepartment = (departmentId: string) => {
    if (confirm('Are you sure you want to delete this department?')) {
      deleteDepartment(departmentId);
      loadData();
    }
  };

  // Close handlers with reset
  const handleCloseProjectForm = () => {
    setProjectFormOpen(false);
    setEditingProject(null);
  };

  const handleCloseProductForm = () => {
    setProductFormOpen(false);
    setEditingProduct(null);
  };

  const handleCloseDepartmentForm = () => {
    setDepartmentFormOpen(false);
    setEditingDepartment(null);
  };

  // Update success handlers
  const handleProjectSuccessUpdated = () => {
    setProjectFormOpen(false);
    setEditingProject(null);
    loadData();
  };

  const handleProductSuccessUpdated = () => {
    setProductFormOpen(false);
    setEditingProduct(null);
    loadData();
  };

  return (
    <div className="dashboard-layout">
      <Header 
        title="Projects & Tasks"
        showSearch
        searchPlaceholder="Search projects, products, departments..."
        onSearch={handleSearch}
      >
        <Button variant="outline">
          <Package className="mr-2 h-4 w-4" />
          Export
        </Button>
      </Header>

      <div className="dashboard-content">
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-4">
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
                      <TableHead>Levels</TableHead>
                      <TableHead>Total Tasks</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterBySearch(projects).map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>{project.levels?.length || 0}</TableCell>
                        <TableCell>
                          {project.levels?.reduce((sum, level) => sum + (level.tasks?.length || 0), 0) || 0}
                        </TableCell>
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
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Products</h2>
              <Button onClick={() => setProductFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Product
              </Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>All Products</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Stages</TableHead>
                      <TableHead>Total Tasks</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterBySearch(products).map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.stages?.length || 0}</TableCell>
                        <TableCell>
                          {product.stages?.reduce((sum, stage) => sum + (stage.tasks?.length || 0), 0) || 0}
                        </TableCell>
                        <TableCell>{product.createdBy}</TableCell>
                        <TableCell>{new Date(product.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge className="bg-success text-success-foreground">Active</Badge>
                        </TableCell>
                        <TableCell>
                          {permissions.canManageProjects && (
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditProduct(product)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteProduct(product.id)}
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
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
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
                    {filterBySearch(departments).map((department) => (
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
          </TabsContent>
        </Tabs>
      </div>

      <CreateProjectForm
        isOpen={isProjectFormOpen} 
        onClose={handleCloseProjectForm} 
        onSuccess={handleProjectSuccessUpdated}
        editingProject={editingProject}
      />

      <CreateProductForm
        isOpen={isProductFormOpen} 
        onClose={handleCloseProductForm}
        onSuccess={handleProductSuccessUpdated}
        editingProduct={editingProduct}
      />

      <CreateDepartmentForm
        isOpen={isDepartmentFormOpen}
        onClose={handleCloseDepartmentForm}
        onSuccess={handleDepartmentSuccess}
        editingDepartment={editingDepartment}
      />
    </div>
  );
}
