import {createRoute, createRouter, Link, useNavigate, useParams} from '@tanstack/react-router';
import React from 'react';
import ExamplePage from './components/ExamplePage';
import ProtectedRoute from './components/ProtectedRoute';
import ScannerInterface from './components/ScannerInterface';
import {useBooks} from './hooks/useBooks';
import {useGroups} from './hooks/useGroups';
import {rootRoute} from './routes/__root';

// Index page component - redirects to first group or scanner
function IndexPage() {
  const navigate = useNavigate();
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
}

// Create routes using code-based approach
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPage,
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

// Group page component - displays books for a specific group
function GroupPage() {
  const params = useParams({strict: false});
  const groupSlug = params.groupSlug as string;
  const {groups} = useGroups();
  const {books} = useBooks();

  const group = groups.find((g) => g.slug === groupSlug);
  const groupBooks = group ? books.filter((book) => book.group_id === group.id) : [];

  if (!group) {
    return (
      <div className="ledger min-h-screen bg-background text-text-primary p-4 flex items-center justify-center">
        <div className="text-center font-serif">
          <h1 className="font-serif text-3xl mb-4">Group not found</h1>
          <Link to="/" className="text-accent hover:underline italic">
            ← Back to Stock Book
          </Link>
        </div>
      </div>
    );
  }

  const CONDITIONS = ['Fine', 'Very Good', 'Good', 'Fair', 'Poor'] as const;
  const FORMATS = ['Hardcover', 'Paperback', 'Trade Paperback', 'Mass Market Paperback', 'Leather'] as const;

  function displayCondition(bookId: string): string {
    let hash = 0;
    for (let i = 0; i < bookId.length; i++) {
      hash = (hash << 5) - hash + bookId.charCodeAt(i);
      hash |= 0;
    }
    return CONDITIONS[Math.abs(hash) % CONDITIONS.length];
  }

  function displayFormat(bookId: string): string {
    let hash = 0;
    for (let i = 0; i < bookId.length; i++) {
      hash = (hash << 5) - hash + bookId.charCodeAt(i);
      hash |= 0;
    }
    return FORMATS[Math.abs(hash) % FORMATS.length];
  }

  return (
    <div className="ledger min-h-screen bg-background text-text-primary">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div className="ledger-header">
              <h1 className="text-2xl sm:text-3xl">{group.name}</h1>
              <div className="text-sm text-text-secondary italic -mt-0.5 mb-1">
                Group Catalogue
              </div>
              <div className="double-rules">
                <div className="thick" />
                <div className="thin" />
              </div>
            </div>
            <Link
              to="/"
              className="border border-border rounded px-3 py-1.5 text-sm font-serif hover:bg-surface transition-colors"
            >
              ← Scanner
            </Link>
          </div>
          <div className="mt-2 text-sm text-text-secondary font-serif">
            {groupBooks.length} volume{groupBooks.length === 1 ? '' : 's'}
          </div>
        </header>

        <table className="ledger-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author(s)</th>
              <th>ISBN</th>
              <th>Condition</th>
              <th>Format</th>
            </tr>
          </thead>
          <tbody>
            {groupBooks.map((book) => {
              const cond = displayCondition(book.id);
              return (
                <tr key={book.id}>
                  <td data-label="Title"><span className="italic">{book.title}</span></td>
                  <td data-label="Author(s)">{book.authors?.join(', ') || 'Unknown'}</td>
                  <td data-label="ISBN" className="isbn">{book.isbn}</td>
                  <td data-label="Condition">
                    <span className={`condition cond-${cond.toLowerCase().replace(/\s+/g, '')}`}>{cond}</span>
                  </td>
                  <td data-label="Format" className="format">{displayFormat(book.id)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {groupBooks.length === 0 && (
          <div className="py-12 text-center text-text-tertiary font-serif italic">
            No books in this group yet.
          </div>
        )}

        {groupBooks.length > 0 && (
          <div className="ledger-footer">
            <span>No. {groupBooks.length} entries</span>
            <span className="total">Stock: {groupBooks.length} volume{groupBooks.length === 1 ? '' : 's'}</span>
          </div>
        )}
      </div>
    </div>
  );
}

const groupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/group/$groupSlug',
  component: GroupPage,
});

const exampleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/example',
  component: ExamplePage,
});

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  scannerRoute,
  scannerWithGroupRoute,
  groupRoute,
  exampleRoute,
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
