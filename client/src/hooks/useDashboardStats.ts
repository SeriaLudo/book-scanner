import {useQuery} from '@tanstack/react-query';
import {useAuth} from '../contexts/AuthContext';
import {apiRequest} from '../lib/api';

export interface DashboardStats {
  books: number;
  groups: number;
  assignedBooks: number;
}

export function useDashboardStats() {
  const {user, getToken} = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      return apiRequest<DashboardStats>('/api/dashboard', {token: await getToken()});
    },
    enabled: !!user,
  });
}
