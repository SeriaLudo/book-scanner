import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useAuth} from '../contexts/AuthContext';
import {supabase} from '../lib/supabase';

export interface Book {
  id: string;
  user_id: string;
  isbn: string;
  title: string;
  authors: string[];
  group_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookInsert {
  isbn: string;
  title: string;
  authors: string[];
  group_id?: string | null;
}

export function useBooks(groupId?: string | null) {
  const {user} = useAuth();
  const queryClient = useQueryClient();

  const {data: books = [], isLoading} = useQuery({
    queryKey: ['books', user?.id, groupId],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', {ascending: false});

      if (groupId) {
        query = query.eq('group_id', groupId);
      }

      const {data, error} = await query;

      if (error) throw error;
      return (data as Book[]) || [];
    },
    enabled: !!user,
  });

  const addBook = useMutation({
    mutationFn: async (book: BookInsert) => {
      if (!user) throw new Error('Not authenticated');

      const {data, error} = await supabase
        .from('books')
        .insert({
          user_id: user.id,
          isbn: book.isbn,
          title: book.title,
          authors: book.authors,
          group_id: book.group_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Book;
    },
    onSettled: () => {
      // Invalidate all book queries for this user
      queryClient.invalidateQueries({queryKey: ['books', user?.id]});
      // Also invalidate groups since book count might have changed
      queryClient.invalidateQueries({queryKey: ['groups', user?.id]});
    },
  });

  const updateBook = useMutation({
    mutationFn: async ({id, groupId}: {id: string; groupId: string | null}) => {
      const {data, error} = await supabase
        .from('books')
        .update({group_id: groupId, updated_at: new Date().toISOString()})
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Book;
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: ['books', user?.id]});
      queryClient.invalidateQueries({queryKey: ['groups', user?.id]});
    },
  });

  const deleteBook = useMutation({
    mutationFn: async (id: string) => {
      const {error} = await supabase.from('books').delete().eq('id', id);
      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: ['books', user?.id]});
      queryClient.invalidateQueries({queryKey: ['groups', user?.id]});
    },
  });

  return {
    books,
    isLoading,
    addBook: addBook.mutateAsync,
    updateBook: updateBook.mutateAsync,
    deleteBook: deleteBook.mutateAsync,
    isAdding: addBook.isPending,
  };
}
