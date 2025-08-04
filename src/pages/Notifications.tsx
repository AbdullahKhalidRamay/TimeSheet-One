import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Check, X, Eye } from "lucide-react";
import Header from "@/components/dashboard/Header";
import { getCurrentUser } from "@/lib/auth";
import { getNotifications, markNotificationAsRead } from "@/services/storage";
import { Notification } from "@/validation/index";

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [readFilter, setReadFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (currentUser) {
      loadNotifications();
    }
  }, [currentUser]);

  const loadNotifications = () => {
    if (currentUser) {
      const userNotifications = getNotifications(currentUser.id);
      setNotifications(userNotifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleMarkAsRead = (notificationId: string) => {
    markNotificationAsRead(notificationId);
    loadNotifications();
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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval': return <Check className="h-4 w-4 text-success" />;
      case 'rejection': return <X className="h-4 w-4 text-destructive" />;
      default: return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'approval': return 'border-l-success';
      case 'rejection': return 'border-l-destructive';
      default: return 'border-l-primary';
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <Header 
        title="Notifications"
        showSearch
        searchPlaceholder="Search notifications..."
        onSearch={handleSearch}
      >
        <Button variant="outline">
          <Check className="mr-2 h-4 w-4" />
          Mark All Read
        </Button>
      </Header>

      <div className="p-6 space-y-6">
        {/* Notification Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <p className="text-3xl font-bold text-success">{notifications.length - unreadCount}</p>
                </div>
                <Check className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
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
              </SelectContent>
            </Select>
          </div>
          <span className="text-sm text-muted-foreground">{filteredNotifications.length} notifications</span>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">No notifications found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Try adjusting your search criteria.' : 'You\'re all caught up!'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
