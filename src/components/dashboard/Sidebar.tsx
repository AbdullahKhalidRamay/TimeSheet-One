import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  Timer, 
  FolderOpen, 
  Users, 
  Bell, 
  CheckSquare, 
  Settings,
  LogOut,
  User,
  BarChart3
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "@/lib/auth";
import { rolePermissions } from "@/validation/index";

const navigation = [
  {
    name: "Tracker",
    href: "/tracker",
    icon: Timer,
    roles: ["employee", "manager", "owner"],
  },
  {
    name: "Timesheet",
    href: "/timesheet",
    icon: Clock,
    roles: ["employee", "manager", "owner"],
  },
  {
    name: "Projects & Tasks",
    href: "/projects",
    icon: FolderOpen,
    roles: ["manager", "owner"],
  },
  {
    name: "Teams",
    href: "/teams",
    icon: Users,
    roles: ["manager", "owner"],
  },
  {
    name: "Approval Workflow",
    href: "/approval",
    icon: CheckSquare,
    roles: ["manager", "owner"],
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["manager", "owner"],
  },
  {
    name: "Notifications",
    href: "/notifications",
    icon: Bell,
    roles: ["employee", "manager", "owner"],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const handleLogout = () => {
    logout();
    // Force navigation to login page
    window.location.href = "/login";
  };

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(currentUser.role)
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner": return "bg-role-owner";
      case "manager": return "bg-role-manager";
      case "employee": return "bg-role-employee";
      default: return "bg-muted";
    }
  };

  const getJobTitleLabel = (jobTitle: string) => {
    return jobTitle;
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 flex flex-col bg-sidebar-background border-r border-sidebar-border animate-fade-in">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-primary text-primary-foreground animate-float">
            <Clock className="h-4 w-4" />
          </div>
          <span className="text-subheading font-bold bg-gradient-primary bg-clip-text text-transparent">Timeflow</span>
        </div>
      </div>

      <Separator />

      {/* User Info */}
      <div className="p-4">
        <div className="card-glass rounded-lg p-3 hover-scale">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-sidebar-foreground">{currentUser.name}</p>
              <div className="flex items-center space-x-2">
                <span 
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border animate-pulse-glow",
                    currentUser.role === 'owner' && 'role-owner',
                    currentUser.role === 'manager' && 'role-manager', 
                    currentUser.role === 'employee' && 'role-employee'
                  )}
                >
                  {getJobTitleLabel(currentUser.jobTitle)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1 py-4">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Button
                key={item.name}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start hover-scale hover-glow transition-all duration-200",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm",
                  !isActive && "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
                onClick={() => navigate(item.href)}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.name}
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      <Separator />

      {/* Footer */}
      <div className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:text-destructive hover-scale hover-glow transition-all duration-200"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
