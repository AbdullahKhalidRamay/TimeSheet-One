import React, { useState, useEffect, useCallback } from 'react';
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
    task: '',
    description: '',
    clockIn: '',
    clockOut: '',
    breakTime: 30,
    isBillable: false,
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
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
        task: editingEntry.projectDetails.task || '',
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
        task: '',
        description: '',
        clockIn: '',
        clockOut: '',
        breakTime: 30,
        isBillable: false,
      });
    }
  }, [editingEntry, isOpen]);

  // Function to get unique tasks from existing time entries for the specific project/product/department
  const getUniqueTasks = useCallback(() => {
    const allEntries = getTimeEntries();
    const tasks = new Set<string>();
    
    allEntries.forEach(entry => {
      if (entry.projectDetails?.category === formData.category && 
          entry.projectDetails?.name === formData.projectName &&
          entry.projectDetails?.task &&
          entry.projectDetails.task.trim() !== '') {
        tasks.add(entry.projectDetails.task);
      }
    });
    
    return Array.from(tasks).sort();
  }, [formData.category, formData.projectName]);

  // Get available project/product/department names based on category
  const getAvailableNames = () => {
    switch (formData.category) {
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

    const projectDetails: ProjectDetail = {
      category: formData.category as 'project' | 'product' | 'department',
      name: formData.projectName,
      task: formData.task,
      description: formData.description,
    };

    const timeEntry: TimeEntry = {
      id: editingEntry?.id || Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      date: formData.date,
      clockIn: formData.clockIn,
      clockOut: formData.clockOut,
      breakTime: formData.breakTime,
      actualHours: 0, // Will be calculated
      billableHours: 0, // Will be calculated
      totalHours: 0, // Will be calculated
      availableHours: currentUser.availableHours,
      task: formData.description,
      projectDetails,
      isBillable: formData.isBillable,
      status: 'pending',
      createdAt: editingEntry?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveTimeEntry(timeEntry);
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg sm:max-w-xl h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Time Entry' : 'Create Time Entry'}</DialogTitle>
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
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value, projectName: '', task: '' })}>
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
            <Label htmlFor="projectName">{formData.category ? formData.category.charAt(0).toUpperCase() + formData.category.slice(1) : 'Project/Product/Department'} Name</Label>
                         <Select value={formData.projectName} onValueChange={(value) => {
               const isBillable = determineIsBillable(formData.category, value);
               setFormData({ 
                 ...formData, 
                 projectName: value, 
                 task: '',
                 isBillable
               });
               setIsBillableDisabled(isBillable);
             }}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${formData.category || 'project/product/department'}`} />
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
            <Select value={formData.task} onValueChange={(value) => setFormData({ ...formData, task: value })}>
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
              value={formData.task}
              onChange={(e) => setFormData({ ...formData, task: e.target.value })}
              className="mt-2"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what you worked on..."
              required
            />
          </div>

          {/* Time Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clockIn">Clock In</Label>
              <Input
                id="clockIn"
                type="time"
                value={formData.clockIn}
                onChange={(e) => setFormData({ ...formData, clockIn: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="clockOut">Clock Out</Label>
              <Input
                id="clockOut"
                type="time"
                value={formData.clockOut}
                onChange={(e) => setFormData({ ...formData, clockOut: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="breakTime">Break Time (minutes)</Label>
            <Input
              id="breakTime"
              type="number"
              value={formData.breakTime}
              onChange={(e) => setFormData({ ...formData, breakTime: parseInt(e.target.value) || 0 })}
              min="0"
              max="480"
            />
          </div>

          {/* Billable Switch */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isBillable"
              checked={formData.isBillable}
              onCheckedChange={(checked) => setFormData({ ...formData, isBillable: checked })}
              disabled={isBillableDisabled}
            />
            <Label htmlFor="isBillable">Billable</Label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? 'Update' : 'Create'} Time Entry
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
