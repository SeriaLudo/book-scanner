import "./App.css";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import QRCode from "qrcode";

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

// --- Helpers ---
const uid = () => Math.random().toString(36).slice(2, 10);

async function fetchBookByISBN(
  isbnRaw: string
): Promise<{ title: string; authors: string[] } | null> {
  // Normalize: strip spaces/dashes
  const isbn = isbnRaw.replace(/[^0-9Xx]/g, "");
  if (!isbn) return null;

  // Try OpenLibrary Books API first (simple, CORS-friendly)
  try {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("OpenLibrary error");
    const data = await res.json();
    const key = `ISBN:${isbn}`;
    const entry = data[key];
    if (entry) {
      const title: string = entry.title || "Untitled";
      const authors: string[] = Array.isArray(entry.authors)
        ? entry.authors.map((a: any) => a.name).filter(Boolean)
        : [];
      return { title, authors };
    }
  } catch (e) {
    console.warn("OpenLibrary jscmd=data fallback", e);
  }

  // Fallback: OpenLibrary works JSON (two-step)
  try {
    const worksRes = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
    if (!worksRes.ok) throw new Error("ISBN not found");
    const worksJson = await worksRes.json();
    let title = worksJson.title || "Untitled";
    let authors: string[] = [];
    if (Array.isArray(worksJson.authors) && worksJson.authors.length) {
      const ids = worksJson.authors
        .map((a: any) => a.key?.replace("/authors/", "").replace("/", ""))
        .filter(Boolean);
      const authorNames: string[] = [];
      for (const id of ids) {
        try {
          const aRes = await fetch(
            `https://openlibrary.org/authors/${id}.json`
          );
          if (aRes.ok) {
            const aJson = await aRes.json();
            if (aJson?.name) authorNames.push(aJson.name);
          }
        } catch {}
      }
      authors = authorNames;
    }
    return { title, authors };
  } catch (e) {
    console.warn("OpenLibrary fallback failed", e);
  }

  return null;
}

