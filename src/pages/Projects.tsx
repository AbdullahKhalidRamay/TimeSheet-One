import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Plus, Building2, Package, Users } from "lucide-react";
import Header from "@/components/layout/Header";
import { getProjects, getProducts, getDepartments } from "@/utils/storage";
import { Project, Product, Department } from "@/types";

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

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

  return (
    <div className="flex-1 overflow-auto">
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

      <div className="p-6">
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Projects</h2>
              <Button>
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
              <Button>
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
              <Button>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}