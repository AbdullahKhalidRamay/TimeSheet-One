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
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { getCurrentUser } from "@/lib/auth";
import { Project, Product, Department } from "@/validation/index";

interface QuickTaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | Product | Department;
  selectedDate: Date;
  onSuccess: (taskDescription: string) => void;
}

export default function QuickTaskForm({
  isOpen,
  onClose,
  project,
  selectedDate,
  onSuccess,
}: QuickTaskFormProps) {
  const [description, setDescription] = useState("");
  const currentUser = getCurrentUser();

  const handleSubmit = () => {
    if (!currentUser || !description.trim()) {
      alert("Please enter a task description");
      return;
    }

    // Pass the task description back to parent component
    onSuccess(description.trim());
    setDescription(""); // Reset form
    onClose();
  };

  const handleClose = () => {
    setDescription(""); // Reset form
    onClose();
  };

  // Format the selected date
  const dayName = format(selectedDate, 'EEEE'); // Monday, Tuesday, etc.
  const dateString = format(selectedDate, 'MMM dd, yyyy'); // Jan 15, 2024

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Quick Task for {project.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Selected Date: {dayName}, {dateString}
            </Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Task Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description for this day..."
              className="min-h-[100px] resize-none"
            />
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleSubmit} className="flex-1">
              Save Task
            </Button>
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
