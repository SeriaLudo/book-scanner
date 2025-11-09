# Supabase Integration Examples

## 1. Supabase Client Setup

### `src/lib/supabase.ts`

```typescript
import {createClient} from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types (can be generated with supabase gen types)
export type Database = {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      books: {
        Row: {
          id: string;
          user_id: string;
          isbn: string;
          title: string;
          authors: string[];
          group_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          isbn: string;
          title: string;
          authors?: string[];
          group_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          isbn?: string;
          title?: string;
          authors?: string[];
          group_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
```

## 2. Authentication Context

### `src/contexts/AuthContext.tsx`

```typescript
import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

## 3. Custom Hooks for Data

### `src/hooks/useGroups.ts`

```typescript
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {supabase} from '../lib/supabase';
import {useAuth} from '../contexts/AuthContext';

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
      return data;
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
      return data;
    },
    onSuccess: () => {
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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['groups', user?.id]});
    },
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
      const {error} = await supabase.from('groups').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['groups', user?.id]});
      queryClient.invalidateQueries({queryKey: ['books', user?.id]});
    },
  });

  return {
    groups,
    isLoading,
    createGroup: createGroup.mutateAsync,
    updateGroup: updateGroup.mutateAsync,
    deleteGroup: deleteGroup.mutateAsync,
  };
}
```

### `src/hooks/useBooks.ts`

```typescript
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {supabase} from '../lib/supabase';
import {useAuth} from '../contexts/AuthContext';

export function useBooks() {
  const {user} = useAuth();
  const queryClient = useQueryClient();

  const {data: books = [], isLoading} = useQuery({
    queryKey: ['books', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const {data, error} = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', {ascending: false});

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addBook = useMutation({
    mutationFn: async (book: {
      isbn: string;
      title: string;
      authors: string[];
      groupId?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const {data, error} = await supabase
        .from('books')
        .insert({
          user_id: user.id,
          isbn: book.isbn,
          title: book.title,
          authors: book.authors,
          group_id: book.groupId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['books', user?.id]});
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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['books', user?.id]});
    },
  });

  const deleteBook = useMutation({
    mutationFn: async (id: string) => {
      const {error} = await supabase.from('books').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['books', user?.id]});
    },
  });

  return {
    books,
    isLoading,
    addBook: addBook.mutateAsync,
    updateBook: updateBook.mutateAsync,
    deleteBook: deleteBook.mutateAsync,
  };
}
```

## 4. Updated App.tsx (Simplified Example)

```typescript
import { useAuth } from './contexts/AuthContext'
import { useGroups } from './hooks/useGroups'
import { useBooks } from './hooks/useBooks'

function App() {
  const { user, loading, signOut } = useAuth()
  const { groups, createGroup, updateGroup } = useGroups()
  const { books, addBook, updateBook, deleteBook } = useBooks()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <LoginScreen />
  }

  // Your existing UI, but now using hooks instead of localStorage
  return (
    <div>
      <header>
        <h1>Book Scanner</h1>
        <button onClick={signOut}>Sign Out</button>
      </header>
      {/* Rest of your UI */}
    </div>
  )
}
```

## 5. Future: eBay Listing Integration

### `src/hooks/useListings.ts`

```typescript
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {supabase} from '../lib/supabase';
import {useAuth} from '../contexts/AuthContext';

export function useListings() {
  const {user} = useAuth();
  const queryClient = useQueryClient();

  const createEbayListing = useMutation({
    mutationFn: async ({bookId, price}: {bookId: string; price: number}) => {
      if (!user) throw new Error('Not authenticated');

      // Call Supabase Edge Function
      const {data, error} = await supabase.functions.invoke('create-ebay-listing', {
        body: {
          bookId,
          price,
          condition: 'used',
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['listings', user?.id]});
      queryClient.invalidateQueries({queryKey: ['books', user?.id]});
    },
  });

  return {
    createEbayListing: createEbayListing.mutateAsync,
    isCreating: createEbayListing.isPending,
  };
}
```

### Usage in Component

```typescript
function BookItem({ book }: { book: Book }) {
  const { createEbayListing, isCreating } = useListings()

  const handleListOnEbay = async () => {
    try {
      const price = prompt('Enter price:')
      if (!price) return

      await createEbayListing({
        bookId: book.id,
        price: parseFloat(price),
      })
      alert('Listing created!')
    } catch (error) {
      alert('Error creating listing: ' + error.message)
    }
  }

  return (
    <div>
      <h3>{book.title}</h3>
      <button onClick={handleListOnEbay} disabled={isCreating}>
        {isCreating ? 'Creating...' : 'List on eBay'}
      </button>
    </div>
  )
}
```

## Key Differences from localStorage

1. **No manual persistence**: Data automatically syncs with database
2. **Real-time updates**: Can subscribe to changes (optional)
3. **Multi-device**: Works across devices automatically
4. **User isolation**: Each user sees only their data (via RLS)
5. **Type safety**: Full TypeScript support
6. **Optimistic updates**: React Query handles caching and updates

## Migration Strategy

1. **Keep localStorage as fallback**: During migration, you can sync both
2. **Gradual migration**: Migrate one feature at a time
3. **Data export**: Export existing localStorage data and import to Supabase
4. **Feature parity**: Ensure all features work before removing localStorage
