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
import { timeEntriesAPI, projectsAPI, productsAPI, departmentsAPI } from "@/services/api";
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

export default function Tracker() {
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
  const loadData = useCallback(async () => {
    if (currentUser) {
      try {
        const [projectsData, productsData, departmentsData] = await Promise.all([
          projectsAPI.getAll(),
          productsAPI.getAll(),
          departmentsAPI.getAll()
        ]);
        setProjects(projectsData);
        setProducts(productsData);
        setDepartments(departmentsData);
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to local storage if API fails
        // You can implement fallback logic here
      }
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

  const handleSubmit = async () => {
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

    const timeEntry: Partial<TimeEntry> = {
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
    };

    try {
      await timeEntriesAPI.create(timeEntry);
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
    } catch (error) {
      console.error('Error saving time entry:', error);
      alert('Failed to save time entry. Please try again.');
    }
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
      <Header title="Tracker" />

      <div className="dashboard-content">
        <WeeklyTimeTracker />
      </div>
    </div>
  );
}
