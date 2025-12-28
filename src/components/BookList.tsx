import type {Book} from '../hooks/useBooks';
import type {Group} from '../hooks/useGroups';
import Button from './ui/Button';
import Card from './ui/Card';

interface BookListProps {
  items: Book[];
  groups: Group[];
  onMoveItem: (itemId: string, groupId: string) => void;
  onRemoveItem: (itemId: string) => void;
}

export default function BookList({items, groups, onMoveItem, onRemoveItem}: BookListProps) {
  return (
    <Card className="w-full">
      <h2 className="font-semibold mb-3 text-text-primary">Scanned Books</h2>
      <div className="max-h-[60vh] overflow-auto divide-y divide-border">
        {items.map((it) => (
          <div key={it.id} className="py-3 flex flex-col sm:flex-row sm:items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate text-text-primary">{it.title || 'Untitled'}</div>
              <div className="text-sm text-text-secondary truncate">
                {it.authors?.join(', ') || 'Unknown author'}
              </div>
              <div className="text-xs text-text-tertiary">ISBN: {it.isbn}</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={it.group_id || 'UNASSIGNED'}
                onChange={(e) =>
                  onMoveItem(it.id, e.target.value === 'UNASSIGNED' ? '' : e.target.value)
                }
                className="border border-border rounded-md text-sm px-3 py-2 min-h-[44px] bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
                <option value="UNASSIGNED">Unassigned</option>
              </select>
              <Button variant="secondary" onPress={() => onRemoveItem(it.id)}>
                Remove
              </Button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="py-12 text-center text-text-tertiary">
            No books yet. Scan a barcode or paste an ISBN.
          </div>
        )}
      </div>
    </Card>
  );
}
