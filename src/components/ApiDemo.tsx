import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

export default function ApiDemo() {
  const [apiUrl, setApiUrl] = useState('https://localhost:7001');
  const [email, setEmail] = useState('admin@timeflow.com');
  const [password, setPassword] = useState('Admin123!');
  const [token, setToken] = useState('');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Check if we have a token in localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('api_token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setToken(data.token);
        localStorage.setItem('api_token', data.token);
        setResponse({
          success: true,
          message: 'Login successful',
          data: data
        });
        toast({
          title: 'Login successful',
          description: `Welcome, ${data.user.name}!`,
        });
      } else {
        setResponse({
          success: false,
          message: data.message || 'Login failed',
        });
        toast({
          variant: 'destructive',
          title: 'Login failed',
          description: data.message || 'Invalid credentials',
        });
      }
    } catch (error) {
      setResponse({
        success: false,
        message: 'API connection error',
      });
      toast({
        variant: 'destructive',
        title: 'API Error',
        description: 'Could not connect to the API. Make sure the API is running.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGetCurrentUser = async () => {
    if (!token) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'Please login first to get a token',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        setResponse({
          success: true,
          message: 'User data retrieved',
          data: data
        });
        toast({
          title: 'Success',
          description: 'Current user data retrieved',
        });
      } else {
        setResponse({
          success: false,
          message: data.message || 'Failed to get user data',
        });
        toast({
          variant: 'destructive',
          title: 'Request failed',
          description: data.message || 'Could not retrieve user data',
        });
      }
    } catch (error) {
      setResponse({
        success: false,
        message: 'API connection error',
      });
      toast({
        variant: 'destructive',
        title: 'API Error',
        description: 'Could not connect to the API. Make sure the API is running.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('api_token');
    setToken('');
    setResponse(null);
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully',
    });
  };

  return (
    <Card className="w-full max-w-3xl mx-auto my-8">
      <CardHeader>
        <CardTitle>TimeSheet API Demo</CardTitle>
        <CardDescription>
          Test the connection to your TimeSheet API backend
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="apiUrl">API URL</Label>
          <Input
            id="apiUrl"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://localhost:7001"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@timeflow.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleLogin} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
          <Button 
            onClick={handleGetCurrentUser} 
            disabled={loading || !token}
            variant="outline"
          >
            Get Current User
          </Button>
          <Button 
            onClick={handleLogout} 
            disabled={!token}
            variant="destructive"
          >
            Logout
          </Button>
        </div>

        {token && (
          <div className="p-2 bg-muted rounded-md">
            <p className="text-sm font-mono break-all">Token: {token}</p>
          </div>
        )}

        {response && (
          <div className={`p-4 rounded-md ${response.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h3 className="font-medium mb-2">{response.success ? 'Success' : 'Error'}</h3>
            <p className="mb-2">{response.message}</p>
            {response.data && (
              <pre className="bg-background p-2 rounded text-xs overflow-auto max-h-60">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          This component demonstrates how to connect to the TimeSheet API from your React application.
        </p>
      </CardFooter>
    </Card>
  );
}