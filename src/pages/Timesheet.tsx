import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-picker";
import { DateRange } from "react-day-picker";
import { Calendar, Edit, Trash2, DollarSign, Clock, BarChart3, Timer, Calendar as CalendarIcon } from "lucide-react";
import Header from "@/components/dashboard/Header";
import { getCurrentUser } from "@/lib/auth";
import { getTimeEntries, deleteTimeEntry } from "@/services/storage";
import { TimeEntry } from "@/validation/index";
import { rolePermissions } from "@/validation/index";
import { formatTime } from "@/services/storage";
import { useNavigate } from "react-router-dom";
import EditTimeEntryForm from "@/components/users/EditTimeEntryForm";

export default function Timesheet() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("2weeks");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isEditFormOpen, setEditFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const currentUser = getCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    loadTimeEntries();
  }, []);

  const loadTimeEntries = () => {
    const allEntries = getTimeEntries();
    const permissions = rolePermissions[currentUser?.role || 'employee'];
    
    if (permissions.canViewAllTimesheets) {
      setTimeEntries(allEntries);
    } else {
      setTimeEntries(allEntries.filter(entry => entry.userId === currentUser?.id));
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleDeleteEntry = (entryId: string) => {
    const entry = timeEntries.find(e => e.id === entryId);
    if (entry && (entry.status === 'pending' || currentUser?.role === 'owner')) {
      deleteTimeEntry(entryId);
      loadTimeEntries();
    }
  };

const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateFilter) {
      case '2weeks':
        return new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
      case '1month':
        return new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '3months':
        return new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
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
    const matchesDateRange = dateRange && dateRange.from
      ? (() => {
          const startDate = new Date(dateRange.from);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(dateRange.to || dateRange.from);
          endDate.setHours(23, 59, 59, 999);
          return entryDate >= startDate && entryDate <= endDate;
        })()
      : true;

    // Get user by userId to check role
    const entryUser = timeEntries.find(e => e.userId === entry.userId);
    const userRole = entryUser ? entryUser.userName : 'employee'; // This should be improved to get actual role
    const matchesRole = roleFilter === 'all' || entry.userName.toLowerCase().includes(roleFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesDateRange && matchesRole;
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
  }, {} as Record<string, any>);

  // Calculate summary statistics based on grouped data
  const dailySummaries = Object.values(groupedEntries);
  const totalHours = dailySummaries.reduce((sum, day: any) => sum + day.totalHours, 0);
  const regularHours = dailySummaries.filter((day: any) => day.totalHours <= 8).reduce((sum, day: any) => sum + day.totalHours, 0);
  const overtimeHours = dailySummaries.filter((day: any) => day.totalHours > 8).reduce((sum, day: any) => sum + (day.totalHours - 8), 0);
  const daysWorked = dailySummaries.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-status-approved text-white';
      case 'rejected': return 'bg-status-rejected text-white';
      case 'pending': return 'bg-status-pending text-black';
      default: return 'bg-muted';
    }
  };

  const canEdit = (entry: TimeEntry) => {
    if (currentUser?.role === 'owner') return true;
    if (entry.userId !== currentUser?.id) return false;
    return entry.status === 'pending';
  };

  const canDelete = (entry: TimeEntry) => {
    if (currentUser?.role === 'owner') return true;
    if (entry.userId !== currentUser?.id) return false;
    return entry.status === 'pending';
  };

  const handleAddEntry = () => {
    navigate('/time-tracker');
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
    setEditFormOpen(true);
  };

  const handleEditSuccess = () => {
    setEditFormOpen(false);
    setEditingEntry(null);
    loadTimeEntries();
  };

  const handleCloseEditForm = () => {
    setEditFormOpen(false);
    setEditingEntry(null);
  };

  const permissions = rolePermissions[currentUser?.role || 'employee'];

  return (
    <div className="flex-1 overflow-auto">
      <Header 
        title="Team Timesheet"
        showSearch
        searchPlaceholder="Search by project, task, employee..."
        onSearch={handleSearch}
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

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                  <p className="text-3xl font-bold text-primary">{totalHours.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">This period</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Regular Hours</p>
                  <p className="text-3xl font-bold text-success">{regularHours.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">Standard time</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overtime</p>
                  <p className="text-3xl font-bold text-warning">{overtimeHours.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">Extra hours</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Timer className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Days Worked</p>
                  <p className="text-3xl font-bold text-primary">{daysWorked}</p>
                  <p className="text-sm text-muted-foreground">This period</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CalendarIcon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
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
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Quick filters:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                  setDateRange({ from: oneWeekAgo, to: today });
                }}
              >
                Last 7 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
                  setDateRange({ from: twoWeeksAgo, to: today });
                }}
              >
                Last 2 weeks
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                  setDateRange({ from: oneMonthAgo, to: today });
                }}
              >
                Last month
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRange(undefined)}
              >
                Clear
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">Other Filters:</span>
          <div className="flex items-center space-x-2">
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
          <div className="flex items-center space-x-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="finance_manager">Finance Manager</SelectItem>
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
                  <TableHead>Task</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    {permissions.canViewAllTimesheets && (
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            {entry.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                          <span className="font-medium">{entry.userName}</span>
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
                        <div>{formatTime(entry.clockIn)} - {formatTime(entry.clockOut)}</div>
                        {entry.breakTime > 0 && (
                          <div className="text-muted-foreground">Break: {entry.breakTime}min</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">{entry.totalHours.toFixed(1)}h</span>
                        {entry.isBillable && (
                          <DollarSign className="h-4 w-4 text-success" />
                        )}
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

      <EditTimeEntryForm
        isOpen={isEditFormOpen}
        onClose={handleCloseEditForm}
        onSuccess={handleEditSuccess}
        editingEntry={editingEntry}
      />
    </div>
  );
}
