import {Link} from '@tanstack/react-router';
import BookList from './BookList';
import ThemeToggle from './ui/ThemeToggle';

const DUMMY_BOOKS = [
  {id: '1', isbn: '978-0-141-18263-6', title: 'The Great Gatsby', authors: ['F. Scott Fitzgerald'], group_id: 'g1'},
  {id: '2', isbn: '978-0-06-112008-4', title: 'To Kill a Mockingbird', authors: ['Harper Lee'], group_id: 'g1'},
  {id: '3', isbn: '978-0-06-088328-7', title: 'One Hundred Years of Solitude', authors: ['Gabriel García Márquez'], group_id: 'g1'},
  {id: '4', isbn: '978-0-09-951847-3', title: 'Brave New World', authors: ['Aldous Huxley'], group_id: 'g2'},
  {id: '5', isbn: '978-0-316-76953-2', title: 'The Catcher in the Rye', authors: ['J. D. Salinger'], group_id: 'g2'},
  {id: '6', isbn: '978-0-14-143951-8', title: 'Pride and Prejudice', authors: ['Jane Austen'], group_id: 'g1'},
  {id: '7', isbn: '978-0-385-33412-4', title: 'Slaughterhouse-Five', authors: ['Kurt Vonnegut'], group_id: 'g2'},
  {id: '8', isbn: '978-1-4000-3341-5', title: 'Beloved', authors: ['Toni Morrison'], group_id: 'g1'},
  {id: '9', isbn: '978-0-547-92822-7', title: 'The Hobbit', authors: ['J. R. R. Tolkien'], group_id: 'g3'},
  {id: '10', isbn: '978-0-14-118358-1', title: 'Ficciones', authors: ['Jorge Luis Borges'], group_id: 'g2'},
  {id: '11', isbn: '978-0-14-018891-8', title: 'The Stranger', authors: ['Albert Camus'], group_id: 'g3'},
  {id: '12', isbn: '978-0-14-044926-6', title: 'Crime and Punishment', authors: ['Fyodor Dostoevsky'], group_id: 'g1'},
  {id: '13', isbn: '978-0-14-243724-7', title: 'Moby-Dick', authors: ['Herman Melville'], group_id: 'g3'},
  {id: '14', isbn: '978-0-14-118776-3', title: 'Lolita', authors: ['Vladimir Nabokov'], group_id: 'g2'},
  {id: '15', isbn: '978-0-14-028567-5', title: 'The Unbearable Lightness of Being', authors: ['Milan Kundera'], group_id: 'g3'},
];

const DUMMY_GROUPS = [
  {id: 'g1', name: 'Fiction Classics', slug: 'fiction-classics', user_id: 'demo', created_at: '', updated_at: ''},
  {id: 'g2', name: 'Modern Literature', slug: 'modern-literature', user_id: 'demo', created_at: '', updated_at: ''},
  {id: 'g3', name: 'Philosophy & Adventure', slug: 'philosophy-adventure', user_id: 'demo', created_at: '', updated_at: ''},
];

function noop() {}

export default function ExamplePage() {
  return (
    <div className="ledger min-h-screen bg-background text-text-primary overflow-x-hidden flex flex-col items-center">
      <header className="sticky top-0 z-10 bg-surface-elevated/80 backdrop-blur border-b border-border w-full">
        <div className="w-full px-2 py-2 sm:py-3 flex justify-center">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full max-w-4xl">
            <div className="flex-1 ledger-header">
              <h1 className="text-xl sm:text-2xl">Stock Book</h1>
              <div className="text-xs sm:text-sm text-text-secondary italic -mt-0.5 mb-1">
                Demo — No Backend Required
              </div>
              <div className="double-rules">
                <div className="thick" />
                <div className="thin" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ThemeToggle />
              <Link
                to="/"
                className="border border-border rounded px-3 py-1.5 text-sm font-serif hover:bg-surface transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-2 py-2 sm:py-4 max-w-4xl">
        <div className="mb-4 flex flex-wrap gap-2">
          {DUMMY_GROUPS.map((g) => (
            <span
              key={g.id}
              className="border border-border rounded-full px-3 py-1 text-xs font-serif text-text-secondary"
            >
              {g.name}
            </span>
          ))}
        </div>

        <BookList
          items={DUMMY_BOOKS.map((b) => ({...b, user_id: 'demo', created_at: '', updated_at: ''}))}
          groups={DUMMY_GROUPS}
          onMoveItem={noop}
          onRemoveItem={noop}
        />

        <div className="mt-6 pt-4 border-t border-border text-center text-xs text-text-tertiary font-serif italic">
          This is a demonstration page using sample data. No backend connection is required.
        </div>
      </main>
    </div>
  );
}
