import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Clock, AlertCircle, Save } from "lucide-react";
import { format, isFuture, isToday } from "date-fns";
import { Project, Product, Department } from "@/validation/index";
import { getCurrentUser } from "@/lib/auth";
import { getTimeEntryStatusForDate, getTimeEntries } from "@/services/storage";

interface DailyProjectData {
  task: string;
  availableHours: number;
  actualHours: number;
  billableHours: number;
}

interface DailyProductData {
  task: string;
  availableHours: number;
  actualHours: number;
  billableHours: number;
}

interface DailyDepartmentData {
  task: string;
  availableHours: number;
  actualHours: number;
  billableHours: number;
}

interface MonthlyData {
  [dateKey: string]: {
    [id: string]: DailyProjectData | DailyProductData | DailyDepartmentData;
  };
}

interface MonthlyViewProps {
  monthlyData: MonthlyData;
  projects: Project[];
  products: Product[];
  departments: Department[];
  onUpdateMonthlyProjectData: (dateKey: string, projectId: string, field: keyof DailyProjectData, value: string | number) => void;
  onUpdateMonthlyProductData: (dateKey: string, productId: string, field: keyof DailyProductData, value: string | number) => void;
  onUpdateMonthlyDepartmentData: (dateKey: string, departmentId: string, field: keyof DailyDepartmentData, value: string | number) => void;
  onSaveEntryForDate: (date: Date) => void;
  onSaveEntireRange: () => void;
  getMonthlyDates: () => Date[];
}

