import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useAuth} from '../contexts/AuthContext';
import {apiRequest} from '../lib/api';

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
  const {user, getIdToken} = useAuth();
  const queryClient = useQueryClient();

  const {data: books = [], isLoading} = useQuery({
    queryKey: ['books', user?.id, groupId],
    queryFn: async () => {
      if (!user) return [];
      const token = await getIdToken();
      const query = groupId ? `?groupId=${encodeURIComponent(groupId)}` : '';
      return apiRequest<Book[]>(`/api/books${query}`, {token});
    },
    enabled: !!user,
  });

  const addBook = useMutation({
    mutationFn: async (book: BookInsert) => {
      if (!user) throw new Error('Not authenticated');
      const token = await getIdToken();
      return apiRequest<Book>('/api/books', {
        method: 'POST',
        token,
        body: {
          isbn: book.isbn,
          title: book.title,
          authors: book.authors,
          group_id: book.group_id || null,
        },
      });
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
      const token = await getIdToken();
      return apiRequest<Book>(`/api/books/${id}`, {
        method: 'PATCH',
        token,
        body: {group_id: groupId},
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: ['books', user?.id]});
      queryClient.invalidateQueries({queryKey: ['groups', user?.id]});
    },
  });

  const deleteBook = useMutation({
    mutationFn: async (id: string) => {
      const token = await getIdToken();
      await apiRequest<void>(`/api/books/${id}`, {method: 'DELETE', token});
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
