import React, {useEffect, useMemo, useState} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {classNames, downloadBlob} from '../utils/generalUtils';
import {normalizeISBN} from '../utils/scannerUtils';
import BookList from './BookList';
import GroupManager from './GroupManager';
import ISBNFetcher from './ISBNFetcher';
import PrintLabel from './PrintLabel';
import Scanner from './Scanner';

// Types
interface BookItem {
  id: string; // uuid-ish
  isbn: string;
  title: string;
  authors: string[];
  groupId?: string;
}

interface Group {
  id: string; // e.g., "GROUP-1"
  name: string; // display name
}

// Main Scanner Interface Component
function ScannerInterface() {
  const {user, signOut} = useAuth();
  const [items, setItems] = useState<BookItem[]>([]);
  const [groups, setGroups] = useState<Group[]>([{id: 'GROUP-1', name: 'Group 1'}]);
  const [activeGroupId, setActiveGroupId] = useState<string>('GROUP-1');
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

  // Persist locally (will be replaced with database)
  useEffect(() => {
    const raw = localStorage.getItem('book-group-state-v1');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.items) setItems(parsed.items);
        if (parsed.groups) setGroups(parsed.groups);
        if (parsed.activeGroupId) setActiveGroupId(parsed.activeGroupId);
      } catch (error) {
        alert(
          `Error loading saved data: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('book-group-state-v1', JSON.stringify({items, groups, activeGroupId}));
  }, [items, groups, activeGroupId]);

  async function handleScanned(raw: string) {
    const isbn = normalizeISBN(raw);
    if (!isbn) return;

    // If we're already processing an ISBN, ignore this scan
    if (isProcessingISBN) return;

    // Stop scanning and mark as processing
    setScanning(false);
    setIsProcessingISBN(true);

    await addISBN(isbn);
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

  function addGroup() {
    const nextIndex = groups.length + 1;
    const id = `GROUP-${nextIndex}`;
    setGroups((xs) => [...xs, {id, name: `Group ${nextIndex}`}]);
    setActiveGroupId(id);
  }

  function renameGroup(id: string, name: string) {
    setGroups((xs) => xs.map((g) => (g.id === id ? {...g, name} : g)));
  }

  function moveItemToGroup(itemId: string, groupId: string) {
    setItems((xs) => xs.map((it) => (it.id === itemId ? {...it, groupId} : it)));
  }

  function removeItem(id: string) {
    setItems((xs) => xs.filter((it) => it.id !== id));
  }

  function clearGroup(id: string) {
    setItems((xs) => xs.map((it) => (it.groupId === id ? {...it, groupId: undefined} : it)));
  }

  const itemsByGroup = useMemo(() => {
    const map = new Map<string, BookItem[]>();
    for (const it of items) {
      const key = it.groupId || 'UNASSIGNED';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return map;
  }, [items]);

  async function exportJSON() {
    const data = {groups, items};
    downloadBlob('book-groups.json', JSON.stringify(data, null, 2));
  }

  function onImportJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (data.groups && data.items) {
          setGroups(data.groups);
          setItems(data.items);
          setActiveGroupId(data.groups?.[0]?.id || 'GROUP-1');
        }
      } catch (err) {
        alert(`Invalid JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
  }

  async function exportSVGLabels() {
    console.log('Starting SVG export...');
    console.log('Groups:', groups);
    console.log('Items by group:', itemsByGroup);

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const items = itemsByGroup.get(group.id) || [];
      console.log(`Processing group ${group.name} with ${items.length} items`);
      if (items.length === 0) continue;

      // Create a simple URL for the QR code (using basepath from router)
      const basepath = '/book-scanner';
      const text = `${window.location.origin}${basepath}/group/${group.id}`;
      console.log(`Generating QR code for ${group.name}:`, text);

      try {
        // Generate SVG QR code
        const QRCode = (await import('qrcode')).default;
        const svgString = await QRCode.toString(text, {
          type: 'svg',
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 600,
        });
        console.log(`QR code generated for ${group.name}`);

        // Create complete SVG label (384px width = 48mm at 203 DPI)
        const labelSVG = `
        <svg width="384" height="256" viewBox="0 0 384 256" xmlns="http://www.w3.org/2000/svg">
          <rect width="384" height="256" fill="white"/>
          <text x="192" y="20" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold">${
            group.name
          }</text>
          <text x="192" y="40" text-anchor="middle" font-family="Arial, sans-serif" font-size="12">${
            items.length
          } item${items.length === 1 ? '' : 's'}</text>
          <g transform="translate(32, 50) scale(3)">
            ${svgString.replace('<svg', '<g').replace('</svg>', '</g>')}
          </g>
        </svg>
      `;

        // Convert SVG to PNG and download
        console.log(`Converting SVG to PNG for ${group.name}`);

        // Create a temporary div with the SVG
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = labelSVG;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        document.body.appendChild(tempDiv);

        // Convert to canvas then PNG
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        const svgBlob = new Blob([labelSVG], {type: 'image/svg+xml'});
        const svgUrl = URL.createObjectURL(svgBlob);

        img.onload = () => {
          try {
            canvas.width = 384;
            canvas.height = 256;
            if (ctx) {
              ctx.drawImage(img, 0, 0, 384, 256);
            }

            canvas.toBlob((pngBlob) => {
              if (pngBlob) {
                const pngUrl = URL.createObjectURL(pngBlob);
                const a = document.createElement('a');
                a.href = pngUrl;
                a.download = `${group.name.replace(/[^a-zA-Z0-9]/g, '_')}_label.png`;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(pngUrl);
                URL.revokeObjectURL(svgUrl);
                document.body.removeChild(tempDiv);
                console.log(`Downloaded ${group.name}_label.png`);
              } else {
                alert(`Failed to convert ${group.name} to PNG`);
              }
            }, 'image/png');
          } catch (error) {
            alert(
              `Error converting ${group.name} to PNG: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`
            );
            document.body.removeChild(tempDiv);
            URL.revokeObjectURL(svgUrl);
          }
        };

        img.onerror = () => {
          alert(`Failed to load SVG for ${group.name}`);
          document.body.removeChild(tempDiv);
          URL.revokeObjectURL(svgUrl);
        };

        img.src = svgUrl;

        // Add a small delay between downloads to prevent browser blocking
        if (i < groups.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Error generating QR code for ${group.name}:`, error);
        setStatus(`Error generating label for ${group.name}`);
        alert(
          `Error generating QR code for ${group.name}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }
    console.log('SVG export completed');
  }

  function handleCameraChange(cameraId: string) {
    setSelectedCameraId(cameraId);
    // Restart scanner with new camera
    if (scanning) {
      setScanning(false);
      setTimeout(() => setScanning(true), 100);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden flex flex-col items-center justify-center">
      <ISBNFetcher
        isbn={currentISBN}
        activeGroupId={activeGroupId}
        onError={handleFetchError}
        onSuccess={handleFetchSuccess}
        onComplete={handleFetchComplete}
      />
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b w-full">
        <div className="w-full px-2 py-2 sm:py-3 flex justify-center">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full max-w-4xl">
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Book Group QR Labeler</h1>
              <span className="text-sm text-gray-500">
                Scan ISBN → Fetch Metadata → Print Labels
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-0.5 sm:gap-2 w-full">
              {user && (
                <button
                  onClick={signOut}
                  className="px-1 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border bg-gray-100 hover:bg-gray-200 min-h-[44px] flex-shrink-0"
                  title={`Signed in as ${user.email}`}
                >
                  Sign Out
                </button>
              )}
              <button
                onClick={() => setScanning((s) => !s)}
                className={classNames(
                  'px-0.5 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-medium border min-h-[40px] sm:min-h-[44px] flex-shrink-0',
                  scanning
                    ? 'bg-red-50 border-red-300 text-red-700'
                    : cameraPermission === 'denied'
                      ? 'bg-gray-50 border-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                )}
                disabled={cameraPermission === 'denied' && !scanning}
              >
                {scanning
                  ? 'Stop'
                  : cameraPermission === 'denied'
                    ? 'Camera Denied'
                    : 'Start Scanner'}
              </button>
              <button
                onClick={addGroup}
                className="px-1 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border bg-white min-h-[44px] flex-shrink-0"
              >
                + Group
              </button>
              <button
                onClick={exportJSON}
                className="px-1 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border bg-white min-h-[44px] flex-shrink-0"
              >
                Export
              </button>
              <label className="px-1 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border bg-white cursor-pointer min-h-[44px] flex items-center flex-shrink-0">
                Import
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={onImportJSON}
                />
              </label>
              <button
                onClick={exportSVGLabels}
                className="px-1 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border bg-indigo-600 text-white min-h-[44px] flex-shrink-0"
              >
                Export SVG
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-2 py-2 sm:py-4 grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-6 print:block max-w-4xl">
        {/* Left: Scanner & Add */}
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

          <div className="border rounded-xl p-2 sm:p-4 bg-white w-full">
            <h2 className="font-semibold mb-2">Manual Entry</h2>
            <p className="text-sm text-gray-600 mt-2">{status}</p>

            {/* Camera Permission Status */}
            {cameraPermission === 'denied' && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Camera access denied.</strong> Please allow camera access in your browser
                  settings and refresh the page.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded text-sm font-medium"
                >
                  Refresh Page
                </button>
              </div>
            )}

            {cameraPermission === 'prompt' && !scanning && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Camera permission needed.</strong> Click "Start" to request camera access.
                </p>
              </div>
            )}

            {status.includes('HTTPS') && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Camera requires HTTPS:</strong> Modern browsers only allow camera access
                  over secure connections. Try running with{' '}
                  <code className="bg-yellow-100 px-1 rounded">npm run dev</code> or deploy to
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
                    }
                    setManualISBN('');
                  }
                }}
                placeholder="Type or paste ISBN and press Enter"
                className="flex-1 px-3 py-3 border rounded-lg text-base min-h-[44px]"
              />
              <button
                onClick={() => {
                  if (manualISBN.trim()) {
                    const isbn = normalizeISBN(manualISBN.trim());
                    if (isbn) {
                      addISBN(isbn);
                    }
                    setManualISBN('');
                  }
                }}
                className="px-4 py-3 border rounded-lg bg-white font-medium min-h-[44px]"
              >
                Add
              </button>
            </div>
          </div>

          <GroupManager
            groups={groups}
            activeGroupId={activeGroupId}
            onGroupSelect={setActiveGroupId}
            onRenameGroup={renameGroup}
            onClearGroup={clearGroup}
            itemsByGroup={itemsByGroup}
          />
        </section>

        {/* Right: Item list */}
        <section className="print:hidden">
          <BookList
            items={items}
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
