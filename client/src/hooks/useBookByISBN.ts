import {useQuery} from '@tanstack/react-query';

interface BookData {
  title: string;
  authors: string[];
}

async function fetchBookByISBN(isbnRaw: string): Promise<BookData | null> {
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

    if (entry && entry.title) {
      return {
        title: entry.title,
        authors: entry.authors?.map((a: {name: string}) => a.name) || [],
      };
    }
  } catch (e) {
    console.log('OpenLibrary failed:', e);
  }

  // Fallback: try Google Books API
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Google Books error');
    const data = await res.json();

    if (data.items && data.items[0]) {
      const book = data.items[0].volumeInfo;
      return {
        title: book.title || 'Unknown Title',
        authors: book.authors || [],
      };
    }
  } catch (e) {
    console.log('Google Books failed:', e);
  }

  return null;
}

export function useBookByISBN(isbn: string | null) {
  return useQuery({
    queryKey: ['book', isbn],
    queryFn: () => fetchBookByISBN(isbn!),
    enabled: !!isbn,
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 2,
  });
}
