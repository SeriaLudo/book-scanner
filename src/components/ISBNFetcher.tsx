import {useEffect} from 'react';
import {useBookByISBN} from '../hooks/useBookByISBN';
import {uid} from '../utils/generalUtils';
import {playBeep} from '../utils/scannerUtils';

interface BookItem {
  id: string;
  isbn: string;
  title: string;
  authors: string[];
  groupId?: string;
}

interface ISBNFetcherProps {
  isbn: string | null;
  activeGroupId: string;
  onBookFetched: (item: BookItem) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  onComplete: () => void;
}

export default function ISBNFetcher({
  isbn,
  activeGroupId,
  onBookFetched,
  onError,
  onSuccess,
  onComplete,
}: ISBNFetcherProps) {
  const {data: bookData, error} = useBookByISBN(isbn);

  // Handle ISBN processing: when an ISBN is scanned, fetch book data and process the result
  // This effect runs whenever the ISBN, book data, error state, or active group changes
  useEffect(() => {
    if (isbn) {
      if (error) {
        // If there's an error fetching book data, notify parent and complete the process
        onError(`No data found for ${isbn}`);
        onComplete();
      } else if (bookData) {
        // If book data was successfully fetched, create a book item and add it to the active group
        const item: BookItem = {
          id: uid(),
          isbn,
          title: bookData.title,
          authors: bookData.authors,
          groupId: activeGroupId,
        };
        onBookFetched(item);
        onSuccess(`Added ${bookData.title} - Scanner stopped`);

        // Play beep sound for successful scan
        playBeep();
        onComplete();
      }
    }
  }, [isbn, bookData, error, activeGroupId, onBookFetched, onError, onSuccess, onComplete]);

  return null; // This component doesn't render anything
}
