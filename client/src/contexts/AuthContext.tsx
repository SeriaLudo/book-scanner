import {
  useAuth as useClerkAuth,
  useClerk,
  useUser,
} from '@clerk/clerk-react';
import {createContext, useContext} from 'react';

interface AppUser {
  id: string;
  email: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const {isLoaded, user: clerkUser} = useUser();
  const {getToken} = useClerkAuth();
  const {signOut: clerkSignOut} = useClerk();
  const user =
    isLoaded && clerkUser
      ? {
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
        }
      : null;

  return (
    <AuthContext.Provider
      value={{user, loading: !isLoaded, signOut: clerkSignOut, getToken}}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
