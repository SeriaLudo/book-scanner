import {useState} from 'react';
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
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-2xl md:text-3xl font-extrabold text-text-primary">
            {isSignUp ? 'Create your account' : 'Sign in to Book Scanner'}
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary">
            {isSignUp
              ? 'Or sign in if you already have an account'
              : "Or create an account if you don't have one"}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
              isDisabled={loading}
              className="w-full text-black dark:text-white"
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
      </div>
    </div>
  );
}
