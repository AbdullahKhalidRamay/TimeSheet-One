import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { saveProject, generateId } from "@/utils/storage";
import { getCurrentUser } from "@/utils/auth";
import { Project, ProjectLevel, ProjectTask, ProjectSubtask } from "@/types";

interface CreateProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateProjectForm({ isOpen, onClose, onSuccess }: CreateProjectFormProps) {
  const [projectName, setProjectName] = useState("");
  const [levels, setLevels] = useState<ProjectLevel[]>([
    {
      id: generateId(),
      name: "",
      tasks: []
    }
  ]);

  const currentUser = getCurrentUser();

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
      id: generateId(),
      name: projectName,
      levels: levels.filter(level => level.name.trim()),
      createdBy: currentUser?.name || "Unknown",
      createdAt: new Date().toISOString()
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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
            />
          </div>

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
                                    size="sm"
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

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
