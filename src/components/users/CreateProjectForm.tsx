import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { saveProject, generateId } from "@/services/storage";
import { getCurrentUser } from "@/lib/auth";
import { Project, ProjectLevel, ProjectTask, ProjectSubtask } from "@/validation/index";

interface CreateProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingProject?: Project | null;
}

export default function CreateProjectForm({ isOpen, onClose, onSuccess, editingProject }: CreateProjectFormProps) {
  const [projectName, setProjectName] = useState("");
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
      setIsBillable(editingProject.isBillable);
      setLevels(editingProject.levels.length > 0 ? editingProject.levels : [{
        id: generateId(),
        name: "",
        tasks: []
      }]);
    } else if (!isOpen) {
      // Reset form when closing
      setProjectName("");
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

  const handleSubmit = () => {
    if (!projectName.trim()) {
      alert("Please enter a project name");
      return;
    }

    const project: Project = {
      id: isEditing ? editingProject!.id : generateId(),
      name: projectName,
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
    setLevels([{
      id: generateId(),
      name: "",
      tasks: []
    }]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50 border-0 shadow-2xl">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isEditing ? 'bg-orange-100' : 'bg-blue-100'}`}>
              {isEditing ? (
                <Edit2 className="h-6 w-6 text-orange-600" />
              ) : (
                <Plus className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <span>{isEditing ? 'Edit Project' : 'Create New Project'}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 p-6">
          {/* Project Name */}
          <div className="space-y-3">
            <Label htmlFor="projectName" className="text-base font-semibold text-gray-700">Project Name</Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter a descriptive project name"
              className="text-base p-3 border-2 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Billable Status */}
          <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="isBillable"
                checked={isBillable}
                onCheckedChange={(checked) => setIsBillable(checked as boolean)}
                className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
              />
              <Label htmlFor="isBillable" className="text-base font-medium text-gray-700 cursor-pointer">💰 This project is billable</Label>
            </div>
          </Card>

          {/* Project Levels */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Project Levels</Label>
              <Button type="button" onClick={addLevel} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Level
              </Button>
            </div>

            {levels.map((level, levelIndex) => (
              <Card key={level.id} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      value={level.name}
                      onChange={(e) => updateLevel(level.id, e.target.value)}
                      placeholder="Level name"
                      className="flex-1"
                    />
                    {levels.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeLevel(level.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Tasks */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Tasks</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addTask(level.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Task
                      </Button>
                    </div>

                    {level.tasks.map((task) => (
                      <Card key={task.id} className="p-3 ml-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Input
                              value={task.name}
                              onChange={(e) => updateTask(level.id, task.id, 'name', e.target.value)}
                              placeholder="Task name"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeTask(level.id, task.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <Textarea
                            value={task.description}
                            onChange={(e) => updateTask(level.id, task.id, 'description', e.target.value)}
                            placeholder="Task description"
                            rows={2}
                          />

                          {/* Subtasks */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">Subtasks</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addSubtask(level.id, task.id)}
                              >
                                <Plus className="h-3 w-3 mr-2" />
                                Add Subtask
                              </Button>
                            </div>

                            {task.subtasks.map((subtask) => (
                              <div key={subtask.id} className="flex items-start space-x-2 ml-4">
                                <div className="flex-1 space-y-2">
                                  <Input
                                    value={subtask.name}
                                    onChange={(e) => updateSubtask(level.id, task.id, subtask.id, 'name', e.target.value)}
                                    placeholder="Subtask name"
                                  />
                                  <Textarea
                                    value={subtask.description}
                                    onChange={(e) => updateSubtask(level.id, task.id, subtask.id, 'description', e.target.value)}
                                    placeholder="Subtask description"
                                    rows={1}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeSubtask(level.id, task.id, subtask.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center border-t border-gray-200 pt-6 px-6">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            className="px-6 py-3 font-medium border-2 hover:bg-gray-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSubmit} 
            className={`${isEditing 
              ? 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800' 
              : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
            } text-white px-8 py-3 font-semibold shadow-lg transition-all duration-200`}
          >
            {isEditing ? (
              <Edit2 className="h-5 w-5 mr-2" />
            ) : (
              <Plus className="h-5 w-5 mr-2" />
            )}
            {isEditing ? 'Update Project' : 'Create Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
