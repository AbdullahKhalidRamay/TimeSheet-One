import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Calendar, Save, X } from "lucide-react";
import { TimeEntry, Project, Product, Department, ProjectDetail } from "@/validation/index";
import { saveTimeEntry, deleteTimeEntry, getUserAssociatedProjects, getUserAssociatedProducts, getUserAssociatedDepartments, getTimeEntries } from "@/services/storage";
import { getCurrentUser } from "@/lib/auth";
import { toast } from "@/components/ui/sonner";

interface EditSingleTimeEntryFormProps {
  entry: TimeEntry;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditSingleTimeEntryForm({ entry, onClose, onSuccess }: EditSingleTimeEntryFormProps) {
  const [formData, setFormData] = useState({
    date: entry.date,
    actualHours: entry.actualHours,
    billableHours: entry.billableHours,
    availableHours: entry.availableHours || 0,
    task: entry.task, // This is the task description
    isBillable: entry.isBillable,
    projectDetails: {
      category: entry.projectDetails.category,
      name: entry.projectDetails.name,
      level: entry.projectDetails.level || "",
      task: entry.projectDetails.task || "",
      subtask: entry.projectDetails.subtask || "",
      description: entry.projectDetails.description || ""
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  const [availableTasks, setAvailableTasks] = useState<string[]>([]);
  const [availableSubtasks, setAvailableSubtasks] = useState<string[]>([]);

  const currentUser = getCurrentUser();

  // Load projects, products, and departments
  useEffect(() => {
    if (currentUser) {
      setProjects(getUserAssociatedProjects(currentUser.id));
      setProducts(getUserAssociatedProducts(currentUser.id));
      setDepartments(getUserAssociatedDepartments(currentUser.id));
    }
  }, [currentUser]);

  // Function to get unique levels from existing time entries for the specific project/product/department
  const getUniqueLevels = useCallback(() => {
    const allEntries = getTimeEntries();
    const levels = new Set<string>();
    
    allEntries.forEach(entry => {
      if (entry.projectDetails?.category === formData.projectDetails.category && 
          entry.projectDetails?.name === formData.projectDetails.name &&
          entry.projectDetails?.level &&
          entry.projectDetails.level.trim() !== '') {
        levels.add(entry.projectDetails.level);
      }
    });
    
    // Also add levels from the project/product/department definition
    if (formData.projectDetails.category && formData.projectDetails.name) {
      let item: Project | Product | Department | undefined;
      
      switch (formData.projectDetails.category) {
        case 'project':
          item = projects.find(p => p.name === formData.projectDetails.name);
          if (item && 'levels' in item) {
            item.levels.forEach(level => {
              if (level.name.trim() !== '') levels.add(level.name);
            });
          }
          break;
        case 'product':
          item = products.find(p => p.name === formData.projectDetails.name);
          if (item && 'stages' in item) {
            item.stages.forEach(stage => {
              if (stage.name.trim() !== '') levels.add(stage.name);
            });
          }
          break;
        case 'department':
          item = departments.find(d => d.name === formData.projectDetails.name);
          if (item && 'functions' in item) {
            item.functions.forEach(func => {
              if (func.name.trim() !== '') levels.add(func.name);
            });
          }
          break;
      }
    }
    
    return Array.from(levels).sort();
  }, [formData.projectDetails.category, formData.projectDetails.name, projects, products, departments]);

  // Function to get unique tasks from existing time entries for the specific project/product/department
  const getUniqueTasks = useCallback(() => {
    const allEntries = getTimeEntries();
    const tasks = new Set<string>();
    
    allEntries.forEach(entry => {
      if (entry.projectDetails?.category === formData.projectDetails.category && 
          entry.projectDetails?.name === formData.projectDetails.name &&
          entry.projectDetails?.level === formData.projectDetails.level &&
          entry.projectDetails?.task &&
          entry.projectDetails.task.trim() !== '') {
        tasks.add(entry.projectDetails.task);
      }
    });
    
    // Also add tasks from the project/product/department definition
    if (formData.projectDetails.category && formData.projectDetails.name && formData.projectDetails.level) {
      let item: Project | Product | Department | undefined;
      
      switch (formData.projectDetails.category) {
        case 'project':
          item = projects.find(p => p.name === formData.projectDetails.name);
          if (item && 'levels' in item) {
            const level = item.levels.find(l => l.name === formData.projectDetails.level);
            if (level) {
              level.tasks.forEach(task => {
                if (task.name.trim() !== '') tasks.add(task.name);
              });
            }
          }
          break;
        case 'product':
          item = products.find(p => p.name === formData.projectDetails.name);
          if (item && 'stages' in item) {
            const stage = item.stages.find(s => s.name === formData.projectDetails.level);
            if (stage) {
              stage.tasks.forEach(task => {
                if (task.name.trim() !== '') tasks.add(task.name);
              });
            }
          }
          break;
        case 'department':
          item = departments.find(d => d.name === formData.projectDetails.name);
          if (item && 'functions' in item) {
            const func = item.functions.find(f => f.name === formData.projectDetails.level);
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
  }, [formData.projectDetails.category, formData.projectDetails.name, formData.projectDetails.level, projects, products, departments]);

  // Function to get unique subtasks from existing time entries for the specific project/product/department
  const getUniqueSubtasks = useCallback(() => {
    const allEntries = getTimeEntries();
    const subtasks = new Set<string>();
    
    allEntries.forEach(entry => {
      if (entry.projectDetails?.category === formData.projectDetails.category && 
          entry.projectDetails?.name === formData.projectDetails.name &&
          entry.projectDetails?.level === formData.projectDetails.level &&
          entry.projectDetails?.task === formData.projectDetails.task &&
          entry.projectDetails?.subtask &&
          entry.projectDetails.subtask.trim() !== '') {
        subtasks.add(entry.projectDetails.subtask);
      }
    });
    
    // Also add subtasks from the project/product/department definition
    if (formData.projectDetails.category && formData.projectDetails.name && formData.projectDetails.level && formData.projectDetails.task) {
      let item: Project | Product | Department | undefined;
      
      switch (formData.projectDetails.category) {
        case 'project':
          item = projects.find(p => p.name === formData.projectDetails.name);
          if (item && 'levels' in item) {
            const level = item.levels.find(l => l.name === formData.projectDetails.level);
            if (level) {
              const task = level.tasks.find(t => t.name === formData.projectDetails.task);
              if (task) {
                task.subtasks.forEach(subtask => {
                  if (subtask.name.trim() !== '') subtasks.add(subtask.name);
                });
              }
            }
          }
          break;
        case 'product':
          item = products.find(p => p.name === formData.projectDetails.name);
          if (item && 'stages' in item) {
            const stage = item.stages.find(s => s.name === formData.projectDetails.level);
            if (stage) {
              const task = stage.tasks.find(t => t.name === formData.projectDetails.task);
              if (task) {
                task.subtasks.forEach(subtask => {
                  if (subtask.name.trim() !== '') subtasks.add(subtask.name);
                });
              }
            }
          }
          break;
        case 'department':
          item = departments.find(d => d.name === formData.projectDetails.name);
          if (item && 'functions' in item) {
            const func = item.functions.find(f => f.name === formData.projectDetails.level);
            if (func) {
              const duty = func.duties.find(d => d.name === formData.projectDetails.task);
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
  }, [formData.projectDetails.category, formData.projectDetails.name, formData.projectDetails.level, formData.projectDetails.task, projects, products, departments]);

  // Load levels when component mounts or project details change
  useEffect(() => {
    if (formData.projectDetails.category && formData.projectDetails.name) {
      const levels = getUniqueLevels();
      setAvailableLevels(levels);
      setAvailableTasks([]);
      setAvailableSubtasks([]);
    }
  }, [formData.projectDetails.category, formData.projectDetails.name, getUniqueLevels]);

  // Load tasks when level changes
  useEffect(() => {
    if (formData.projectDetails.level) {
      const tasks = getUniqueTasks();
      setAvailableTasks(tasks);
      setAvailableSubtasks([]);
    } else {
      setAvailableTasks([]);
      setAvailableSubtasks([]);
    }
  }, [formData.projectDetails.level, getUniqueTasks]);

  // Load subtasks when task changes
  useEffect(() => {
    if (formData.projectDetails.task) {
      const subtasks = getUniqueSubtasks();
      setAvailableSubtasks(subtasks);
    } else {
      setAvailableSubtasks([]);
    }
  }, [formData.projectDetails.task, getUniqueSubtasks]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProjectDetailsChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      projectDetails: {
        ...prev.projectDetails,
        [field]: value
      }
    }));
    
    // Reset dependent fields when parent changes
    if (field === 'level') {
      setFormData(prev => ({
        ...prev,
        projectDetails: {
          ...prev.projectDetails,
          task: '',
          subtask: ''
        }
      }));
    } else if (field === 'task') {
      setFormData(prev => ({
        ...prev,
        projectDetails: {
          ...prev.projectDetails,
          subtask: ''
        }
      }));
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Delete the original entry
      deleteTimeEntry(entry.id);

      // Create updated entry
      const updatedEntry: TimeEntry = {
        ...entry,
        date: formData.date,
        actualHours: formData.actualHours,
        billableHours: formData.billableHours,
        totalHours: formData.actualHours + formData.billableHours,
        availableHours: formData.availableHours,
        task: formData.task, // Task description
        isBillable: formData.isBillable,
        projectDetails: formData.projectDetails,
        updatedAt: new Date().toISOString()
      };

      saveTimeEntry(updatedEntry);
      onSuccess();
    } catch (error) {
      console.error('Error updating time entry:', error);
      toast.error('Error updating time entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'project': return 'bg-blue-500';
      case 'product': return 'bg-purple-500';
      case 'department': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'project': return 'default';
      case 'product': return 'secondary';
      case 'department': return 'outline';
      default: return 'outline';
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
    <Card className="w-full max-w-md mx-auto bg-card border-border shadow-lg max-h-[90vh] overflow-y-auto">
      <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
        <CardTitle className="flex items-center justify-between text-xl font-semibold">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-foreground/20 rounded-lg">
              <Calendar className="h-6 w-6" />
            </div>
            <span>Edit Time Entry</span>
          </div>
          <button 
            onClick={onClose}
            className="text-primary-foreground/80 hover:text-primary-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Project Info Header */}
        <div className="p-3 bg-muted/30 rounded-lg border">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${getCategoryColor(formData.projectDetails.category)}`}></div>
            <h3 className="font-semibold text-base">{formData.projectDetails.name}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {formData.projectDetails.category} - {formData.projectDetails.task}
          </p>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <DatePicker
            date={formData.date ? new Date(formData.date) : undefined}
            onDateChange={(date) => 
              handleInputChange('date', date ? date.toISOString().split('T')[0] : '')
            }
            placeholder="Select date"
            className="w-full max-w-xs"
          />
        </div>

        {/* Hours Section */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="actualHours">Actual Hours</Label>
            <Input
              id="actualHours"
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={formData.actualHours}
              onChange={(e) => handleInputChange('actualHours', parseFloat(e.target.value) || 0)}
              placeholder="Enter actual hours"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="billableHours">Billable Hours</Label>
            <Input
              id="billableHours"
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={formData.billableHours}
              onChange={(e) => handleInputChange('billableHours', parseFloat(e.target.value) || 0)}
              placeholder="Enter billable hours"
              disabled={!formData.isBillable}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="availableHours">Available Hours</Label>
            <Input
              id="availableHours"
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={formData.availableHours}
              onChange={(e) => handleInputChange('availableHours', parseFloat(e.target.value) || 0)}
              placeholder="Available hours"
              className="bg-muted/50 font-semibold"
            />
          </div>
        </div>

        {/* Project Details */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-foreground">Project Details</h4>
          
          <div className="space-y-2">
            <Label htmlFor="level">{getLevelLabel()}</Label>
            <Select 
              value={formData.projectDetails.level} 
              onValueChange={(value) => handleProjectDetailsChange('level', value)}
            >
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

          <div className="space-y-2">
            <Label htmlFor="projectTask">{getTaskLabel()}</Label>
            <Select 
              value={formData.projectDetails.task} 
              onValueChange={(value) => handleProjectDetailsChange('task', value)}
              disabled={!formData.projectDetails.level}
            >
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
            <Select 
              value={formData.projectDetails.subtask} 
              onValueChange={(value) => handleProjectDetailsChange('subtask', value)}
              disabled={!formData.projectDetails.level || !formData.projectDetails.task}
            >
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

        {/* Task Description */}
        <div className="space-y-2">
          <Label htmlFor="task">Task Description</Label>
          <Textarea
            id="task"
            placeholder="Describe what you did in this task..."
            value={formData.task}
            onChange={(e) => handleInputChange('task', e.target.value)}
            rows={2}
            className="text-sm"
          />
        </div>

        {/* Billable Toggle */}
        <div className="flex items-center space-x-3">
          <Switch
            checked={formData.isBillable}
            onCheckedChange={(checked) => {
              handleInputChange('isBillable', checked);
              if (!checked) {
                handleInputChange('billableHours', 0);
              }
            }}
          />
          <Label className="text-sm font-medium">
            💰 Billable Work
          </Label>
        </div>

        {/* Summary */}
        <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-around">
            <div className="text-center">
              <p className="text-xs text-gray-600 font-medium">Total Hours</p>
              <p className="text-lg font-bold text-gray-800">
                {(formData.actualHours + formData.billableHours).toFixed(1)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 font-medium">Billable</p>
              <p className="text-lg font-bold text-green-700">
                {formData.billableHours.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-border">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isLoading || formData.actualHours + formData.billableHours === 0}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
