import { useState, useEffect } from "react";
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
import { getCurrentUser } from "@/utils/auth";
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
  calculateHours
} from "@/utils/storage";
import { TimeEntry, ProjectDetail, Project, Product, Department } from "@/types";

interface ProjectEntry {
  id: string;
  project: Project | Product | Department;
  category: 'project' | 'product' | 'department';
  level?: string;
  task?: string;
  subtask?: string;
  clockIn: string;
  clockOut: string;
  breakTime: number;
  hours: number;
  isBillable: boolean;
  isBillableDisabled: boolean;
  description: string;
  selectedLevels: any[];
  selectedTasks: any[];
  selectedSubtasks: any[];
}

interface DailyTrackerFormData {
  date: string;
  projectEntries: ProjectEntry[];
  clockIn: string;
  clockOut: string;
  breakTime: number;
}

interface DailyTrackerFormProps {
  initialDate?: string;
  onClose?: () => void;
}

export default function DailyTrackerForm({ initialDate, onClose }: DailyTrackerFormProps) {
  const [formData, setFormData] = useState<DailyTrackerFormData>({
    date: initialDate || new Date().toISOString().split('T')[0],
    projectEntries: [],
    clockIn: '',
    clockOut: '',
    breakTime: 30
  });

  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<Department[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<(Project | Product | Department)[]>([]);

  const currentUser = getCurrentUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    if (currentUser) {
      // Load only user-associated projects, products, and departments
      const userProjects = getUserAssociatedProjects(currentUser.id);
      const userProducts = getUserAssociatedProducts(currentUser.id);
      const userDepartments = getUserAssociatedDepartments(currentUser.id);
      
      // Only show items the user is associated with through teams
      setAvailableProjects(userProjects);
      setAvailableProducts(userProducts);
      setAvailableDepartments(userDepartments);
    }
  };

  const handleProjectSelection = (item: Project | Product | Department, category: 'project' | 'product' | 'department', checked: boolean) => {
    if (checked) {
      setSelectedProjects(prev => [...prev, item]);
      const billableStatus = determineIsBillable(category, item.name);
      const newEntry: ProjectEntry = {
        id: generateId(),
        project: item,
        category,
        clockIn: '',
        clockOut: '',
        breakTime: 30,
        hours: 0,
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

  const updateProjectEntry = (entryId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      projectEntries: prev.projectEntries.map(entry => 
        entry.id === entryId ? { ...entry, [field]: value } : entry
      )
    }));
  };

  const handleLevelSelection = (entryId: string, level: any, checked: boolean) => {
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

  const handleTaskSelection = (entryId: string, task: any, levelId: string, checked: boolean) => {
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

  const handleSubtaskSelection = (entryId: string, subtask: any, taskId: string, checked: boolean) => {
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

  const getTasksForLevel = (level: any, category: 'project' | 'product' | 'department') => {
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

  const getSubtasksForTask = (task: any, category: 'project' | 'product' | 'department') => {
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

    // Create separate time entries for each project entry
    formData.projectEntries.forEach(entry => {
      if (entry.hours > 0) {
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
          clockIn: entry.clockIn,
          clockOut: entry.clockOut,
          breakTime: entry.breakTime,
          totalHours: entry.hours,
          task: entry.description,
          projectDetails,
          isBillable: entry.isBillable,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        saveTimeEntry(timeEntry);
      }
    });

    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      projectEntries: [],
      clockIn: '',
      clockOut: '',
      breakTime: 30
    });
    setSelectedProjects([]);
    
    alert('Time entries saved successfully!');
    
    // Call onClose if provided
    if (onClose) {
      onClose();
    }
  };

  const getTotalHours = () => {
    return formData.projectEntries.reduce((total, entry) => total + entry.hours, 0);
  };

  const getTotalBillableHours = () => {
    return formData.projectEntries.reduce((total, entry) => 
      total + (entry.isBillable ? entry.hours : 0), 0
    );
  };

  return (
    <Card className="max-w-6xl mx-auto shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-black/5"></div>
        <CardTitle className="flex items-center space-x-3 text-xl font-semibold relative z-10">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Calendar className="h-6 w-6" />
          </div>
          <span>Daily Time Tracker</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {/* Date Selection */}
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

        {/* Project Selection */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
            <Label className="text-lg font-semibold text-gray-800">Select Projects, Products, and Departments</Label>
          </div>
          
          {/* Projects */}
          {availableProjects.length > 0 && (
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-4 flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Projects</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableProjects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-3 p-3 rounded-lg bg-white/70 hover:bg-white transition-colors border border-blue-200/50">
                    <Checkbox
                      checked={selectedProjects.some(p => p.id === project.id)}
                      onCheckedChange={(checked) => 
                        handleProjectSelection(project, 'project', checked as boolean)
                      }
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <Label className="font-medium text-gray-700 cursor-pointer flex-1">{project.name}</Label>
                    {project.isBillable && <DollarSign className="h-4 w-4 text-green-600" />}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Products */}
          {availableProducts.length > 0 && (
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-4 flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>Products</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableProducts.map((product) => (
                  <div key={product.id} className="flex items-center space-x-3 p-3 rounded-lg bg-white/70 hover:bg-white transition-colors border border-purple-200/50">
                    <Checkbox
                      checked={selectedProjects.some(p => p.id === product.id)}
                      onCheckedChange={(checked) => 
                        handleProjectSelection(product, 'product', checked as boolean)
                      }
                      className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                    />
                    <Label className="font-medium text-gray-700 cursor-pointer flex-1">{product.name}</Label>
                    {product.isBillable && <DollarSign className="h-4 w-4 text-green-600" />}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Departments */}
          {availableDepartments.length > 0 && (
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-4 flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>Departments</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableDepartments.map((department) => (
                  <div key={department.id} className="flex items-center space-x-3 p-3 rounded-lg bg-white/70 hover:bg-white transition-colors border border-orange-200/50">
                    <Checkbox
                      checked={selectedProjects.some(p => p.id === department.id)}
                      onCheckedChange={(checked) => 
                        handleProjectSelection(department, 'department', checked as boolean)
                      }
                      className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                    />
                    <Label className="font-medium text-gray-700 cursor-pointer flex-1">{department.name}</Label>
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

              {/* Clock In/Out Times and Hours Calculation */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Clock In</Label>
                  <Input
                    type="time"
                    value={entry.clockIn}
                    onChange={(e) => {
                      const newClockIn = e.target.value;
                      updateProjectEntry(entry.id, 'clockIn', newClockIn);
                      // Recalculate hours if both times are available
                      if (newClockIn && entry.clockOut) {
                        const calculatedHours = calculateHours(newClockIn, entry.clockOut, entry.breakTime);
                        updateProjectEntry(entry.id, 'hours', calculatedHours);
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Clock Out</Label>
                  <Input
                    type="time"
                    value={entry.clockOut}
                    onChange={(e) => {
                      const newClockOut = e.target.value;
                      updateProjectEntry(entry.id, 'clockOut', newClockOut);
                      // Recalculate hours if both times are available
                      if (entry.clockIn && newClockOut) {
                        const calculatedHours = calculateHours(entry.clockIn, newClockOut, entry.breakTime);
                        updateProjectEntry(entry.id, 'hours', calculatedHours);
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Break (min)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="480"
                    value={entry.breakTime}
                    onChange={(e) => {
                      const newBreakTime = parseInt(e.target.value) || 0;
                      updateProjectEntry(entry.id, 'breakTime', newBreakTime);
                      // Recalculate hours if both times are available
                      if (entry.clockIn && entry.clockOut) {
                        const calculatedHours = calculateHours(entry.clockIn, entry.clockOut, newBreakTime);
                        updateProjectEntry(entry.id, 'hours', calculatedHours);
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Calculated Hours</Label>
                  <Input
                    value={entry.hours.toFixed(2)}
                    readOnly
                    className="bg-muted font-semibold"
                  />
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
                      <p className="text-sm text-gray-600 font-medium">Total Hours</p>
                      <p className="text-xl font-bold text-gray-800">{getTotalHours().toFixed(1)}</p>
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
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <Button 
            variant="outline"
            size="lg"
            onClick={() => {
              setFormData({
                date: new Date().toISOString().split('T')[0],
                projectEntries: [],
                clockIn: '',
                clockOut: '',
                breakTime: 30
              });
              setSelectedProjects([]);
            }}
            className="px-6 py-3 font-medium border-2 hover:bg-gray-50"
          >
            Reset Form
          </Button>
          <Button 
            size="lg"
            onClick={handleSubmit}
            disabled={formData.projectEntries.length === 0 || getTotalHours() === 0}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-8 py-3 font-semibold shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calendar className="mr-2 h-5 w-5" />
            Save Time Entries
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
