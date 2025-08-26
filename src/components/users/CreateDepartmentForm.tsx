import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit2 } from "lucide-react";
import { saveDepartment, generateId } from "@/services/storage";
import { getCurrentUser } from "@/lib/auth";
import { Department } from "@/validation/index";
import { toast } from "@/components/ui/sonner";

interface CreateDepartmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingDepartment?: Department | null;
}

export default function CreateDepartmentForm({ isOpen, onClose, onSuccess, editingDepartment }: CreateDepartmentFormProps) {
  const [departmentName, setDepartmentName] = useState("");
  const [departmentDescription, setDepartmentDescription] = useState("");
  const [isBillable, setIsBillable] = useState(false);

  const currentUser = getCurrentUser();
  const isEditing = !!editingDepartment;

  // Load editing data when editingDepartment changes
  useEffect(() => {
    if (editingDepartment && isOpen) {
      setDepartmentName(editingDepartment.name);
      setDepartmentDescription(editingDepartment.departmentDescription);
      setIsBillable(editingDepartment.isBillable);
    } else if (!isOpen) {
      // Reset form when closing
      setDepartmentName("");
      setDepartmentDescription("");
      setIsBillable(false);
    }
  }, [editingDepartment, isOpen]);

  const handleSubmit = () => {
    if (!departmentName.trim()) {
      toast.error("Please enter a department name");
      return;
    }

    const department: Department = {
      id: isEditing ? editingDepartment!.id : generateId(),
      name: departmentName,
      departmentDescription: departmentDescription,
      isBillable,
      createdBy: isEditing ? editingDepartment!.createdBy : (currentUser?.id || "Unknown"),
      createdAt: isEditing ? editingDepartment!.createdAt : new Date().toISOString()
    };

    saveDepartment(department);
    onSuccess();
    handleClose();
  };

  const handleClose = () => {
    setDepartmentName("");
    setDepartmentDescription("");
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
            <span>{isEditing ? 'Edit Department' : 'Create New Department'}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-6 bg-muted/30 rounded-lg border">
          {/* Department Name */}
          <div className="space-y-2">
            <Label htmlFor="departmentName" className="text-sm font-medium text-foreground">Department Name</Label>
            <Input
              id="departmentName"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              placeholder="Enter department name"
              className="bg-background border-border focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Department Description */}
          <div className="space-y-2">
            <Label htmlFor="departmentDescription" className="text-sm font-medium text-foreground">Department Description</Label>
            <Textarea
              id="departmentDescription"
              value={departmentDescription}
              onChange={(e) => setDepartmentDescription(e.target.value)}
              placeholder="Enter a brief department description"
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
              💰 Billable Department
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
                Update Department
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                Create Department
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
