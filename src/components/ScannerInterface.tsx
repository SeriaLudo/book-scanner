import {useNavigate, useParams} from '@tanstack/react-router';
import {useEffect, useMemo, useState} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useBooks, type Book} from '../hooks/useBooks';
import {useGroups} from '../hooks/useGroups';
import {downloadBlob} from '../utils/generalUtils';
import {normalizeISBN} from '../utils/scannerUtils';
import BookList from './BookList';
import GroupManager from './GroupManager';
import ISBNFetcher from './ISBNFetcher';
import PrintLabel from './PrintLabel';
import Scanner from './Scanner';
import Button from './ui/Button';
import Card from './ui/Card';
import ThemeToggle from './ui/ThemeToggle';

// Main Scanner Interface Component
function ScannerInterface() {
  const {user, signOut} = useAuth();
  const {books, updateBook, deleteBook} = useBooks();
  const {groups, createGroup, updateGroup} = useGroups();
  const navigate = useNavigate();
  const params = useParams({strict: false}) as {groupSlug?: string};

  // Get active group from URL or default to first group
  const activeGroup = useMemo(() => {
    if (params?.groupSlug) {
      return groups.find((g) => g.slug === params.groupSlug);
    }
    return groups[0] || null;
  }, [groups, params?.groupSlug]);

  const activeGroupId = activeGroup?.id || null;
  const [scanning, setScanning] = useState(false);
  const [manualISBN, setManualISBN] = useState('');
  const [status, setStatus] = useState<string>('');
  const [cameraPermission, setCameraPermission] = useState<
    'granted' | 'denied' | 'prompt' | 'unknown'
  >('unknown');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [currentISBN, setCurrentISBN] = useState<string | null>(null);
  const [isProcessingISBN, setIsProcessingISBN] = useState(false);

  // Navigate to first group if no group is selected
  useEffect(() => {
    if (groups.length > 0 && !params.groupSlug) {
      navigate({to: '/scanner/$groupSlug', params: {groupSlug: groups[0].slug}});
    }
  }, [groups, params.groupSlug, navigate]);

  async function handleScanned(raw: string) {
    const isbn = normalizeISBN(raw);
    if (!isbn) return;

    // If we're already processing an ISBN, ignore this scan
    if (isProcessingISBN) return;

    // Stop scanning and mark as processing
    setScanning(false);
    setIsProcessingISBN(true);

    addISBN(isbn);
  }

  function addISBN(isbn: string) {
    setCurrentISBN(isbn);
  }

  function handleFetchError(message: string) {
    setStatus(message);
  }

  function handleFetchSuccess(message: string) {
    setStatus(message);
    setScanning(false);
  }

  function handleFetchComplete() {
    setCurrentISBN(null);
    setIsProcessingISBN(false);
  }

  async function addGroup() {
    const nextIndex = groups.length + 1;
    const name = `Group ${nextIndex}`;
    const slug = `group-${nextIndex}`;
    try {
      const newGroup = await createGroup({name, slug});
      navigate({to: '/scanner/$groupSlug', params: {groupSlug: newGroup.slug}});
    } catch (error) {
      setStatus(
        `Failed to create group: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async function renameGroup(id: string, name: string) {
    try {
      await updateGroup({id, name});
    } catch (error) {
      setStatus(
        `Failed to rename group: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async function moveItemToGroup(bookId: string, groupId: string) {
    try {
      await updateBook({id: bookId, groupId: groupId || null});
    } catch (error) {
      setStatus(`Failed to move book: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async function removeItem(id: string) {
    try {
      await deleteBook(id);
    } catch (error) {
      setStatus(
        `Failed to delete book: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async function clearGroup(id: string) {
    try {
      const booksInGroup = books.filter((b) => b.group_id === id);
      await Promise.all(booksInGroup.map((book) => updateBook({id: book.id, groupId: null})));
    } catch (error) {
      setStatus(
        `Failed to clear group: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  const itemsByGroup = useMemo(() => {
    const map = new Map<string, Book[]>();
    for (const book of books) {
      const key = book.group_id || 'UNASSIGNED';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(book);
    }
    return map;
  }, [books]);

  async function exportJSON() {
    const data = {groups, books};
    downloadBlob('book-groups.json', JSON.stringify(data, null, 2));
  }

  function handleCameraChange(cameraId: string) {
    setSelectedCameraId(cameraId);
    // Restart scanner with new camera
    if (scanning) {
      setScanning(false);
      setTimeout(() => setScanning(true), 100);
    }
  }

  const scannerButtonVariant = useMemo(() => {
    if (scanning) {
      return 'danger';
    }
    if (cameraPermission === 'denied') {
      return 'secondary';
    }
    return 'primary';
  }, [scanning, cameraPermission]);

  const scannerButtonText = useMemo(() => {
    if (scanning) {
      return 'Stop';
    }
    if (cameraPermission === 'denied') {
      return 'Camera Denied';
    }
    return 'Start Scanner';
  }, [scanning, cameraPermission]);

  return (
    <div className="min-h-screen bg-background text-text-primary overflow-x-hidden flex flex-col items-center justify-center">
      <ISBNFetcher
        isbn={currentISBN}
        activeGroupId={activeGroupId}
        onError={handleFetchError}
        onSuccess={handleFetchSuccess}
        onComplete={handleFetchComplete}
      />
      <header className="sticky top-0 z-10 bg-surface-elevated/80 backdrop-blur border-b border-border w-full">
        <div className="w-full px-2 py-2 sm:py-3 flex justify-center">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full max-w-4xl">
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-text-primary">Book Group Labeler</h1>
              <span className="text-sm text-text-secondary">
                Scan ISBN → Fetch Metadata → Print Labels
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-0.5 sm:gap-2 w-full">
              <ThemeToggle />
              {user && (
                <Button
                  variant="secondary"
                  onPress={signOut}
                  className="px-1 sm:px-4 text-xs sm:text-sm shrink-0"
                  aria-label={`Signed in as ${user.email}`}
                >
                  Sign Out
                </Button>
              )}
              <Button
                variant={'secondary'}
                onPress={() => setScanning((s) => !s)}
                isDisabled={cameraPermission === 'denied' && !scanning}
                className="px-0.5 sm:px-4 text-xs sm:text-sm shrink-0"
              >
                {scannerButtonText}
              </Button>
              <Button
                variant="secondary"
                onPress={addGroup}
                className="px-1 sm:px-4 text-xs sm:text-sm shrink-0"
              >
                + Group
              </Button>
              <Button
                variant="secondary"
                onPress={exportJSON}
                className="px-1 sm:px-4 text-xs sm:text-sm shrink-0"
              >
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-2 py-2 sm:py-4 grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-6 print:block max-w-4xl">
        {/* Left: Scanner & Add */}
        {activeGroupId && (
          <section className="space-y-4 print:hidden">
            <Scanner
              scanning={scanning}
              onScanned={handleScanned}
              onStatusChange={setStatus}
              onCameraPermissionChange={setCameraPermission}
              availableCameras={availableCameras}
              selectedCameraId={selectedCameraId}
              onCameraChange={handleCameraChange}
              onCamerasDetected={setAvailableCameras}
            />
            <Card className="w-full">
              <h2 className="font-semibold mb-2 text-text-primary">Manual Entry</h2>
              <p className="text-sm text-text-secondary mt-2">{status}</p>

              {/* Camera Permission Status */}
              {cameraPermission === 'denied' && (
                <div className="mt-2 p-3 bg-error/10 border border-error/20 rounded-lg">
                  <p className="text-sm text-error">
                    <strong>Camera access denied.</strong> Please allow camera access in your
                    browser settings and refresh the page.
                  </p>
                  <Button
                    variant="danger"
                    onPress={() => globalThis.location.reload()}
                    className="mt-2"
                  >
                    Refresh Page
                  </Button>
                </div>
              )}

              {cameraPermission === 'prompt' && !scanning && (
                <div className="mt-2 p-3 bg-accent/10 border border-accent/20 rounded-lg">
                  <p className="text-sm text-accent">
                    <strong>Camera permission needed.</strong> Click "Start" to request camera
                    access.
                  </p>
                </div>
              )}

              {status.includes('HTTPS') && (
                <div className="mt-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <p className="text-sm text-warning">
                    <strong>Camera requires HTTPS:</strong> Modern browsers only allow camera access
                    over secure connections. Try running with{' '}
                    <code className="bg-warning/20 px-1 rounded">npm run dev</code> or deploy to
                    HTTPS.
                  </p>
                </div>
              )}
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <input
                  value={manualISBN}
                  onChange={(e) => setManualISBN(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && manualISBN.trim()) {
                      const isbn = normalizeISBN(manualISBN.trim());
                      if (isbn) {
                        addISBN(isbn);
                      } else {
                        setStatus('Invalid ISBN format');
                      }
                      setManualISBN('');
                    }
                  }}
                  placeholder="Type or paste ISBN and press Enter"
                  className="flex-1 px-3 py-3 border border-border rounded-lg text-base min-h-[44px] bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent placeholder:text-text-tertiary"
                />
                <Button
                  onPress={() => {
                    if (manualISBN.trim()) {
                      const isbn = normalizeISBN(manualISBN.trim());
                      if (isbn) {
                        addISBN(isbn);
                      } else {
                        setStatus('Invalid ISBN format');
                      }
                      setManualISBN('');
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </Card>

            <GroupManager
              groups={groups}
              activeGroupId={activeGroupId || ''}
              onGroupSelect={(groupId) => {
                const group = groups.find((g) => g.id === groupId);
                if (group) {
                  navigate({to: '/scanner/$groupSlug', params: {groupSlug: group.slug}});
                }
              }}
              onRenameGroup={renameGroup}
              onClearGroup={clearGroup}
              itemsByGroup={itemsByGroup}
            />
          </section>
        )}
        {/* Right: Item list */}
        <section className="print:hidden">
          <BookList
            items={books}
            groups={groups}
            onMoveItem={moveItemToGroup}
            onRemoveItem={removeItem}
          />
        </section>

        {/* Print layout */}
        <section className="print:block hidden">
          <div className="print:grid print:grid-cols-2 print:gap-12 print:mt-0">
            {groups.map((g) => (
              <PrintLabel key={g.id} group={g} items={itemsByGroup.get(g.id) || []} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default ScannerInterface;
