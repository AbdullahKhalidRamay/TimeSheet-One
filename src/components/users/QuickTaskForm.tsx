import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentUser } from "@/lib/auth";
import { saveTimeEntry, generateId } from "@/services/storage";
import { TimeEntry, Project, ProjectDetail } from "@/validation/index";

interface QuickTaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onSuccess: () => void;
}

export default function QuickTaskForm({
  isOpen,
  onClose,
  project,
  onSuccess,
}: QuickTaskFormProps) {
  const [description, setDescription] = useState("");
  const currentUser = getCurrentUser();

  const handleSubmit = () => {
    if (!currentUser || !description) {
      alert("Please enter a task description");
      return;
    }

    const availableHours = currentUser.availableHours;

    const timeEntry: TimeEntry = {
      id: generateId(),
      userId: currentUser.id,
      userName: currentUser.name,
      date: new Date().toISOString().split('T')[0],
      actualHours: availableHours,
      billableHours: project.isBillable ? availableHours : 0,
      availableHours: availableHours,
      task: description,
      projectDetails: {
        category: 'project',
        name: project.name,
        level: '',
        task: '',
        subtask: '',
        description: description,
      } as ProjectDetail,
      isBillable: project.isBillable,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveTimeEntry(timeEntry);
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Quick Task for {project.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="description">Task Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
            />
          </div>
          <Button onClick={handleSubmit} className="w-full">
            Save Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
