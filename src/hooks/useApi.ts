import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { 
  timeEntriesService, 
  projectsService, 
  teamsService, 
  usersService,
  TimeEntry,
  Project,
  Team,
  User 
} from '@/services/apiService';

// Time Entries Hooks
export const useTimeEntries = () => {
  const { accessToken } = useAuth();
  
  return useQuery({
    queryKey: ['timeEntries'],
    queryFn: () => timeEntriesService.getAll(accessToken!),
    enabled: !!accessToken,
  });
};

export const useTimeEntry = (id: string) => {
  const { accessToken } = useAuth();
  
  return useQuery({
    queryKey: ['timeEntry', id],
    queryFn: () => timeEntriesService.getById(id, accessToken!),
    enabled: !!accessToken && !!id,
  });
};

export const useCreateTimeEntry = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  
  return useMutation({
    mutationFn: (timeEntry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) =>
      timeEntriesService.create(timeEntry, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    },
  });
};

export const useUpdateTimeEntry = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TimeEntry> }) =>
      timeEntriesService.update(id, data, accessToken!),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['timeEntry', id] });
    },
  });
};

export const useDeleteTimeEntry = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  
  return useMutation({
    mutationFn: (id: string) => timeEntriesService.delete(id, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    },
  });
};

export const useTimeEntriesByDate = (date: string) => {
  const { accessToken } = useAuth();
  
  return useQuery({
    queryKey: ['timeEntries', 'date', date],
    queryFn: () => timeEntriesService.getByDate(date, accessToken!),
    enabled: !!accessToken && !!date,
  });
};

export const useTimeEntriesByUser = (userId: string) => {
  const { accessToken } = useAuth();
  
  return useQuery({
    queryKey: ['timeEntries', 'user', userId],
    queryFn: () => timeEntriesService.getByUser(userId, accessToken!),
    enabled: !!accessToken && !!userId,
  });
};

export const useTimeEntriesByProject = (projectId: string) => {
  const { accessToken } = useAuth();
  
  return useQuery({
    queryKey: ['timeEntries', 'project', projectId],
    queryFn: () => timeEntriesService.getByProject(projectId, accessToken!),
    enabled: !!accessToken && !!projectId,
  });
};

export const useSearchTimeEntries = (query: string) => {
  const { accessToken } = useAuth();
  
  return useQuery({
    queryKey: ['timeEntries', 'search', query],
    queryFn: () => timeEntriesService.search(query, accessToken!),
    enabled: !!accessToken && !!query,
  });
};

// Projects Hooks
export const useProjects = () => {
  const { accessToken } = useAuth();
  
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsService.getAll(accessToken!),
    enabled: !!accessToken,
  });
};

export const useProject = (id: string) => {
  const { accessToken } = useAuth();
  
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsService.getById(id, accessToken!),
    enabled: !!accessToken && !!id,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  
  return useMutation({
    mutationFn: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) =>
      projectsService.create(project, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      projectsService.update(id, data, accessToken!),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  
  return useMutation({
    mutationFn: (id: string) => projectsService.delete(id, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

// Teams Hooks
export const useTeams = () => {
  const { accessToken } = useAuth();
  
  return useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsService.getAll(accessToken!),
    enabled: !!accessToken,
  });
};

export const useTeam = (id: string) => {
  const { accessToken } = useAuth();
  
  return useQuery({
    queryKey: ['team', id],
    queryFn: () => teamsService.getById(id, accessToken!),
    enabled: !!accessToken && !!id,
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  
  return useMutation({
    mutationFn: (team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) =>
      teamsService.create(team, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

export const useUpdateTeam = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Team> }) =>
      teamsService.update(id, data, accessToken!),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team', id] });
    },
  });
};

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  
  return useMutation({
    mutationFn: (id: string) => teamsService.delete(id, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

// Users Hooks
export const useUsers = () => {
  const { accessToken } = useAuth();
  
  return useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getAll(accessToken!),
    enabled: !!accessToken,
  });
};

export const useUser = (id: string) => {
  const { accessToken } = useAuth();
  
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => usersService.getById(id, accessToken!),
    enabled: !!accessToken && !!id,
  });
};
