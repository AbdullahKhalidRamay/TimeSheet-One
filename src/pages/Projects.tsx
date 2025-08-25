import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Package, Search } from "lucide-react";
import Header from "@/components/dashboard/Header";
import { deleteProject, deleteProduct, deleteDepartment } from "@/services/storage";
import { Project, Product, Department } from "@/validation/index";
import { getCurrentUser } from "@/lib/auth";
import { rolePermissions } from "@/validation/index";
import { useProjects, useProducts, useDepartments, invalidateCache } from "@/hooks/useData";
import { toast } from "@/components/ui/sonner";
import { useSettings } from '@/contexts/SettingsContext';
import ProjectsTab from '@/components/users/Projects Tab';
import ProductsTab from '@/components/users/Products Tab';
import DepartmentsTab from '@/components/users/Departments Tab';
import CreateProjectForm from "@/components/users/CreateProjectForm";
import CreateProductForm from "@/components/users/CreateProductForm";
import CreateDepartmentForm from "@/components/users/CreateDepartmentForm";

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isProjectFormOpen, setProjectFormOpen] = useState(false);
  const [isProductFormOpen, setProductFormOpen] = useState(false);
  const [isDepartmentFormOpen, setDepartmentFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  
  const currentUser = getCurrentUser();
  const permissions = rolePermissions[currentUser?.role || 'employee'];

  const { projects, refreshProjects } = useProjects();
  const { products, refreshProducts } = useProducts();
  const { departments, refreshDepartments } = useDepartments();

  const { showProductsTab, showDepartmentsTab } = useSettings();

  const loadData = useCallback(() => {
    refreshProjects();
    if (showProductsTab) refreshProducts();
    if (showDepartmentsTab) refreshDepartments();
  }, [refreshProjects, refreshProducts, refreshDepartments, showProductsTab, showDepartmentsTab]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const filterBySearch = useCallback(<T extends { name: string }>(items: T[]): T[] => {
    if (!searchQuery) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleProjectSuccess = useCallback(() => {
    setProjectFormOpen(false);
    invalidateCache('projects');
    refreshProjects();
  }, [refreshProjects]);

  const handleProductSuccess = useCallback(() => {
    setProductFormOpen(false);
    invalidateCache('products');
    refreshProducts();
  }, [refreshProducts]);

  const handleDepartmentSuccess = useCallback(() => {
    setDepartmentFormOpen(false);
    setEditingDepartment(null);
    invalidateCache('departments');
    refreshDepartments();
  }, [refreshDepartments]);

  // Edit handlers
  const handleEditProject = useCallback((project: Project) => {
    setEditingProject(project);
    setProjectFormOpen(true);
  }, []);

  const handleEditProduct = useCallback((product: Product) => {
    setEditingProduct(product);
    setProductFormOpen(true);
  }, []);

  const handleEditDepartment = useCallback((department: Department) => {
    setEditingDepartment(department);
    setDepartmentFormOpen(true);
  }, []);

  // Delete handlers
  const handleDeleteProject = useCallback((projectId: string) => {
    deleteProject(projectId);
    invalidateCache('projects');
    refreshProjects();
    toast.success('Project deleted successfully');
  }, [refreshProjects]);

  const handleDeleteProduct = useCallback((productId: string) => {
    deleteProduct(productId);
    invalidateCache('products');
    refreshProducts();
    toast.success('Product deleted successfully');
  }, [refreshProjects]);

  const handleDeleteDepartment = useCallback((departmentId: string) => {
    deleteDepartment(departmentId);
    invalidateCache('departments');
    refreshDepartments();
    toast.success('Department deleted successfully');
  }, [refreshDepartments]);

  // Close handlers with reset
  const handleCloseProjectForm = useCallback(() => {
    setProjectFormOpen(false);
    setEditingProject(null);
  }, []);

  const handleCloseProductForm = useCallback(() => {
    setProductFormOpen(false);
    setEditingProduct(null);
  }, []);

  const handleCloseDepartmentForm = useCallback(() => {
    setDepartmentFormOpen(false);
    setEditingDepartment(null);
  }, []);

  // Update success handlers
  const handleProjectSuccessUpdated = useCallback(() => {
    setProjectFormOpen(false);
    setEditingProject(null);
    invalidateCache('projects');
    refreshProjects();
  }, [refreshProjects]);

  const handleProductSuccessUpdated = useCallback(() => {
    setProductFormOpen(false);
    setEditingProduct(null);
    invalidateCache('products');
    refreshProducts();
  }, [refreshProducts]);

  // Calculate number of tabs for grid-cols
  const numTabs = 1 + (showProductsTab ? 1 : 0) + (showDepartmentsTab ? 1 : 0);

  return (
    <div className="dashboard-layout">
      <Header 
        title="Projects & Tasks"
      >
        <Button variant="outline">
          <Package className="mr-2 h-4 w-4" />
          Export
        </Button>
      </Header>

      <div className="dashboard-content">
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className={`grid w-full grid-cols-${numTabs}`}>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            {showProductsTab && <TabsTrigger value="products">Products</TabsTrigger>}
            {showDepartmentsTab && <TabsTrigger value="departments">Departments</TabsTrigger>}
          </TabsList>

          {/* Search Bar */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects, products, departments..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          <TabsContent value="projects" className="space-y-4">
            <ProjectsTab
              filterBySearch={filterBySearch}
              setProjectFormOpen={setProjectFormOpen}
              setEditingProject={setEditingProject}
              handleDeleteProject={handleDeleteProject}
            />
          </TabsContent>

          {showProductsTab && (
            <TabsContent value="products" className="space-y-4">
              <ProductsTab
                filterBySearch={filterBySearch}
                setProductFormOpen={setProductFormOpen}
                setEditingProduct={setEditingProduct}
                handleDeleteProduct={handleDeleteProduct}
              />
            </TabsContent>
          )}

          {showDepartmentsTab && (
            <TabsContent value="departments" className="space-y-4">
              <DepartmentsTab
                filterBySearch={filterBySearch}
                setDepartmentFormOpen={setDepartmentFormOpen}
                setEditingDepartment={setEditingDepartment}
                handleDeleteDepartment={handleDeleteDepartment}
              />
            </TabsContent>
          )}
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
