import {Link} from '@tanstack/react-router';
import {useAuth} from '../contexts/AuthContext';
import {useDashboardStats} from '../hooks/useDashboardStats';
import Button from './ui/Button';
import Card from './ui/Card';
import ThemeToggle from './ui/ThemeToggle';

function StatCard({
  label,
  value,
  hint,
}: Readonly<{label: string; value: number | string; hint: string}>) {
  return (
    <Card className="w-full">
      <div className="text-xs uppercase tracking-wide text-text-tertiary font-serif">{label}</div>
      <div className="mt-2 text-4xl font-serif text-text-primary">{value}</div>
      <p className="mt-2 text-sm text-text-secondary font-serif italic">{hint}</p>
    </Card>
  );
}

export default function Dashboard() {
  const {user, signOut} = useAuth();
  const {data, isLoading, error} = useDashboardStats();

  return (
    <div className="ledger min-h-screen bg-background text-text-primary">
      <header className="sticky top-0 z-10 bg-surface-elevated/80 backdrop-blur border-b border-border w-full">
        <div className="w-full px-4 py-3 flex justify-center">
          <div className="flex items-center justify-between gap-3 w-full max-w-4xl">
            <div className="ledger-header">
              <h1 className="text-xl sm:text-2xl">Stock Book</h1>
              <div className="text-xs sm:text-sm text-text-secondary italic -mt-0.5 mb-1">
                Dashboard
              </div>
              <div className="double-rules">
                <div className="thick" />
                <div className="thin" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="secondary" onPress={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6">
        <section>
          <p className="text-sm text-text-secondary font-serif italic">
            Signed in{user?.email ? ` as ${user.email}` : ''}
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-serif">Inventory Overview</h2>
        </section>

        {error && (
          <Card className="border-error/30 bg-error/10">
            <p className="text-sm text-error font-serif">
              Could not load dashboard counts. Check that the server can connect to Postgres, then
              refresh this page.
            </p>
          </Card>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Books"
            value={isLoading ? '...' : data?.books ?? 0}
            hint="Total books scanned into your inventory."
          />
          <StatCard
            label="Groups"
            value={isLoading ? '...' : data?.groups ?? 0}
            hint="Catalog groups available for scanning and labels."
          />
          <StatCard
            label="Assigned"
            value={isLoading ? '...' : data?.assignedBooks ?? 0}
            hint="Books currently assigned to a group."
          />
        </section>

        <section className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/scanner"
            className="inline-flex items-center justify-center rounded border border-border bg-accent text-background px-4 py-3 font-serif hover:bg-accent-hover transition-colors"
          >
            Open Scanner
          </Link>
          <Link
            to="/example"
            className="inline-flex items-center justify-center rounded border border-border px-4 py-3 font-serif hover:bg-surface transition-colors"
          >
            Explore Demo
          </Link>
        </section>
      </main>
    </div>
  );
}
