import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useAuth} from '../contexts/AuthContext';
import {apiRequest} from '../lib/api';
import type {BookCondition, BookFormat} from '../lib/inventory';

export interface Book {
  id: string;
  user_id: string;
  isbn: string;
  title: string;
  authors: string[];
  group_id: string | null;
  condition: BookCondition;
  format: BookFormat;
  created_at: string;
  updated_at: string;
}

export interface BookInsert {
  isbn: string;
  title: string;
  authors: string[];
  group_id?: string | null;
  condition?: BookCondition;
  format?: BookFormat;
}

export function useBooks(groupId?: string | null) {
  const {user, getToken} = useAuth();
  const queryClient = useQueryClient();

  const {data: books = [], isLoading} = useQuery({
    queryKey: ['books', user?.id, groupId],
    queryFn: async () => {
      if (!user) return [];

      const query = groupId ? `?group_id=${encodeURIComponent(groupId)}` : '';
      return apiRequest<Book[]>(`/api/books${query}`, {token: await getToken()});
    },
    enabled: !!user,
  });

  const addBook = useMutation({
    mutationFn: async (book: BookInsert) => {
      if (!user) throw new Error('Not authenticated');

      return apiRequest<Book>('/api/books', {
        method: 'POST',
        token: await getToken(),
        body: {
          isbn: book.isbn,
          title: book.title,
          authors: book.authors,
          group_id: book.group_id || null,
          condition: book.condition,
          format: book.format,
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
    mutationFn: async ({
      id,
      groupId,
      condition,
      format,
    }: {
      id: string;
      groupId?: string | null;
      condition?: BookCondition;
      format?: BookFormat;
    }) => {
      return apiRequest<Book>(`/api/books/${id}`, {
        method: 'PATCH',
        token: await getToken(),
        body: {
          ...(groupId !== undefined ? {group_id: groupId} : {}),
          ...(condition ? {condition} : {}),
          ...(format ? {format} : {}),
        },
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: ['books', user?.id]});
      queryClient.invalidateQueries({queryKey: ['groups', user?.id]});
    },
  });

  const deleteBook = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest<void>(`/api/books/${id}`, {
        method: 'DELETE',
        token: await getToken(),
      });
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
