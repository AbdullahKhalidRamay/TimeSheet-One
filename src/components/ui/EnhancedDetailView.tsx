import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  User, 
  Clock, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Building,
  Users,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Award,
  TrendingUp,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { getTimeEntries } from "@/services/storage";
import { User as UserType, Team, Project, Product, Department, TimeEntry } from "@/validation/index";

// Extended User type for member details with additional stats
interface ExtendedUser extends UserType {
  actualHours?: number;
  billableHours?: number;
  approvedEntries?: number;
  pendingEntries?: number;
  totalEntries?: number;
  phone?: string;
  location?: string;
  department?: string;
  skills?: string[];
}

// Extended TimeEntry type to include optional properties
interface ExtendedTimeEntry extends TimeEntry {
  description?: string;
  userRole?: string;
}

// Union type for data that can be either a Team, ExtendedUser, or ExtendedTimeEntry
type DetailData = Team | ExtendedUser | ExtendedTimeEntry;

interface DetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  data: DetailData;
  type: 'timesheet' | 'approval' | 'team';
  teamMembers?: UserType[];
  projects?: Project[];
  products?: Product[];
  departments?: Department[];
}

// Type guards
const isTeam = (data: DetailData): data is Team => {
  return 'memberIds' in data;
};

const isTimeEntry = (data: DetailData): data is ExtendedTimeEntry => {
  return 'projectDetails' in data && 'date' in data;
};

const isExtendedUser = (data: DetailData): data is ExtendedUser => {
  return 'role' in data && 'jobTitle' in data && !('memberIds' in data) && !('projectDetails' in data);
};

