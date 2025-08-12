import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Users } from "lucide-react";
import { getAllUsers, getCurrentUser } from "@/lib/auth";
import { teamsAPI, projectsAPI, productsAPI, departmentsAPI } from "@/services/api";
import { Team, Project, Product, Department, User } from "@/validation/index";

interface CreateTeamFormProps {
  onClose: () => void;
  onSuccess: () => void;
  editingTeam?: Team;
}

export default function CreateTeamForm({ onClose, onSuccess, editingTeam }: CreateTeamFormProps) {
  const [name, setName] = useState(editingTeam?.name || "");
  const [description, setDescription] = useState(editingTeam?.description || "");
  const [selectedMembers, setSelectedMembers] = useState<string[]>(editingTeam?.memberIds || []);
  const [selectedLeader, setSelectedLeader] = useState<string>(editingTeam?.leaderId || "");
  const [selectedProjects, setSelectedProjects] = useState<string[]>(editingTeam?.associatedProjects || []);
  const [selectedProducts, setSelectedProducts] = useState<string[]>(editingTeam?.associatedProducts || []);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(editingTeam?.associatedDepartments || []);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const users = getAllUsers();
  const currentUser = getCurrentUser();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsData, productsData, departmentsData] = await Promise.all([
          projectsAPI.getAll(),
          productsAPI.getAll(),
          departmentsAPI.getAll()
        ]);
        setProjects(projectsData);
        setProducts(productsData);
        setDepartments(departmentsData);
      } catch (error) {
        console.error('Error loading form data:', error);
        // Fallback to empty arrays if API fails
        setProjects([]);
        setProducts([]);
        setDepartments([]);
      }
    };

    loadData();
  }, []);

  const handleSubmit = async () => {
    if (!name.trim() || selectedMembers.length === 0) {
      alert("Please fill out all required fields");
      return;
    }

    setLoading(true);
    try {
      const teamData: Partial<Team> = {
        name: name,
        description: description,
        leaderId: selectedLeader,
        memberIds: selectedMembers,
        associatedProjects: selectedProjects,
        associatedProducts: selectedProducts,
        associatedDepartments: selectedDepartments,
        createdBy: currentUser?.id || "",
        createdAt: new Date().toISOString(),
      };

      if (editingTeam) {
        await teamsAPI.update(editingTeam.id, teamData);
      } else {
        await teamsAPI.create(teamData);
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving team:", error);
      alert("Failed to save team. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setSelectedLeader("");
    setSelectedMembers([]);
    setSelectedProjects([]);
    setSelectedProducts([]);
    setSelectedDepartments([]);
    onClose();
  };

  return (
    <Card className="max-w-4xl max-h-[85vh] overflow-y-auto bg-card border-border shadow-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold text-card-foreground flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <span>{editingTeam ? 'Edit Team' : 'Create New Team'}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="teamName" className="text-foreground font-medium">Team Name *</Label>
          <Input
            id="teamName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter team name"
            className="border-input bg-background text-foreground focus:border-primary focus:ring-primary/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-foreground font-medium">Team Description (Optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter team description"
            className="border-input bg-background text-foreground focus:border-primary focus:ring-primary/20"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-foreground font-medium">Select Team Leader (Optional)</Label>
          <Select value={selectedLeader} onValueChange={setSelectedLeader}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a leader" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No leader</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} - {user.jobTitle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-foreground font-medium">Select Team Members *</Label>
          <div className="max-h-40 overflow-y-auto border border-border rounded-lg p-4 bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {users.map(user => (
                <div key={user.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                  <Checkbox
                    id={`member-${user.id}`}
                    checked={selectedMembers.includes(user.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedMembers([...selectedMembers, user.id]);
                      } else {
                        setSelectedMembers(selectedMembers.filter(id => id !== user.id));
                      }
                    }}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <div className="flex-1">
                    <Label htmlFor={`member-${user.id}`} className="text-sm text-foreground cursor-pointer font-medium">{user.name}</Label>
                    <p className="text-xs text-muted-foreground">{user.jobTitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-foreground font-medium">Associate with Projects (Optional)</Label>
          <div className="max-h-40 overflow-y-auto border border-border rounded-lg p-4 bg-blue-50/30 dark:bg-blue-900/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {projects.map(project => (
                <div key={project.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-blue-100/50 dark:hover:bg-blue-800/20 transition-colors">
                  <Checkbox
                    id={`project-${project.id}`}
                    checked={selectedProjects.includes(project.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedProjects([...selectedProjects, project.id]);
                      } else {
                        setSelectedProjects(selectedProjects.filter(id => id !== project.id));
                      }
                    }}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label htmlFor={`project-${project.id}`} className="text-sm text-foreground cursor-pointer flex-1">{project.name}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-foreground font-medium">Associate with Products (Optional)</Label>
          <div className="max-h-40 overflow-y-auto border border-border rounded-lg p-4 bg-purple-50/30 dark:bg-purple-900/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {products.map(product => (
                <div key={product.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-purple-100/50 dark:hover:bg-purple-800/20 transition-colors">
                  <Checkbox
                    id={`product-${product.id}`}
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedProducts([...selectedProducts, product.id]);
                      } else {
                        setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                      }
                    }}
                    className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                  />
                  <Label htmlFor={`product-${product.id}`} className="text-sm text-foreground cursor-pointer flex-1">{product.name}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-foreground font-medium">Associate with Departments (Optional)</Label>
          <div className="max-h-40 overflow-y-auto border border-border rounded-lg p-4 bg-orange-50/30 dark:bg-orange-900/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {departments.map(department => (
                <div key={department.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-orange-100/50 dark:hover:bg-orange-800/20 transition-colors">
                  <Checkbox
                    id={`department-${department.id}`}
                    checked={selectedDepartments.includes(department.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedDepartments([...selectedDepartments, department.id]);
                      } else {
                        setSelectedDepartments(selectedDepartments.filter(id => id !== department.id));
                      }
                    }}
                    className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                  />
                  <Label htmlFor={`department-${department.id}`} className="text-sm text-foreground cursor-pointer flex-1">{department.name}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-border pt-6">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="border-border text-foreground hover:bg-accent"
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-200"
          >
            <Users className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : (editingTeam ? 'Update Team' : 'Create Team')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

