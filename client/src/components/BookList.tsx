import type {Book} from '../hooks/useBooks';
import type {Group} from '../hooks/useGroups';
import {
  BOOK_CONDITIONS,
  BOOK_FORMATS,
  getConditionLabel,
  getFormatLabel,
  type BookCondition,
  type BookFormat,
} from '../lib/inventory';
import Button from './ui/Button';

interface BookListProps {
  items: Book[];
  groups: Group[];
  onMoveItem: (itemId: string, groupId: string) => void;
  onUpdateItem: (itemId: string, values: {condition?: BookCondition; format?: BookFormat}) => void;
  onRemoveItem: (itemId: string) => void;
}

export default function BookList({
  items,
  groups,
  onMoveItem,
  onUpdateItem,
  onRemoveItem,
}: BookListProps) {
  return (
    <div className="w-full">
      <table className="ledger-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Author(s)</th>
            <th>ISBN</th>
            <th>Condition</th>
            <th>Format</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
              <tr key={it.id}>
                <td data-label="Title">
                  <span className="italic">{it.title || 'Untitled'}</span>
                </td>
                <td data-label="Author(s)">
                  {it.authors?.join(', ') || 'Unknown'}
                </td>
                <td data-label="ISBN" className="isbn">{it.isbn}</td>
                <td data-label="Condition">
                  <select
                    value={it.condition}
                    onChange={(e) =>
                      onUpdateItem(it.id, {condition: e.target.value as BookCondition})
                    }
                    className="border border-border rounded px-2 py-1.5 text-xs min-h-[36px] bg-surface text-text-primary font-serif focus:outline-none focus:ring-2 focus:ring-accent"
                    aria-label={`Condition for ${it.title}`}
                  >
                    {BOOK_CONDITIONS.map((condition) => (
                      <option key={condition.value} value={condition.value}>
                        {condition.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td data-label="Format" className="format">
                  <select
                    value={it.format}
                    onChange={(e) => onUpdateItem(it.id, {format: e.target.value as BookFormat})}
                    className="border border-border rounded px-2 py-1.5 text-xs min-h-[36px] bg-surface text-text-primary font-serif focus:outline-none focus:ring-2 focus:ring-accent"
                    aria-label={`Format for ${it.title}`}
                    title={getFormatLabel(it.format)}
                  >
                    {BOOK_FORMATS.map((format) => (
                      <option key={format.value} value={format.value}>
                        {format.label}
                      </option>
                    ))}
                  </select>
                  <span className="sr-only">{getConditionLabel(it.condition)}</span>
                </td>
                <td data-label="Actions">
                  <div className="flex flex-col sm:flex-row gap-1.5 min-w-0">
                    <select
                      value={it.group_id || 'UNASSIGNED'}
                      onChange={(e) =>
                        onMoveItem(it.id, e.target.value === 'UNASSIGNED' ? '' : e.target.value)
                      }
                      className="border border-border rounded px-2 py-1.5 text-xs min-h-[36px] bg-surface text-text-primary font-serif focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                      <option value="UNASSIGNED">Unassigned</option>
                    </select>
                    <Button variant="secondary" onPress={() => onRemoveItem(it.id)}>
                      Remove
                    </Button>
                  </div>
                </td>
              </tr>
          ))}
        </tbody>
      </table>

      {items.length === 0 && (
        <div className="py-12 text-center text-text-tertiary font-serif italic">
          No books yet. Scan a barcode or paste an ISBN.
        </div>
      )}

      {items.length > 0 && (
        <div className="ledger-footer">
          <span>No. {items.length} entries</span>
          <span className="total">Stock: {items.length} volume{items.length === 1 ? '' : 's'}</span>
        </div>
      )}
    </div>
  );
}
