interface Box {
  id: string;
  name: string;
}

interface BoxManagerProps {
  boxes: Box[];
  activeBoxId: string;
  onBoxSelect: (boxId: string) => void;
  onRenameBox: (id: string, name: string) => void;
  onClearBox: (id: string) => void;
  itemsByBox: Map<string, any[]>;
}

export default function BoxManager({
  boxes,
  activeBoxId,
  onBoxSelect,
  onRenameBox,
  onClearBox,
  itemsByBox,
}: BoxManagerProps) {
  return (
    <div className="border rounded-xl p-2 sm:p-4 bg-white w-full">
      <h2 className="font-semibold mb-3">Boxes</h2>
      <div className="flex flex-wrap gap-2">
        {boxes.map((b) => (
          <button
            key={b.id}
            onClick={() => onBoxSelect(b.id)}
            className={`px-4 py-2 rounded-full border font-medium min-h-[44px] ${
              activeBoxId === b.id
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white"
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-3">
        {boxes.map((b) => (
          <div
            key={b.id}
            className="flex flex-col sm:flex-row sm:items-center gap-2"
          >
            <span className="text-xs text-gray-500 w-16 flex-shrink-0">
              {b.id}
            </span>
            <input
              value={b.name}
              onChange={(e) => onRenameBox(b.id, e.target.value)}
              className="px-3 py-2 border rounded-md flex-1 min-h-[44px] text-base"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {itemsByBox.get(b.id)?.length || 0} items
              </span>
              <button
                onClick={() => onClearBox(b.id)}
                className="text-sm px-3 py-2 border rounded-md font-medium min-h-[44px]"
              >
                Clear
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