function downloadBlob(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

// --- Main Component ---
export default function App() {
  const [items, setItems] = useState<BookItem[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([{ id: "BOX-1", name: "Box 1" }]);
  const [activeBoxId, setActiveBoxId] = useState<string>("BOX-1");
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string>("");
  const [manualISBN, setManualISBN] = useState("");
  const [status, setStatus] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const scannerControlsRef = useRef<any>(null);

  // Persist locally
  useEffect(() => {
    const raw = localStorage.getItem("book-box-state-v1");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.items) setItems(parsed.items);
        if (parsed.boxes) setBoxes(parsed.boxes);
        if (parsed.activeBoxId) setActiveBoxId(parsed.activeBoxId);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "book-box-state-v1",
      JSON.stringify({ items, boxes, activeBoxId })
    );
  }, [items, boxes, activeBoxId]);

  // Start/stop camera scanner
  useEffect(() => {
    if (!scanning) return;
    const reader = new BrowserMultiFormatReader();
    codeReaderRef.current = reader;

    const start = async () => {
      try {
        // Check if we're on HTTPS or localhost
        if (
          location.protocol !== "https:" &&
          location.hostname !== "localhost" &&
          location.hostname !== "127.0.0.1"
        ) {
          setStatus("Camera requires HTTPS. Please use https:// or localhost");
          return;
        }

        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const deviceId = devices?.[0]?.deviceId;
        if (!deviceId) {
          setStatus("No camera found. Please check permissions.");
          return;
        }

        setStatus("Starting camera...");
        const controls = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current!,
          (result) => {
            if (result) {
              const text = result.getText();
              if (text && text !== lastScan) {
                setLastScan(text);
                handleScanned(text);
              }
            }
          }
        );
        scannerControlsRef.current = controls;
        setStatus("Scanner active - Point camera at barcode");
      } catch (e: any) {
        console.error("Camera error:", e);
        if (e.name === "NotAllowedError") {
          setStatus(
            "Camera permission denied. Please allow camera access and try again."
          );
        } else if (e.name === "NotFoundError") {
          setStatus("No camera found. Please connect a camera and try again.");
        } else if (e.name === "NotSupportedError") {
          setStatus("Camera not supported. Please use HTTPS or localhost.");
        } else {
          setStatus("Camera error: " + (e?.message || e));
        }
      }
    };

    start();
    return () => {
      try {
        if (scannerControlsRef.current) {
          scannerControlsRef.current.stop();
        }
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  async function handleScanned(raw: string) {
    const isbn = raw.replace(/[^0-9Xx]/g, "");
    if (!isbn) return;
    await addISBN(isbn);
  }

  async function addISBN(isbn: string) {
    setStatus(`Fetching ${isbn}…`);
    const meta = await fetchBookByISBN(isbn);
    if (!meta) {
      setStatus(`No data found for ${isbn}`);
      return;
    }
    const item: BookItem = {
      id: uid(),
      isbn,
      title: meta.title,
      authors: meta.authors,
      boxId: activeBoxId,
    };
    setItems((xs) => [item, ...xs]);
    setStatus(`Added ${meta.title}`);
  }

  function addBox() {
    const nextIndex = boxes.length + 1;
    const id = `BOX-${nextIndex}`;
    setBoxes((xs) => [...xs, { id, name: `Box ${nextIndex}` }]);
    setActiveBoxId(id);
  }

  function renameBox(id: string, name: string) {
    setBoxes((xs) => xs.map((b) => (b.id === id ? { ...b, name } : b)));
  }

  function moveItemToBox(itemId: string, boxId: string) {
    setItems((xs) =>
      xs.map((it) => (it.id === itemId ? { ...it, boxId } : it))
    );
  }

  function removeItem(id: string) {
    setItems((xs) => xs.filter((it) => it.id !== id));
  }

  function clearBox(id: string) {
    setItems((xs) =>
      xs.map((it) => (it.boxId === id ? { ...it, boxId: undefined } : it))
    );
  }

  const itemsByBox = useMemo(() => {
    const map = new Map<string, BookItem[]>();
    for (const it of items) {
      const key = it.boxId || "UNASSIGNED";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return map;
  }, [items]);

  async function makeQRForBox(box: Box): Promise<string> {
    const payload = {
      boxId: box.id,
      name: box.name,
      items: (itemsByBox.get(box.id) || []).map((it) => ({
        isbn: it.isbn,
        title: it.title,
        a: it.authors,
      })),
      v: 1,
    };
    const text = JSON.stringify(payload);
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 256,
    });
  }

  async function exportJSON() {
    const data = { boxes, items };
    downloadBlob("book-boxes.json", JSON.stringify(data, null, 2));
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
          setActiveBoxId(data.boxes?.[0]?.id || "BOX-1");
        }
      } catch (err) {
        alert("Invalid JSON");
      }
    };
    reader.readAsText(file);
  }

  function printLabels() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden flex flex-col items-center justify-center">
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
                  "px-0.5 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-medium border min-h-[40px] sm:min-h-[44px] flex-shrink-0",
                  scanning
                    ? "bg-red-50 border-red-300 text-red-700"
                    : "bg-emerald-50 border-emerald-300 text-emerald-700"
                )}
              >
                {scanning ? "Stop" : "Start"}
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
                onClick={printLabels}
                className="px-1 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border bg-indigo-600 text-white min-h-[44px] flex-shrink-0"
              >
                Print
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-2 py-2 sm:py-4 grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-6 print:block max-w-4xl">
        {/* Left: Scanner & Add */}
        <section className="space-y-4 print:hidden">
          <div className="border rounded-xl p-2 sm:p-4 bg-white w-full">
            <h2 className="font-semibold mb-2">Scan ISBN</h2>
            <div className="aspect-video bg-black/5 rounded-lg flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
              ></video>
            </div>
            <p className="text-sm text-gray-600 mt-2">{status}</p>
            {status.includes("HTTPS") && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Camera requires HTTPS:</strong> Modern browsers only
                  allow camera access over secure connections. Try running with{" "}
                  <code className="bg-yellow-100 px-1 rounded">
                    npm run dev
                  </code>{" "}
                  or deploy to HTTPS.
                </p>
              </div>
            )}
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <input
                value={manualISBN}
                onChange={(e) => setManualISBN(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && manualISBN.trim()) {
                    addISBN(manualISBN.trim());
                    setManualISBN("");
                  }
                }}
                placeholder="Type or paste ISBN and press Enter"
                className="flex-1 px-3 py-3 border rounded-lg text-base min-h-[44px]"
              />
              <button
                onClick={() => {
                  if (manualISBN.trim()) {
                    addISBN(manualISBN.trim());
                    setManualISBN("");
                  }
                }}
                className="px-4 py-3 border rounded-lg bg-white font-medium min-h-[44px]"
              >
                Add
              </button>
            </div>
          </div>

          <div className="border rounded-xl p-2 sm:p-4 bg-white w-full">
            <h2 className="font-semibold mb-3">Boxes</h2>
            <div className="flex flex-wrap gap-2">
              {boxes.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setActiveBoxId(b.id)}
                  className={classNames(
                    "px-4 py-2 rounded-full border font-medium min-h-[44px]",
                    activeBoxId === b.id
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white"
                  )}
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
                    onChange={(e) => renameBox(b.id, e.target.value)}
                    className="px-3 py-2 border rounded-md flex-1 min-h-[44px] text-base"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {itemsByBox.get(b.id)?.length || 0} items
                    </span>
                    <button
                      onClick={() => clearBox(b.id)}
                      className="text-sm px-3 py-2 border rounded-md font-medium min-h-[44px]"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right: Item list */}
        <section className="border rounded-xl p-2 sm:p-4 bg-white w-full print:hidden">
          <h2 className="font-semibold mb-3">Scanned Books</h2>
          <div className="max-h-[60vh] overflow-auto divide-y">
            {items.map((it) => (
              <div
                key={it.id}
                className="py-3 flex flex-col sm:flex-row sm:items-start gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">
                    {it.title || "Untitled"}
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {it.authors?.join(", ") || "Unknown author"}
                  </div>
                  <div className="text-xs text-gray-500">ISBN: {it.isbn}</div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={it.boxId || "UNASSIGNED"}
                    onChange={(e) => moveItemToBox(it.id, e.target.value)}
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
                    onClick={() => removeItem(it.id)}
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
        </section>

        {/* Print layout */}
        <section className="print:block hidden">
          <div className="print:grid print:grid-cols-2 print:gap-12 print:mt-0">
            {boxes.map((b) => (
              <PrintLabel
                key={b.id}
                box={b}
                getQR={() => makeQRForBox(b)}
                items={itemsByBox.get(b.id) || []}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function PrintLabel({
  box,
  getQR,
  items,
}: {
  box: Box;
  getQR: () => Promise<string>;
  items: BookItem[];
}) {
  const [src, setSrc] = useState<string>("");
  useEffect(() => {
    let mounted = true;
    getQR().then((d) => mounted && setSrc(d));
    return () => {
      mounted = false;
    };
  }, [getQR]);

  return (
    <div className="print:border print:border-gray-300 print:p-8 print:break-inside-avoid print:mb-0">
      <div className="print:text-2xl print:font-bold print:mb-2 print:mt-0">
        {box.name}
      </div>
      <div className="print:text-sm print:text-gray-700 print:mb-2">
        {items.length} item{items.length === 1 ? "" : "s"}
      </div>
      <div className="print:mt-2">
        {src ? (
          <img
            src={src}
            alt={`QR for ${box.name}`}
            className="print:w-16 print:h-16 print:object-contain w-16 h-16 object-contain"
          />
        ) : (
          <div className="print:w-16 print:h-16 print:bg-gray-100 w-16 h-16 bg-gray-100" />
        )}
      </div>
      <ol className="print:mt-2 print:text-xs print:space-y-1">
        {items.slice(0, 10).map((it, i) => (
          <li key={it.id}>
            {i + 1}. {it.title}{" "}
            {it.authors.length ? `— ${it.authors.join(", ")}` : ""}
          </li>
        ))}
        {items.length > 10 && <li>… and {items.length - 10} more</li>}
      </ol>
    </div>
  );
}
