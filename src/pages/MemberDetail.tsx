import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  ArrowLeft, 
  User, 
  Clock, 
  DollarSign, 
  Calendar as CalendarIcon,
  Building, 
  TrendingUp, 
  Activity,
  CheckCircle,
  AlertCircle,
  FileText,
  BarChart3,
  Download
} from "lucide-react";
import Header from "@/components/dashboard/Header";
import { useUsers, useTimeEntries, useProjects, useProducts, useDepartments } from "@/hooks/useData";
import { TimeEntry } from "@/validation/index";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from "date-fns";

// Helper function to format time (e.g., 8.5h)
const formatTime = (hours: number) => `${hours.toFixed(1)}h`;

export default function MemberDetail() {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [chartType, setChartType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  const { users } = useUsers();
  const { timeEntries } = useTimeEntries();
  const { projects } = useProjects();
  const { products } = useProducts();
  const { departments } = useDepartments();

  const member = useMemo(() => {
    return users.find(user => user.id === memberId);
  }, [users, memberId]);

  const memberTimeEntries = useMemo(() => {
    if (!member) return [];
    return timeEntries.filter(entry => entry.userId === member.id);
  }, [timeEntries, member]);

  // Filter entries by selected date range
  const filteredTimeEntries = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return memberTimeEntries;
    
    return memberTimeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return isWithinInterval(entryDate, { start: dateRange.from, end: dateRange.to });
    });
  }, [memberTimeEntries, dateRange]);

  const memberStats = useMemo(() => {
    if (!filteredTimeEntries.length) return {
      totalActualHours: 0,
      totalBillableHours: 0,
      totalAvailableHours: 0,
      approvedEntries: 0,
      pendingEntries: 0,
      rejectedEntries: 0,
      totalEntries: 0,
      averageHoursPerDay: 0,
      daysWorked: 0
    };

    const totalActualHours = filteredTimeEntries.reduce((sum, entry) => sum + entry.actualHours, 0);
    const totalBillableHours = filteredTimeEntries.reduce((sum, entry) => sum + entry.billableHours, 0);
    const totalAvailableHours = filteredTimeEntries.reduce((sum, entry) => sum + (entry.availableHours || 0), 0);
    
    const approvedEntries = filteredTimeEntries.filter(entry => entry.status === 'approved').length;
    const pendingEntries = filteredTimeEntries.filter(entry => entry.status === 'pending').length;
    const rejectedEntries = filteredTimeEntries.filter(entry => entry.status === 'rejected').length;
    
    const uniqueDates = new Set(filteredTimeEntries.map(entry => entry.date));
    const daysWorked = uniqueDates.size;
    const averageHoursPerDay = daysWorked > 0 ? totalActualHours / daysWorked : 0;

    return {
      totalActualHours,
      totalBillableHours,
      totalAvailableHours,
      approvedEntries,
      pendingEntries,
      rejectedEntries,
      totalEntries: filteredTimeEntries.length,
      averageHoursPerDay,
      daysWorked
    };
  }, [filteredTimeEntries]);

  const projectBreakdown = useMemo(() => {
    const breakdown: { [key: string]: { actualHours: number; billableHours: number; entries: number } } = {};
    
    filteredTimeEntries.forEach(entry => {
      const projectName = entry.projectDetails.name;
      if (!breakdown[projectName]) {
        breakdown[projectName] = { actualHours: 0, billableHours: 0, entries: 0 };
      }
      breakdown[projectName].actualHours += entry.actualHours;
      breakdown[projectName].billableHours += entry.billableHours;
      breakdown[projectName].entries += 1;
    });

    return Object.entries(breakdown).map(([name, data]) => ({
      name,
      ...data
    }));
  }, [filteredTimeEntries]);

  const recentEntries = useMemo(() => {
    return filteredTimeEntries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [filteredTimeEntries]);

  // Generate chart data for all dates in the selected range
  const chartData = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return [];

    // Generate all dates in the range
    const allDates = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    
    // Create a map of entries by date
    const entriesByDate = filteredTimeEntries.reduce((acc, entry) => {
      const date = entry.date;
      if (!acc[date]) {
        acc[date] = { actualHours: 0, billableHours: 0, total: 0 };
      }
      acc[date].actualHours += entry.actualHours;
      acc[date].billableHours += entry.billableHours;
      acc[date].total += entry.actualHours;
      return acc;
    }, {} as Record<string, { actualHours: number; billableHours: number; total: number }>);

    // Generate data for all dates, including those with no entries
    return allDates.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const data = entriesByDate[dateStr] || { actualHours: 0, billableHours: 0, total: 0 };
      
      // Calculate available hours (8 hours - actual hours)
      // If no entries for the day, available hours should be 0
      const availableHours = data.actualHours > 0 ? Math.max(0, 8 - data.actualHours) : 0;
      
      return {
        date: format(date, 'MMM dd'),
        fullDate: dateStr,
        actual: Math.round(data.actualHours * 100) / 100,
        billable: Math.round(data.billableHours * 100) / 100,
        available: Math.round(availableHours * 100) / 100,
        total: Math.round(data.total * 100) / 100
      };
    });
  }, [filteredTimeEntries, dateRange]);

  // Prepare pie chart data for project breakdown
  const pieChartData = useMemo(() => {
    return projectBreakdown.map((project, index) => ({
      name: project.name,
      value: project.actualHours,
      billable: project.billableHours,
      actual: project.actualHours,
      fill: `hsl(${210 + (index * 40)}, 70%, 50%)`
    }));
  }, [projectBreakdown]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  if (!member) {
    return (
      <div className="dashboard-layout">
        <Header title="Member Not Found">
          <Button onClick={() => navigate('/reports')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Button>
        </Header>
        <div className="dashboard-content">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-lg text-muted-foreground">Member not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Header title={`${member.name} - Member Details`}>
        <Button onClick={() => navigate('/reports')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reports
        </Button>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </Header>

      <div className="dashboard-content">
        {/* Member Info Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{member.name}</h2>
                <p className="text-muted-foreground">{member.email}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge variant="outline">{member.role}</Badge>
                  <Badge variant="outline">{member.jobTitle}</Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Available Hours</p>
                <p className="text-2xl font-bold text-primary">{member.availableHours}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                  <p className="text-2xl font-bold">{memberStats.totalActualHours.toFixed(1)}h</p>
                  <p className="text-xs text-muted-foreground">{memberStats.totalEntries} entries</p>
                </div>
                <Clock className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Billable Hours</p>
                  <p className="text-2xl font-bold text-green-600">{memberStats.totalBillableHours.toFixed(1)}h</p>
                  <p className="text-xs text-muted-foreground">
                    {memberStats.totalActualHours > 0 ? `${Math.round((memberStats.totalBillableHours / memberStats.totalActualHours) * 100)}%` : '0%'} of total
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Daily Average</p>
                  <p className="text-2xl font-bold text-orange-600">{memberStats.averageHoursPerDay.toFixed(1)}h</p>
                  <p className="text-xs text-muted-foreground">Per working day</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Projects</p>
                  <p className="text-2xl font-bold">{projectBreakdown.length}</p>
                  <p className="text-xs text-muted-foreground">Active projects</p>
                </div>
                <Building className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Time Overview</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>Project Breakdown</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Trends</span>
            </TabsTrigger>
          </TabsList>

          {/* Time Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm font-medium">View by:</label>
              <Select value={chartType} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setChartType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Date Range:</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={dateRange}
                                             onSelect={(range) => {
                         if (range?.from && range?.to) {
                           setDateRange({ from: range.from, to: range.to });
                         }
                       }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Hours Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatTime(value)} />
                      <Bar dataKey="billable" stackId="a" fill="#22c55e" name="Billable" />
                      <Bar dataKey="actual" stackId="a" fill="#f59e0b" name="Actual" />
                      <Bar dataKey="available" fill="#8b5cf6" name="Available" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No data available for chart
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Entries Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Entries Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-green-50">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-600">Approved</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">{memberStats.approvedEntries}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-yellow-50">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <span className="font-semibold text-yellow-600">Pending</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-700">{memberStats.pendingEntries}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-red-50">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span className="font-semibold text-red-600">Rejected</span>
                    </div>
                    <p className="text-2xl font-bold text-red-700">{memberStats.rejectedEntries}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Project Breakdown Tab */}
          <TabsContent value="projects" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Hours Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {pieChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${formatTime(value)}`}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatTime(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      No project data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {projectBreakdown.map((project, index) => (
                      <div key={project.name} className="flex items-center justify-between p-3 rounded border">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <div>
                            <p className="font-medium">{project.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Billable: {project.billableHours.toFixed(1)}h | Actual: {project.actualHours.toFixed(1)}h
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{project.actualHours.toFixed(1)}h</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Time Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                                         <LineChart data={chartData}>
                       <CartesianGrid strokeDasharray="3 3" />
                       <XAxis dataKey="date" />
                       <YAxis />
                       <Tooltip formatter={(value: number) => formatTime(value)} />
                       <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total Hours" />
                       <Line type="monotone" dataKey="billable" stroke="#22c55e" strokeWidth={2} name="Billable Hours" />
                       <Line type="monotone" dataKey="actual" stroke="#f59e0b" strokeWidth={2} name="Actual Hours" />
                       <Line type="monotone" dataKey="available" stroke="#8b5cf6" strokeWidth={2} name="Available Hours" />
                     </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No data available for trends
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Time Entries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Recent Time Entries</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Actual Hours</TableHead>
                      <TableHead>Billable Hours</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="font-medium">{new Date(entry.date).toLocaleDateString()}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{entry.projectDetails.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {entry.projectDetails.category}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{entry.task}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-blue-600">{entry.actualHours.toFixed(1)}h</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">{entry.billableHours.toFixed(1)}h</span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              entry.status === 'approved' ? 'bg-green-100 text-green-800' :
                              entry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }
                          >
                            {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
