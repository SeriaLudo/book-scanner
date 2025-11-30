import {createRoute, createRouter, Link} from '@tanstack/react-router';
import React from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import ScannerInterface from './components/ScannerInterface';
import {useBooks} from './hooks/useBooks';
import {useGroups} from './hooks/useGroups';
import {rootRoute} from './routes/__root';

// Create routes using code-based approach
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => {
    const navigate = indexRoute.useNavigate();
    const {groups} = useGroups();

    // Redirect to first group if groups exist, otherwise stay on scanner
    React.useEffect(() => {
      if (groups.length > 0) {
        navigate({to: '/scanner/$groupSlug', params: {groupSlug: groups[0].slug}});
      } else {
        navigate({to: '/scanner'});
      }
    }, [groups, navigate]);

    return null;
  },
});

const scannerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scanner',
  component: () => (
    <ProtectedRoute>
      <ScannerInterface />
    </ProtectedRoute>
  ),
});

const scannerWithGroupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scanner/$groupSlug',
  component: () => (
    <ProtectedRoute>
      <ScannerInterface />
    </ProtectedRoute>
  ),
});

const groupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/group/$groupSlug',
  component: () => {
    const {groupSlug} = groupRoute.useParams();
    const {groups} = useGroups();
    const {books} = useBooks();

    const group = groups.find((g) => g.slug === groupSlug);
    const groupBooks = group ? books.filter((book) => book.group_id === group.id) : [];

    if (!group) {
      return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-4 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Group not found</h1>
            <Link to="/" className="text-blue-600 hover:underline">
              ← Back to Scanner
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">{group.name}</h1>
              <Link to="/" className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                ← Back to Scanner
              </Link>
            </div>

            <div className="mb-4">
              <span className="text-lg text-gray-600">
                {groupBooks.length} item{groupBooks.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="grid gap-4">
              {groupBooks.map((book) => (
                <div key={book.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg">{book.title}</h3>
                  <p className="text-gray-600">ISBN: {book.isbn}</p>
                  {book.authors.length > 0 && (
                    <p className="text-sm text-gray-500">by {book.authors.join(', ')}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  },
});

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  scannerRoute,
  scannerWithGroupRoute,
  groupRoute,
]);

// Create the router
export const router = createRouter({
  routeTree,
  basepath: '/book-scanner/',
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
