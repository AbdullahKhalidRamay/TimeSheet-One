import { useState, useEffect } from 'react';
import { Bell, Clock, Calendar, BarChart3, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  getUnreadReminders, 
  markReminderAsRead, 
  type Reminder 
} from '@/services/reminderService';
import { getCurrentUser } from '@/lib/auth';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const currentUser = getCurrentUser();

  const loadReminders = () => {
    if (currentUser) {
      const unreadReminders = getUnreadReminders(currentUser.id);
      setReminders(unreadReminders);
    }
  };

  useEffect(() => {
    loadReminders();
    // Refresh reminders every 5 minutes
    const interval = setInterval(loadReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleMarkAsRead = (reminderId: string) => {
    markReminderAsRead(reminderId);
    loadReminders();
  };

  const handleMarkAllAsRead = () => {
    reminders.forEach(reminder => {
      markReminderAsRead(reminder.id);
    });
    loadReminders();
  };

  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'daily':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'weekly':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'monthly':
        return <BarChart3 className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getReminderTypeColor = (type: string) => {
    switch (type) {
      case 'daily':
        return 'bg-blue-100 border-blue-200';
      case 'weekly':
        return 'bg-orange-100 border-orange-200';
      case 'monthly':
        return 'bg-purple-100 border-purple-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  if (!currentUser) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {reminders.length > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {reminders.length > 9 ? '9+' : reminders.length}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50">
          <Card className="w-80 max-w-[90vw] shadow-lg border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  Notifications
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {reminders.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="text-xs"
                    >
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="p-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {reminders.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No new notifications</p>
                </div>
              ) : (
                <ScrollArea className="max-h-96">
                  <div className="space-y-2 p-4">
                    {reminders.map((reminder) => (
                      <div
                        key={reminder.id}
                        className={`p-3 rounded-lg border ${getReminderTypeColor(reminder.type)} hover:shadow-sm transition-shadow`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getReminderIcon(reminder.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <Badge 
                                variant="outline" 
                                className="text-xs capitalize"
                              >
                                {reminder.type}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(reminder.id)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed">
                              {reminder.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatRelativeTime(reminder.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Backdrop to close dropdown when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
