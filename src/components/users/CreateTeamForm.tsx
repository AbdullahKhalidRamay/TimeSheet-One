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
      memberIds: selectedMembers,
      associatedProjects: selectedProjects,
      associatedProducts: selectedProducts,
      associatedDepartments: selectedDepartments,
    } : {
      id: Date.now().toString(),
      name: teamName,
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
    setSelectedMembers([]);
    setSelectedProjects([]);
    setSelectedProducts([]);
    setSelectedDepartments([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50 border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Team' : 'Create New Team'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teamName">Team Name</Label>
            <Input
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
            />
          </div>

          <div className="space-y-2">
            <Label>Select Team Members</Label>
            <div className="max-h-32 overflow-y-auto border rounded p-2">
              {users.map(user => (
                <div key={user.id} className="flex items-center space-x-2 p-1">
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
                  />
                  <Label htmlFor={`member-${user.id}`} className="text-sm">{user.name}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Associate with Projects (Optional)</Label>
            <div className="max-h-32 overflow-y-auto border rounded p-2">
              {projects.map(project => (
                <div key={project.id} className="flex items-center space-x-2 p-1">
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
                  />
                  <Label htmlFor={`project-${project.id}`} className="text-sm">{project.name}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Associate with Products (Optional)</Label>
            <div className="max-h-32 overflow-y-auto border rounded p-2">
              {products.map(product => (
                <div key={product.id} className="flex items-center space-x-2 p-1">
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
                  />
                  <Label htmlFor={`product-${product.id}`} className="text-sm">{product.name}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Associate with Departments (Optional)</Label>
            <div className="max-h-32 overflow-y-auto border rounded p-2">
              {departments.map(department => (
                <div key={department.id} className="flex items-center space-x-2 p-1">
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
                  />
                  <Label htmlFor={`department-${department.id}`} className="text-sm">{department.name}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit}>{editing ? 'Update Team' : 'Create Team'}</Button>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

