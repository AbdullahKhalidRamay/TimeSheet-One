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
  User
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "@/utils/auth";
import { rolePermissions } from "@/types";

const navigation = [
  {
    name: "Timesheet",
    href: "/timesheet",
    icon: Clock,
    roles: ["employee", "finance_manager", "manager", "owner"],
  },
  {
    name: "Time Tracker", 
    href: "/time-tracker",
    icon: Timer,
    roles: ["employee", "finance_manager", "manager", "owner"],
  },
  {
    name: "Projects & Tasks",
    href: "/projects",
    icon: FolderOpen,
    roles: ["finance_manager", "manager", "owner"],
  },
  {
    name: "Teams",
    href: "/teams",
    icon: Users,
    roles: ["finance_manager", "manager", "owner"],
  },
  {
    name: "Notifications",
    href: "/notifications",
    icon: Bell,
    roles: ["employee", "finance_manager", "manager", "owner"],
  },
  {
    name: "Approval Workflow",
    href: "/approval",
    icon: CheckSquare,
    roles: ["manager", "owner"],
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
      case "finance_manager": return "bg-role-finance";
      case "employee": return "bg-role-employee";
      default: return "bg-muted";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "finance_manager": return "Finance Manager";
      case "manager": return "Manager";
      case "owner": return "Owner";
      case "employee": return "Employee";
      default: return role;
    }
  };

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
            <Clock className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold">Timesheet App</span>
        </div>
      </div>

      <Separator />

      {/* User Info */}
      <div className="p-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <User className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentUser.name}</p>
            <div className="flex items-center space-x-2">
              <span 
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white",
                  getRoleColor(currentUser.role)
                )}
              >
                {getRoleLabel(currentUser.role)}
              </span>
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
                  "w-full justify-start",
                  isActive && "bg-primary/10 text-primary hover:bg-primary/20"
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
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}