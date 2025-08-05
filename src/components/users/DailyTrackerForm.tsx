import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Trash2, Clock, DollarSign } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { 
  saveTimeEntry, 
  generateId, 
  getProjects, 
  getProducts, 
  getDepartments,
  getUserAssociatedProjects,
  getUserAssociatedProducts,
  getUserAssociatedDepartments,
  determineIsBillable,
  calculateHours,
  deleteTimeEntry
} from "@/services/storage";
import { TimeEntry, ProjectDetail, Project, Product, Department } from "@/validation/index";

interface Level {
  id: string;
  name: string;
  tasks?: Task[];
  duties?: Task[];
}

interface Task {
  id: string;
  name: string;
  levelId?: string;
  taskId?: string;
  subtasks?: Subtask[];
  tasks?: Subtask[];
}

interface Subtask {
  id: string;
  name: string;
  taskId?: string;
}

interface ProjectEntry {
  id: string;
  project: Project | Product | Department;
  category: 'project' | 'product' | 'department';
  level?: string;
  task?: string;
  subtask?: string;
  actualHours: number;
  billableHours: number;
  totalHours: number;
  availableHours: number;
  isBillable: boolean;
  isBillableDisabled: boolean;
  description: string;
  selectedLevels: Level[];
  selectedTasks: Task[];
  selectedSubtasks: Subtask[];
}

interface DailyTrackerFormData {
  date: string;
  projectEntries: ProjectEntry[];
  breakTime: number;
  availableHours: number;
}

interface DailyTrackerFormProps {
  initialDate?: string;
  editingEntries?: TimeEntry[];
  onClose?: () => void;
}

