import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {createRootRoute, Outlet} from '@tanstack/react-router';
import {TanStackRouterDevtools} from '@tanstack/router-devtools';

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
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Outlet />
        <TanStackRouterDevtools />
      </div>
    </QueryClientProvider>
  ),
});
