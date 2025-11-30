import {useEffect} from 'react';
import {useBookByISBN} from '../hooks/useBookByISBN';
import {useBooks} from '../hooks/useBooks';
import {playBeep} from '../utils/scannerUtils';

interface ISBNFetcherProps {
  isbn: string | null;
  activeGroupId: string | null;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  onComplete: () => void;
}

export default function ISBNFetcher({
  isbn,
  activeGroupId,
  onError,
  onSuccess,
  onComplete,
}: ISBNFetcherProps) {
  const {data: bookData, error} = useBookByISBN(isbn);
  const {addBook} = useBooks();

  // Handle ISBN processing: when an ISBN is scanned, fetch book data and save to database
  useEffect(() => {
    if (isbn && bookData && activeGroupId) {
      // Save book to database using React Query mutation
      addBook({
        isbn,
        title: bookData.title,
        authors: bookData.authors,
        group_id: activeGroupId,
      })
        .then(() => {
          onSuccess(`Added ${bookData.title} - Scanner stopped`);
          playBeep();
          onComplete();
        })
        .catch((err) => {
          onError(`Failed to save book: ${err.message}`);
          onComplete();
        });
    } else if (isbn && error) {
      onError(`No data found for ${isbn}`);
      onComplete();
    }
  }, [isbn, bookData, error, activeGroupId, addBook, onError, onSuccess, onComplete]);

  return null; // This component doesn't render anything
}