export default function MonthlyView({
  monthlyData,
  projects,
  products,
  departments,
  onUpdateMonthlyProjectData,
  onUpdateMonthlyProductData,
  onUpdateMonthlyDepartmentData,
  onSaveEntryForDate,
  onSaveEntireRange,
  getMonthlyDates
}: MonthlyViewProps) {
  const currentUser = getCurrentUser();

  // Function to check if an entry exists for a specific project and date
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
    
    return result;
  };

  return (
    <div className="space-y-6">
      {/* Monthly Table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-center border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Date</th>
              <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Entry Details</th>
              <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Task</th>
              <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Available Hours</th>
              <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Actual Hours</th>
              <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Billable Hours</th>
              <th className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {getMonthlyDates().flatMap(currentDate => {
              const formattedDate = format(currentDate, 'dd/MM/yyyy');
              const day = format(currentDate, "EEEE");
              const statusData = currentUser ? getTimeEntryStatusForDate(format(currentDate, 'yyyy-MM-dd'), currentUser.id) : null;
              const isFutureDate = isFuture(currentDate) && !isToday(currentDate);
              const dateKey = format(currentDate, 'yyyy-MM-dd');

              // Get status indicator
              const getStatusIndicator = () => {
                if (!statusData || !statusData.hasEntries) {
                  return {
                    text: 'No Entries',
                    color: 'text-gray-500 dark:text-gray-400',
                    icon: null
                  };
                }

                const hasApproved = statusData.statuses.includes('approved');
                const hasPending = statusData.statuses.includes('pending');
                const hasRejected = statusData.statuses.includes('rejected');

                if (hasApproved && !hasPending && !hasRejected) {
                  return {
                    text: `✓ Approved (${statusData.entriesCount} entries, ${statusData.totalHours.toFixed(1)}h)`,
                    color: 'text-green-600 dark:text-green-400',
                    icon: Check
                  };
                } else if (hasPending) {
                  return {
                    text: `⏳ Pending (${statusData.entriesCount} entries, ${statusData.totalHours.toFixed(1)}h)`,
                    color: 'text-yellow-600 dark:text-yellow-400',
                    icon: Clock
                  };
                } else if (hasRejected) {
                  return {
                    text: `❌ Rejected (${statusData.entriesCount} entries, ${statusData.totalHours.toFixed(1)}h)`,
                    color: 'text-red-600 dark:text-red-400',
                    icon: AlertCircle
                  };
                }
                return {
                  text: `✓ Done (${statusData.entriesCount} entries, ${statusData.totalHours.toFixed(1)}h)`,
                  color: 'text-green-600 dark:text-green-400',
                  icon: Check
                };
              };

              const statusIndicator = getStatusIndicator();

              // Create all entries for this date
              const allEntries = [];

              // Add all projects
              projects.forEach((project, index) => {
                const projectData = monthlyData[dateKey]?.[project.id] || {
                  task: '',
                  availableHours: 0,
                  actualHours: 0,
                  billableHours: 0
                };

                allEntries.push({
                  type: 'project',
                  id: project.id,
                  data: project,
                  entryData: projectData,
                  index
                });
              });

              // Add all products
              products.forEach((product, index) => {
                const productData = monthlyData[dateKey]?.[product.id] || {
                  task: '',
                  availableHours: 0,
                  actualHours: 0,
                  billableHours: 0
                };

                allEntries.push({
                  type: 'product',
                  id: product.id,
                  data: product,
                  entryData: productData,
                  index
                });
              });

              // Add all departments
              departments.forEach((department, index) => {
                const departmentData = monthlyData[dateKey]?.[department.id] || {
                  task: '',
                  availableHours: 0,
                  actualHours: 0,
                  billableHours: 0
                };

                allEntries.push({
                  type: 'department',
                  id: department.id,
                  data: department,
                  entryData: departmentData,
                  index
                });
              });

              // If no entries exist, show a message
              if (allEntries.length === 0) {
                return [
                  <tr key={currentDate.toString()} className={`odd:bg-white dark:odd:bg-gray-900 even:bg-gray-50 dark:even:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 ${isFutureDate ? 'opacity-50' : ''}`}>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-gray-100">
                      <div className="flex flex-col items-center">
                        <span className="text-sm">{day}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">No projects, products, or departments available</span>
                    </td>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700"></td>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700"></td>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700"></td>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700"></td>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col items-center">
                        <span className={`text-xs font-medium ${statusIndicator.color}`}>
                          {statusIndicator.text}
                        </span>
                        {!isFutureDate && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => onSaveEntryForDate(currentDate)}
                            className="mt-2 text-xs h-6 px-2 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Save Entry
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ];
              }

              // Show rows for each entry
              return allEntries.map((entry, entryIndex) => {
                const { type, id, data, entryData } = entry;
                const isFirstEntry = entryIndex === 0;

                return (
                  <tr key={`${dateKey}-${type}-${id}`} className={`odd:bg-white dark:odd:bg-gray-900 even:bg-gray-50 dark:even:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 ${isFutureDate ? 'opacity-50' : ''}`}>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-gray-100">
                      {isFirstEntry ? (
                        <div className="flex flex-col items-center">
                          <span className="text-sm">{day}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</span>
                        </div>
                      ) : null}
                    </td>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700 text-sm">
                      <span className={`text-xs px-2 py-1 rounded ${
                        type === 'project' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                        type === 'product' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                        'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                      }`}>
                        {type === 'project' ? 'Project' : type === 'product' ? 'Product' : 'Department'}: {data.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700">
                      <Input
                        type="text"
                        value={entryData.task}
                        onChange={(e) => {
                          if (type === 'project') onUpdateMonthlyProjectData(dateKey, id, 'task', e.target.value);
                          else if (type === 'product') onUpdateMonthlyProductData(dateKey, id, 'task', e.target.value);
                          else onUpdateMonthlyDepartmentData(dateKey, id, 'task', e.target.value);
                        }}
                        placeholder="Task Description"
                        disabled={isFutureDate || hasEntryForProjectAndDate(id, dateKey, type)}
                        className="w-full text-xs h-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                      />
                    </td>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700">
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        value={entryData.availableHours || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          if (type === 'project') onUpdateMonthlyProjectData(dateKey, id, 'availableHours', value);
                          else if (type === 'product') onUpdateMonthlyProductData(dateKey, id, 'availableHours', value);
                          else onUpdateMonthlyDepartmentData(dateKey, id, 'availableHours', value);
                        }}
                        placeholder="0"
                        disabled={isFutureDate || hasEntryForProjectAndDate(id, dateKey, type)}
                        className="w-20 text-xs h-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 [ &::-webkit-outer-spin-button]:appearance-none [ &::-webkit-inner-spin-button]:appearance-none [ &[type=number]]:[-moz-appearance:textfield]"
                      />
                    </td>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700">
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        value={entryData.actualHours || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          if (type === 'project') onUpdateMonthlyProjectData(dateKey, id, 'actualHours', value);
                          else if (type === 'product') onUpdateMonthlyProductData(dateKey, id, 'actualHours', value);
                          else onUpdateMonthlyDepartmentData(dateKey, id, 'actualHours', value);
                        }}
                        placeholder="0"
                        disabled={isFutureDate || hasEntryForProjectAndDate(id, dateKey, type)}
                        className="w-20 text-xs h-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 [ &::-webkit-outer-spin-button]:appearance-none [ &::-webkit-inner-spin-button]:appearance-none [ &[type=number]]:[-moz-appearance:textfield]"
                      />
                    </td>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700">
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        value={entryData.billableHours || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          if (type === 'project') onUpdateMonthlyProjectData(dateKey, id, 'billableHours', value);
                          else if (type === 'product') onUpdateMonthlyProductData(dateKey, id, 'billableHours', value);
                          else onUpdateMonthlyDepartmentData(dateKey, id, 'billableHours', value);
                        }}
                        placeholder="0"
                        disabled={!data.isBillable || isFutureDate || hasEntryForProjectAndDate(id, dateKey, type)}
                        className={`w-20 text-xs h-8 ${!data.isBillable ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'} border-gray-300 dark:border-gray-600 [ &::-webkit-outer-spin-button]:appearance-none [ &::-webkit-inner-spin-button]:appearance-none [ &[type=number]]:[-moz-appearance:textfield]`}
                      />
                    </td>
                    <td className="py-3 px-4 border border-gray-200 dark:border-gray-700">
                      {isFirstEntry ? (
                        <div className="flex flex-col items-center">
                          <span className={`text-xs font-medium ${statusIndicator.color}`}>
                            {statusIndicator.text}
                          </span>
                          {!isFutureDate && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => onSaveEntryForDate(currentDate)}
                              className="mt-2 text-xs h-6 px-2 bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Save Entry
                            </Button>
                          )}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={onSaveEntireRange} className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded shadow-lg transition-colors flex items-center space-x-2">
          <Save className="h-4 w-4" />
          <span>Save Entire Range</span>
        </Button>
      </div>
    </div>
  );
}
