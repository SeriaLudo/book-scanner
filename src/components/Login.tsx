import {Link} from '@tanstack/react-router';
import {useState} from 'react';
import {supabase} from '../lib/supabase';
import {useAuth} from '../contexts/AuthContext';
import Button from './ui/Button';
import TextField from './ui/TextField';
import ThemeToggle from './ui/ThemeToggle';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {signIn, signUp} = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        setError('Check your email to confirm your account!');
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ledger min-h-screen bg-background text-text-primary py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full space-y-8">
        <div className="ledger-header">
          <h1 className="text-2xl sm:text-3xl">Stock Book</h1>
          <div className="text-xs sm:text-sm text-text-secondary italic -mt-0.5 mb-1">
            {isSignUp ? 'Create your account' : 'Sign in to continue'}
          </div>
          <div className="double-rules">
            <div className="thick" />
            <div className="thin" />
          </div>
        </div>

        {!supabase && (
          <div className="rounded-md p-4 border bg-warning/10 text-warning border-warning/20 text-center">
            <p className="text-sm font-serif">
              Supabase is not configured. Sign-in is unavailable.
            </p>
          </div>
        )}

        <form className="mt-8 space-y-6 font-serif" onSubmit={handleSubmit}>
          {error && (
            <div
              className={`rounded-md p-4 border ${
                error.includes('Check your email')
                  ? 'bg-success/10 text-success border-success/20'
                  : 'bg-error/10 text-error border-error/20'
              }`}
            >
              <p className="text-sm">{error}</p>
            </div>
          )}
          <div className="space-y-4">
            <TextField
              type="email"
              label="Email address"
              placeholder="Email address"
              value={email}
              onChange={(value) => setEmail(value)}
              isRequired
              autoComplete="email"
            />
            <TextField
              type="password"
              label="Password"
              placeholder="Password"
              value={password}
              onChange={(value) => setPassword(value)}
              isRequired
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </div>

          <div>
            <Button
              type="submit"
              isDisabled={loading || !supabase}
              className="w-full"
            >
              {loading ? 'Loading...' : isSignUp ? 'Sign up' : 'Sign in'}
            </Button>
          </div>

          <div className="text-center">
            <Button
              variant="ghost"
              onPress={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-sm"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </Button>
          </div>
        </form>

        <div className="text-center pt-2 border-t border-border">
          <Link
            to="/example"
            className="inline-block text-sm text-text-secondary hover:text-text-primary underline underline-offset-2 font-serif italic transition-colors"
          >
            Explore Demo →
          </Link>
        </div>
      </div>
    </div>
  );
}
