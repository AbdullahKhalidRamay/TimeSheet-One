// Sample data script for testing
console.log('Adding sample time entries...');

// Sample time entries
const sampleTimeEntries = [
  {
    id: 'TE1',
    userId: '1',
    userName: 'John Mitchell',
    date: '2024-01-15',
    actualHours: 6,
    billableHours: 6,
    totalHours: 6,
    task: 'Development work on Project Alpha',
    projectDetails: {
      category: 'project',
      name: 'Project Alpha',
      level: 'Phase 1',
      task: 'Development',
      subtask: 'Frontend',
      description: 'Working on user interface components'
    },
    isBillable: true,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'TE2', 
    userId: '1',
    userName: 'John Mitchell',
    date: '2024-01-16',
    actualHours: 8,
    billableHours: 8,
    totalHours: 8,
    task: 'Testing and debugging',
    projectDetails: {
      category: 'project',
      name: 'Project Beta',
      level: 'Phase 2',
      task: 'Testing',
      subtask: 'Unit Tests',
      description: 'Creating unit tests for core functionality'
    },
    isBillable: true,
    status: 'approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'TE3',
    userId: '10',
    userName: 'Emily Wilson',
    date: '2024-01-15',
    actualHours: 7,
    billableHours: 5,
    totalHours: 7,
    task: 'Database optimization',
    projectDetails: {
      category: 'department',
      name: 'Department X',
      level: 'IT Support',
      task: 'Database Management',
      subtask: 'Performance Tuning',
      description: 'Optimizing database queries for better performance'
    },
    isBillable: false,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Add to localStorage
localStorage.setItem('timeEntries', JSON.stringify(sampleTimeEntries));
console.log('Sample time entries added successfully!');
