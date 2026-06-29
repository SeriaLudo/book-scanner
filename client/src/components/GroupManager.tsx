import {useState} from 'react';
import {Input} from 'react-aria-components';
import type {Book} from '../hooks/useBooks';
import type {Group} from '../hooks/useGroups';
import Button from './ui/Button';
import Card from './ui/Card';

interface GroupManagerProps {
  readonly groups: Group[];
  readonly activeGroupId: string;
  readonly onGroupSelect: (groupId: string) => void;
  readonly onRenameGroup: (id: string, name: string) => Promise<void>;
  readonly itemsByGroup: Map<string, Book[]>;
}

export default function GroupManager({
  groups,
  activeGroupId,
  onGroupSelect,
  onRenameGroup,
  itemsByGroup,
}: GroupManagerProps) {
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [savingGroupId, setSavingGroupId] = useState<string | null>(null);

  function startEditing(group: Group) {
    setEditingGroupId(group.id);
    setDraftName(group.name);
  }

  function cancelEditing() {
    setEditingGroupId(null);
    setDraftName('');
  }

  async function confirmEditing(group: Group) {
    const nextName = draftName.trim();

    if (!nextName || nextName === group.name) {
      cancelEditing();
      return;
    }

    setSavingGroupId(group.id);
    try {
      await onRenameGroup(group.id, nextName);
      cancelEditing();
    } catch {
      // The parent owns surfacing the error; keep the draft open for another attempt.
    } finally {
      setSavingGroupId(null);
    }
  }

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
        {groups.map((g) => {
          const isEditing = editingGroupId === g.id;
          const isSaving = savingGroupId === g.id;
          const itemCount = itemsByGroup.get(g.id)?.length || 0;
          const itemCountLabel = itemCount === 1 ? '1 item' : `${itemCount} items`;

          return (
            <div key={g.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[4rem_minmax(0,1fr)]">
              <span className="text-xs text-text-tertiary w-16 shrink-0">{g.slug}</span>
              <div className="min-w-0 space-y-2">
                {isEditing ? (
                  <Input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void confirmEditing(g);
                      }

                      if (e.key === 'Escape') {
                        cancelEditing();
                      }
                    }}
                    autoFocus
                    className="w-full min-w-0 px-3 py-2 border border-border rounded-md min-h-[44px] text-base bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                ) : (
                  <span className="block w-full min-w-0 px-3 py-2 border border-border rounded-md min-h-[44px] text-base bg-surface text-text-primary">
                    {g.name}
                  </span>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-text-tertiary">{itemCountLabel}</span>
                  {isEditing ? (
                    <>
                      <Button
                        onPress={() => void confirmEditing(g)}
                        isDisabled={isSaving || !draftName.trim()}
                        className="text-sm px-3 py-2"
                      >
                        OK
                      </Button>
                      <Button
                        onPress={cancelEditing}
                        variant="secondary"
                        isDisabled={isSaving}
                        className="text-sm px-3 py-2"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      onPress={() => startEditing(g)}
                      variant="secondary"
                      className="text-sm px-3 py-2"
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
