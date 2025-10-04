// Scanner utility functions

export function playBeep() {
  try {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz beep
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (e) {
    console.log('Could not play beep sound:', e);
  }
}

export async function fetchBookByISBN(
  isbnRaw: string
): Promise<{title: string; authors: string[]} | null> {
  // Normalize: strip spaces/dashes
  const isbn = isbnRaw.replace(/[^0-9Xx]/g, '');
  if (!isbn) return null;

  // Try OpenLibrary Books API first (simple, CORS-friendly)
  try {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('OpenLibrary error');
    const data = await res.json();
    const key = `ISBN:${isbn}`;
    const entry = data[key];
    if (entry) {
      const title: string = entry.title || 'Untitled';
      const authors: string[] = Array.isArray(entry.authors)
        ? entry.authors.map((a: any) => a.name).filter(Boolean)
        : [];
      return {title, authors};
    }
  } catch (e) {
    console.warn('OpenLibrary jscmd=data fallback', e);
  }

  // Fallback: OpenLibrary works JSON (two-step)
  try {
    const worksRes = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
    if (!worksRes.ok) throw new Error('ISBN not found');
    const worksJson = await worksRes.json();
    let title = worksJson.title || 'Untitled';
    let authors: string[] = [];
    if (Array.isArray(worksJson.authors) && worksJson.authors.length) {
      const ids = worksJson.authors
        .map((a: any) => a.key?.replace('/authors/', '').replace('/', ''))
        .filter(Boolean);
      const authorNames: string[] = [];
      for (const id of ids) {
        try {
          const aRes = await fetch(`https://openlibrary.org/authors/${id}.json`);
          if (aRes.ok) {
            const aJson = await aRes.json();
            if (aJson?.name) authorNames.push(aJson.name);
          }
        } catch {}
      }
      authors = authorNames;
    }
    return {title, authors};
  } catch (e) {
    console.warn('OpenLibrary fallback failed', e);
  }

  return null;
}

export function normalizeISBN(raw: string): string {
  return raw.replace(/[^0-9Xx]/g, '');
}

export function checkDuplicateScan(isbn: string, recentScans: Set<string>): boolean {
  return recentScans.has(isbn);
}

export function addToRecentScans(
  isbn: string,
  setRecentScans: React.Dispatch<React.SetStateAction<Set<string>>>,
  timeoutMs: number = 5000
): void {
  setRecentScans((prev) => new Set([...prev, isbn]));
  setTimeout(() => {
    setRecentScans((prev) => {
      const newSet = new Set(prev);
      newSet.delete(isbn);
      return newSet;
    });
  }, timeoutMs);
}
