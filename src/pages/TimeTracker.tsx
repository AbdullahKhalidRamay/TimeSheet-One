import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar } from "lucide-react";
import Header from "@/components/dashboard/Header";
import { getCurrentUser } from "@/lib/auth";
import { saveTimeEntry, generateId, determineIsBillable, getUserAssociatedProjects, getUserAssociatedProducts, getUserAssociatedDepartments } from "@/services/storage";
import { TimeEntry, ProjectDetail, Project, Product, Department } from "@/validation/index";

interface Level {
  id?: string;
  name: string;
  tasks?: Task[];
  duties?: Task[];
}

interface Task {
  id?: string;
  name: string;
  subtasks?: Subtask[];
  tasks?: Subtask[];
}

interface Subtask {
  id?: string;
  name: string;
}
import DailyTrackerForm from "@/components/users/DailyTrackerForm";
import WeeklyTimeTracker from "@/components/users/WeeklyTimeTracker";
import MonthlyTimeTracker from "@/components/users/MonthlyTimeTracker";

interface FormData {
  date: string;
  category: string;
  projectName: string;
  level: string;
  task: string;
  subtask: string;
  description: string;
  actualHours: number;
  billableHours: number;
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
    actualHours: 0,
    billableHours: 0,
    isBillable: false,
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [availableLevels, setAvailableLevels] = useState<Level[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [availableSubtasks, setAvailableSubtasks] = useState<Subtask[]>([]);
  const [isBillableDisabled, setIsBillableDisabled] = useState(false);

  const currentUser = getCurrentUser();

  // Define callback functions first before using them in useEffect
  const loadData = useCallback(() => {
    if (currentUser) {
      setProjects(getUserAssociatedProjects(currentUser.id));
      setProducts(getUserAssociatedProducts(currentUser.id));
      setDepartments(getUserAssociatedDepartments(currentUser.id));
    }
  }, [currentUser]);

  const loadLevels = useCallback(() => {
    let levels: Level[] = [];
    
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
  }, [formData.category, formData.projectName, projects, products, departments]);

  const loadTasks = useCallback(() => {
    let tasks: Task[] = [];
    
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
  }, [availableLevels, formData.level, formData.category]);

  const loadSubtasks = useCallback(() => {
    let subtasks: Subtask[] = [];
    
    const task = availableTasks.find(t => t.name === formData.task);
    if (task) {
      if (formData.category === 'department') {
        subtasks = task.tasks || [];
      } else {
        subtasks = task.subtasks || [];
      }
    }
    
    setAvailableSubtasks(subtasks);
  }, [availableTasks, formData.task, formData.category]);

  // useEffect hooks after function declarations
  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (formData.category && formData.projectName) {
      loadLevels();
      // Automatically determine and set billable status
      const billableStatus = determineIsBillable(formData.category as 'project' | 'product' | 'department', formData.projectName);
      setFormData(prev => ({ ...prev, isBillable: billableStatus }));
      setIsBillableDisabled(true);
    } else {
      // Reset billable status and enable toggle when no project/product/department is selected
      setFormData(prev => ({ ...prev, isBillable: false }));
      setIsBillableDisabled(false);
    }
  }, [formData.category, formData.projectName, loadLevels]);

  useEffect(() => {
    if (formData.level) {
      loadTasks();
    }
  }, [formData.level, loadTasks]);

  useEffect(() => {
    if (formData.task) {
      loadSubtasks();
    }
  }, [formData.task, loadSubtasks]);

  const handleInputChange = (field: string, value: unknown) => {
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

    // Validation
    if (!formData.date || !formData.category || !formData.projectName) {
      alert('Please fill in all required fields: Date, Category, and Project/Product/Department selection.');
      return;
    }

    if (!currentUser.availableHours || currentUser.availableHours <= 0) {
      alert('No available hours found in your profile. Please contact your administrator.');
      return;
    }

    if (!formData.description.trim()) {
      alert('Please provide a task description.');
      return;
    }

    const projectDetails: ProjectDetail = {
      category: formData.category as 'project' | 'product' | 'department',
      name: formData.projectName,
      level: formData.level,
      task: formData.task,
      subtask: formData.subtask,
      description: formData.description,
    };

    const availableHours = currentUser.availableHours;

    const timeEntry: TimeEntry = {
      id: generateId(),
      userId: currentUser.id,
      userName: currentUser.name,
      date: formData.date,
      actualHours: currentUser.availableHours,
      billableHours: formData.isBillable ? currentUser.availableHours : 0,
      availableHours: availableHours,
      task: formData.description,
      projectDetails,
      isBillable: formData.isBillable,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveTimeEntry(timeEntry);
    
    alert('Time entry saved successfully!');
    
    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: '',
      projectName: '',
      level: '',
      task: '',
      subtask: '',
      description: '',
      actualHours: 0,
      billableHours: 0,
      isBillable: false,
    });
    setIsBillableDisabled(false);
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
    <div className="dashboard-layout">
      <Header title="Time Tracker" />

      <div className="dashboard-content">
        <Tabs defaultValue="entry-form" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="entry-form">1st Approach</TabsTrigger>
            <TabsTrigger value="trackers">Trackers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="entry-form">
            <Card className="max-w-4xl mx-auto card-primary">
              <CardHeader className="bg-gradient-primary text-primary-foreground rounded-t-lg">
                <CardTitle className="flex items-center space-x-3">
                  <Calendar className="h-6 w-6" />
                  <span className="text-display">Add Time Entry</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
            {/* Date and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <DatePicker
                  date={formData.date ? new Date(formData.date) : undefined}
                  onDateChange={(date) => 
                    handleInputChange('date', date ? date.toISOString().split('T')[0] : '')
                  }
                  placeholder="Select date"
                  className="w-full"
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{formData.category.charAt(0).toUpperCase() + formData.category.slice(1)} Selection</Label>
                  <Select value={formData.projectName} onValueChange={(value) => handleInputChange('projectName', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${formData.category.charAt(0).toUpperCase() + formData.category.slice(1)}`} />
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
                        {availableLevels.map((level, index) => (
                          <SelectItem key={level.id || `level-${index}`} value={level.name}>
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
                      {availableTasks.map((task, index) => (
                        <SelectItem key={task.id || `task-${index}`} value={task.name}>
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
                        {availableSubtasks.map((subtask, index) => (
                          <SelectItem key={subtask.id || `subtask-${index}`} value={subtask.name}>
                            {subtask.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

{/* Available Hours Input */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="availableHours">Available Hours</Label>
                <Input
                  id="availableHours"
                  type="number"
                  value={currentUser && currentUser.availableHours ? currentUser.availableHours.toFixed(1) : '0.0'}
                  readOnly
                  className="bg-muted font-semibold"
                  placeholder="Available hours"
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
                disabled={isBillableDisabled}
                onCheckedChange={(checked) => !isBillableDisabled && handleInputChange('isBillable', checked)}
              />
              <Label htmlFor="billable" className={`text-sm font-medium ${isBillableDisabled ? 'text-muted-foreground' : ''}`}>
                💰 Billable Time {isBillableDisabled && '(Auto-determined)'}
              </Label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => {
                setFormData({
                  date: new Date().toISOString().split('T')[0],
                  category: '',
                  projectName: '',
                  level: '',
                  task: '',
                  subtask: '',
                  description: '',
                  actualHours: 0,
                  billableHours: 0,
                  isBillable: false,
                });
                setIsBillableDisabled(false);
              }}>Cancel</Button>
                <Button 
                  onClick={handleSubmit} 
                  className="btn-primary"
                  disabled={!formData.date || !formData.category || !formData.projectName || !currentUser?.availableHours || currentUser.availableHours <= 0}
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Add Time Entry
                </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="trackers">
            <div className="space-y-6">
              <Tabs defaultValue="daily" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="daily">Daily Tracker</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly Tracker</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly Tracker</TabsTrigger>
                </TabsList>
                
                <TabsContent value="daily">
                  <DailyTrackerForm />
                </TabsContent>
                
                <TabsContent value="weekly">
                  <WeeklyTimeTracker />
                </TabsContent>
                
                <TabsContent value="monthly">
                  <MonthlyTimeTracker />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
