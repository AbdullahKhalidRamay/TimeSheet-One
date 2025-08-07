import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-picker";
import { DateRange } from "react-day-picker";
import { Input } from "@/components/ui/input";
import { Calendar, Edit, Trash2, DollarSign, Clock, BarChart3, Timer, Calendar as CalendarIcon, Search } from "lucide-react";
import Header from "@/components/dashboard/Header";
import { getCurrentUser, getAllUsers } from "@/lib/auth";
import { getTimeEntries, deleteTimeEntry, getProjects } from "@/services/storage";
import { TimeEntry, rolePermissions } from "@/validation/index";
import { useNavigate } from "react-router-dom";
import EditSingleTimeEntryForm from "@/components/users/EditSingleTimeEntryForm";

interface GroupedEntry {
  date: string;
  userId: string;
  userName: string;
  status: string;
  totalHours: number;
  entries: TimeEntry[];
  projectDetails: {
    category: string;
    name: string;
    level?: string;
    task: string;
    subtask?: string;
    description: string;
  };
}

export default function Timesheet() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [billableFilter, setBillableFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState("all");
  const [isDailyTrackerOpen, setDailyTrackerOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const currentUser = getCurrentUser();
  const navigate = useNavigate();
  const users = getAllUsers();
  const projects = getProjects();

  const loadTimeEntries = useCallback(() => {
    const allEntries = getTimeEntries();
    
    if (currentUser?.role === 'owner') {
      setTimeEntries(allEntries);
    } else if (currentUser?.role === 'manager') {
      setTimeEntries(allEntries);
    } else {
      setTimeEntries(allEntries.filter(entry => entry.userId === currentUser?.id));
    }
  }, [currentUser]);

  useEffect(() => {
    loadTimeEntries();
  }, [loadTimeEntries]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleUserClick = (userId: string) => {
    setSelectedUser(userId === selectedUser ? null : userId);
  };

  const handleDeleteEntry = (entryId: string) => {
    const entry = timeEntries.find(e => e.id === entryId);
    if (entry && (entry.status === 'pending' || currentUser?.role === 'owner')) {
      deleteTimeEntry(entryId);
      loadTimeEntries();
    }
  };


  const filteredEntries = timeEntries.filter(entry => {
    const matchesSearch = !searchQuery ||
      entry.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.projectDetails.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.date.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    
    const entryDate = new Date(entry.date);
    
    // Date filtering logic - only use calendar date range
    let matchesDateFilter = true;
    
    if (dateRange && dateRange.from) {
      // Use calendar date range if selected
      const startDate = new Date(dateRange.from);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(dateRange.to || dateRange.from);
      endDate.setHours(23, 59, 59, 999);
      matchesDateFilter = entryDate >= startDate && entryDate <= endDate;
    }
    // If no date range is selected, show all entries (no date filtering)

    const matchesEmployee = roleFilter === 'all' || entry.userId === roleFilter;
    const matchesBillable = billableFilter === 'all' || 
      (billableFilter === 'billable' && entry.isBillable) ||
      (billableFilter === 'non-billable' && !entry.isBillable);
    const matchesProject = projectFilter === 'all' || entry.projectDetails.name === projects.find(p => p.id === projectFilter)?.name;

    return matchesSearch && matchesStatus && matchesDateFilter && matchesEmployee && matchesBillable && matchesProject;
  });

  // Get entries for overtime calculation (current month if no date filter)
  const overtimeEntries = timeEntries.filter(entry => {
    const matchesEmployee = roleFilter === 'all' || entry.userId === roleFilter;
    const matchesBillable = billableFilter === 'all' || 
      (billableFilter === 'billable' && entry.isBillable) ||
      (billableFilter === 'non-billable' && !entry.isBillable);
    const matchesProject = projectFilter === 'all' || entry.projectDetails.name === projects.find(p => p.id === projectFilter)?.name;
    
    const entryDate = new Date(entry.date);
    let matchesDateFilter = true;
    
    if (dateRange && dateRange.from) {
      // Use selected date range
      const startDate = new Date(dateRange.from);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(dateRange.to || dateRange.from);
      endDate.setHours(23, 59, 59, 999);
      matchesDateFilter = entryDate >= startDate && entryDate <= endDate;
    } else {
      // Default to current month if no date range selected
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      matchesDateFilter = entryDate >= currentMonthStart && entryDate <= currentMonthEnd;
    }

    return matchesDateFilter && matchesEmployee && matchesBillable && matchesProject;
  });

  // Group entries by date and sum hours for the same date
  const groupedEntries = filteredEntries.reduce((groups, entry) => {
    const date = entry.date;
    if (!groups[date]) {
      groups[date] = {
        ...entry,
        totalHours: 0,
        entries: []
      };
    }
    groups[date].totalHours += entry.totalHours;
    groups[date].entries.push(entry);
    return groups;
  }, {} as Record<string, GroupedEntry>);

  const getStatsForEntries = (entries: TimeEntry[]) => {
    const dailyEntries = entries.reduce((acc: { [key: string]: TimeEntry[] }, entry) => {
      const date = entry.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(entry);
      return acc;
    }, {});

    const daysWorked = Object.keys(dailyEntries).length;
    const totalActualHours = entries.reduce((sum, entry) => sum + entry.actualHours, 0);
    const totalBillableHours = entries.reduce((sum, entry) => sum + (entry.isBillable ? entry.billableHours : 0), 0);
    const averageHours = daysWorked ? totalActualHours / daysWorked : 0;

    return {
      totalActualHours,
      totalBillableHours,
      daysWorked,
      averageHours,
      entries
    };
  };

  // Get entries based on current selection
  const getFilteredStats = () => {
    let entriesToUse = filteredEntries;
    if (selectedUser) {
      entriesToUse = filteredEntries.filter(entry => entry.userId === selectedUser);
    }
    return getStatsForEntries(entriesToUse);
  };

  const stats = getFilteredStats();
  const totalActualHours = stats.totalActualHours;
  const totalBillableHours = stats.totalBillableHours;
  const daysWorked = stats.daysWorked;
  
  // Calculate overtime based on total expected hours for the period
  const calculateOvertimeHours = () => {
    const standardDailyHours = 8;
    
    // Calculate total actual hours from overtime entries
    const totalActualHoursForOvertime = overtimeEntries.reduce((sum, entry) => sum + entry.actualHours, 0);
    
    // Calculate expected hours for the period
    let expectedHours = 0;
    
    if (dateRange && dateRange.from) {
      // Use selected date range
      const startDate = new Date(dateRange.from);
      const endDate = new Date(dateRange.to || dateRange.from);
      
      // Count working days (Monday to Friday) in the selected range
      let workDays = 0;
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Monday to Friday
          workDays++;
        }
      }
      expectedHours = workDays * standardDailyHours;
    } else {
      // Default to current month
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Count working days in current month
      let workDays = 0;
      for (let d = new Date(currentMonthStart); d <= currentMonthEnd; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Monday to Friday
          workDays++;
        }
      }
      expectedHours = workDays * standardDailyHours;
    }
    
    // Calculate overtime (total actual - expected, but never negative)
    const overtime = Math.max(0, totalActualHoursForOvertime - expectedHours);
    return overtime;
  };
  
  const overtimeCalculated = calculateOvertimeHours();
  const averageHours = totalActualHours / (daysWorked || 1);
  
  // Get current user's available hours
  const availableHours = currentUser?.availableHours || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-600 text-white';
      case 'rejected': return 'bg-red-600 text-white';
      case 'pending': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const canEdit = (entry: TimeEntry) => {
    if (currentUser?.role === 'owner') return true;
    if (currentUser?.role === 'manager') return entry.status === 'pending';
    if (entry.userId !== currentUser?.id) return false;
    return entry.status === 'pending';
  };

  const canDelete = (entry: TimeEntry) => {
    if (currentUser?.role === 'owner') return true;
    if (currentUser?.role === 'manager') return entry.status === 'pending';
    if (entry.userId !== currentUser?.id) return false;
    return entry.status === 'pending';
  };

  const handleAddEntry = () => {
    navigate('/tracker');
  };

  const handleExport = () => {
    // Export functionality
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Date,Employee,Project,Task,Hours,Status\n" +
      filteredEntries.map(entry => 
        `${entry.date},${entry.userName},${entry.projectDetails.name},${entry.task},${entry.totalHours},${entry.status}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "timesheet.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmitTimesheet = () => {
    // Submit timesheet functionality - mark all pending entries as submitted
    const pendingEntries = filteredEntries.filter(entry => 
      entry.status === 'pending' && entry.userId === currentUser?.id
    );
    
    if (pendingEntries.length === 0) {
      alert('No pending entries to submit');
      return;
    }
    
    alert(`Submitted ${pendingEntries.length} entries for approval`);
  };

  // Edit handlers
  const handleEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setDailyTrackerOpen(true);
  };

  const handleEditSuccess = () => {
    setDailyTrackerOpen(false);
    setEditingEntry(null);
    loadTimeEntries();
  };

  const handleCloseDailyTracker = () => {
    setDailyTrackerOpen(false);
    setEditingEntry(null);
  };

  const permissions = rolePermissions[currentUser?.role || 'employee'];


  return (
    <div className="dashboard-layout">
      <Header 
        title="Timesheet"
      >
        <Button className="bg-primary hover:bg-primary-hover" onClick={handleAddEntry}>
          <Calendar className="mr-2 h-4 w-4" />
          Add Entry
        </Button>
        <Button variant="outline" onClick={handleExport}>
          <BarChart3 className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button variant="outline" onClick={handleSubmitTimesheet}>
          Submit Timesheet
        </Button>
      </Header>

      <div className="dashboard-content">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {selectedUser ? users.find(u => u.id === selectedUser)?.name + "'s HOURS" : "TOTAL HOURS"}
                  </p>
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{totalBillableHours.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">Billable</p>
                    </div>
                    <div className="text-muted-foreground text-lg">|</div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{totalActualHours.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">Actual</p>
                    </div>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-6 w-6 text-primary flex-shrink-0" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {selectedUser ? users.find(u => u.id === selectedUser)?.name + "'s Daily Average" : "Daily Average"}
                  </p>
                  <p className="text-3xl font-bold text-green-600">{stats.averageHours.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">Hours per day</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="h-6 w-6 text-success flex-shrink-0" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {selectedUser ? users.find(u => u.id === selectedUser)?.name + "'s Overtime" : "Overtime"}
                  </p>
                  <p className="text-3xl font-bold text-warning">{overtimeCalculated.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">
                    {dateRange && dateRange.from ? 'Above expected hours' : 'Above expected hours (current month)'}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Timer className="h-6 w-6 text-warning flex-shrink-0" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {selectedUser ? users.find(u => u.id === selectedUser)?.name + "'s Days Worked" : "Days Worked"}
                  </p>
                  <p className="text-3xl font-bold text-primary">{daysWorked}</p>
                  <p className="text-sm text-muted-foreground">This period</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CalendarIcon className="h-6 w-6 text-primary flex-shrink-0" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by project, task, employee..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <span className="text-sm text-muted-foreground">{filteredEntries.length} entries</span>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4 flex-wrap">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Date Filter:</span>
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                placeholder="Select date range"
                className="w-60"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4 flex-wrap">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {permissions.canViewAllTimesheets && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Employee:</span>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {users.map(user => (
                      <SelectItem value={user.id} key={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {permissions.canViewBillableRates && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Type:</span>
                <Select value={billableFilter} onValueChange={setBillableFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="billable">Billable</SelectItem>
                    <SelectItem value="non-billable">Non-billable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Project:</span>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map(project => (
                    <SelectItem value={project.id} key={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-sm text-muted-foreground">{filteredEntries.length} entries</span>
          </div>
        </div>

        {/* Timesheet Table */}
        <Card>
          <CardHeader>
            <CardTitle>Timesheet Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {permissions.canViewAllTimesheets && (
                    <TableHead>Employee</TableHead>
                  )}
                  <TableHead>Date</TableHead>
                <TableHead>Project Details</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Actual Hours</TableHead>
                <TableHead>Billable Hours</TableHead>
                <TableHead>Available Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((entry) => (
                  <TableRow key={entry.id}>
                    {permissions.canViewAllTimesheets && (
                      <TableCell>
                        <div 
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded"
                          onClick={() => handleUserClick(entry.userId)}
                        >
                          <div className={`h-8 w-8 rounded-full ${selectedUser === entry.userId ? 'bg-primary text-white' : 'bg-muted'} flex items-center justify-center text-xs font-medium`}>
                            {entry.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                          <span className={`font-medium ${selectedUser === entry.userId ? 'text-primary' : ''}`}>
                            {entry.userName}
                          </span>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="font-medium">{new Date(entry.date).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{entry.projectDetails.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {entry.projectDetails.category} - {entry.projectDetails.task}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-48 truncate">{entry.task}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="font-medium">{(entry.actualHours || 0).toFixed(1)}h</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">{(entry.billableHours || 0).toFixed(1)}h</span>
                        {entry.isBillable && (
                          <DollarSign className="h-4 w-4 text-success" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="font-medium">{(entry.availableHours || 0).toFixed(1)}h</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(entry.status)}>
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {canEdit(entry) && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditEntry(entry)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete(entry) && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {isDailyTrackerOpen && editingEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <EditSingleTimeEntryForm 
            entry={editingEntry}
            onClose={handleCloseDailyTracker}
            onSuccess={handleEditSuccess}
          />
        </div>
      )}
    </div>
  );
}
