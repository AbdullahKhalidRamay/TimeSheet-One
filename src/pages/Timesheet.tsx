import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Edit, Trash2, DollarSign, Search, Clock, BarChart3, Timer, Calendar as CalendarIcon } from "lucide-react";
import Header from "@/components/layout/Header";
import { getCurrentUser } from "@/utils/auth";
import { getTimeEntries, deleteTimeEntry } from "@/utils/storage";
import { TimeEntry } from "@/types";
import { rolePermissions } from "@/types";
import { formatTime } from "@/utils/storage";

export default function Timesheet() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("current");
  const currentUser = getCurrentUser();

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

  const filteredEntries = timeEntries.filter(entry => {
    if (!searchQuery) return true;
    return (
      entry.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.projectDetails.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.date.includes(searchQuery)
    );
  });

  // Calculate summary statistics
  const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
  const regularHours = filteredEntries.filter(e => e.totalHours <= 8).reduce((sum, entry) => sum + entry.totalHours, 0);
  const overtimeHours = Math.max(0, totalHours - regularHours);
  const daysWorked = new Set(filteredEntries.map(e => e.date)).size;

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

  const permissions = rolePermissions[currentUser?.role || 'employee'];

  return (
    <div className="flex-1 overflow-auto">
      <Header 
        title="Team Timesheet"
        showSearch
        searchPlaceholder="Search by project, task, employee..."
        onSearch={handleSearch}
      >
        <Button className="bg-primary hover:bg-primary-hover">
          <Calendar className="mr-2 h-4 w-4" />
          Add Entry
        </Button>
        <Button variant="outline">
          <BarChart3 className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button variant="outline">
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
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Filters:</span>
            <select className="px-3 py-1 border border-border rounded-md text-sm">
              <option value="2weeks">2 Weeks</option>
              <option value="1month">1 Month</option>
              <option value="3months">3 Months</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <select className="px-3 py-1 border border-border rounded-md text-sm">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <select className="px-3 py-1 border border-border rounded-md text-sm">
              <option value="all">All Roles</option>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <span className="text-sm text-muted-foreground">{filteredEntries.length} entries</span>
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
                          <Button variant="ghost" size="sm">
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
    </div>
  );
}