export default function DailyTrackerForm({ initialDate, editingEntries, onClose }: DailyTrackerFormProps) {
  const currentUser = getCurrentUser();
  
  const [formData, setFormData] = useState<DailyTrackerFormData>({
    date: initialDate || new Date().toISOString().split('T')[0],
    projectEntries: [],
    breakTime: 30,
    availableHours: currentUser?.availableHours || 0
  });

  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<Department[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<(Project | Product | Department)[]>([]);

  const loadData = useCallback(() => {
    if (currentUser) {
      // Load only user-associated projects, products, and departments
      const userProjects = getUserAssociatedProjects(currentUser.id);
      const userProducts = getUserAssociatedProducts(currentUser.id);
      const userDepartments = getUserAssociatedDepartments(currentUser.id);
      
      // Only show items the user is associated with through teams
      setAvailableProjects(userProjects);
      setAvailableProducts(userProducts);
      setAvailableDepartments(userDepartments);
      
      // Load editing entries if provided
      if (editingEntries && editingEntries.length > 0) {
        loadEditingEntries(userProjects, userProducts, userDepartments);
      }
    }
  }, [currentUser, editingEntries]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Function to load existing entries for editing
  const loadEditingEntries = (userProjects: Project[], userProducts: Product[], userDepartments: Department[]) => {
    if (!editingEntries || editingEntries.length === 0) return;

    const newProjectEntries: ProjectEntry[] = [];
    const newSelectedProjects: (Project | Product | Department)[] = [];

    editingEntries.forEach(entry => {
      let projectItem: Project | Product | Department | null = null;
      let category: 'project' | 'product' | 'department' = entry.projectDetails.category;

      // Find the project/product/department item
      switch (category) {
        case 'project':
          projectItem = userProjects.find(p => p.name === entry.projectDetails.name) || null;
          break;
        case 'product':
          projectItem = userProducts.find(p => p.name === entry.projectDetails.name) || null;
          break;
        case 'department':
          projectItem = userDepartments.find(d => d.name === entry.projectDetails.name) || null;
          break;
      }

      if (projectItem) {
        // Parse selected levels, tasks, and subtasks
        const selectedLevels = parseSelectionString(entry.projectDetails.level || '', projectItem, category, 'levels');
        const selectedTasks = parseSelectionString(entry.projectDetails.task || '', projectItem, category, 'tasks', selectedLevels);
        const selectedSubtasks = parseSelectionString(entry.projectDetails.subtask || '', projectItem, category, 'subtasks', selectedTasks);

        const projectEntry: ProjectEntry = {
          id: entry.id, // Use the original entry ID for editing
          project: projectItem,
          category,
          level: entry.projectDetails.level,
          task: entry.projectDetails.task,
          subtask: entry.projectDetails.subtask,
          actualHours: entry.actualHours,
          billableHours: entry.billableHours,
          totalHours: entry.totalHours || entry.actualHours + entry.billableHours,
          availableHours: entry.availableHours || 0,
          isBillable: entry.isBillable,
          isBillableDisabled: true,
          description: entry.task || entry.projectDetails.description,
          selectedLevels,
          selectedTasks,
          selectedSubtasks
        };

        newProjectEntries.push(projectEntry);
        newSelectedProjects.push(projectItem);
      }
    });

    setFormData(prev => ({
      ...prev,
      projectEntries: newProjectEntries
    }));
    setSelectedProjects(newSelectedProjects);
  };

  // Helper function to parse selection strings back to objects
  const parseSelectionString = (
    selectionStr: string, 
    projectItem: Project | Product | Department, 
    category: 'project' | 'product' | 'department',
    type: 'levels' | 'tasks' | 'subtasks',
    parentItems?: any[]
  ): any[] => {
    if (!selectionStr) return [];
    
    const names = selectionStr.split(', ').filter(name => name.trim());
    const results: any[] = [];

    names.forEach(name => {
      if (type === 'levels') {
        const levels = getLevelsForProject(projectItem, category);
        const level = levels.find(l => l.name === name);
        if (level) results.push(level);
      } else if (type === 'tasks' && parentItems) {
        parentItems.forEach(level => {
          const tasks = getTasksForLevel(level, category);
          const task = tasks.find(t => t.name === name);
          if (task) results.push({ ...task, levelId: level.id });
        });
      } else if (type === 'subtasks' && parentItems) {
        parentItems.forEach(task => {
          const subtasks = getSubtasksForTask(task, category);
          const subtask = subtasks.find(st => st.name === name);
          if (subtask) results.push({ ...subtask, taskId: task.id });
        });
      }
    });

    return results;
  };

  const handleProjectSelection = (item: Project | Product | Department, category: 'project' | 'product' | 'department', checked: boolean) => {
    if (checked) {
      setSelectedProjects(prev => [...prev, item]);
      const billableStatus = determineIsBillable(category, item.name);
      const newEntry: ProjectEntry = {
        id: generateId(),
        project: item,
        category,
        actualHours: 0,
        billableHours: 0,
        totalHours: 0,
        availableHours: currentUser?.availableHours || 0,
        isBillable: billableStatus,
        isBillableDisabled: true, // Auto-determined
        description: '',
        selectedLevels: [],
        selectedTasks: [],
        selectedSubtasks: []
      };
      setFormData(prev => ({
        ...prev,
        projectEntries: [...prev.projectEntries, newEntry]
      }));
    } else {
      setSelectedProjects(prev => prev.filter(p => p.id !== item.id));
      setFormData(prev => ({
        ...prev,
        projectEntries: prev.projectEntries.filter(entry => entry.project.id !== item.id)
      }));
    }
  };

  const updateProjectEntry = (entryId: string, field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      projectEntries: prev.projectEntries.map(entry => 
        entry.id === entryId ? { ...entry, [field]: value } : entry
      )
    }));
  };

  const handleLevelSelection = (entryId: string, level: Level, checked: boolean) => {
    const entry = formData.projectEntries.find(e => e.id === entryId);
    if (!entry) return;

    if (checked) {
      updateProjectEntry(entryId, 'selectedLevels', [...(entry.selectedLevels || []), level]);
    } else {
      updateProjectEntry(entryId, 'selectedLevels', (entry.selectedLevels || []).filter(l => l.id !== level.id));
      // Also remove dependent tasks and subtasks
      updateProjectEntry(entryId, 'selectedTasks', (entry.selectedTasks || []).filter(t => t.levelId !== level.id));
      updateProjectEntry(entryId, 'selectedSubtasks', (entry.selectedSubtasks || []).filter(st => st.taskId && (entry.selectedTasks || []).some(t => t.id === st.taskId)));
    }
  };

  const handleTaskSelection = (entryId: string, task: Task, levelId: string, checked: boolean) => {
    const entry = formData.projectEntries.find(e => e.id === entryId);
    if (!entry) return;

    const taskWithLevel = { ...task, levelId };

    if (checked) {
      updateProjectEntry(entryId, 'selectedTasks', [...(entry.selectedTasks || []), taskWithLevel]);
    } else {
      updateProjectEntry(entryId, 'selectedTasks', (entry.selectedTasks || []).filter(t => t.id !== task.id));
      // Also remove dependent subtasks
      updateProjectEntry(entryId, 'selectedSubtasks', (entry.selectedSubtasks || []).filter(st => st.taskId !== task.id));
    }
  };

  const handleSubtaskSelection = (entryId: string, subtask: Subtask, taskId: string, checked: boolean) => {
    const entry = formData.projectEntries.find(e => e.id === entryId);
    if (!entry) return;

    const subtaskWithTask = { ...subtask, taskId };

    if (checked) {
      updateProjectEntry(entryId, 'selectedSubtasks', [...(entry.selectedSubtasks || []), subtaskWithTask]);
    } else {
      updateProjectEntry(entryId, 'selectedSubtasks', (entry.selectedSubtasks || []).filter(st => st.id !== subtask.id));
    }
  };

  const getLevelsForProject = (project: Project | Product | Department, category: 'project' | 'product' | 'department') => {
    switch (category) {
      case 'project':
        return (project as Project).levels || [];
      case 'product':
        return (project as Product).stages || [];
      case 'department':
        return (project as Department).functions || [];
      default:
        return [];
    }
  };

  const getTasksForLevel = (level: Level, category: 'project' | 'product' | 'department') => {
    switch (category) {
      case 'project':
      case 'product':
        return level.tasks || [];
      case 'department':
        return level.duties || [];
      default:
        return [];
    }
  };

  const getSubtasksForTask = (task: Task, category: 'project' | 'product' | 'department') => {
    switch (category) {
      case 'project':
      case 'product':
        return task.subtasks || [];
      case 'department':
        return task.tasks || [];
      default:
        return [];
    }
  };

  const handleSubmit = () => {
    if (!currentUser) return;

    // If editing, first delete the original entries for this date
    if (editingEntries && editingEntries.length > 0) {
      editingEntries.forEach(entry => {
        deleteTimeEntry(entry.id);
      });
    }

    // Create separate time entries for each project entry
    formData.projectEntries.forEach(entry => {
      if (entry.totalHours > 0) {
        const projectDetails: ProjectDetail = {
          category: entry.category,
          name: entry.project.name,
          level: entry.selectedLevels.map(l => l.name).join(', '),
          task: entry.selectedTasks.map(t => t.name).join(', '),
          subtask: entry.selectedSubtasks.map(st => st.name).join(', '),
          description: entry.description,
        };

        const timeEntry: TimeEntry = {
          id: generateId(),
          userId: currentUser.id,
          userName: currentUser.name,
          date: formData.date,
          actualHours: entry.actualHours,
          billableHours: entry.billableHours,
          totalHours: entry.totalHours,
          availableHours: entry.availableHours,
          task: entry.description,
          projectDetails,
          isBillable: entry.isBillable,
          status: 'pending',
          createdAt: editingEntries && editingEntries.length > 0 ? editingEntries[0].createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        saveTimeEntry(timeEntry);
      }
    });

    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      projectEntries: [],
      breakTime: 30,
      availableHours: currentUser?.availableHours || 0
    });
    setSelectedProjects([]);
    
    const message = editingEntries && editingEntries.length > 0 
      ? 'Time entries updated successfully!' 
      : 'Time entries saved successfully!';
    alert(message);
    
    // Call onClose if provided
    if (onClose) {
      onClose();
    }
  };

  const getTotalHours = () => {
    return formData.projectEntries.reduce((total, entry) => total + entry.totalHours, 0);
  };

  const getTotalBillableHours = () => {
    return formData.projectEntries.reduce((total, entry) => 
      total + entry.billableHours, 0
    );
  };

  return (
    <Card className="max-w-6xl mx-auto bg-card border-border shadow-lg">
      <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
        <CardTitle className="flex items-center space-x-3 text-xl font-semibold">
          <div className="p-2 bg-primary-foreground/20 rounded-lg">
            <Calendar className="h-6 w-6" />
          </div>
          <span>Daily Time Tracker</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {/* Date */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <DatePicker
              date={formData.date ? new Date(formData.date) : undefined}
              onDateChange={(date) => 
                setFormData(prev => ({ 
                  ...prev, 
                  date: date ? date.toISOString().split('T')[0] : '' 
                }))
              }
              placeholder="Select date"
              className="w-full max-w-xs"
            />
          </div>
        </div>

        {/* Project Selection */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="h-2 w-2 bg-primary rounded-full"></div>
            <Label className="text-lg font-semibold text-foreground">Select Projects, Products, and Departments</Label>
          </div>
          
          {/* Projects */}
          {availableProjects.length > 0 && (
            <Card className="p-6 bg-blue-50/30 border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-4 flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Projects</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableProjects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-3 p-3 rounded-lg bg-background hover:bg-accent/50 transition-colors border border-border">
                    <Checkbox
                      id={`project-${project.id}`}
                      checked={selectedProjects.some(p => p.id === project.id)}
                      onCheckedChange={(checked) => 
                        handleProjectSelection(project, 'project', checked as boolean)
                      }
                      className="border-border data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                    />
                    <Label htmlFor={`project-${project.id}`} className="font-medium text-foreground cursor-pointer flex-1">{project.name}</Label>
                    {project.isBillable && <DollarSign className="h-4 w-4 text-green-600" />}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Products */}
          {availableProducts.length > 0 && (
            <Card className="p-6 bg-purple-50/30 border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-4 flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>Products</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableProducts.map((product) => (
                  <div key={product.id} className="flex items-center space-x-3 p-3 rounded-lg bg-background hover:bg-accent/50 transition-colors border border-border">
                    <Checkbox
                      id={`product-${product.id}`}
                      checked={selectedProjects.some(p => p.id === product.id)}
                      onCheckedChange={(checked) => 
                        handleProjectSelection(product, 'product', checked as boolean)
                      }
                      className="border-border data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 data-[state=checked]:text-white"
                    />
                    <Label htmlFor={`product-${product.id}`} className="font-medium text-foreground cursor-pointer flex-1">{product.name}</Label>
                    {product.isBillable && <DollarSign className="h-4 w-4 text-green-600" />}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Departments */}
          {availableDepartments.length > 0 && (
            <Card className="p-6 bg-orange-50/30 border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-4 flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>Departments</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableDepartments.map((department) => (
                  <div key={department.id} className="flex items-center space-x-3 p-3 rounded-lg bg-background hover:bg-accent/50 transition-colors border border-border">
                    <Checkbox
                      id={`department-${department.id}`}
                      checked={selectedProjects.some(p => p.id === department.id)}
                      onCheckedChange={(checked) => 
                        handleProjectSelection(department, 'department', checked as boolean)
                      }
                      className="border-border data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600 data-[state=checked]:text-white"
                    />
                    <Label htmlFor={`department-${department.id}`} className="font-medium text-foreground cursor-pointer flex-1">{department.name}</Label>
                    {department.isBillable && <DollarSign className="h-4 w-4 text-green-600" />}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Selected Project Entries */}
        {formData.projectEntries.map((entry) => {
          const categoryColors = {
            project: 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/30',
            product: 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100/30',
            department: 'border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100/30'
          };
          
          return (
            <Card key={entry.id} className={`border-l-4 ${categoryColors[entry.category]} shadow-md`}>
              <CardHeader className="pb-4 border-b border-gray-100">
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      entry.category === 'project' ? 'bg-blue-500' :
                      entry.category === 'product' ? 'bg-purple-500' : 'bg-orange-500'
                    }`}></div>
                    <span className="font-semibold text-gray-800">{entry.project.name}</span>
                  </div>
                  <Badge variant={entry.category === 'project' ? 'default' : 
                                entry.category === 'product' ? 'secondary' : 'outline'}
                         className="capitalize font-medium">
                    {entry.category}
                  </Badge>
                </CardTitle>
              </CardHeader>
            <CardContent className="space-y-4">
              {/* Level Selection */}
              <div className="space-y-2">
                <Label>
                  {entry.category === 'project' ? 'Levels' : 
                   entry.category === 'product' ? 'Stages' : 'Functions'}
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {getLevelsForProject(entry.project, entry.category).map((level) => (
                    <div key={level.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={(entry.selectedLevels || []).some(l => l.id === level.id)}
                        onCheckedChange={(checked) => 
                          handleLevelSelection(entry.id, level, checked as boolean)
                        }
                      />
                      <Label className="text-sm">{level.name}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Task Selection */}
              {(entry.selectedLevels || []).map((level) => (
                <div key={level.id} className="space-y-2">
                  <Label>
                    {entry.category === 'department' ? 'Duties' : 'Tasks'} for {level.name}
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {getTasksForLevel(level, entry.category).map((task) => (
                      <div key={task.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={(entry.selectedTasks || []).some(t => t.id === task.id && t.levelId === level.id)}
                          onCheckedChange={(checked) => 
                            handleTaskSelection(entry.id, task, level.id, checked as boolean)
                          }
                        />
                        <Label className="text-sm">{task.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Subtask Selection */}
              {(entry.selectedTasks || []).map((task) => (
                <div key={task.id} className="space-y-2">
                  <Label>
                    {entry.category === 'department' ? 'Tasks' : 'Subtasks'} for {task.name}
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {getSubtasksForTask(task, entry.category).map((subtask) => (
                      <div key={subtask.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={(entry.selectedSubtasks || []).some(st => st.id === subtask.id && st.taskId === task.id)}
                          onCheckedChange={(checked) => 
                            handleSubtaskSelection(entry.id, subtask, task.id, checked as boolean)
                          }
                        />
                        <Label className="text-sm">{subtask.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Hours Input */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Actual Hours</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={entry.actualHours}
                    onChange={(e) => {
                      const actualHours = parseFloat(e.target.value) || 0;
                      updateProjectEntry(entry.id, 'actualHours', actualHours);
                      // Update total hours
                      updateProjectEntry(entry.id, 'totalHours', actualHours + entry.billableHours);
                    }}
                    placeholder="Enter actual hours"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Billable Hours</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={entry.billableHours}
                    onChange={(e) => {
                      const billableHours = parseFloat(e.target.value) || 0;
                      updateProjectEntry(entry.id, 'billableHours', billableHours);
                      // Update total hours
                      updateProjectEntry(entry.id, 'totalHours', entry.actualHours + billableHours);
                    }}
                    placeholder="Enter billable hours"
                    disabled={!entry.isBillable}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Available Hours</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={entry.availableHours}
                    onChange={(e) => {
                      const newAvailableHours = parseFloat(e.target.value) || 0;
                      updateProjectEntry(entry.id, 'availableHours', newAvailableHours);
                    }}
                    className="bg-muted/50 font-semibold"
                    placeholder="Available hours for this project"
                  />
                  <p className="text-xs text-muted-foreground">Hours available for this project</p>
                </div>
              </div>
              
              {/* Billable and Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={entry.isBillable}
                    disabled={entry.isBillableDisabled}
                    onCheckedChange={(checked) => 
                      !entry.isBillableDisabled && updateProjectEntry(entry.id, 'isBillable', checked)
                    }
                  />
                  <Label className={`${entry.isBillableDisabled ? 'text-muted-foreground' : ''}`}>
                    💰 Billable {entry.isBillableDisabled && '(Auto-determined)'}
                  </Label>
                </div>
                <div className="space-y-2">
                  <Label>Task Description</Label>
                  <Textarea
                    placeholder="What did you work on?"
                    value={entry.description}
                    onChange={(e) => 
                      updateProjectEntry(entry.id, 'description', e.target.value)
                    }
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          );
        })}

        {/* Summary */}
        {formData.projectEntries.length > 0 && (
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-3 bg-white/70 px-4 py-3 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Actual Hours</p>
                      <p className="text-xl font-bold text-gray-800">{formData.projectEntries.reduce((sum, entry) => sum + entry.actualHours, 0).toFixed(1)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 bg-white/70 px-4 py-3 rounded-lg">
                    <div className="p-2 bg-green-100 rounded-full">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Billable Hours</p>
                      <p className="text-xl font-bold text-green-700">{getTotalBillableHours().toFixed(1)}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="px-3 py-1 text-sm font-semibold">
                    {formData.projectEntries.length} Project{formData.projectEntries.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-border">
          <Button 
            variant="outline"
            size="lg"
            onClick={() => {
              setFormData({
                date: new Date().toISOString().split('T')[0],
                projectEntries: [],
                breakTime: 30
              });
              setSelectedProjects([]);
            }}
            className="border-border text-foreground hover:bg-accent"
          >
            Reset Form
          </Button>
          <Button 
            size="lg"
            onClick={handleSubmit}
            disabled={formData.projectEntries.length === 0 || getTotalHours() === 0}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calendar className="mr-2 h-5 w-5" />
            Save Time Entries
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
