import {Input} from 'react-aria-components';
import type {Book} from '../hooks/useBooks';
import type {Group} from '../hooks/useGroups';
import Button from './ui/Button';
import Card from './ui/Card';

interface GroupManagerProps {
  readonly groups: Group[];
  readonly activeGroupId: string;
  readonly onGroupSelect: (groupId: string) => void;
  readonly onRenameGroup: (id: string, name: string) => void;
  readonly onClearGroup: (id: string) => void;
  readonly itemsByGroup: Map<string, Book[]>;
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
    <Card className="w-full" padding="sm">
      <h2 className="font-semibold mb-3 text-text-primary">Groups</h2>
      <div className="flex flex-wrap gap-2">
        {groups.map((g) => (
          <Button
            key={g.id}
            onPress={() => onGroupSelect(g.id)}
            variant={activeGroupId === g.id ? 'primary' : 'secondary'}
            className={`px-4 py-2 rounded-full font-medium ${
              activeGroupId === g.id
                ? 'bg-accent text-white border-accent'
                : 'border-2 border-border'
            }`}
          >
            {g.name}
          </Button>
        ))}
      </div>
      <div className="mt-3 space-y-3">
        {groups.map((g) => (
          <div key={g.id} className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs text-text-tertiary w-16 shrink-0">{g.slug}</span>
            <Input
              value={g.name}
              onChange={(e) => onRenameGroup(g.id, e.target.value)}
              className="px-3 py-2 border border-border rounded-md flex-1 min-h-[44px] text-base bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-tertiary">
                {itemsByGroup.get(g.id)?.length || 0} items
              </span>
              <Button
                onPress={() => onClearGroup(g.id)}
                variant="secondary"
                className="text-sm px-3 py-2"
              >
                Clear
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
