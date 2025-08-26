import { saveTimeEntry, saveProject, saveProduct, saveDepartment, saveTeam, generateId } from '../services/storage';
import { getCurrentUser, getAllUsers } from '../lib/auth';
import { TimeEntry, Project, Product, Department, ProjectDetail, Team } from '../validation';

export const initializeSampleData = () => {
  // Clear existing data to ensure fresh initialization
  localStorage.removeItem('projects');
  localStorage.removeItem('products');
  localStorage.removeItem('departments');
  localStorage.removeItem('timeEntries');
  localStorage.removeItem('teams');
  
  console.log('Clearing existing data and reinitializing...');

  const users = getAllUsers();
  const currentUser = getCurrentUser();

  console.log('Current user:', currentUser);
  console.log('Available users:', users.map(u => ({ id: u.id, name: u.name, role: u.role })));

  // Sample Projects
  const projectId1 = 'sample-project-1';
  const projectId2 = 'sample-project-2';
  const sampleProjects: Project[] = [
    {
      id: projectId1,
      name: 'Mobile App Development',
      description: 'Development of mobile application for client',
      projectType: 'Time and Material',
      clientName: 'Mobile Corp',
      clientEmail: 'contact@mobilecorp.com',
      isBillable: true,
      createdBy: currentUser?.id || '1',
      createdAt: new Date().toISOString()
    },
    {
      id: projectId2,
      name: 'Web Platform',
      description: 'Web-based platform development',
      projectType: 'Fixed Cost',
      clientName: 'Web Solutions',
      clientEmail: 'info@websolutions.com',
      isBillable: true,
      createdBy: currentUser?.id || '1',
      createdAt: new Date().toISOString()
    }
  ];

  // Sample Products
  const productId1 = 'sample-product-1';
  const productId2 = 'sample-product-2';
  const sampleProducts: Product[] = [
    {
      id: productId1,
      name: 'Timesheet Software',
      productDescription: 'Internal timesheet management software',
      isBillable: false,
      createdBy: currentUser?.id || '1',
      createdAt: new Date().toISOString()
    },
    {
      id: productId2,
      name: 'Product Apple',
      productDescription: 'Apple product development',
      isBillable: true,
      createdBy: currentUser?.id || '1',
      createdAt: new Date().toISOString()
    }
  ];

  // Sample Departments
  const departmentId1 = 'sample-department-1';
  const sampleDepartments: Department[] = [
    {
      id: departmentId1,
      name: 'Engineering',
      departmentDescription: 'Software engineering and development department',
      isBillable: true,
      createdBy: currentUser?.id || '1',
      createdAt: new Date().toISOString()
    }
  ];

  // Sample Time Entries
  const sampleTimeEntries: TimeEntry[] = [
    {
      id: generateId(),
      userId: users[0].id, // CEO/Owner (current user)
      userName: users[0].name,
      date: new Date().toISOString().split('T')[0],
      clockIn: '09:00',
      clockOut: '17:00',
      breakTime: 60,
      totalHours: 7,
      billableHours: 6,
      actualHours: 7,
      availableHours: 8,
      task: 'Worked on implementing the new dashboard UI components and integrated them with the backend API',
      projectDetails: {
        category: 'project',
        name: 'Mobile App Development',
        task: 'UI Design Implementation',
        description: 'Implemented responsive dashboard with real-time data'
      },
      isBillable: true,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: generateId(),
      userId: users[3].id, // Employee
      userName: users[3].name,
      date: new Date().toISOString().split('T')[0],
      clockIn: '09:00',
      clockOut: '17:00',
      breakTime: 60,
      totalHours: 7,
      billableHours: 6,
      actualHours: 7,
      availableHours: 8,
      task: 'Worked on implementing the new dashboard UI components and integrated them with the backend API',
      projectDetails: {
        category: 'project',
        name: 'Mobile App Development',
        task: 'UI Design Implementation',
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
      billableHours: 7,
      actualHours: 7.5,
      availableHours: 8,
      task: 'Reviewed and approved budget allocations for Q4 projects and conducted financial analysis',
      projectDetails: {
        category: 'department',
        name: 'Engineering',
        task: 'Documentation',
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
      memberIds: [users[0].id, users[3].id], // CEO/Owner (John Mitchell) and Employee (Alice)
      leaderId: users[1].id, // Manager (Jane)
      associatedProjects: [projectId1, projectId2],
      associatedProducts: [],
      associatedDepartments: [],
      createdBy: users[0].id, // Owner
      createdAt: new Date().toISOString()
    },
    {
      id: generateId(),
      name: 'Product Development Team',
      description: 'Team working on product development and testing',
      memberIds: [users[0].id, users[2].id, users[3].id], // CEO/Owner, Finance Manager and Employee
      leaderId: users[1].id, // Manager
      associatedProjects: [],
      associatedProducts: [productId1, productId2],
      associatedDepartments: [],
      createdBy: users[0].id, // Owner
      createdAt: new Date().toISOString()
    },
    {
      id: generateId(),
      name: 'Engineering Department Team',
      description: 'Core engineering team handling department duties',
      memberIds: [users[0].id, users[2].id], // CEO/Owner and Finance Manager
      leaderId: users[1].id, // Manager
      associatedProjects: [],
      associatedProducts: [],
      associatedDepartments: [departmentId1],
      createdBy: users[0].id, // Owner
      createdAt: new Date().toISOString()
    }
  ];

  // Save all sample data
  console.log('Saving sample projects...');
  sampleProjects.forEach(project => saveProject(project));

  console.log('Saving sample products...');
  sampleProducts.forEach(product => saveProduct(product));

  console.log('Saving sample departments...');
  sampleDepartments.forEach(department => saveDepartment(department));

  console.log('Saving sample time entries...');
  sampleTimeEntries.forEach(entry => saveTimeEntry(entry));

  console.log('Saving sample teams...');
  sampleTeams.forEach(team => saveTeam(team));

  console.log('Sample data initialization completed successfully!');
  console.log(`Created ${sampleProjects.length} projects, ${sampleProducts.length} products, ${sampleDepartments.length} departments, ${sampleTimeEntries.length} time entries, and ${sampleTeams.length} teams.`);
};