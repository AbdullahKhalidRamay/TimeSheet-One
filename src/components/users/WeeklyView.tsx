import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, Clock, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, isFuture, isToday } from "date-fns";
import { Project, Product, Department } from "@/validation/index";
import { getCurrentUser } from "@/lib/auth";
import { getTimeEntryStatusForDate, getTimeEntries } from "@/services/storage";

interface WeeklyHours {
  billable: number;
  actual: number;
  task?: string;
}

interface ProjectWeekData {
  [projectId: string]: {
    [dayKey: string]: WeeklyHours;
  };
}

interface ProductWeekData {
  [productId: string]: {
    [dayKey: string]: WeeklyHours;
  };
}

interface DepartmentWeekData {
  [departmentId: string]: {
    [dayKey: string]: WeeklyHours;
  };
}

interface DailyAvailableHours {
  [dayKey: string]: number;
}

interface WeeklyViewProps {
  selectedWeek: Date;
  onWeekChange: (date: Date) => void;
  weeklyData: ProjectWeekData;
  productWeeklyData: ProductWeekData;
  departmentWeeklyData: DepartmentWeekData;
  dailyAvailableHours: DailyAvailableHours;
  projects: Project[];
  products: Product[];
  departments: Department[];
  onUpdateHours: (projectId: string, dayKey: string, type: 'billable' | 'actual', value: number) => void;
  onUpdateProjectData: (dayKey: string, projectId: string, field: 'task' | 'billable' | 'actual', value: string | number) => void;
  onUpdateProductHours: (productId: string, dayKey: string, type: 'billable' | 'actual', value: number) => void;
  onUpdateProductData: (dayKey: string, productId: string, field: 'task' | 'billable' | 'actual', value: string | number) => void;
  onUpdateDepartmentHours: (departmentId: string, dayKey: string, type: 'billable' | 'actual', value: number) => void;
  onUpdateDepartmentData: (dayKey: string, departmentId: string, field: 'task' | 'billable' | 'actual', value: string | number) => void;
  onUpdateAvailableHours: (dayKey: string, value: number) => void;
  onQuickTaskClick: (project: Project | Product | Department, date: Date) => void;
  onSaveWeeklyData: () => void;
  selectedDates: Date[];
  onDateSelection: (date: Date) => void;
}

