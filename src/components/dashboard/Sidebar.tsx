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
  BarChart3,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "@/lib/auth";
import { rolePermissions } from "@/validation/index";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

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

export default function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
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
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen flex flex-col bg-sidebar-background border-r border-sidebar-border animate-fade-in transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Collapsed overlay for better visual separation */}
      {collapsed && (
        <div className="absolute inset-0 bg-gradient-to-b from-sidebar-background via-sidebar-background/95 to-sidebar-background/90 pointer-events-none" />
      )}
             {/* Header */}
       <div className={cn("flex items-center justify-between relative", collapsed ? "p-3" : "p-6")}>
         <div className="flex items-center space-x-2">
           <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-primary text-primary-foreground">
             <Clock className="h-4 w-4" />
           </div>
           {!collapsed && (
             <span className="text-subheading font-bold bg-gradient-primary bg-clip-text text-transparent">Timeflow</span>
           )}
         </div>
                   <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onToggle?.();
            }}
            className={cn(
              "h-8 w-8 p-0 hover:bg-sidebar-accent/50 z-50 bg-sidebar-background shadow-sm hover:shadow-md transition-all duration-200",
              collapsed ? "absolute -right-2 top-1/2 transform -translate-y-1/2 border-0" : "absolute right-2 top-1/2 transform -translate-y-1/2 border border-sidebar-border"
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
           {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
         </Button>
       </div>

      <Separator />

      {/* User Info */}
      <div className={collapsed ? "p-2" : "p-4"}>
        <div className={cn(
          "rounded-lg p-3 transition-all duration-200",
          collapsed ? "bg-transparent" : "card-glass hover-scale"
        )}>
          <div className="flex items-center space-x-3">
            <div className={cn(
              "flex items-center justify-center rounded-full bg-gradient-primary text-primary-foreground",
              collapsed ? "h-8 w-8" : "h-10 w-10"
            )}>
              <User className={collapsed ? "h-4 w-4" : "h-5 w-5"} />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-sidebar-foreground">{currentUser.name}</p>
                <div className="flex items-center space-x-2">
                  <span 
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                      currentUser.role === 'owner' && 'role-owner',
                      currentUser.role === 'manager' && 'role-manager', 
                      currentUser.role === 'employee' && 'role-employee'
                    )}
                  >
                    {getJobTitleLabel(currentUser.jobTitle)}
                  </span>
                </div>
              </div>
            )}
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
                  "w-full transition-all duration-200",
                  collapsed ? "justify-center px-2 h-10 w-10 mx-auto rounded-lg" : "justify-start",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm",
                  !isActive && "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                  collapsed && isActive && "bg-gradient-primary text-primary-foreground shadow-md",
                  collapsed && !isActive && "hover:bg-sidebar-accent/30"
                )}
                onClick={() => navigate(item.href)}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className={cn("h-4 w-4", !collapsed && "mr-3")} />
                {!collapsed && item.name}
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      <Separator />

      {/* Footer */}
      <div className={collapsed ? "p-2" : "p-4"}>
        <Button
          variant="ghost"
          className={cn(
            "w-full text-sidebar-foreground hover:text-destructive transition-all duration-200",
            collapsed ? "justify-center px-2 h-10 w-10 mx-auto rounded-lg hover:bg-destructive/10" : "justify-start hover-scale hover-glow"
          )}
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className={cn("h-4 w-4", !collapsed && "mr-3")} />
          {!collapsed && "Logout"}
        </Button>
      </div>
    </aside>
  );
}
