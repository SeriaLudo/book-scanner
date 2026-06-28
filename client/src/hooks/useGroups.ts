import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useAuth} from '../contexts/AuthContext';
import {apiRequest} from '../lib/api';

export interface Group {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export function useGroups() {
  const {user, getToken} = useAuth();
  const queryClient = useQueryClient();

  const {data: groups = [], isLoading} = useQuery({
    queryKey: ['groups', user?.id],
    queryFn: async () => {
      if (!user) return [];

      return apiRequest<Group[]>('/api/groups', {token: await getToken()});
    },
    enabled: !!user,
  });

  const createGroup = useMutation({
    mutationFn: async ({name, slug}: {name: string; slug: string}) => {
      if (!user) throw new Error('Not authenticated');

      return apiRequest<Group>('/api/groups', {
        method: 'POST',
        token: await getToken(),
        body: {name, slug},
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: ['groups', user?.id]});
    },
  });

  const updateGroup = useMutation({
    mutationFn: async ({id, name}: {id: string; name: string}) => {
      return apiRequest<Group>(`/api/groups/${id}`, {
        method: 'PATCH',
        token: await getToken(),
        body: {name},
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: ['groups', user?.id]});
    },
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest<void>(`/api/groups/${id}`, {
        method: 'DELETE',
        token: await getToken(),
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: ['groups', user?.id]});
      // Also invalidate books since they might be orphaned
      queryClient.invalidateQueries({queryKey: ['books', user?.id]});
    },
  });

  return {
    groups,
    isLoading,
    createGroup: createGroup.mutateAsync,
    updateGroup: updateGroup.mutateAsync,
    deleteGroup: deleteGroup.mutateAsync,
    isCreating: createGroup.isPending,
  };
}
