import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useAuth} from '../contexts/AuthContext';
import {supabase} from '../lib/supabase';

// Helper to handle auth errors
function getClient() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

async function handleAuthError(error: any) {
  if (
    error?.code === 'PGRST301' ||
    error?.message?.includes('JWT') ||
    error?.message?.includes('refresh_token')
  ) {
    await getClient().auth.signOut();
  }
}

export interface Group {
  id: string;
  user_id: string;
  name: string;
  slug: string;
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

      const client = getClient();
      const {data, error} = await client
        .from('groups')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', {ascending: true});

      if (error) {
        await handleAuthError(error);
        throw error;
      }
      return (data as Group[]) || [];
    },
    enabled: !!user,
  });

  const createGroup = useMutation({
    mutationFn: async ({name, slug}: {name: string; slug: string}) => {
      if (!user) throw new Error('Not authenticated');

      const client = getClient();
      const {data, error} = await client
        .from('groups')
        .insert({user_id: user.id, name, slug})
        .select()
        .single();

      if (error) {
        await handleAuthError(error);
        throw error;
      }
      return data as Group;
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: ['groups', user?.id]});
    },
  });

  const updateGroup = useMutation({
    mutationFn: async ({id, name}: {id: string; name: string}) => {
      const client = getClient();
      const {data, error} = await client
        .from('groups')
        .update({name, updated_at: new Date().toISOString()})
        .eq('id', id)
        .select()
        .single();

      if (error) {
        await handleAuthError(error);
        throw error;
      }
      return data as Group;
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: ['groups', user?.id]});
    },
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
      const client = getClient();
      const {error} = await client.from('groups').delete().eq('id', id);
      if (error) {
        await handleAuthError(error);
        throw error;
      }
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
