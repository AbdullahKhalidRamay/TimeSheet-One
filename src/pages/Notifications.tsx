import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Bell, Check, X, Eye, Search, Clock, Calendar, BarChart3 } from "lucide-react";
import Header from "@/components/dashboard/Header";
import { getCurrentUser } from "@/lib/auth";
import { notificationsAPI, remindersAPI } from "@/services/api";
import { Notification } from "@/validation/index";
import { Reminder } from "@/services/reminderService";

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [readFilter, setReadFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const currentUser = getCurrentUser();

  const loadNotifications = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const [userNotifications, userReminders] = await Promise.all([
        notificationsAPI.getAll(),
        remindersAPI.getAll()
      ]);
      
      setNotifications(userNotifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
      
      setReminders(userReminders.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Fallback to empty arrays if API fails
      setNotifications([]);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadNotifications();
    }
  }, [currentUser, loadNotifications]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkReminderAsRead = async (reminderId: string) => {
    try {
      await remindersAPI.markAsRead(reminderId);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking reminder as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await Promise.all([
        notificationsAPI.markAllAsRead(currentUser?.id),
        remindersAPI.markAllAsRead(currentUser?.id)
      ]);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = !searchQuery ||
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesRead = true;
    if (readFilter === 'read') {
      matchesRead = notification.isRead;
    } else if (readFilter === 'unread') {
      matchesRead = !notification.isRead;
    }

    const matchesType = typeFilter === 'all' || notification.type === typeFilter;

    return matchesSearch && matchesRead && matchesType;
  });

  const filteredReminders = reminders.filter(reminder => {
    const matchesSearch = !searchQuery ||
      reminder.message.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesRead = true;
    if (readFilter === 'read') {
      matchesRead = reminder.isRead;
    } else if (readFilter === 'unread') {
      matchesRead = !reminder.isRead;
    }

    const matchesType = typeFilter === 'all' || reminder.type === typeFilter;

    return matchesSearch && matchesRead && matchesType;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length + reminders.filter(r => !r.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval': return <Check className="h-4 w-4 text-success" />;
      case 'rejection': return <X className="h-4 w-4 text-destructive" />;
      case 'daily': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'weekly': return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'monthly': return <BarChart3 className="h-4 w-4 text-purple-500" />;
      default: return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'approval': return 'border-l-success';
      case 'rejection': return 'border-l-destructive';
      case 'daily': return 'border-l-blue-500';
      case 'weekly': return 'border-l-orange-500';
      case 'monthly': return 'border-l-purple-500';
      default: return 'border-l-primary';
    }
  };

  return (
    <div className="dashboard-layout">
      <Header 
        title="Notifications"
      >
        <Button variant="outline" onClick={handleMarkAllAsRead}>
          <Check className="mr-2 h-4 w-4" />
          Mark All Read
        </Button>
      </Header>

      <div className="dashboard-content">
        {/* Notification Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Notifications</p>
                  <p className="text-3xl font-bold text-primary">{notifications.length}</p>
                </div>
                <Bell className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Reminders</p>
                  <p className="text-3xl font-bold text-blue-500">{reminders.length}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unread</p>
                  <p className="text-3xl font-bold text-warning">{unreadCount}</p>
                </div>
                <Bell className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Read</p>
                  <p className="text-3xl font-bold text-success">{(notifications.length + reminders.length) - unreadCount}</p>
                </div>
                <Check className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar and Filters */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <span className="text-sm text-muted-foreground">{filteredNotifications.length + filteredReminders.length} items</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Filter:</span>
              <Select value={readFilter} onValueChange={setReadFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Notifications</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="approval">Approvals</SelectItem>
                  <SelectItem value="rejection">Rejections</SelectItem>
                  <SelectItem value="status_change">Status Changes</SelectItem>
                  <SelectItem value="daily">Daily Reminders</SelectItem>
                  <SelectItem value="weekly">Weekly Reminders</SelectItem>
                  <SelectItem value="monthly">Monthly Reminders</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Notifications and Reminders List */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">Loading notifications...</h3>
              </CardContent>
            </Card>
          ) : filteredNotifications.length === 0 && filteredReminders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">No notifications or reminders found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Try adjusting your search criteria.' : 'You\'re all caught up!'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Regular Notifications */}
              {filteredNotifications.map((notification) => (
                <Card 
                  key={`notification-${notification.id}`} 
                  className={`border-l-4 ${getNotificationColor(notification.type)} ${
                    !notification.isRead ? 'bg-muted/50' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-foreground">{notification.title}</h4>
                            {!notification.isRead && (
                              <Badge variant="outline" className="text-xs">New</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Reminders */}
              {filteredReminders.map((reminder) => (
                <Card 
                  key={`reminder-${reminder.id}`} 
                  className={`border-l-4 ${getNotificationColor(reminder.type)} ${
                    !reminder.isRead ? 'bg-muted/50' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="mt-1">
                          {getNotificationIcon(reminder.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-foreground capitalize">{reminder.type} Reminder</h4>
                            {!reminder.isRead && (
                              <Badge variant="outline" className="text-xs">New</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{reminder.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(reminder.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {!reminder.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkReminderAsRead(reminder.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
