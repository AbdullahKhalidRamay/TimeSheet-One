import { saveTimeEntry, saveProject, saveProduct, saveDepartment, saveTeam, generateId } from '../services/storage';
import { getCurrentUser, getAllUsers } from '../lib/auth';
import { TimeEntry, Project, Product, Department, ProjectDetail, Team } from '../validation';

export const initializeSampleData = () => {
  // Only initialize if no data exists
  const existingProjects = JSON.parse(localStorage.getItem('projects') || '[]');
  if (existingProjects.length > 0) return;

  const users = getAllUsers();
  const currentUser = getCurrentUser();

  // Sample Projects
  const projectId1 = generateId();
  const sampleProjects: Project[] = [
    {
      id: projectId1,
      name: 'Mobile App Development',
      isBillable: true,
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
  const productId1 = generateId();
  const sampleProducts: Product[] = [
    {
      id: productId1,
      name: 'Timesheet Software',
      isBillable: false,
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
  const departmentId1 = generateId();
  const sampleDepartments: Department[] = [
    {
      id: departmentId1,
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
              subduties: [
                { id: generateId(), name: 'Frontend Review', description: 'Review frontend code changes' },
                { id: generateId(), name: 'Backend Review', description: 'Review backend code changes' }
              ]
            },
            {
              id: generateId(),
              name: 'Documentation',
              description: 'Maintain technical documentation',
              subduties: [
                { id: generateId(), name: 'API Documentation', description: 'Document API endpoints' },
                { id: generateId(), name: 'User Guide', description: 'Write user documentation' }
              ]
            }
          ]
        }
      ],
      isBillable: true,
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

  // Sample Teams
  const sampleTeams: Team[] = [
    {
      id: generateId(),
      name: 'Frontend Development Team',
      description: 'Team responsible for frontend development tasks',
      memberIds: [users[3].id], // Employee (Alice)
      leaderId: users[1].id, // Manager (Jane)
      associatedProjects: [projectId1],
      associatedProducts: [],
      associatedDepartments: [],
      createdBy: users[0].id, // Owner
      createdAt: new Date().toISOString()
    },
    {
      id: generateId(),
      name: 'Product Development Team',
      description: 'Team working on product development and testing',
      memberIds: [users[2].id, users[3].id], // Finance Manager and Employee
      leaderId: users[1].id, // Manager
      associatedProjects: [],
      associatedProducts: [productId1],
      associatedDepartments: [],
      createdBy: users[0].id, // Owner
      createdAt: new Date().toISOString()
    },
    {
      id: generateId(),
      name: 'Engineering Department Team',
      description: 'Core engineering team handling department duties',
      memberIds: [users[2].id], // Finance Manager
      leaderId: users[1].id, // Manager
      associatedProjects: [],
      associatedProducts: [],
      associatedDepartments: [departmentId1],
      createdBy: users[0].id, // Owner
      createdAt: new Date().toISOString()
    }
  ];

  // Save sample data
  sampleProjects.forEach(saveProject);
  sampleProducts.forEach(saveProduct);
  sampleDepartments.forEach(saveDepartment);
  sampleTimeEntries.forEach(saveTimeEntry);
  sampleTeams.forEach(saveTeam);

  console.log('Sample data initialized successfully');
};