export default function EnhancedDetailView({ 
  isOpen, 
  onClose, 
  data, 
  type, 
  teamMembers, 
  projects, 
  products, 
  departments 
}: DetailViewProps) {
  if (!data) return null;

  const renderTimesheetDetails = () => {
    if (!isTimeEntry(data)) return null;
    
    return (
      <div className="space-y-2">
        {/* Header Section */}
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded-full bg-[#006666] flex items-center justify-center">
              <User className="h-3 w-3 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{data.userName}</h3>
              <p className="text-xs text-muted-foreground">
                {(() => {
                  try {
                    return format(new Date(data.date), 'EEEE, MMMM d, yyyy');
                  } catch (error) {
                    return data.date;
                  }
                })()}
              </p>
            </div>
          </div>
          <Badge className={getStatusBadgeClass(data.status)}>
            {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
          </Badge>
        </div>

        {/* Project Information */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs flex items-center space-x-1">
              <Building className="h-3 w-3" />
              <span>Project Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Project Name</p>
                <p className="text-sm font-semibold">{data.projectDetails.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Category</p>
                <Badge variant="outline" className={getCategoryBadgeClass(data.projectDetails.category)}>
                  {data.projectDetails.category.charAt(0).toUpperCase() + data.projectDetails.category.slice(1)}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Task</p>
              <p className="text-sm">{data.projectDetails.task}</p>
            </div>
            {data.projectDetails.description && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Description</p>
                <p className="text-xs">{data.projectDetails.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hours Information */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Time Tracking</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-1 rounded bg-blue-50">
                <div className="flex items-center justify-center space-x-1">
                  <Clock className="h-3 w-3 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-600">Actual</span>
                </div>
                <p className="text-base font-bold text-blue-700">{(data.actualHours || 0).toFixed(1)}h</p>
              </div>
              <div className="text-center p-1 rounded bg-green-50">
                <div className="flex items-center justify-center space-x-1">
                  <DollarSign className="h-3 w-3 text-green-600" />
                  <span className="text-xs font-semibold text-green-600">Billable</span>
                </div>
                <p className="text-base font-bold text-green-700">{(data.billableHours || 0).toFixed(1)}h</p>
                {data.isBillable && (
                  <Badge className="mt-1 bg-green-100 text-green-800 text-xs">Billable</Badge>
                )}
              </div>
              <div className="text-center p-1 rounded bg-purple-50">
                <div className="flex items-center justify-center space-x-1">
                  <Activity className="h-3 w-3 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-600">Available</span>
                </div>
                <p className="text-base font-bold text-purple-700">{(data.availableHours || 0).toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs flex items-center space-x-1">
              <FileText className="h-3 w-3" />
              <span>Additional Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Created</p>
                <p className="text-xs">{format(new Date(data.createdAt), 'MMM d, yyyy HH:mm')}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Last Updated</p>
                <p className="text-xs">{format(new Date(data.updatedAt), 'MMM d, yyyy HH:mm')}</p>
              </div>
            </div>
            {data.description && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Description</p>
                <p className="text-xs bg-muted p-1 rounded">{data.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderApprovalDetails = () => {
    if (!isTimeEntry(data)) return null;
    
    return (
      <div className="space-y-2">
        {/* Header Section */}
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded-full bg-[#006666] flex items-center justify-center">
              <CheckCircle className="h-3 w-3 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Approval Request</h3>
              <p className="text-xs text-muted-foreground">Submitted by {data.userName}</p>
            </div>
          </div>
          <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
        </div>

        {/* Entry Information */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs flex items-center space-x-1">
              <FileText className="h-3 w-3" />
              <span>Entry Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Date</p>
                <p className="text-sm font-semibold">{format(new Date(data.date), 'EEEE, MMMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Submitted</p>
                <p className="text-sm font-semibold">{format(new Date(data.createdAt), 'MMM d, yyyy HH:mm')}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Project</p>
              <p className="text-sm font-semibold">{data.projectDetails.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Task</p>
              <p className="text-sm">{data.projectDetails.task}</p>
            </div>
          </CardContent>
        </Card>

        {/* Hours Summary */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Hours Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-1 rounded bg-blue-50">
                <Clock className="h-3 w-3 text-blue-600 mx-auto" />
                <p className="text-base font-bold text-blue-700">{(data.actualHours || 0).toFixed(1)}h</p>
                <p className="text-xs text-blue-600">Actual</p>
              </div>
              <div className="text-center p-1 rounded bg-green-50">
                <DollarSign className="h-3 w-3 text-green-600 mx-auto" />
                <p className="text-base font-bold text-green-700">{(data.billableHours || 0).toFixed(1)}h</p>
                <p className="text-xs text-green-600">Billable</p>
              </div>
              <div className="text-center p-1 rounded bg-purple-50">
                <Activity className="h-3 w-3 text-purple-600 mx-auto" />
                <p className="text-base font-bold text-purple-700">{(data.availableHours || 0).toFixed(1)}h</p>
                <p className="text-xs text-purple-600">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Information */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>Employee Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Name</p>
                <p className="text-sm font-semibold">{data.userName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Role</p>
                <Badge variant="outline">{data.userRole || 'Employee'}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTeamDetails = () => {
    if (isTeam(data)) {
      // Render Team details
      return (
        <div className="space-y-3">
          {/* Header Section */}
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-[#006666] flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{data.name}</h3>
                <p className="text-xs text-muted-foreground">{data.description || 'No description available'}</p>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              Team
            </Badge>
          </div>

          {/* Team Information */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs flex items-center space-x-1">
                <Building className="h-3 w-3" />
                <span>Team Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Team Name</p>
                  <p className="text-sm font-semibold">{data.name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Leader</p>
                  <p className="text-sm font-medium">
                    {teamMembers?.find(u => u.id === data.leaderId)?.name || 'No leader assigned'}
                  </p>
                </div>
              </div>
              {data.description && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Description</p>
                  <p className="text-xs">{data.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>Team Members</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {data.memberIds.map((memberId: string) => {
                  const member = teamMembers?.find(m => m.id === memberId);
                  return member ? (
                    <div key={memberId} className="flex items-center justify-between p-2 rounded bg-gray-50">
                      <div className="flex items-center space-x-2">
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.role} • {member.jobTitle}</p>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </CardContent>
          </Card>



          {/* Associated Projects */}
          {data.associatedProjects && data.associatedProjects.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span>Associated Projects</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data.associatedProjects.map((projectId: string) => {
                    const project = projects?.find((p: Project) => p.id === projectId);
                    return project ? (
                      <Badge key={projectId} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {project.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Associated Products */}
          {data.associatedProducts && data.associatedProducts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center space-x-2">
                  <Award className="h-4 w-4" />
                  <span>Associated Products</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data.associatedProducts.map((productId: string) => {
                    const product = products?.find((p: Product) => p.id === productId);
                    return product ? (
                      <Badge key={productId} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {product.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Associated Departments */}
          {data.associatedDepartments && data.associatedDepartments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span>Associated Departments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data.associatedDepartments.map((deptId: string) => {
                    const dept = departments?.find((d: Department) => d.id === deptId);
                    return dept ? (
                      <Badge key={deptId} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {dept.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Creation Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Creation Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created By</p>
                  <p className="font-medium">{data.createdBy}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created On</p>
                  <p className="font-medium">{new Date(data.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    } else if (isExtendedUser(data)) {
      // Render User details (individual team member)
      return (
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-[#006666] flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{data.name}</h3>
                <p className="text-sm text-muted-foreground">{data.jobTitle}</p>
              </div>
            </div>
            <Badge className={getRoleBadgeClass(data.role)}>
              {data.role.charAt(0).toUpperCase() + data.role.slice(1)}
            </Badge>
          </div>

          <Separator />

          {/* Contact Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Contact Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="font-medium">{data.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="font-medium">{data.phone || 'Not provided'}</p>
                </div>
              </div>
              {data.location && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p className="font-medium">{data.location}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2">
                <Briefcase className="h-4 w-4" />
                <span>Professional Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Job Title</p>
                  <p className="font-semibold">{data.jobTitle}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Department</p>
                  <p className="font-medium">{data.department || 'Not assigned'}</p>
                </div>
              </div>
              {data.skills && data.skills.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {data.skills.map((skill: string, index: number) => (
                      <Badge key={index} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hours and Entries Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Hours and Entries Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-600">Actual Hours</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{data.actualHours || 0}h</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-600">Billable Hours</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">{data.billableHours || 0}h</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Activity className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-purple-600">Available Hours</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">{data.availableHours || 0}h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Entries Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Entries Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-600">Approved Entries</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">{data.approvedEntries || 0}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-600">Pending Entries</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-700">{data.pendingEntries || 0}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-600">Total Entries</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{data.totalEntries || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    return null;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'project': return 'border-blue-200 text-blue-700';
      case 'product': return 'border-green-200 text-green-700';
      case 'department': return 'border-purple-200 text-purple-700';
      default: return 'border-gray-200 text-gray-700';
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'employee': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {type === 'timesheet' && 'Timesheet Entry Details'}
            {type === 'approval' && 'Approval Request Details'}
            {type === 'team' && (isTeam(data) ? 'Team Details' : 'Team Member Details')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-6">
          {type === 'timesheet' && renderTimesheetDetails()}
          {type === 'approval' && renderApprovalDetails()}
          {type === 'team' && renderTeamDetails()}
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={onClose} className="bg-[#006666] hover:bg-[#004d4d]">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
