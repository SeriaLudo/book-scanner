interface BookItem {
  id: string;
  isbn: string;
  title: string;
  authors: string[];
  groupId?: string;
}

interface Group {
  id: string;
  name: string;
}

interface GroupManagerProps {
  groups: Group[];
  activeGroupId: string;
  onGroupSelect: (groupId: string) => void;
  onRenameGroup: (id: string, name: string) => void;
  onClearGroup: (id: string) => void;
  itemsByGroup: Map<string, BookItem[]>;
}

export default function GroupManager({
  groups,
  activeGroupId,
  onGroupSelect,
  onRenameGroup,
  onClearGroup,
  itemsByGroup,
}: GroupManagerProps) {
  return (
    <div className="border rounded-xl p-2 sm:p-4 bg-white w-full">
      <h2 className="font-semibold mb-3">Groups</h2>
      <div className="flex flex-wrap gap-2">
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => onGroupSelect(g.id)}
            className={`px-4 py-2 rounded-full border font-medium min-h-[44px] ${
              activeGroupId === g.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white'
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-3">
        {groups.map((g) => (
          <div key={g.id} className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs text-gray-500 w-16 flex-shrink-0">{g.id}</span>
            <input
              value={g.name}
              onChange={(e) => onRenameGroup(g.id, e.target.value)}
              className="px-3 py-2 border rounded-md flex-1 min-h-[44px] text-base"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {itemsByGroup.get(g.id)?.length || 0} items
              </span>
              <button
                onClick={() => onClearGroup(g.id)}
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
