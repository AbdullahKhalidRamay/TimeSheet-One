// Utility function to reset all application data
// This can be called from browser console for testing purposes
export const resetAllAppData = (): void => {
  const keys = [
    'currentUser',
    'users', 
    'timeEntries',
    'projects',
    'products',
    'departments',
    'notifications',
    'approvalHistory',
    'teams',
    'userSettings',
    'userSession'
  ];
  
  keys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('All application data has been reset. Please refresh the page.');
  
  // Optionally reload the page
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
};

// Make it available globally for easy testing
if (typeof window !== 'undefined') {
  (window as typeof window & { resetAllAppData: typeof resetAllAppData }).resetAllAppData = resetAllAppData;
}
