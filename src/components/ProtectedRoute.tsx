import {useAuth} from '../contexts/AuthContext';
import Login from './Login';

export default function ProtectedRoute({children}: {children: React.ReactNode}) {
  const {user, loading} = useAuth();

  if (loading) {
    return (
      <div className="ledger min-h-screen flex items-center justify-center bg-background text-text-primary font-serif">
        <div className="text-center">
          <div className="inline-block w-6 h-6 border-2 border-text-primary border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 italic text-text-secondary">Loading&hellip;</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <>{children}</>;
}
