import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllUsers, setCurrentUser } from "@/utils/auth";
import { Clock } from "lucide-react";

export default function Login() {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const navigate = useNavigate();
  const users = getAllUsers();

  const handleLogin = () => {
    const user = users.find(u => u.id === selectedUserId);
    if (user) {
      setCurrentUser(user);
      navigate("/timesheet");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Clock className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl">Timesheet Application</CardTitle>
          <CardDescription>
            Select a user role to access the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select User</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center space-x-2">
                      <span>{user.name}</span>
                      <span className="text-muted-foreground">
                        ({user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={handleLogin} 
            disabled={!selectedUserId}
            className="w-full"
          >
            Login
          </Button>
          
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Demo Users:</strong></p>
            <p>• Owner - Full access to all features</p>
            <p>• Manager - Access to management features</p>
            <p>• Finance Manager - Financial data access</p>
            <p>• Employee - Basic timesheet access</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}