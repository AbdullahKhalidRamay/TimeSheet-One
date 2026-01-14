import * as React from "react";
import { Search, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getCurrentUser } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import NotificationBell from "@/components/notifications/NotificationBell";

interface HeaderProps {
  title: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  children?: React.ReactNode;
}

export default function Header({ 
  title, 
  showSearch = false, 
  searchPlaceholder = "Search...",
  onSearch,
  children 
}: HeaderProps) {
  const currentUser = getCurrentUser();
  const navigate = useNavigate();
  const currentChildren = React.Children.toArray(children);
  const actionButtons = currentChildren.filter(child => 
    React.isValidElement(child) && child.type === Button
  );

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  return (
    <div className="sticky top-0 z-40 animate-fade-in">
      <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-heading">{title}</h1>
          </div>

          <div className="flex items-center space-x-2">
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:scale-105 transition-transform duration-200">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 animate-scale-in" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{currentUser?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {currentUser?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSettings}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      {/* Search bar and action buttons in header */}
      {(showSearch || actionButtons.length > 0) && (
        <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border py-2 px-6">
          <div className="flex items-center justify-between">
            {showSearch && (
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  className="pl-10 input-primary"
                  onChange={(e) => onSearch?.(e.target.value)}
                />
              </div>
            )}
            
            {actionButtons.length > 0 && (
              <div className="flex items-center space-x-3">
                {actionButtons}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