export default function WeeklyView({
  selectedWeek,
  onWeekChange,
  weeklyData,
  productWeeklyData,
  departmentWeeklyData,
  dailyAvailableHours,
  projects,
  products,
  departments,
  onUpdateHours,
  onUpdateProjectData,
  onUpdateProductHours,
  onUpdateProductData,
  onUpdateDepartmentHours,
  onUpdateDepartmentData,
  onUpdateAvailableHours,
  onQuickTaskClick,
  onSaveWeeklyData,
  selectedDates,
  onDateSelection
}: WeeklyViewProps) {
  const currentUser = getCurrentUser();
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePreviousWeek = () => {
    onWeekChange(subWeeks(selectedWeek, 1));
  };

  const handleNextWeek = () => {
    const nextWeek = addWeeks(selectedWeek, 1);
    const nextWeekStart = startOfWeek(nextWeek, { weekStartsOn: 1 });
    
    if (!isFuture(nextWeekStart) || isToday(nextWeekStart)) {
      onWeekChange(nextWeek);
    }
  };

  const canGoToNextWeek = () => {
    const nextWeek = addWeeks(selectedWeek, 1);
    const nextWeekStart = startOfWeek(nextWeek, { weekStartsOn: 1 });
    return !isFuture(nextWeekStart) || isToday(nextWeekStart);
  };

  const hasEntryForProjectAndDate = (projectId: string, dayKey: string, projectType: 'project' | 'product' | 'department') => {
    const allEntries = getTimeEntries();
    const result = allEntries.some(entry => {
      if (entry.date !== dayKey || entry.userId !== currentUser?.id) return false;
      
      if (projectType === 'project') {
        return entry.projectDetails.category === 'project' && entry.projectDetails.name === projects.find(p => p.id === projectId)?.name;
      } else if (projectType === 'product') {
        return entry.projectDetails.category === 'product' && entry.projectDetails.name === products.find(p => p.id === projectId)?.name;
      } else if (projectType === 'department') {
        return entry.projectDetails.category === 'department' && entry.projectDetails.name === departments.find(d => d.id === projectId)?.name;
      }
      return false;
    });
    
    if (result) {
      console.log(`Entry found for ${projectType} ${projectId} on ${dayKey}, field will be disabled`);
    }
    
    return result;
  };

  const isDateSelected = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return selectedDates.some(d => format(d, 'yyyy-MM-dd') === dateKey);
  };

  const isDateInRange = (date: Date) => {
    if (selectedDates.length !== 2) return false;
    const dateKey = format(date, 'yyyy-MM-dd');
    const startKey = format(selectedDates[0], 'yyyy-MM-dd');
    const endKey = format(selectedDates[1], 'yyyy-MM-dd');
    return dateKey >= startKey && dateKey <= endKey;
  };

  const getDateStatus = (date: Date) => {
    if (!currentUser) return null;
    const dateStr = format(date, 'yyyy-MM-dd');
    return getTimeEntryStatusForDate(dateStr, currentUser.id);
  };

  const getStatusIndicator = (date: Date) => {
    const dateStatus = getDateStatus(date);
    if (!dateStatus || !dateStatus.hasEntries) {
      return null;
    }

    const hasApproved = dateStatus.statuses.includes('approved');
    const hasPending = dateStatus.statuses.includes('pending');
    const hasRejected = dateStatus.statuses.includes('rejected');

    if (hasApproved && !hasPending && !hasRejected) {
      return {
        icon: Check,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        tooltip: `${dateStatus.entriesCount} approved entries (${dateStatus.totalHours}h)`
      };
    } else if (hasPending) {
      return {
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        tooltip: `${dateStatus.entriesCount} entries pending approval (${dateStatus.totalHours}h)`
      };
    } else if (hasRejected) {
      return {
        icon: AlertCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        tooltip: `${dateStatus.entriesCount} rejected entries (${dateStatus.totalHours}h)`
      };
    }
    return null;
  };

  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousWeek}
            className="flex items-center space-x-1"
          >
            <span>Previous</span>
          </Button>
          <Badge variant="secondary" className="px-3 py-1">
            {format(weekStart, "MMM dd")} - {format(weekEnd, "MMM dd, yyyy")}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextWeek}
            disabled={!canGoToNextWeek()}
            className="flex items-center space-x-1"
          >
            <span>Next</span>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-center border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="py-3 px-1 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold w-24">Assigned</th>
              {weekDays.map(day => {
                const statusIndicator = getStatusIndicator(day);
                return (
                  <th 
                    key={day.toString()} 
                    className={`py-3 px-1 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-16 ${(isDateSelected(day) || isDateInRange(day)) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    onClick={() => onDateSelection(day)}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <div className="flex items-center justify-center space-x-1">
                        <span className="text-xs">{format(day, 'E, MMM d')}</span>
                        {statusIndicator && (
                          <div 
                            className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${statusIndicator.bgColor}`}
                            title={statusIndicator.tooltip}
                          >
                            <statusIndicator.icon className={`w-2 h-2 ${statusIndicator.color}`} />
                          </div>
                        )}
                      </div>
                      <div className="flex justify-around items-center gap-1 text-xs">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="w-6 h-3 flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded cursor-help font-medium text-xs">
                              B
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Billable Hours</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="w-6 h-3 flex items-center justify-center bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded cursor-help font-medium text-xs">
                              A
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Actual Hours</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {projects.map(project => (
              <tr key={`project-${project.id}`} className="odd:bg-white dark:odd:bg-gray-900 even:bg-gray-50 dark:even:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
                <td className="py-2 px-1 border border-gray-200 dark:border-gray-700 font-medium text-left text-gray-900 dark:text-gray-100">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-1">
                          <span className="text-xs px-1 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">P</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="font-semibold break-words whitespace-normal text-xs" title={project.name}>{project.name}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{project.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        {project.department && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs text-gray-600 dark:text-gray-400 break-words whitespace-normal" title={`Department: ${project.department}`}>
                                D: {project.department}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Department: {project.department}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {project.associatedProducts && project.associatedProducts.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {project.associatedProducts.slice(0, 1).map((product, index) => (
                              <Tooltip key={index}>
                                <TooltipTrigger asChild>
                                  <span className="text-xs px-1 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded break-words whitespace-normal" title={product}>
                                    {product}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{product}</p>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                            {project.associatedProducts.length > 1 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-xs px-1 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                                    +{project.associatedProducts.length - 1}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{project.associatedProducts.slice(1).join(', ')}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                {weekDays.map(day => {
                  const dayKey = format(day, 'yyyy-MM-dd');
                  const hours = weeklyData[project.id]?.[dayKey] || { billable: 0, actual: 0, task: '' };
                  const isFutureDay = day.getTime() > new Date().getTime();
                  const hasExistingEntry = hasEntryForProjectAndDate(project.id, dayKey, 'project');
                  const hasData = hours.billable > 0 || hours.actual > 0 || hours.task.trim() !== '';
                  
                  const billableDisabled = !project.isBillable || isFutureDay || hasExistingEntry;
                  const actualDisabled = isFutureDay || hasExistingEntry;
                  
                  return (
                    <td key={dayKey} className={`py-1 px-1 border border-gray-200 dark:border-gray-700 ${hasData ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                      <div className="flex justify-around items-center gap-1">
                        {hasData && (
                          <div className="absolute top-1 right-1">
                            <span className="text-xs text-blue-600 dark:text-blue-400">✓</span>
                          </div>
                        )}
                        <Input 
                          type="number" 
                          step="0.5" 
                          min="0" 
                          max="24"
                          value={hours.billable || ''}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            const value = inputValue === '' ? 0 : Math.max(0, parseFloat(inputValue) || 0);
                            onUpdateHours(project.id, dayKey, 'billable', value);
                          }}
                          className={`w-8 text-xs h-6 text-center ${hasData ? 'bg-blue-100 dark:bg-blue-800' : 'bg-white dark:bg-gray-800'} text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&[type=number]]:[-moz-appearance:textfield]`}
                          disabled={billableDisabled}
                          placeholder="0"
                          title={hasData ? `Existing data: ${hours.billable}h billable, ${hours.actual}h actual${hours.task ? `, Task: ${hours.task}` : ''}` : ''}
                        />
                        <Input 
                          type="number" 
                          step="0.5" 
                          min="0" 
                          max="24"
                          value={hours.actual || ''}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            const value = inputValue === '' ? 0 : Math.max(0, parseFloat(inputValue) || 0);
                            onUpdateHours(project.id, dayKey, 'actual', value);
                          }}
                          className={`w-8 text-xs h-6 text-center ${hasData ? 'bg-blue-100 dark:bg-blue-800' : 'bg-white dark:bg-gray-800'} text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&[type=number]]:[-moz-appearance:textfield]`}
                          disabled={actualDisabled}
                          placeholder="0"
                          title={hasData ? `Existing data: ${hours.billable}h billable, ${hours.actual}h actual${hours.task ? `, Task: ${hours.task}` : ''}` : ''}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onQuickTaskClick(project, day)}
                          className={`h-5 w-5 p-0 ${hours.task.trim() ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400 dark:text-gray-500'}`}
                          title={hours.task.trim() ? `Edit task for ${project.name}: ${hours.task}` : `Add task for ${project.name}`}
                          disabled={isFutureDay || hasExistingEntry}
                        >
                          <Plus className="h-2 w-2" />
                        </Button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}

            {products.map(product => (
              <tr key={`product-${product.id}`} className="odd:bg-white dark:odd:bg-gray-900 even:bg-gray-50 dark:even:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
                <td className="py-2 px-1 border border-gray-200 dark:border-gray-700 font-medium text-left text-gray-900 dark:text-gray-100">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-1">
                          <span className="text-xs px-1 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">Pr</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="font-semibold break-words whitespace-normal text-xs" title={product.name}>{product.name}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{product.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                {weekDays.map(day => {
                  const dayKey = format(day, 'yyyy-MM-dd');
                  const hours = productWeeklyData[product.id]?.[dayKey] || { billable: 0, actual: 0, task: '' };
                  const isFutureDay = day.getTime() > new Date().getTime();
                  const hasExistingEntry = hasEntryForProjectAndDate(product.id, dayKey, 'product');
                  const hasData = hours.billable > 0 || hours.actual > 0 || hours.task.trim() !== '';
                  
                  const billableDisabled = !product.isBillable || isFutureDay || hasExistingEntry;
                  const actualDisabled = isFutureDay || hasExistingEntry;
                  
                  return (
                    <td key={dayKey} className={`py-1 px-1 border border-gray-200 dark:border-gray-700 ${hasData ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                      <div className="flex justify-around items-center gap-1">
                        {hasData && (
                          <div className="absolute top-1 right-1">
                            <span className="text-xs text-green-600 dark:text-green-400">✓</span>
                          </div>
                        )}
                        <Input 
                          type="number" 
                          step="0.5" 
                          min="0" 
                          max="24"
                          value={hours.billable || ''}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            const value = inputValue === '' ? 0 : Math.max(0, parseFloat(inputValue) || 0);
                            onUpdateProductHours(product.id, dayKey, 'billable', value);
                          }}
                          className={`w-8 text-xs h-6 text-center ${hasData ? 'bg-green-100 dark:bg-green-800' : 'bg-white dark:bg-gray-800'} text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&[type=number]]:[-moz-appearance:textfield]`}
                          disabled={billableDisabled}
                          placeholder="0"
                          title={hasData ? `Existing data: ${hours.billable}h billable, ${hours.actual}h actual${hours.task ? `, Task: ${hours.task}` : ''}` : ''}
                        />
                        <Input 
                          type="number" 
                          step="0.5" 
                          min="0" 
                          max="24"
                          value={hours.actual || ''}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            const value = inputValue === '' ? 0 : Math.max(0, parseFloat(inputValue) || 0);
                            onUpdateProductHours(product.id, dayKey, 'actual', value);
                          }}
                          className={`w-8 text-xs h-6 text-center ${hasData ? 'bg-green-100 dark:bg-green-800' : 'bg-white dark:bg-gray-800'} text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&[type=number]]:[-moz-appearance:textfield]`}
                          disabled={actualDisabled}
                          placeholder="0"
                          title={hasData ? `Existing data: ${hours.billable}h billable, ${hours.actual}h actual${hours.task ? `, Task: ${hours.task}` : ''}` : ''}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onQuickTaskClick(product, day)}
                          className={`h-5 w-5 p-0 ${hours.task.trim() ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' : 'text-gray-400 dark:text-gray-500'}`}
                          title={hours.task.trim() ? `Edit task for ${product.name}: ${hours.task}` : `Add task for ${product.name}`}
                          disabled={isFutureDay || hasExistingEntry}
                        >
                          <Plus className="h-2 w-2" />
                        </Button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}

            {departments.map(department => (
              <tr key={`department-${department.id}`} className="odd:bg-white dark:odd:bg-gray-900 even:bg-gray-50 dark:even:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
                <td className="py-2 px-1 border border-gray-200 dark:border-gray-700 font-medium text-left text-gray-900 dark:text-gray-100">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-1">
                          <span className="text-xs px-1 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">D</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="font-semibold break-words whitespace-normal text-xs" title={department.name}>{department.name}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{department.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                {weekDays.map(day => {
                  const dayKey = format(day, 'yyyy-MM-dd');
                  const hours = departmentWeeklyData[department.id]?.[dayKey] || { billable: 0, actual: 0, task: '' };
                  const isFutureDay = day.getTime() > new Date().getTime();
                  const hasExistingEntry = hasEntryForProjectAndDate(department.id, dayKey, 'department');
                  const hasData = hours.billable > 0 || hours.actual > 0 || hours.task.trim() !== '';
                  
                  return (
                    <td key={dayKey} className={`py-1 px-1 border border-gray-200 dark:border-gray-700 ${hasData ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}>
                      <div className="flex justify-around items-center gap-1">
                        {hasData && (
                          <div className="absolute top-1 right-1">
                            <span className="text-xs text-purple-600 dark:text-purple-400">✓</span>
                          </div>
                        )}
                        <Input 
                          type="number" 
                          step="0.5" 
                          min="0" 
                          max="24"
                          value={hours.billable || ''}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            const value = inputValue === '' ? 0 : Math.max(0, parseFloat(inputValue) || 0);
                            onUpdateDepartmentHours(department.id, dayKey, 'billable', value);
                          }}
                          className={`w-8 text-xs h-6 text-center ${hasData ? 'bg-purple-100 dark:bg-purple-800' : 'bg-white dark:bg-gray-800'} text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&[type=number]]:[-moz-appearance:textfield]`}
                          disabled={!department.isBillable || isFutureDay || hasExistingEntry}
                          placeholder="0"
                          title={hasData ? `Existing data: ${hours.billable}h billable, ${hours.actual}h actual${hours.task ? `, Task: ${hours.task}` : ''}` : ''}
                        />
                        <Input 
                          type="number" 
                          step="0.5" 
                          min="0" 
                          max="24"
                          value={hours.actual || ''}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            const value = inputValue === '' ? 0 : Math.max(0, parseFloat(inputValue) || 0);
                            onUpdateDepartmentHours(department.id, dayKey, 'actual', value);
                          }}
                          className={`w-8 text-xs h-6 text-center ${hasData ? 'bg-purple-100 dark:bg-purple-800' : 'bg-white dark:bg-gray-800'} text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&[type=number]]:[-moz-appearance:textfield]`}
                          disabled={isFutureDay || hasExistingEntry}
                          placeholder="0"
                          title={hasData ? `Existing data: ${hours.billable}h billable, ${hours.actual}h actual${hours.task ? `, Task: ${hours.task}` : ''}` : ''}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onQuickTaskClick(department, day)}
                          className={`h-5 w-5 p-0 ${hours.task.trim() ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' : 'text-gray-400 dark:text-gray-500'}`}
                          title={hours.task.trim() ? `Edit task for ${department.name}: ${hours.task}` : `Add task for ${department.name}`}
                          disabled={isFutureDay || hasExistingEntry}
                        >
                          <Plus className="h-2 w-2" />
                        </Button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}

            <tr className="bg-blue-50 dark:bg-blue-900/20 border-t-2 border-blue-200 dark:border-blue-700">
              <td className="py-2 px-1 border border-gray-200 dark:border-gray-700 font-semibold text-blue-800 dark:text-blue-400 text-xs">Avail Hr.</td>
              {weekDays.map(day => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const isFutureDay = day.getTime() > new Date().getTime();
                const availableHours = dailyAvailableHours[dayKey] || 0;
                return (
                  <td key={dayKey} className="py-1 px-1 border border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex justify-center">
                      <div className="w-12 text-center text-xs h-6 bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100 border border-blue-300 dark:border-blue-600 rounded flex items-center justify-center font-medium">
                        {availableHours.toFixed(1)}
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={onSaveWeeklyData} className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded shadow-lg transition-colors">
          <span>Save Week</span>
        </Button>
      </div>
    </div>
  );
}