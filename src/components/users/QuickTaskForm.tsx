import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { getCurrentUser } from "@/lib/auth";
import { Project, Product, Department } from "@/validation/index";

interface QuickTaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | Product | Department;
  selectedDate: Date;
  onSuccess: (taskDescription: string) => void;
  initialDescription?: string; // Added to support existing descriptions
}

export default function QuickTaskForm({
  isOpen,
  onClose,
  project,
  selectedDate,
  onSuccess,
  initialDescription = "",
}: QuickTaskFormProps) {
  const [description, setDescription] = useState(initialDescription);
  const currentUser = getCurrentUser();

  // Update description when initialDescription changes (when editing existing entry)
  useEffect(() => {
    setDescription(initialDescription);
  }, [initialDescription]);

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

  // Determine the type and styling for the badge
  const getProjectTypeInfo = () => {
    if ('stages' in project) {
      return {
        type: 'Project',
        badgeClass: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
        icon: '📋'
      };
    } else if ('productStages' in project) {
      return {
        type: 'Product',
        badgeClass: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
        icon: '📦'
      };
    } else if ('functions' in project) {
      return {
        type: 'Department',
        badgeClass: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
        icon: '🏢'
      };
    }
    return {
      type: 'Unknown',
      badgeClass: 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200',
      icon: '❓'
    };
  };

  const projectTypeInfo = getProjectTypeInfo();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>{projectTypeInfo.icon}</span>
            <span>Add Task for {projectTypeInfo.type}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 p-4">
          {/* Project/Product/Department Info */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {projectTypeInfo.type} Name:
            </Label>
            <div className="flex items-center space-x-2">
              <Badge className={projectTypeInfo.badgeClass}>
                {projectTypeInfo.type}
              </Badge>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {project.name}
              </span>
            </div>
          </div>

          {/* Date Info */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Selected Date:
            </Label>
            <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
              {dayName}, {dateString}
            </div>
          </div>

          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Task Description for {project.name}
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Enter task description for ${project.name} on ${dayName}...`}
              className="min-h-[120px] resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This task description will be saved specifically for {project.name} on {dayName}, {dateString}.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
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
