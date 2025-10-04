import {useEffect} from 'react';
import {useBookByISBN} from '../hooks/useBookByISBN';
import {uid} from '../utils/generalUtils';
import {playBeep} from '../utils/scannerUtils';

interface BookItem {
  id: string;
  isbn: string;
  title: string;
  authors: string[];
  boxId?: string;
}

interface ISBNFetcherProps {
  isbn: string | null;
  activeBoxId: string;
  onBookFetched: (item: BookItem) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  onComplete: () => void;
}

export default function ISBNFetcher({
  isbn,
  activeBoxId,
  onBookFetched,
  onError,
  onSuccess,
  onComplete,
}: ISBNFetcherProps) {
  const {data: bookData, isLoading, error} = useBookByISBN(isbn);

  useEffect(() => {
    if (isbn) {
      if (error) {
        onError(`No data found for ${isbn}`);
        onComplete();
      } else if (bookData) {
        const item: BookItem = {
          id: uid(),
          isbn,
          title: bookData.title,
          authors: bookData.authors,
          boxId: activeBoxId,
        };
        onBookFetched(item);
        onSuccess(`Added ${bookData.title} - Scanner stopped`);

        // Play beep sound for successful scan
        playBeep();
        onComplete();
      }
    }
  }, [isbn, bookData, error, activeBoxId, onBookFetched, onError, onSuccess, onComplete]);

  return null; // This component doesn't render anything
}
