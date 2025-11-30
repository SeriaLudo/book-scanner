import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useAuth} from '../contexts/AuthContext';
import {supabase} from '../lib/supabase';

export interface Group {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export function useGroups() {
  const {user} = useAuth();
  const queryClient = useQueryClient();

  const {data: groups = [], isLoading} = useQuery({
    queryKey: ['groups', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const {data, error} = await supabase
        .from('groups')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', {ascending: true});

      if (error) throw error;
      return (data as Group[]) || [];
    },
    enabled: !!user,
  });

  const createGroup = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('Not authenticated');

      const {data, error} = await supabase
        .from('groups')
        .insert({user_id: user.id, name})
        .select()
        .single();

      if (error) throw error;
      return data as Group;
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: ['groups', user?.id]});
    },
  });

  const updateGroup = useMutation({
    mutationFn: async ({id, name}: {id: string; name: string}) => {
      const {data, error} = await supabase
        .from('groups')
        .update({name, updated_at: new Date().toISOString()})
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Group;
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: ['groups', user?.id]});
    },
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
      const {error} = await supabase.from('groups').delete().eq('id', id);
      if (error) throw error;
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
