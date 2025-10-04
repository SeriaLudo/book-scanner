import './App.css';

import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import React, {useEffect, useMemo, useState} from 'react';
import BookList from './components/BookList';
import BoxManager from './components/BoxManager';
import ISBNFetcher from './components/ISBNFetcher';
import PrintLabel from './components/PrintLabel';
import Scanner from './components/Scanner';
import {classNames, downloadBlob} from './utils/generalUtils';
import {normalizeISBN} from './utils/scannerUtils';

// Minimal one-file React app:
// - Scan ISBN barcodes with the device camera (or type manually)
// - Fetch title/author via OpenLibrary
// - Assign books to boxes
// - Print QR labels for each box (QR encodes box + item list JSON)
// - Export/Import JSON for persistence

// Tailwind is available in this environment.

// --- Types ---
interface BookItem {
  id: string; // uuid-ish
  isbn: string;
  title: string;
  authors: string[];
  boxId?: string;
}

interface Box {
  id: string; // e.g., "BOX-1"
  name: string; // display name
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

// --- Main Component ---
function App() {
  const [items, setItems] = useState<BookItem[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([{id: 'BOX-1', name: 'Box 1'}]);
  const [activeBoxId, setActiveBoxId] = useState<string>('BOX-1');
  const [scanning, setScanning] = useState(false);
  const [manualISBN, setManualISBN] = useState('');
  const [status, setStatus] = useState<string>('');
  const [cameraPermission, setCameraPermission] = useState<
    'granted' | 'denied' | 'prompt' | 'unknown'
  >('unknown');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [viewingBoxId, setViewingBoxId] = useState<string | null>(null);
  const [currentISBN, setCurrentISBN] = useState<string | null>(null);

  // Handle URL routing (using hash for GitHub Pages compatibility)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/box/')) {
      const boxId = hash.split('#/box/')[1];
      setViewingBoxId(boxId);
    } else {
      setViewingBoxId(null);
    }
  }, []);

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/box/')) {
        const boxId = hash.split('#/box/')[1];
        setViewingBoxId(boxId);
      } else {
        setViewingBoxId(null);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Persist locally
  useEffect(() => {
    const raw = localStorage.getItem('book-box-state-v1');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.items) setItems(parsed.items);
        if (parsed.boxes) setBoxes(parsed.boxes);
        if (parsed.activeBoxId) setActiveBoxId(parsed.activeBoxId);
      } catch (error) {
        alert(
          `Error loading saved data: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('book-box-state-v1', JSON.stringify({items, boxes, activeBoxId}));
  }, [items, boxes, activeBoxId]);

  async function handleScanned(raw: string) {
    const isbn = normalizeISBN(raw);
    if (!isbn) return;

    // Check if this ISBN already exists in the current box
    const existingInBox = items.find((item) => item.isbn === isbn && item.boxId === activeBoxId);

    if (existingInBox) {
      setStatus(
        `"${existingInBox.title}" is already in ${
          boxes.find((b) => b.id === activeBoxId)?.name || 'this box'
        }`
      );
      return;
    }

    await addISBN(isbn);
  }

  function addISBN(isbn: string) {
    setCurrentISBN(isbn);
  }

  function handleBookFetched(item: BookItem) {
    setItems((xs) => [item, ...xs]);
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
  }

  function addBox() {
    const nextIndex = boxes.length + 1;
    const id = `BOX-${nextIndex}`;
    setBoxes((xs) => [...xs, {id, name: `Box ${nextIndex}`}]);
    setActiveBoxId(id);
  }

  function renameBox(id: string, name: string) {
    setBoxes((xs) => xs.map((b) => (b.id === id ? {...b, name} : b)));
  }

  function moveItemToBox(itemId: string, boxId: string) {
    setItems((xs) => xs.map((it) => (it.id === itemId ? {...it, boxId} : it)));
  }

  function removeItem(id: string) {
    setItems((xs) => xs.filter((it) => it.id !== id));
  }

  function clearBox(id: string) {
    setItems((xs) => xs.map((it) => (it.boxId === id ? {...it, boxId: undefined} : it)));
  }

  const itemsByBox = useMemo(() => {
    const map = new Map<string, BookItem[]>();
    for (const it of items) {
      const key = it.boxId || 'UNASSIGNED';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return map;
  }, [items]);

  async function exportJSON() {
    const data = {boxes, items};
    downloadBlob('book-boxes.json', JSON.stringify(data, null, 2));
  }

  function onImportJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (data.boxes && data.items) {
          setBoxes(data.boxes);
          setItems(data.items);
          setActiveBoxId(data.boxes?.[0]?.id || 'BOX-1');
        }
      } catch (err) {
        alert(`Invalid JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
  }

  async function exportSVGLabels() {
    console.log('Starting SVG export...');
    console.log('Boxes:', boxes);
    console.log('Items by box:', itemsByBox);

    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      const items = itemsByBox.get(box.id) || [];
      console.log(`Processing box ${box.name} with ${items.length} items`);
      if (items.length === 0) continue;

      // Create a simple URL for the QR code
      const text = `${window.location.origin}/book-scanner/#/box/${box.id}`;
      console.log(`Generating QR code for ${box.name}:`, text);

      try {
        // Generate SVG QR code
        const QRCode = (await import('qrcode')).default;
        const svgString = await QRCode.toString(text, {
          type: 'svg',
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 600,
        });
        console.log(`QR code generated for ${box.name}`);

        // Create complete SVG label (384px width = 48mm at 203 DPI)
        const labelSVG = `
        <svg width="384" height="256" viewBox="0 0 384 256" xmlns="http://www.w3.org/2000/svg">
          <rect width="384" height="256" fill="white"/>
          <text x="192" y="20" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold">${
            box.name
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
        console.log(`Converting SVG to PNG for ${box.name}`);

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
                a.download = `${box.name.replace(/[^a-zA-Z0-9]/g, '_')}_label.png`;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(pngUrl);
                URL.revokeObjectURL(svgUrl);
                document.body.removeChild(tempDiv);
                console.log(`Downloaded ${box.name}_label.png`);
              } else {
                alert(`Failed to convert ${box.name} to PNG`);
              }
            }, 'image/png');
          } catch (error) {
            alert(
              `Error converting ${box.name} to PNG: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`
            );
            document.body.removeChild(tempDiv);
            URL.revokeObjectURL(svgUrl);
          }
        };

        img.onerror = () => {
          alert(`Failed to load SVG for ${box.name}`);
          document.body.removeChild(tempDiv);
          URL.revokeObjectURL(svgUrl);
        };

        img.src = svgUrl;

        // Add a small delay between downloads to prevent browser blocking
        if (i < boxes.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Error generating QR code for ${box.name}:`, error);
        setStatus(`Error generating label for ${box.name}`);
        alert(
          `Error generating QR code for ${box.name}: ${
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

  // Box viewer component for QR code scanning
  if (viewingBoxId) {
    const box = boxes.find((b) => b.id === viewingBoxId);
    const boxItems = itemsByBox.get(viewingBoxId) || [];

    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">{box?.name || 'Unknown Box'}</h1>
              <button
                onClick={() => {
                  window.location.hash = '';
                  setViewingBoxId(null);
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                ← Back to Scanner
              </button>
            </div>

            <div className="mb-4">
              <span className="text-lg text-gray-600">
                {boxItems.length} item{boxItems.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="grid gap-4">
              {boxItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-gray-600">ISBN: {item.isbn}</p>
                  {item.authors.length > 0 && (
                    <p className="text-sm text-gray-500">by {item.authors.join(', ')}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden flex flex-col items-center justify-center">
      <ISBNFetcher
        isbn={currentISBN}
        activeBoxId={activeBoxId}
        onBookFetched={handleBookFetched}
        onError={handleFetchError}
        onSuccess={handleFetchSuccess}
        onComplete={handleFetchComplete}
      />
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b w-full">
        <div className="w-full px-2 py-2 sm:py-3 flex justify-center">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full max-w-4xl">
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Book Box QR Labeler</h1>
              <span className="text-sm text-gray-500">
                Scan ISBN → Fetch Metadata → Print Labels
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-0.5 sm:gap-2 w-full">
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
                onClick={addBox}
                className="px-1 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border bg-white min-h-[44px] flex-shrink-0"
              >
                + Box
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
                      // Check if this ISBN already exists in the current box
                      const existingInBox = items.find(
                        (item) => item.isbn === isbn && item.boxId === activeBoxId
                      );
                      if (existingInBox) {
                        setStatus(
                          `"${existingInBox.title}" is already in ${
                            boxes.find((b) => b.id === activeBoxId)?.name || 'this box'
                          }`
                        );
                      } else {
                        addISBN(isbn);
                      }
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
                      // Check if this ISBN already exists in the current box
                      const existingInBox = items.find(
                        (item) => item.isbn === isbn && item.boxId === activeBoxId
                      );
                      if (existingInBox) {
                        setStatus(
                          `"${existingInBox.title}" is already in ${
                            boxes.find((b) => b.id === activeBoxId)?.name || 'this box'
                          }`
                        );
                      } else {
                        addISBN(isbn);
                      }
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

          <BoxManager
            boxes={boxes}
            activeBoxId={activeBoxId}
            onBoxSelect={setActiveBoxId}
            onRenameBox={renameBox}
            onClearBox={clearBox}
            itemsByBox={itemsByBox}
          />
        </section>

        {/* Right: Item list */}
        <section className="print:hidden">
          <BookList
            items={items}
            boxes={boxes}
            onMoveItem={moveItemToBox}
            onRemoveItem={removeItem}
          />
        </section>

        {/* Print layout */}
        <section className="print:block hidden">
          <div className="print:grid print:grid-cols-2 print:gap-12 print:mt-0">
            {boxes.map((b) => (
              <PrintLabel key={b.id} box={b} items={itemsByBox.get(b.id) || []} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

// Export with QueryClientProvider
export default function AppWithQuery() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}
