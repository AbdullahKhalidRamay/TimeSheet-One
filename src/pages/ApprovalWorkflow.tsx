import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckSquare, X, Check, Clock, History, MessageSquare } from "lucide-react";
import Header from "@/components/dashboard/Header";
import { getCurrentUser } from "@/lib/auth";
import { getTimeEntries, updateTimeEntryStatus, getApprovalHistory } from "@/services/storage";
import { TimeEntry, ApprovalAction } from "@/validation/index";
import { rolePermissions } from "@/validation/index";

export default function ApprovalWorkflow() {
  const [pendingEntries, setPendingEntries] = useState<TimeEntry[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalAction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [approvalMessage, setApprovalMessage] = useState("");
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const currentUser = getCurrentUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allEntries = getTimeEntries();
    setPendingEntries(allEntries.filter(entry => entry.status === 'pending'));
    setApprovalHistory(getApprovalHistory());
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleApproval = (entry: TimeEntry, action: 'approve' | 'reject') => {
    setSelectedEntry(entry);
    setApprovalAction(action);
    setApprovalMessage("");
  };

  const submitApproval = () => {
    if (!selectedEntry || !currentUser || !approvalMessage.trim()) return;

    const status = approvalAction === 'approve' ? 'approved' : 'rejected';
    updateTimeEntryStatus(selectedEntry.id, status, approvalMessage, currentUser.name);
    
    setSelectedEntry(null);
    setApprovalMessage("");
    loadData();
  };

  const filteredPendingEntries = pendingEntries.filter(entry => {
    if (!searchQuery) return true;
    return (
      entry.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.projectDetails.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.date.includes(searchQuery)
    );
  });

  const filteredHistory = approvalHistory.filter(action => {
    if (!searchQuery) return true;
    const entry = getTimeEntries().find(e => e.id === action.entryId);
    if (!entry) return false;
    return (
      entry.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.projectDetails.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.message.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

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
        showSearch
        searchPlaceholder="Search by project, task, employee..."
        onSearch={handleSearch}
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Project Details</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Hours</TableHead>
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
                        <TableCell>
                          <div className="max-w-48 truncate">{entry.task}</div>
                        </TableCell>
                        <TableCell>{entry.totalHours.toFixed(1)}h</TableCell>
                        <TableCell>
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
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
                <Table>
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
                      const entry = getTimeEntries().find(e => e.id === action.entryId);
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
