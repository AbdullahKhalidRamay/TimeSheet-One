import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "lucide-react";
import Header from "@/components/layout/Header";
import { getCurrentUser } from "@/utils/auth";
import { saveTimeEntry, generateId, calculateHours, getProjects, getProducts, getDepartments } from "@/utils/storage";
import { TimeEntry, ProjectDetail, Project, Product, Department } from "@/types";

interface FormData {
  date: string;
  category: string;
  projectName: string;
  level: string;
  task: string;
  subtask: string;
  description: string;
  clockIn: string;
  clockOut: string;
  breakTime: number;
  isBillable: boolean;
}

export default function TimeTracker() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    projectName: '',
    level: '',
    task: '',
    subtask: '',
    description: '',
    clockIn: '',
    clockOut: '',
    breakTime: 30,
    isBillable: false,
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [availableLevels, setAvailableLevels] = useState<any[]>([]);
  const [availableTasks, setAvailableTasks] = useState<any[]>([]);
  const [availableSubtasks, setAvailableSubtasks] = useState<any[]>([]);

  const currentUser = getCurrentUser();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.category && formData.projectName) {
      loadLevels();
    }
  }, [formData.category, formData.projectName]);

  useEffect(() => {
    if (formData.level) {
      loadTasks();
    }
  }, [formData.level]);

  useEffect(() => {
    if (formData.task) {
      loadSubtasks();
    }
  }, [formData.task]);

  const loadData = () => {
    setProjects(getProjects());
    setProducts(getProducts());
    setDepartments(getDepartments());
  };

  const loadLevels = () => {
    let levels: any[] = [];
    
    if (formData.category === 'project') {
      const project = projects.find(p => p.name === formData.projectName);
      levels = project?.levels || [];
    } else if (formData.category === 'product') {
      const product = products.find(p => p.name === formData.projectName);
      levels = product?.stages || [];
    } else if (formData.category === 'department') {
      const department = departments.find(d => d.name === formData.projectName);
      levels = department?.functions || [];
    }
    
    setAvailableLevels(levels);
    setAvailableTasks([]);
    setAvailableSubtasks([]);
  };

  const loadTasks = () => {
    let tasks: any[] = [];
    
    const level = availableLevels.find(l => l.name === formData.level);
    if (level) {
      if (formData.category === 'project') {
        tasks = level.tasks || [];
      } else if (formData.category === 'product') {
        tasks = level.tasks || [];
      } else if (formData.category === 'department') {
        tasks = level.duties || [];
      }
    }
    
    setAvailableTasks(tasks);
    setAvailableSubtasks([]);
  };

  const loadSubtasks = () => {
    let subtasks: any[] = [];
    
    const task = availableTasks.find(t => t.name === formData.task);
    if (task) {
      if (formData.category === 'department') {
        subtasks = task.tasks || [];
      } else {
        subtasks = task.subtasks || [];
      }
    }
    
    setAvailableSubtasks(subtasks);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Reset dependent fields when parent changes
    if (field === 'category' || field === 'projectName') {
      setFormData(prev => ({ ...prev, level: '', task: '', subtask: '' }));
    } else if (field === 'level') {
      setFormData(prev => ({ ...prev, task: '', subtask: '' }));
    } else if (field === 'task') {
      setFormData(prev => ({ ...prev, subtask: '' }));
    }
  };

  const handleSubmit = () => {
    if (!currentUser) return;

    const totalHours = calculateHours(formData.clockIn, formData.clockOut, formData.breakTime);

    const projectDetails: ProjectDetail = {
      category: formData.category as 'project' | 'product' | 'department',
      name: formData.projectName,
      level: formData.level,
      task: formData.task,
      subtask: formData.subtask,
      description: formData.description,
    };

    const timeEntry: TimeEntry = {
      id: generateId(),
      userId: currentUser.id,
      userName: currentUser.name,
      date: formData.date,
      clockIn: formData.clockIn,
      clockOut: formData.clockOut,
      breakTime: formData.breakTime,
      totalHours,
      task: formData.description,
      projectDetails,
      isBillable: formData.isBillable,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveTimeEntry(timeEntry);
    
    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: '',
      projectName: '',
      level: '',
      task: '',
      subtask: '',
      description: '',
      clockIn: '',
      clockOut: '',
      breakTime: 30,
      isBillable: false,
    });
  };

  const getProjectOptions = () => {
    switch (formData.category) {
      case 'project': return projects;
      case 'product': return products;
      case 'department': return departments;
      default: return [];
    }
  };

  const getLevelLabel = () => {
    switch (formData.category) {
      case 'project': return 'Project Level';
      case 'product': return 'Product Stage';
      case 'department': return 'Department Function';
      default: return 'Level';
    }
  };

  const getTaskLabel = () => {
    switch (formData.category) {
      case 'department': return 'Duty';
      default: return 'Task';
    }
  };

  const getSubtaskLabel = () => {
    switch (formData.category) {
      case 'department': return 'Task';
      default: return 'Subtask';
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Add Time Entry" />

      <div className="p-6">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="bg-primary text-primary-foreground">
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Add Time Entry</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Date and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Project/Product/Department Selection */}
            {formData.category && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">{formData.category.charAt(0).toUpperCase() + formData.category.slice(1)} Name</Label>
                  <Select value={formData.projectName} onValueChange={(value) => handleInputChange('projectName', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${formData.category}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {getProjectOptions().map((item) => (
                        <SelectItem key={item.id} value={item.name}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.projectName && availableLevels.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="level">{getLevelLabel()}</Label>
                    <Select value={formData.level} onValueChange={(value) => handleInputChange('level', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${getLevelLabel()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableLevels.map((level) => (
                          <SelectItem key={level.id} value={level.name}>
                            {level.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Task and Subtask */}
            {formData.level && availableTasks.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task">{getTaskLabel()}</Label>
                  <Select value={formData.task} onValueChange={(value) => handleInputChange('task', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${getTaskLabel()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTasks.map((task) => (
                        <SelectItem key={task.id} value={task.name}>
                          {task.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.task && availableSubtasks.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="subtask">{getSubtaskLabel()}</Label>
                    <Select value={formData.subtask} onValueChange={(value) => handleInputChange('subtask', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${getSubtaskLabel()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSubtasks.map((subtask) => (
                          <SelectItem key={subtask.id} value={subtask.name}>
                            {subtask.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Time Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clockIn">Clock In</Label>
                <Input
                  id="clockIn"
                  type="time"
                  value={formData.clockIn}
                  onChange={(e) => handleInputChange('clockIn', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clockOut">Clock Out</Label>
                <Input
                  id="clockOut"
                  type="time"
                  value={formData.clockOut}
                  onChange={(e) => handleInputChange('clockOut', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="breakTime">Break (minutes)</Label>
                <Input
                  id="breakTime"
                  type="number"
                  value={formData.breakTime}
                  onChange={(e) => handleInputChange('breakTime', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Task Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Task Description</Label>
              <Textarea
                id="description"
                placeholder="What did you do in this sub-task?"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>

            {/* Billable Time */}
            <div className="flex items-center space-x-3">
              <Switch
                id="billable"
                checked={formData.isBillable}
                onCheckedChange={(checked) => handleInputChange('isBillable', checked)}
              />
              <Label htmlFor="billable" className="text-sm font-medium">
                💰 Billable Time
              </Label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button variant="outline">Cancel</Button>
              <Button onClick={handleSubmit} className="bg-primary hover:bg-primary-hover">
                <Calendar className="mr-2 h-4 w-4" />
                Add Time Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}