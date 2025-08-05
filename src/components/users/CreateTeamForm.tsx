import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { getAllUsers, getCurrentUser } from "@/lib/auth";
import { getProjects, getProducts, getDepartments, saveTeam } from "@/services/storage";
import { User, Team } from "@/validation/index";
import { Users, Trash2 } from "lucide-react";

interface CreateTeamFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editing?: Team | null;
}

export default function CreateTeamForm({ isOpen, onClose, onSuccess, editing }: CreateTeamFormProps) {
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedLeader, setSelectedLeader] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  const users = getAllUsers();
  const projects = getProjects();
  const products = getProducts();
  const departments = getDepartments();

  // Pre-fill form when editing
  useEffect(() => {
    if (editing && isOpen) {
      setTeamName(editing.name);
      setDescription(editing.description || "");
      setSelectedLeader(editing.leaderId || null);
      setSelectedMembers(editing.memberIds);
      setSelectedProjects(editing.associatedProjects);
      setSelectedProducts(editing.associatedProducts);
      setSelectedDepartments(editing.associatedDepartments);
    }
  }, [editing, isOpen]);

  const handleSubmit = () => {
    if (!teamName.trim() || selectedMembers.length === 0) {
      alert("Please fill out all fields");
      return;
    }

    const teamData: Team = editing ? {
      ...editing,
      name: teamName,
      description: description,
      leaderId: selectedLeader,
      memberIds: selectedMembers,
      associatedProjects: selectedProjects,
      associatedProducts: selectedProducts,
      associatedDepartments: selectedDepartments,
    } : {
      id: Date.now().toString(),
      name: teamName,
      description: description,
      leaderId: selectedLeader,
      memberIds: selectedMembers,
      associatedProjects: selectedProjects,
      associatedProducts: selectedProducts,
      associatedDepartments: selectedDepartments,
      createdBy: getCurrentUser()?.id || "",
      createdAt: new Date().toISOString(),
    };

    saveTeam(teamData);
    onSuccess();
    handleClose();
  };

  const handleClose = () => {
    setTeamName("");
    setDescription("");
    setSelectedLeader(null);
    setSelectedMembers([]);
    setSelectedProjects([]);
    setSelectedProducts([]);
    setSelectedDepartments([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-card border-border shadow-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-2xl font-semibold text-card-foreground flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <span>{editing ? 'Edit Team' : 'Create New Team'}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="teamName" className="text-foreground font-medium">Team Name</Label>
            <Input
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
              className="border-input bg-background text-foreground focus:border-primary focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground font-medium">Team Description (Optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter team description"
              className="border-input bg-background text-foreground focus:border-primary focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-medium">Select Team Leader (Optional)</Label>
            <select
              value={selectedLeader || ""}
              onChange={(e) => setSelectedLeader(e.target.value || null)}
              className="w-full p-2 border border-input bg-background text-foreground rounded-md focus:border-primary focus:ring-primary/20"
            >
              <option value="">Select a leader</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} - {user.jobTitle}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <Label className="text-foreground font-medium">Select Team Members</Label>
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
        </div>

        <DialogFooter className="flex justify-between items-center border-t border-border pt-6">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="border-border text-foreground hover:bg-accent"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-200"
          >
            <Users className="h-4 w-4 mr-2" />
            {editing ? 'Update Team' : 'Create Team'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

