import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Edit2, Trash2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { saveTimeEntry, getProjects, getProducts, getDepartments, determineIsBillable, getUserAssociatedProjects, getUserAssociatedProducts, getUserAssociatedDepartments, getTimeEntries } from "@/services/storage";
import { TimeEntry, ProjectDetail, Project, Product, Department } from "@/validation/index";

interface EditTimeEntryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingEntry: TimeEntry | null;
}

export default function EditTimeEntryForm({ isOpen, onClose, onSuccess, editingEntry }: EditTimeEntryFormProps) {
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
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  const [availableTasks, setAvailableTasks] = useState<string[]>([]);
  const [availableSubtasks, setAvailableSubtasks] = useState<string[]>([]);
  const [isBillableDisabled, setIsBillableDisabled] = useState(false);

  const currentUser = getCurrentUser();
  const isEditing = !!editingEntry;

  const loadData = useCallback(() => {
    if (currentUser) {
      setProjects(getUserAssociatedProjects(currentUser.id));
      setProducts(getUserAssociatedProducts(currentUser.id));
      setDepartments(getUserAssociatedDepartments(currentUser.id));
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (editingEntry && isOpen) {
      // Pre-fill form with existing data
      setFormData({
        date: editingEntry.date,
        category: editingEntry.projectDetails.category,
        projectName: editingEntry.projectDetails.name,
        level: editingEntry.projectDetails.level || '',
        task: editingEntry.projectDetails.task || '',
        subtask: editingEntry.projectDetails.subtask || '',
        description: editingEntry.task || '', // Task description goes in description field
        clockIn: editingEntry.clockIn,
        clockOut: editingEntry.clockOut,
        breakTime: editingEntry.breakTime,
        isBillable: editingEntry.isBillable,
      });
    } else if (!isOpen) {
      // Reset form when closing
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
    }
  }, [editingEntry, isOpen]);

  // Function to get unique levels from existing time entries for the specific project/product/department
  const getUniqueLevels = useCallback(() => {
    const allEntries = getTimeEntries();
    const levels = new Set<string>();
    
    allEntries.forEach(entry => {
      if (entry.projectDetails?.category === formData.category && 
          entry.projectDetails?.name === formData.projectName &&
          entry.projectDetails?.level &&
          entry.projectDetails.level.trim() !== '') {
        levels.add(entry.projectDetails.level);
      }
    });
    
    // Also add levels from the project/product/department definition
    if (formData.category && formData.projectName) {
      let item: Project | Product | Department | undefined;
      
      switch (formData.category) {
        case 'project':
          item = projects.find(p => p.name === formData.projectName);
          if (item && 'levels' in item) {
            item.levels.forEach(level => {
              if (level.name.trim() !== '') levels.add(level.name);
            });
          }
          break;
        case 'product':
          item = products.find(p => p.name === formData.projectName);
          if (item && 'stages' in item) {
            item.stages.forEach(stage => {
              if (stage.name.trim() !== '') levels.add(stage.name);
            });
          }
          break;
        case 'department':
          item = departments.find(d => d.name === formData.projectName);
          if (item && 'functions' in item) {
            item.functions.forEach(func => {
              if (func.name.trim() !== '') levels.add(func.name);
            });
          }
          break;
      }
    }
    
    return Array.from(levels).sort();
  }, [formData.category, formData.projectName, projects, products, departments]);

  // Function to get unique tasks from existing time entries for the specific project/product/department
  const getUniqueTasks = useCallback(() => {
    const allEntries = getTimeEntries();
    const tasks = new Set<string>();
    
    allEntries.forEach(entry => {
      if (entry.projectDetails?.category === formData.category && 
          entry.projectDetails?.name === formData.projectName &&
          entry.projectDetails?.level === formData.level &&
          entry.projectDetails?.task &&
          entry.projectDetails.task.trim() !== '') {
        tasks.add(entry.projectDetails.task);
      }
    });
    
    // Also add tasks from the project/product/department definition
    if (formData.category && formData.projectName && formData.level) {
      let item: Project | Product | Department | undefined;
      
      switch (formData.category) {
        case 'project':
          item = projects.find(p => p.name === formData.projectName);
          if (item && 'levels' in item) {
            const level = item.levels.find(l => l.name === formData.level);
            if (level) {
              level.tasks.forEach(task => {
                if (task.name.trim() !== '') tasks.add(task.name);
              });
            }
          }
          break;
        case 'product':
          item = products.find(p => p.name === formData.projectName);
          if (item && 'stages' in item) {
            const stage = item.stages.find(s => s.name === formData.level);
            if (stage) {
              stage.tasks.forEach(task => {
                if (task.name.trim() !== '') tasks.add(task.name);
              });
            }
          }
          break;
        case 'department':
          item = departments.find(d => d.name === formData.projectName);
          if (item && 'functions' in item) {
            const func = item.functions.find(f => f.name === formData.level);
            if (func) {
              func.duties.forEach(duty => {
                if (duty.name.trim() !== '') tasks.add(duty.name);
              });
            }
          }
          break;
      }
    }
    
    return Array.from(tasks).sort();
  }, [formData.category, formData.projectName, formData.level, projects, products, departments]);

  // Function to get unique subtasks from existing time entries for the specific project/product/department
  const getUniqueSubtasks = useCallback(() => {
    const allEntries = getTimeEntries();
    const subtasks = new Set<string>();
    
    allEntries.forEach(entry => {
      if (entry.projectDetails?.category === formData.category && 
          entry.projectDetails?.name === formData.projectName &&
          entry.projectDetails?.level === formData.level &&
          entry.projectDetails?.task === formData.task &&
          entry.projectDetails?.subtask &&
          entry.projectDetails.subtask.trim() !== '') {
        subtasks.add(entry.projectDetails.subtask);
      }
    });
    
    // Also add subtasks from the project/product/department definition
    if (formData.category && formData.projectName && formData.level && formData.task) {
      let item: Project | Product | Department | undefined;
      
      switch (formData.category) {
        case 'project':
          item = projects.find(p => p.name === formData.projectName);
          if (item && 'levels' in item) {
            const level = item.levels.find(l => l.name === formData.level);
            if (level) {
              const task = level.tasks.find(t => t.name === formData.task);
              if (task) {
                task.subtasks.forEach(subtask => {
                  if (subtask.name.trim() !== '') subtasks.add(subtask.name);
                });
              }
            }
          }
          break;
        case 'product':
          item = products.find(p => p.name === formData.projectName);
          if (item && 'stages' in item) {
            const stage = item.stages.find(s => s.name === formData.level);
            if (stage) {
              const task = stage.tasks.find(t => t.name === formData.task);
              if (task) {
                task.subtasks.forEach(subtask => {
                  if (subtask.name.trim() !== '') subtasks.add(subtask.name);
                });
              }
            }
          }
          break;
        case 'department':
          item = departments.find(d => d.name === formData.projectName);
          if (item && 'functions' in item) {
            const func = item.functions.find(f => f.name === formData.level);
            if (func) {
              const duty = func.duties.find(d => d.name === formData.task);
              if (duty) {
                duty.subduties.forEach(subduty => {
                  if (subduty.name.trim() !== '') subtasks.add(subduty.name);
                });
              }
            }
          }
          break;
      }
    }
    
    return Array.from(subtasks).sort();
  }, [formData.category, formData.projectName, formData.level, formData.task, projects, products, departments]);

  // Load levels when category and project name change
  useEffect(() => {
    if (formData.category && formData.projectName) {
      const levels = getUniqueLevels();
      setAvailableLevels(levels);
      setAvailableTasks([]);
      setAvailableSubtasks([]);
      
      const billableStatus = determineIsBillable(formData.category as 'project' | 'product' | 'department', formData.projectName);
      setFormData(prev => ({ ...prev, isBillable: billableStatus }));
      setIsBillableDisabled(true);
    } else {
      setFormData(prev => ({ ...prev, isBillable: false }));
      setIsBillableDisabled(false);
      setAvailableLevels([]);
      setAvailableTasks([]);
      setAvailableSubtasks([]);
    }
  }, [formData.category, formData.projectName, getUniqueLevels]);

  // Load tasks when level changes
  useEffect(() => {
    if (formData.level) {
      const tasks = getUniqueTasks();
      setAvailableTasks(tasks);
      setAvailableSubtasks([]);
    } else {
      setAvailableTasks([]);
      setAvailableSubtasks([]);
    }
  }, [formData.level, getUniqueTasks]);

  // Load subtasks when task changes
  useEffect(() => {
    if (formData.task) {
      const subtasks = getUniqueSubtasks();
      setAvailableSubtasks(subtasks);
    } else {
      setAvailableSubtasks([]);
    }
  }, [formData.task, getUniqueSubtasks]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
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
    if (!currentUser || !editingEntry) return;

    const availableHours = editingEntry.availableHours || currentUser.availableHours;

    const projectDetails: ProjectDetail = {
      category: formData.category as 'project' | 'product' | 'department',
      name: formData.projectName,
      level: formData.level,
      task: formData.task,
      subtask: formData.subtask,
      description: formData.description, // Task description goes in description field
    };

    const updatedTimeEntry: TimeEntry = {
      ...editingEntry,
      date: formData.date,
      clockIn: formData.clockIn,
      clockOut: formData.clockOut,
      breakTime: formData.breakTime,
      availableHours,
      task: formData.description, // Task description goes in task field
      projectDetails,
      isBillable: formData.isBillable,
      updatedAt: new Date().toISOString(),
    };

    saveTimeEntry(updatedTimeEntry);
    onSuccess();
    handleClose();
  };

  const handleClose = () => {
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
    onClose();
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
    return 'Level';
  };

  const getTaskLabel = () => {
    return 'Task';
  };

  const getSubtaskLabel = () => {
    return 'Subtask';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-card border-border shadow-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-2xl font-semibold text-card-foreground flex items-center space-x-3">
            <div className="p-2 bg-orange-100/30 rounded-lg">
              <Edit2 className="h-6 w-6 text-orange-600" />
            </div>
            <span>Edit Time Entry</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-6">
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
            <div className="space-y-2">
              <Label>{formData.category.charAt(0).toUpperCase() + formData.category.slice(1)} Name</Label>
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
          )}

          {/* Level Selection */}
          {formData.projectName && (
            <div className="space-y-2">
              <Label htmlFor="level">{getLevelLabel()}</Label>
              <Select value={formData.level} onValueChange={(value) => handleInputChange('level', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${getLevelLabel()}`} />
                </SelectTrigger>
                <SelectContent>
                  {availableLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Task and Subtask */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task">{getTaskLabel()}</Label>
              <Select value={formData.task} onValueChange={(value) => handleInputChange('task', value)} disabled={!formData.level}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${getTaskLabel()}`} />
                </SelectTrigger>
                <SelectContent>
                  {availableTasks.map((task) => (
                    <SelectItem key={task} value={task}>
                      {task}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtask">{getSubtaskLabel()}</Label>
              <Select value={formData.subtask} onValueChange={(value) => handleInputChange('subtask', value)} disabled={!formData.level || !formData.task}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${getSubtaskLabel()}`} />
                </SelectTrigger>
                <SelectContent>
                  {availableSubtasks.map((subtask) => (
                    <SelectItem key={subtask} value={subtask}>
                      {subtask}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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
              placeholder="Describe what you did in this task..."
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
        </div>

        <DialogFooter className="flex justify-between items-center border-t border-border pt-6">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="border-border text-foreground hover:bg-accent"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-200"
          >
            <Edit2 className="h-5 w-5 mr-2" />
            Update Time Entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
