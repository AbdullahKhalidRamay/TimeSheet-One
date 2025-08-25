
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { saveProject, generateId } from "@/services/storage";
import { getCurrentUser } from "@/lib/auth";
import { Project, ProjectLevel, ProjectTask, ProjectSubtask } from "@/validation/index";
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
  const [levels, setLevels] = useState<ProjectLevel[]>([
    {
      id: generateId(),
      name: "",
      tasks: []
    }
  ]);

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
      setLevels(editingProject.levels.length > 0 ? editingProject.levels : [{
        id: generateId(),
        name: "",
        tasks: []
      }]);
    } else if (!isOpen) {
      // Reset form when closing
      setProjectName("");
      setClientName("");
      setClientEmail("");
      setProjectType("");
      setProjectDescription("");
      setIsBillable(false);
      setLevels([{
        id: generateId(),
        name: "",
        tasks: []
      }]);
    }
  }, [editingProject, isOpen]);

  const addLevel = () => {
    setLevels([...levels, {
      id: generateId(),
      name: "",
      tasks: []
    }]);
  };

  const removeLevel = (levelId: string) => {
    setLevels(levels.filter(level => level.id !== levelId));
  };

  const updateLevel = (levelId: string, name: string) => {
    setLevels(levels.map(level => 
      level.id === levelId ? { ...level, name } : level
    ));
  };

  const addTask = (levelId: string) => {
    setLevels(levels.map(level => 
      level.id === levelId ? {
        ...level,
        tasks: [...level.tasks, {
          id: generateId(),
          name: "",
          description: "",
          subtasks: []
        }]
      } : level
    ));
  };

  const removeTask = (levelId: string, taskId: string) => {
    setLevels(levels.map(level => 
      level.id === levelId ? {
        ...level,
        tasks: level.tasks.filter(task => task.id !== taskId)
      } : level
    ));
  };

  const updateTask = (levelId: string, taskId: string, field: keyof ProjectTask, value: string) => {
    setLevels(levels.map(level => 
      level.id === levelId ? {
        ...level,
        tasks: level.tasks.map(task => 
          task.id === taskId ? { ...task, [field]: value } : task
        )
      } : level
    ));
  };

  const addSubtask = (levelId: string, taskId: string) => {
    setLevels(levels.map(level => 
      level.id === levelId ? {
        ...level,
        tasks: level.tasks.map(task => 
          task.id === taskId ? {
            ...task,
            subtasks: [...task.subtasks, {
              id: generateId(),
              name: "",
              description: ""
            }]
          } : task
        )
      } : level
    ));
  };

  const removeSubtask = (levelId: string, taskId: string, subtaskId: string) => {
    setLevels(levels.map(level => 
      level.id === levelId ? {
        ...level,
        tasks: level.tasks.map(task => 
          task.id === taskId ? {
            ...task,
            subtasks: task.subtasks.filter(subtask => subtask.id !== subtaskId)
          } : task
        )
      } : level
    ));
  };

  const updateSubtask = (levelId: string, taskId: string, subtaskId: string, field: keyof ProjectSubtask, value: string) => {
    setLevels(levels.map(level => 
      level.id === levelId ? {
        ...level,
        tasks: level.tasks.map(task => 
          task.id === taskId ? {
            ...task,
            subtasks: task.subtasks.map(subtask => 
              subtask.id === subtaskId ? { ...subtask, [field]: value } : subtask
            )
          } : task
        )
      } : level
    ));
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email === "" || emailRegex.test(email);
  };

  const handleSubmit = () => {
    if (!projectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    if (!clientName.trim()) {
      toast.error("Please enter a client name");
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
      levels: levels.filter(level => level.name.trim()),
      isBillable,
      createdBy: isEditing ? editingProject!.createdBy : (currentUser?.name || "Unknown"),
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
    setLevels([{
      id: generateId(),
      name: "",
      tasks: []
    }]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg sm:max-w-xl h-[80vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isEditing ? 'bg-orange-100/30' : 'bg-blue-100/30'}`}>
              {isEditing ? (
                <Edit2 className="h-6 w-6 text-orange-600" />
              ) : (
                <Plus className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <span>{isEditing ? 'Edit Project' : 'Create New Project'}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-6 bg-muted/30 rounded-lg border border-gray-300">
          {/* Client Details */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-foreground">Client Details</Label>
            <div className="space-y-2">
              <Label htmlFor="clientName" className="text-sm font-medium text-foreground">Client Name</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
                className="bg-background border-gray-300 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail" className="text-sm font-medium text-foreground">Client Email</Label>
              <Input
                id="clientEmail"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="Enter client email (optional)"
                className="bg-background border-gray-300 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Project Type */}
          <div className="space-y-2">
            <Label htmlFor="projectType" className="text-sm font-medium text-foreground">Project Type</Label>
            <Select value={projectType} onValueChange={(value: string) => setProjectType(value as "" | "Fixed Cost" | "Time and Material" | "Full Time Employed")}>
              <SelectTrigger id="projectType" className="bg-background border-gray-300 focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fixed Cost">Fixed Cost</SelectItem>
                <SelectItem value="Time and Material">Time and Material</SelectItem>
                <SelectItem value="Full Time Employed">Full Time Employed</SelectItem>
              </SelectContent>
            </Select>
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
            />
          </div>

          {/* Billable Status */}
          <div className="flex items-center space-x-3 p-3 bg-card rounded-lg border border-gray-300">
            <Switch
              id="isBillable"
              checked={isBillable}
              onCheckedChange={setIsBillable}
            />
            <Label htmlFor="isBillable" className="text-sm font-medium text-card-foreground cursor-pointer">
              <span className="inline-block animate-pulse text-green-600 font-bold mr-1">$</span>
              Billable only
            </Label>
          </div>

          {/* Levels */}
       {/*   <div className="space-y-4">
            <Label className="text-sm font-medium text-foreground">Project Levels</Label>
            {levels.map((level, levelIndex) => (
              <Card key={level.id} className="p-4 bg-card border-gray-300">
                <CardContent className="space-y-4 p-0">
                  <div className="flex items-center space-x-2">
                    <Input
                      value={level.name}
                      onChange={(e) => updateLevel(level.id, e.target.value)}
                      placeholder={`Level ${levelIndex + 1} name`}
                      className="flex-1 bg-background border-gray-300 focus:ring-2 focus:ring-primary/20"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLevel(level.id)}
                      disabled={levels.length === 1}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* Tasks */}
           {/*       {level.tasks.map((task, taskIndex) => (
                    <div key={task.id} className="ml-4 space-y-2 border-l-2 border-gray-200 pl-4">
                      <div className="flex items-center space-x-2">
                        <Input
                          value={task.name}
                          onChange={(e) => updateTask(level.id, task.id, 'name', e.target.value)}
                          placeholder={`Task ${taskIndex + 1} name`}
                          className="flex-1 bg-background border-gray-300 focus:ring-2 focus:ring-primary/20"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTask(level.id, task.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Textarea
                        value={task.description}
                        onChange={(e) => updateTask(level.id, task.id, 'description', e.target.value)}
                        placeholder={`Task ${taskIndex + 1} description`}
                        className="bg-background border-gray-300 focus:ring-2 focus:ring-primary/20"
                      />
                      {/* Subtasks */}
        {/*              {task.subtasks.map((subtask, subtaskIndex) => (
                        <div key={subtask.id} className="ml-4 space-y-2 border-l-2 border-gray-200 pl-4">
                          <div className="flex items-center space-x-2">
                            <Input
                              value={subtask.name}
                              onChange={(e) => updateSubtask(level.id, task.id, subtask.id, 'name', e.target.value)}
                              placeholder={`Subtask ${subtaskIndex + 1} name`}
                              className="flex-1 bg-background border-gray-300 focus:ring-2 focus:ring-primary/20"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSubtask(level.id, task.id, subtask.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <Textarea
                            value={subtask.description}
                            onChange={(e) => updateSubtask(level.id, task.id, subtask.id, 'description', e.target.value)}
                            placeholder={`Subtask ${subtaskIndex + 1} description`}
                            className="bg-background border-gray-300 focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addSubtask(level.id, task.id)}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Subtask
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addTask(level.id)}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </CardContent>
              </Card>
            ))}
            <Button
              variant="outline"
              onClick={addLevel}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Level
            </Button>
          </div>
         */} </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            className={`${isEditing 
              ? 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800' 
              : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
            } text-white font-semibold shadow-lg transition-all duration-200`}
          >
            {isEditing ? (
              <Edit2 className="h-4 w-4 mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {isEditing ? 'Update Project' : 'Create Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
