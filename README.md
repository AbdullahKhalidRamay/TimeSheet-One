# Pro TimeFlow

## Project Overview

Pro TimeFlow is a comprehensive time tracking and project management system designed for professional teams. It provides a robust backend API for tracking time entries, managing projects, teams, departments, and user notifications.

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/ebf48bcc-b954-46ad-a898-3d6bcad821fa) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## TimeSheetAPI Features

- **User Management**: Create, update, and manage users with different roles (Admin, Manager, Employee)
- **Time Tracking**: Log time entries with clock-in/out functionality, break time tracking, and billable hours calculation
- **Project Management**: Create and manage projects, project levels, tasks, and subtasks
- **Team Management**: Organize users into teams and departments
- **Approval Workflow**: Request, approve, and reject time entries
- **Notifications**: System notifications for important events

## Technology Stack

This project is built with:

### Frontend
- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

### Backend (TimeSheetAPI)
- ASP.NET Core 7.0
- Entity Framework Core
- SQL Server
- JWT Authentication
- Swagger/OpenAPI

## TimeSheetAPI Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Authenticate a user and get JWT token
- `GET /api/auth/current`: Get current authenticated user

### Users
- `GET /api/users`: Get all users (Admin/Manager only)
- `GET /api/users/{id}`: Get user by ID
- `PUT /api/users/{id}`: Update user
- `DELETE /api/users/{id}`: Delete user (Admin only)

### Time Entries
- `GET /api/timeentries`: Get all time entries (Admin/Manager only)
- `GET /api/timeentries/user/{userId}`: Get user's time entries
- `GET /api/timeentries/project/{projectId}`: Get project time entries
- `POST /api/timeentries`: Create a new time entry
- `PUT /api/timeentries/{id}`: Update time entry
- `DELETE /api/timeentries/{id}`: Delete time entry

### Projects
- `GET /api/projects`: Get all projects
- `GET /api/projects/{id}`: Get project by ID
- `POST /api/projects`: Create a new project (Admin/Manager only)
- `PUT /api/projects/{id}`: Update project (Admin/Manager only)
- `DELETE /api/projects/{id}`: Delete project (Admin only)

### Departments & Teams
- `GET /api/departments`: Get all departments
- `GET /api/teams`: Get all teams
- `GET /api/teams/{id}/members`: Get team members

### Notifications
- `GET /api/notifications/user`: Get user notifications
- `GET /api/notifications/user/unread`: Get unread notifications

## How to Run the TimeSheetAPI

1. Navigate to the TimeSheetAPI directory:
   ```
   cd TimeSheetAPI/TimeSheetAPI
   ```

2. Update the connection string in `appsettings.json` to point to your SQL Server instance

3. Run the following commands to create the database:
   ```
   dotnet ef database update
   ```

4. Run the application:
   ```
   dotnet run
   ```

5. Access the Swagger UI at `https://localhost:5001/swagger`

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/ebf48bcc-b954-46ad-a898-3d6bcad821fa) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
