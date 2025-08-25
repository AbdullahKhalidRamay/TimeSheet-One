import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckSquare, X, Check, Clock, History, MessageSquare, Search, DollarSign, Eye } from "lucide-react";
import Header from "@/components/dashboard/Header";
import { getCurrentUser } from "@/lib/auth";
import { updateTimeEntryStatus } from "@/services/storage";
import { TimeEntry, ApprovalAction } from "@/validation/index";
import { rolePermissions } from "@/validation/index";
import { useTimeEntries, useApprovalHistory, invalidateCache } from "@/hooks/useData";
import { toast } from "@/components/ui/sonner";

export default function ApprovalWorkflow() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [approvalMessage, setApprovalMessage] = useState("");
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [viewingEntry, setViewingEntry] = useState<TimeEntry | null>(null);
  const [isDetailViewOpen, setDetailViewOpen] = useState(false);
  const currentUser = getCurrentUser();

  const { timeEntries, refreshTimeEntries } = useTimeEntries();
  const { approvalHistory, refreshApprovalHistory } = useApprovalHistory();

  const loadData = useCallback(() => {
    refreshTimeEntries();
    refreshApprovalHistory();
  }, [refreshTimeEntries, refreshApprovalHistory]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleApproval = useCallback((entry: TimeEntry, action: 'approve' | 'reject') => {
    setSelectedEntry(entry);
    setApprovalAction(action);
    setApprovalMessage("");
  }, []);

  const handleViewEntry = useCallback((entry: TimeEntry) => {
    setViewingEntry(entry);
    setDetailViewOpen(true);
  }, []);

  const handleCloseDetailView = useCallback(() => {
    setDetailViewOpen(false);
    setViewingEntry(null);
  }, []);

  const submitApproval = useCallback(() => {
    if (!selectedEntry || !currentUser || !approvalMessage.trim()) return;

    const status = approvalAction === 'approve' ? 'approved' : 'rejected';
    updateTimeEntryStatus(selectedEntry.id, status, approvalMessage, currentUser.name);
    
    setSelectedEntry(null);
    setApprovalMessage("");
    invalidateCache('timeEntries');
    invalidateCache('approvalHistory');
    loadData();
    toast.success(`Timesheet entry ${status} successfully!`);
  }, [selectedEntry, currentUser, approvalMessage, approvalAction, loadData]);

  const pendingEntries = useMemo(() => {
    return timeEntries.filter(entry => entry.status === 'pending');
  }, [timeEntries]);

  const filteredPendingEntries = useMemo(() => {
    return pendingEntries.filter(entry => {
      if (!searchQuery) return true;
      return (
        entry.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.projectDetails.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.date.includes(searchQuery)
      );
    });
  }, [pendingEntries, searchQuery]);

  const filteredHistory = useMemo(() => {
    return approvalHistory.filter(action => {
      if (!searchQuery) return true;
      const entry = timeEntries.find(e => e.id === action.entryId);
      if (!entry) return false;
      return (
        entry.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.projectDetails.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [approvalHistory, searchQuery, timeEntries]);

  const permissions = rolePermissions[currentUser?.role || 'employee'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-status-approved text-white';
      case 'rejected': return 'bg-status-rejected text-white';
      default: return 'bg-status-pending text-black';
    }
  };

  return (
    <div className="dashboard-layout">
      <Header 
        title="Approval Workflow"
      />

      <div className="dashboard-content">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                  <p className="text-3xl font-bold text-warning">{pendingEntries.length}</p>
                </div>
                <Clock className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Approved Today</p>
                  <p className="text-3xl font-bold text-success">
                    {approvalHistory.filter(a => 
                      a.newStatus === 'approved' && 
                      new Date(a.approvedAt).toDateString() === new Date().toDateString()
                    ).length}
                  </p>
                </div>
                <Check className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Actions</p>
                  <p className="text-3xl font-bold text-primary">{approvalHistory.length}</p>
                </div>
                <History className="h-8 w-8 text-primary" />
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
          <span className="text-sm text-muted-foreground">{filteredPendingEntries.length} pending entries</span>
        </div>

        <Tabs defaultValue="approval" className="space-y-6">
          <TabsList>
            <TabsTrigger value="approval">Approval</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="approval" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckSquare className="h-5 w-5" />
                  <span>Pending Approvals</span>
                  <Badge variant="outline">{filteredPendingEntries.length} entries</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="min-w-[900px]">
                    <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Project Details</TableHead>
                      <TableHead>Actual Hours</TableHead>
                      <TableHead>Billable Hours</TableHead>
                      <TableHead>Available Hours</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPendingEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                              {entry.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <span className="font-medium">{entry.userName}</span>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{entry.projectDetails.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {entry.projectDetails.category} - {entry.projectDetails.task}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{(entry.actualHours || 0).toFixed(1)}h</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <span>{(entry.billableHours || 0).toFixed(1)}h</span>
                            {entry.isBillable && (
                              <DollarSign className="h-4 w-4 text-success" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{(entry.availableHours || 0).toFixed(1)}h</TableCell>
                        <TableCell>
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewEntry(entry)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-success hover:text-success"
                                  onClick={() => handleApproval(entry, 'approve')}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Approve Timesheet Entry</DialogTitle>
                                  <DialogDescription>
                                    Approve this timesheet entry for {entry.userName}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Message</label>
                                    <Textarea 
                                      placeholder="Add approval message..."
                                      value={approvalMessage}
                                      onChange={(e) => setApprovalMessage(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setSelectedEntry(null)}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={submitApproval}
                                    disabled={!approvalMessage.trim()}
                                    className="bg-success hover:bg-success/90"
                                  >
                                    Approve
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleApproval(entry, 'reject')}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject Timesheet Entry</DialogTitle>
                                  <DialogDescription>
                                    Reject this timesheet entry for {entry.userName}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Reason for rejection</label>
                                    <Textarea 
                                      placeholder="Explain why this entry is being rejected..."
                                      value={approvalMessage}
                                      onChange={(e) => setApprovalMessage(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setSelectedEntry(null)}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={submitApproval}
                                    disabled={!approvalMessage.trim()}
                                    variant="destructive"
                                  >
                                    Reject
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="h-5 w-5" />
                  <span>Approval History</span>
                  <Badge variant="outline">{filteredHistory.length} actions</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="min-w-[900px]">
                    <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Approved By</TableHead>
                      <TableHead>Approved At</TableHead>
                      {currentUser?.role === 'owner' && (
                        <TableHead>Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((action) => {
                      const entry = timeEntries.find(e => e.id === action.entryId);
                      if (!entry) return null;
                      
                      return (
                        <TableRow key={action.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                {entry.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                              <span className="font-medium">{entry.userName}</span>
                            </div>
                          </TableCell>
                          <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(action.newStatus)}>
                              {action.newStatus.charAt(0).toUpperCase() + action.newStatus.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-48 truncate" title={action.message}>
                              {action.message}
                            </div>
                          </TableCell>
                          <TableCell>{action.approvedBy}</TableCell>
                          <TableCell>{new Date(action.approvedAt).toLocaleString()}</TableCell>
                          {currentUser?.role === 'owner' && (
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {viewingEntry && (
        <Dialog open={isDetailViewOpen} onOpenChange={setDetailViewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Entry Details</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div>
                <p><strong>Date:</strong> {new Date(viewingEntry.date).toLocaleDateString()}</p>
                <p><strong>Employee:</strong> {viewingEntry.userName}</p>
                <p><strong>Project:</strong> {viewingEntry.projectDetails.name}</p>
                <p><strong>Task:</strong> {viewingEntry.task}</p>
                <p><strong>Actual Hours:</strong> {(viewingEntry.actualHours || 0).toFixed(1)}h</p>
                <p><strong>Billable Hours:</strong> {(viewingEntry.billableHours || 0).toFixed(1)}h</p>
                <p><strong>Available Hours:</strong> {(viewingEntry.availableHours || 0).toFixed(1)}h</p>
                <p><strong>Status:</strong> {viewingEntry.status.charAt(0).toUpperCase() + viewingEntry.status.slice(1)}</p>
                <p><strong>Created At:</strong> {new Date(viewingEntry.createdAt).toLocaleDateString()}</p>
                <p><strong>Updated At:</strong> {new Date(viewingEntry.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
            <Button className="mt-4" onClick={handleCloseDetailView}>Close</Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
