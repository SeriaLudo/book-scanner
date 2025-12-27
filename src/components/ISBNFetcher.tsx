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
    if (!isbn) return; // No ISBN to process

    // Check if activeGroupId is missing
    if (!activeGroupId) {
      onError('Please select a group before adding a book');
      onComplete();
      return;
    }

    // Handle error case
    if (error) {
      onError(`No data found for ${isbn}`);
      onComplete();
      return;
    }

    // Process book when data is available
    if (bookData) {
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
    }
    // If bookData is null/undefined but no error yet, the query is still loading
    // We'll wait for it to complete (either success or error)
  }, [isbn, bookData, error, activeGroupId, addBook, onError, onSuccess, onComplete]);

  return null; // This component doesn't render anything
}
