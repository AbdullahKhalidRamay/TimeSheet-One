# 🚀 TimeTraceOne Backend-Frontend Integration

## Overview
This document describes the integration between the **TimeTraceOne Backend API** and the **TimeFlow Frontend** application.

## 🏗️ Architecture

```
┌─────────────────┐    HTTP/HTTPS    ┌─────────────────┐
│   Frontend      │ ◄──────────────► │   Backend       │
│   (React)       │                  │   (.NET Core)   │
│                 │                  │                 │
│ • Authentication│                  │ • JWT Auth      │
│ • Time Entries  │                  │ • REST API      │
│ • Projects      │                  │ • SQL Server    │
│ • Teams         │                  │ • Entity        │
│ • Reports       │                  │   Framework     │
└─────────────────┘                  └─────────────────┘
```

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file in the frontend root:

```bash
# TimeTraceOne Backend API Configuration
VITE_API_BASE_URL=http://localhost:5155

# Frontend Configuration
VITE_APP_NAME=TimeFlow
VITE_APP_VERSION=1.0.0
VITE_DEBUG_MODE=true
```

### Backend Requirements
- **URL**: `http://localhost:5155`
- **Authentication**: JWT Bearer Token
- **Database**: SQL Server with seeded data
- **Admin Credentials**: `admin@timeflow.com` / `Admin123!`

## 🔐 Authentication Flow

### 1. Login Process
```typescript
// User enters credentials
const { login } = useAuth();
const success = await login({ 
  email: "admin@timeflow.com", 
  password: "Admin123!" 
});

// Backend validates and returns JWT tokens
// Frontend stores tokens in localStorage
// User is redirected to dashboard
```

### 2. Token Management
- **Access Token**: Valid for 15 minutes
- **Refresh Token**: Valid for 7 days
- **Auto-refresh**: Every 14 minutes
- **Storage**: localStorage with automatic cleanup

### 3. Protected Routes
```typescript
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  return isAuthenticated ? children : <Navigate to="/login" />;
};
```

## 📡 API Integration

### Service Layer
The frontend uses a comprehensive service layer:

```typescript
// API Service Structure
src/services/
├── apiService.ts          # Main API service
├── storageApi.ts          # Legacy storage (can be removed)
└── reminderService.ts     # Local notifications
```

### React Query Hooks
Custom hooks for data fetching and mutations:

```typescript
// Time Entries
const { data: timeEntries, isLoading } = useTimeEntries();
const createTimeEntry = useCreateTimeEntry();
const updateTimeEntry = useUpdateTimeEntry();
const deleteTimeEntry = useDeleteTimeEntry();

// Projects
const { data: projects } = useProjects();
const createProject = useCreateProject();

// Teams
const { data: teams } = useTeams();
const createTeam = useCreateTeam();
```

## 🔄 Data Flow

### 1. Time Entries
```
Frontend Form → API Service → Backend → Database
     ↑              ↓           ↓         ↓
     └── React Query ←── Response ←── Success
```

### 2. Real-time Updates
- **Automatic Invalidation**: React Query invalidates related queries
- **Optimistic Updates**: UI updates immediately, syncs with backend
- **Error Handling**: Automatic rollback on failure

## 🎯 Key Features Integrated

### ✅ Authentication
- [x] JWT-based login/logout
- [x] Token refresh
- [x] Protected routes
- [x] User session management

### ✅ Time Management
- [x] Create time entries
- [x] Update time entries
- [x] Delete time entries
- [x] Search and filter
- [x] Date-based queries

### ✅ Project Management
- [x] CRUD operations
- [x] Project statistics
- [x] Team associations

### ✅ Team Management
- [x] CRUD operations
- [x] Member management
- [x] Project associations

### ✅ User Management
- [x] User profiles
- [x] Role-based access
- [x] Statistics and reports

## 🚦 Getting Started

### 1. Start Backend
```bash
cd D:\project\TimeTraceOne
dotnet run
```

### 2. Start Frontend
```bash
cd D:\pro-timeflow-main
npm install
npm run dev
```

### 3. Access Application
- **Frontend**: `http://localhost:5173`
- **Backend**: `http://localhost:5155`
- **Login**: `admin@timeflow.com` / `Admin123!`

## 🔍 Testing Integration

### 1. Verify Backend Health
```bash
curl http://localhost:5155/api/auth/login
```

### 2. Test Frontend Connection
- Open browser console
- Check for API connection errors
- Verify JWT token storage

### 3. Test Data Flow
- Create a time entry
- Verify it appears in backend
- Check real-time updates

## 🛠️ Development Workflow

### 1. Adding New API Endpoints
1. **Backend**: Add controller endpoint
2. **Frontend**: Add to `api.ts` config
3. **Frontend**: Add service method
4. **Frontend**: Create React Query hook
5. **Frontend**: Use in components

### 2. Data Model Changes
1. **Backend**: Update DTOs and models
2. **Frontend**: Update TypeScript interfaces
3. **Frontend**: Update service methods
4. **Frontend**: Update components

### 3. Error Handling
```typescript
try {
  const result = await apiService.create(data);
  // Handle success
} catch (error) {
  // Handle error with user feedback
  console.error('API Error:', error);
  showErrorNotification(error.message);
}
```

## 🔒 Security Considerations

### 1. Token Security
- Tokens stored in localStorage (consider httpOnly cookies for production)
- Automatic token refresh
- Secure logout with backend invalidation

### 2. API Security
- All requests require valid JWT token
- CORS configured for localhost development
- Input validation on both frontend and backend

### 3. Production Considerations
- Use HTTPS in production
- Implement rate limiting
- Add request/response logging
- Consider API versioning

## 📊 Monitoring & Debugging

### 1. Frontend Debugging
```typescript
// Enable debug mode
VITE_DEBUG_MODE=true

// Check API calls in browser console
// Monitor React Query DevTools
```

### 2. Backend Debugging
```bash
# Check backend logs
dotnet run --environment Development

# Monitor database connections
# Check API endpoint responses
```

### 3. Network Monitoring
- Browser DevTools Network tab
- Check request/response headers
- Verify JWT token inclusion

## 🚀 Next Steps

### 1. Immediate Improvements
- [ ] Add error boundaries for API failures
- [ ] Implement offline support with service workers
- [ ] Add loading states and skeletons
- [ ] Implement optimistic updates

### 2. Advanced Features
- [ ] Real-time notifications with SignalR
- [ ] File upload for project attachments
- [ ] Advanced reporting and analytics
- [ ] Mobile app with React Native

### 3. Production Deployment
- [ ] Docker containerization
- [ ] CI/CD pipeline setup
- [ ] Environment-specific configurations
- [ ] Performance monitoring

## 📚 Resources

- **Backend API**: [TimeTraceOne Documentation](./BACKEND_CORE_APIS.md)
- **Frontend**: [React + TypeScript + Vite](https://vitejs.dev/)
- **State Management**: [React Query](https://tanstack.com/query/latest)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)

## 🤝 Support

For integration issues:
1. Check backend is running on port 5155
2. Verify JWT token generation
3. Check browser console for errors
4. Review network requests in DevTools
5. Verify database seeding completed

---

**Integration Status**: ✅ **COMPLETE**  
**Last Updated**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**Version**: 1.0.0
