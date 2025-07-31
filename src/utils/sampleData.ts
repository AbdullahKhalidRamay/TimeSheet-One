import { saveTimeEntry, saveProject, saveProduct, saveDepartment, generateId } from './storage';
import { getCurrentUser, getAllUsers } from './auth';
import { TimeEntry, Project, Product, Department, ProjectDetail } from '@/types';

export const initializeSampleData = () => {
  // Only initialize if no data exists
  const existingProjects = JSON.parse(localStorage.getItem('projects') || '[]');
  if (existingProjects.length > 0) return;

  const users = getAllUsers();
  const currentUser = getCurrentUser();

  // Sample Projects
  const sampleProjects: Project[] = [
    {
      id: generateId(),
      name: 'Mobile App Development',
      levels: [
        {
          id: generateId(),
          name: 'Frontend Development',
          tasks: [
            {
              id: generateId(),
              name: 'UI Design Implementation',
              description: 'Implement the user interface designs',
              subtasks: [
                { id: generateId(), name: 'Login Screen', description: 'Create login interface' },
                { id: generateId(), name: 'Dashboard', description: 'Build main dashboard' }
              ]
            },
            {
              id: generateId(),
              name: 'API Integration',
              description: 'Connect frontend with backend APIs',
              subtasks: [
                { id: generateId(), name: 'Authentication API', description: 'Integrate auth endpoints' },
                { id: generateId(), name: 'Data Sync', description: 'Implement data synchronization' }
              ]
            }
          ]
        },
        {
          id: generateId(),
          name: 'Backend Development',
          tasks: [
            {
              id: generateId(),
              name: 'Database Design',
              description: 'Design and implement database schema',
              subtasks: [
                { id: generateId(), name: 'User Tables', description: 'Create user-related tables' },
                { id: generateId(), name: 'Business Logic', description: 'Implement core business tables' }
              ]
            }
          ]
        }
      ],
      createdBy: 'System',
      createdAt: new Date().toISOString()
    }
  ];

  // Sample Products
  const sampleProducts: Product[] = [
    {
      id: generateId(),
      name: 'Timesheet Software',
      stages: [
        {
          id: generateId(),
          name: 'Development',
          tasks: [
            {
              id: generateId(),
              name: 'Feature Development',
              description: 'Build new features',
              subtasks: [
                { id: generateId(), name: 'Time Tracking', description: 'Implement time tracking functionality' },
                { id: generateId(), name: 'Reporting', description: 'Build reporting features' }
              ]
            }
          ]
        },
        {
          id: generateId(),
          name: 'Testing',
          tasks: [
            {
              id: generateId(),
              name: 'Quality Assurance',
              description: 'Test product quality',
              subtasks: [
                { id: generateId(), name: 'Unit Testing', description: 'Write and run unit tests' },
                { id: generateId(), name: 'Integration Testing', description: 'Test system integration' }
              ]
            }
          ]
        }
      ],
      createdBy: 'System',
      createdAt: new Date().toISOString()
    }
  ];

  // Sample Departments
  const sampleDepartments: Department[] = [
    {
      id: generateId(),
      name: 'Engineering',
      functions: [
        {
          id: generateId(),
          name: 'Software Development',
          duties: [
            {
              id: generateId(),
              name: 'Code Review',
              description: 'Review team code submissions',
              tasks: [
                { id: generateId(), name: 'Frontend Review', description: 'Review frontend code changes' },
                { id: generateId(), name: 'Backend Review', description: 'Review backend code changes' }
              ]
            },
            {
              id: generateId(),
              name: 'Documentation',
              description: 'Maintain technical documentation',
              tasks: [
                { id: generateId(), name: 'API Documentation', description: 'Document API endpoints' },
                { id: generateId(), name: 'User Guide', description: 'Write user documentation' }
              ]
            }
          ]
        }
      ],
      createdBy: 'System',
      createdAt: new Date().toISOString()
    }
  ];

  // Sample Time Entries
  const sampleTimeEntries: TimeEntry[] = [
    {
      id: generateId(),
      userId: users[3].id, // Employee
      userName: users[3].name,
      date: new Date().toISOString().split('T')[0],
      clockIn: '09:00',
      clockOut: '17:00',
      breakTime: 60,
      totalHours: 7,
      task: 'Worked on implementing the new dashboard UI components and integrated them with the backend API',
      projectDetails: {
        category: 'project',
        name: 'Mobile App Development',
        level: 'Frontend Development',
        task: 'UI Design Implementation',
        subtask: 'Dashboard',
        description: 'Implemented responsive dashboard with real-time data'
      },
      isBillable: true,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: generateId(),
      userId: users[2].id, // Finance Manager
      userName: users[2].name,
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
      clockIn: '08:30',
      clockOut: '16:30',
      breakTime: 30,
      totalHours: 7.5,
      task: 'Reviewed and approved budget allocations for Q4 projects and conducted financial analysis',
      projectDetails: {
        category: 'department',
        name: 'Engineering',
        level: 'Software Development',
        task: 'Documentation',
        subtask: 'Financial Reports',
        description: 'Quarterly financial review and budget planning'
      },
      isBillable: true,
      status: 'approved',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Save sample data
  sampleProjects.forEach(saveProject);
  sampleProducts.forEach(saveProduct);
  sampleDepartments.forEach(saveDepartment);
  sampleTimeEntries.forEach(saveTimeEntry);

  console.log('Sample data initialized successfully');
};