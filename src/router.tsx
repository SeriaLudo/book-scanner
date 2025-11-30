import {createRoute, createRouter, Link} from '@tanstack/react-router';
import ProtectedRoute from './components/ProtectedRoute';
import ScannerInterface from './components/ScannerInterface';
import {rootRoute} from './routes/__root';

// Create routes using code-based approach
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <ProtectedRoute>
      <ScannerInterface />
    </ProtectedRoute>
  ),
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

const groupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/group/$groupId',
  component: () => {
    const {groupId} = groupRoute.useParams();

    // Mock data for now - will be replaced with database queries
    const mockGroups = [
      {id: 'GROUP-1', name: 'Group 1'},
      {id: 'GROUP-2', name: 'Group 2'},
    ];

    const mockBooks = [
      {
        id: '1',
        isbn: '1234567890',
        title: 'Sample Book 1',
        authors: ['Author 1'],
        groupId: 'GROUP-1',
      },
      {
        id: '2',
        isbn: '0987654321',
        title: 'Sample Book 2',
        authors: ['Author 2'],
        groupId: 'GROUP-1',
      },
    ];

    const group = mockGroups.find((g) => g.id === groupId);
    const books = mockBooks.filter((book) => book.groupId === groupId);

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
                {books.length} item{books.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="grid gap-4">
              {books.map((book) => (
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
const routeTree = rootRoute.addChildren([indexRoute, scannerRoute, groupRoute]);

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
