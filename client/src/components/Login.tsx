import {SignIn, SignUp} from '@clerk/clerk-react';
import {Link, useNavigate} from '@tanstack/react-router';
import {useEffect} from 'react';
import {useAuth} from '../contexts/AuthContext';
import ThemeToggle from './ui/ThemeToggle';

interface LoginProps {
  mode?: 'sign-in' | 'sign-up';
}

export default function Login({mode = 'sign-in'}: Readonly<LoginProps>) {
  const isSignUp = mode === 'sign-up';
  const {user, loading} = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate({to: '/dashboard'});
    }
  }, [loading, navigate, user]);

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

        <div className="flex justify-center">
          {isSignUp ? (
            <SignUp routing="hash" signInUrl="/sign-in" />
          ) : (
            <SignIn routing="hash" signUpUrl="/sign-up" />
          )}
        </div>

        <div className="text-center">
          <Link
            to={isSignUp ? '/sign-in' : '/sign-up'}
            className="inline-block text-sm text-text-secondary hover:text-text-primary underline underline-offset-2 font-serif italic transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </Link>
        </div>

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
