
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2 } from "lucide-react";
import { saveProject, generateId } from "@/services/storage";
import { getCurrentUser } from "@/lib/auth";
import { Project } from "@/validation/index";
import { toast } from "@/components/ui/sonner";

interface CreateProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingProject?: Project | null;
}

export default function CreateProjectForm({ isOpen, onClose, onSuccess, editingProject }: CreateProjectFormProps) {
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [projectType, setProjectType] = useState<"Fixed Cost" | "Time and Material" | "Full Time Employed" | "">("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isBillable, setIsBillable] = useState(false);

  const currentUser = getCurrentUser();
  const isEditing = !!editingProject;

  // Load editing data when editingProject changes
  useEffect(() => {
    if (editingProject && isOpen) {
      setProjectName(editingProject.name);
      setClientName(editingProject.clientName || "");
      setClientEmail(editingProject.clientEmail || "");
      setProjectType(editingProject.projectType || "");
      setProjectDescription(editingProject.description);
      setIsBillable(editingProject.isBillable);
    } else if (!isOpen) {
      // Reset form when closing
      setProjectName("");
      setClientName("");
      setClientEmail("");
      setProjectType("");
      setProjectDescription("");
      setIsBillable(false);
    }
  }, [editingProject, isOpen]);

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) return true; // Allow empty email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = () => {
    if (!projectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    if (!projectType) {
      toast.error("Please select a project type");
      return;
    }
    if (!validateEmail(clientEmail)) {
      toast.error("Please enter a valid email address or leave it blank");
      return;
    }

    const project: Project = {
      id: isEditing ? editingProject!.id : generateId(),
      name: projectName,
      clientName,
      clientEmail,
      projectType,
      description: projectDescription,
      isBillable,
      createdBy: isEditing ? editingProject!.createdBy : (currentUser?.id || "Unknown"),
      createdAt: isEditing ? editingProject!.createdAt : new Date().toISOString()
    };

    saveProject(project);
    onSuccess();
    handleClose();
  };

  const handleClose = () => {
    setProjectName("");
    setClientName("");
    setClientEmail("");
    setProjectType("");
    setProjectDescription("");
    setIsBillable(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg sm:max-w-xl h-[80vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-2xl font-semibold text-card-foreground flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isEditing ? 'bg-orange-100/30' : 'bg-green-100/30'}`}>
              {isEditing ? (
                <Edit2 className="h-6 w-6 text-orange-600" />
              ) : (
                <Plus className="h-6 w-6 text-green-600" />
              )}
            </div>
            <span>{isEditing ? 'Edit Project' : 'Create New Project'}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-6 bg-muted/30 rounded-lg border">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="projectName" className="text-sm font-medium text-foreground">Project Name</Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
              className="bg-background border-border focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Project Type */}
          <div className="space-y-2">
            <Label htmlFor="projectType" className="text-sm font-medium text-foreground">Project Type</Label>
            <Select value={projectType} onValueChange={(value: "Fixed Cost" | "Time and Material" | "Full Time Employed") => setProjectType(value)}>
              <SelectTrigger className="bg-background border-border focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fixed Cost">Fixed Cost</SelectItem>
                <SelectItem value="Time and Material">Time and Material</SelectItem>
                <SelectItem value="Full Time Employed">Full Time Employed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Client Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName" className="text-sm font-medium text-foreground">Client Name</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
                className="bg-background border-border focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail" className="text-sm font-medium text-foreground">Client Email</Label>
              <Input
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="Enter client email (optional)"
                className="bg-background border-border focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Project Description */}
          <div className="space-y-2">
            <Label htmlFor="projectDescription" className="text-sm font-medium text-foreground">Project Description</Label>
            <Textarea
              id="projectDescription"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Enter a brief project description"
              className="bg-background border-gray-300 focus:ring-2 focus:ring-primary/20"
              rows={3}
            />
          </div>

          {/* Billable Status */}
          <div className="flex items-center space-x-3">
            <Switch
              id="isBillable"
              checked={isBillable}
              onCheckedChange={setIsBillable}
            />
            <Label htmlFor="isBillable" className="text-sm font-medium text-foreground">
              💰 Billable Project
            </Label>
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center border-t border-border pt-6">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="border-border text-foreground hover:bg-accent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-200"
          >
            {isEditing ? (
              <>
                <Edit2 className="h-5 w-5 mr-2" />
                Update Project
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                Create Project
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
