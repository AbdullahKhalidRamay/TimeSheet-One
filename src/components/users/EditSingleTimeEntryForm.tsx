import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { TimeEntry, Project, Product, Department, ProjectDetail } from '@/validation/index';
import { getCurrentUser } from '@/lib/auth';
import { saveTimeEntry, getUserAssociatedProjects, getUserAssociatedProducts, getUserAssociatedDepartments, getTimeEntries } from '@/services/storage';

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
      task: entry.projectDetails.task || "",
      description: entry.projectDetails.description || ""
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const currentUser = getCurrentUser();

  // Load projects, products, and departments
  useEffect(() => {
    if (currentUser) {
      setProjects(getUserAssociatedProjects(currentUser.id));
      setProducts(getUserAssociatedProducts(currentUser.id));
      setDepartments(getUserAssociatedDepartments(currentUser.id));
    }
  }, [currentUser]);

  // Function to get unique tasks from existing time entries for the specific project/product/department
  const getUniqueTasks = useCallback(() => {
    const allEntries = getTimeEntries();
    const tasks = new Set<string>();
    
    allEntries.forEach(entry => {
      if (entry.projectDetails?.category === formData.projectDetails.category && 
          entry.projectDetails?.name === formData.projectDetails.name &&
          entry.projectDetails?.task &&
          entry.projectDetails.task.trim() !== '') {
        tasks.add(entry.projectDetails.task);
      }
    });
    
    return Array.from(tasks).sort();
  }, [formData.projectDetails.category, formData.projectDetails.name]);

  // Get available project/product/department names based on category
  const getAvailableNames = () => {
    switch (formData.projectDetails.category) {
      case 'project':
        return projects.map(p => p.name);
      case 'product':
        return products.map(p => p.name);
      case 'department':
        return departments.map(d => d.name);
      default:
        return [];
    }
  };

  // Get available tasks for the selected project/product/department
  const getAvailableTasks = () => {
    return getUniqueTasks();
  };

  // Determine if billable based on project/product/department
  const determineIsBillable = (category: string, name: string) => {
    switch (category) {
      case 'project': {
        const project = projects.find(p => p.name === name);
        return project?.isBillable || false;
      }
      case 'product': {
        const product = products.find(p => p.name === name);
        return product?.isBillable || false;
      }
      case 'department': {
        const department = departments.find(d => d.name === name);
        return department?.isBillable || false;
      }
      default:
        return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;

    setIsLoading(true);

    try {
      const projectDetails: ProjectDetail = {
        category: formData.projectDetails.category as 'project' | 'product' | 'department',
        name: formData.projectDetails.name,
        task: formData.projectDetails.task,
        description: formData.projectDetails.description,
      };

      const updatedEntry: TimeEntry = {
        ...entry,
        date: formData.date,
        actualHours: formData.actualHours,
        billableHours: formData.billableHours,
        availableHours: formData.availableHours,
        task: formData.task,
        projectDetails,
        isBillable: formData.isBillable,
        updatedAt: new Date().toISOString(),
      };

      saveTimeEntry(updatedEntry);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating time entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg sm:max-w-xl h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Time Entry</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category</Label>
            <Select 
              value={formData.projectDetails.category} 
              onValueChange={(value) => setFormData({ 
                ...formData, 
                projectDetails: { 
                  ...formData.projectDetails, 
                  category: value as 'project' | 'product' | 'department',
                  name: '',
                  task: ''
                }
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="department">Department</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Project/Product/Department Name */}
          <div>
            <Label htmlFor="projectName">{formData.projectDetails.category ? formData.projectDetails.category.charAt(0).toUpperCase() + formData.projectDetails.category.slice(1) : 'Project/Product/Department'} Name</Label>
            <Select 
              value={formData.projectDetails.name} 
              onValueChange={(value) => {
                const isBillable = determineIsBillable(formData.projectDetails.category, value);
                setFormData({ 
                  ...formData, 
                  projectDetails: { 
                    ...formData.projectDetails, 
                    name: value, 
                    task: ''
                  },
                  isBillable
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${formData.projectDetails.category || 'project/product/department'}`} />
              </SelectTrigger>
              <SelectContent>
                {getAvailableNames().map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task */}
          <div>
            <Label htmlFor="task">Task</Label>
            <Select 
              value={formData.projectDetails.task} 
              onValueChange={(value) => setFormData({ 
                ...formData, 
                projectDetails: { 
                  ...formData.projectDetails, 
                  task: value 
                }
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select or enter task" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableTasks().map((task) => (
                  <SelectItem key={task} value={task}>
                    {task}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Or enter a new task"
              value={formData.projectDetails.task}
              onChange={(e) => setFormData({ 
                ...formData, 
                projectDetails: { 
                  ...formData.projectDetails, 
                  task: e.target.value 
                }
              })}
              className="mt-2"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.projectDetails.description}
              onChange={(e) => setFormData({ 
                ...formData, 
                projectDetails: { 
                  ...formData.projectDetails, 
                  description: e.target.value 
                }
              })}
              placeholder="Describe what you worked on..."
              required
            />
          </div>

          {/* Hours */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="actualHours">Actual Hours</Label>
              <Input
                id="actualHours"
                type="number"
                step="0.5"
                min="0"
                value={formData.actualHours}
                onChange={(e) => setFormData({ ...formData, actualHours: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div>
              <Label htmlFor="billableHours">Billable Hours</Label>
              <Input
                id="billableHours"
                type="number"
                step="0.5"
                min="0"
                value={formData.billableHours}
                onChange={(e) => setFormData({ ...formData, billableHours: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div>
              <Label htmlFor="availableHours">Available Hours</Label>
              <Input
                id="availableHours"
                type="number"
                step="0.5"
                min="0"
                value={formData.availableHours}
                onChange={(e) => setFormData({ ...formData, availableHours: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          {/* Task Description */}
          <div>
            <Label htmlFor="taskDescription">Task Description</Label>
            <Textarea
              id="taskDescription"
              value={formData.task}
              onChange={(e) => setFormData({ ...formData, task: e.target.value })}
              placeholder="Describe the task in detail..."
              required
            />
          </div>

          {/* Billable Switch */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isBillable"
              checked={formData.isBillable}
              onCheckedChange={(checked) => setFormData({ ...formData, isBillable: checked })}
            />
            <Label htmlFor="isBillable">Billable</Label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Time Entry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
