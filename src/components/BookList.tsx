interface BookItem {
  id: string;
  isbn: string;
  title: string;
  authors: string[];
  boxId?: string;
}

interface Box {
  id: string;
  name: string;
}

interface BookListProps {
  items: BookItem[];
  boxes: Box[];
  onMoveItem: (itemId: string, boxId: string) => void;
  onRemoveItem: (itemId: string) => void;
}

export default function BookList({items, boxes, onMoveItem, onRemoveItem}: BookListProps) {
  return (
    <div className="border rounded-xl p-2 sm:p-4 bg-white w-full">
      <h2 className="font-semibold mb-3">Scanned Books</h2>
      <div className="max-h-[60vh] overflow-auto divide-y">
        {items.map((it) => (
          <div key={it.id} className="py-3 flex flex-col sm:flex-row sm:items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{it.title || 'Untitled'}</div>
              <div className="text-sm text-gray-600 truncate">
                {it.authors?.join(', ') || 'Unknown author'}
              </div>
              <div className="text-xs text-gray-500">ISBN: {it.isbn}</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={it.boxId || 'UNASSIGNED'}
                onChange={(e) => onMoveItem(it.id, e.target.value)}
                className="border rounded-md text-sm px-3 py-2 min-h-[44px]"
              >
                {boxes.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
                <option value="UNASSIGNED">Unassigned</option>
              </select>
              <button
                onClick={() => onRemoveItem(it.id)}
                className="text-sm px-3 py-2 border rounded-md font-medium min-h-[44px]"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            No books yet. Scan a barcode or paste an ISBN.
          </div>
        )}
      </div>
    </div>
  );
}
