import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {createRootRoute, Outlet} from '@tanstack/react-router';
import {TanStackRouterDevtools} from '@tanstack/router-devtools';
import {AuthProvider} from '../contexts/AuthContext';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export const rootRoute = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 text-gray-900">
          <Outlet />
          <TanStackRouterDevtools />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  ),
});
