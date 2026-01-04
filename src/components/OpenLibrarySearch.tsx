import {useReducer, useState} from 'react';
import type {Key} from 'react-aria-components';
import {useOpenLibrarySearch} from '../hooks/useOpenLibrarySearch';
import Card from './ui/Card';
import Select, {SelectItem} from './ui/Select';
import TextField from './ui/TextField';

interface OpenLibrarySearchProps {
  readonly onBookSelected?: (book: {
    title: string;
    authors: string[];
    identifier: string; // ISBN or edition_key
    editionKey?: string;
    year?: number;
  }) => void;
}

interface SearchState {
  title: string;
  author: string;
}

type SearchAction =
  | {type: 'SET_TITLE'; payload: string}
  | {type: 'SET_AUTHOR'; payload: string}
  | {type: 'RESET'};

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_TITLE':
      return {...state, title: action.payload};
    case 'SET_AUTHOR':
      return {...state, author: action.payload};
    case 'RESET':
      return {title: '', author: ''};
    default:
      return state;
  }
}

export default function OpenLibrarySearch({onBookSelected}: OpenLibrarySearchProps) {
  const [searchState, dispatch] = useReducer(searchReducer, {title: '', author: ''});
  const [selectedWorkKey, setSelectedWorkKey] = useState<string | null>(null);
  const {works, isLoading, error} = useOpenLibrarySearch({
    title: searchState.title,
    author: searchState.author,
  });

  const handleSelectionChange = (key: Key | null) => {
    if (!key || typeof key !== 'string') return;

    setSelectedWorkKey(key);
    const work = works.find((w) => {
      // Match by edition_key (for edition results) or cover_edition_key (for work results) or work key
      return w.edition_key?.[0] === key || w.cover_edition_key === key || w.key === key;
    });
    if (!work) return;

    // Extract book data
    const title = work.title || 'Unknown Title';
    const authors = work.author_name || [];
    const isbn = work.isbn?.[0];
    // Prefer edition_key array, then cover_edition_key, then derive from work key
    let editionKey: string | undefined;
    if (work.edition_key && work.edition_key.length > 0) {
      editionKey = work.edition_key[0];
    } else if (work.cover_edition_key) {
      editionKey = work.cover_edition_key;
    } else if (work.key) {
      // Extract edition key from work key if possible, or use work key as fallback
      // Work keys are like "/works/OL44966W", we'd need to fetch editions
      // For now, we'll use the work key as identifier
      editionKey = work.key.replace('/works/', '');
    }

    if (!editionKey && !isbn) {
      console.error('Work missing both edition_key and ISBN:', work);
      return;
    }
    const identifier = isbn || editionKey || 'UNKNOWN';
    const year = work.first_publish_year;

    // Log the details
    console.log('Selected book:', {
      title,
      authors,
      identifier,
      isbn: isbn || null,
      editionKey,
      year,
    });

    // Call callback if provided
    if (onBookSelected) {
      onBookSelected({
        title,
        authors,
        identifier,
        editionKey,
        year,
      });
    }

    // Clear selection after logging
    setSelectedWorkKey(null);
  };

  const formatWorkOption = (work: (typeof works)[0]): string => {
    const title = work.title || 'Unknown Title';
    const author = work.author_name?.[0] || 'Unknown Author';
    const year = work.first_publish_year ? ` (${work.first_publish_year})` : '';
    const hasIsbn = work.isbn && work.isbn.length > 0;
    const hasEditionKey = !!(work.edition_key?.[0] || work.cover_edition_key);
    let isbnNote = '';
    if (!hasIsbn) {
      isbnNote = hasEditionKey ? ' [No ISBN]' : ' [No ISBN/Key]';
    }
    return `${title} - ${author}${year}${isbnNote}`;
  };

  const getWorkKey = (work: (typeof works)[0]): string => {
    // Use edition_key if available, otherwise cover_edition_key, otherwise work key
    return work.edition_key?.[0] || work.cover_edition_key || work.key || 'unknown';
  };

  return (
    <Card className="w-full">
      <h2 className="font-semibold mb-2 text-text-primary">Search by Title/Author</h2>
      <p className="text-sm text-text-secondary mb-4">
        Search Open Library for books by title, author, or both
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            label="Title"
            placeholder="e.g., 'Winter Words'"
            value={searchState.title}
            onChange={(value) => dispatch({type: 'SET_TITLE', payload: value})}
          />
          <TextField
            label="Author"
            placeholder="e.g., 'Thomas Hardy'"
            value={searchState.author}
            onChange={(value) => dispatch({type: 'SET_AUTHOR', payload: value})}
          />
        </div>

        {isLoading && <div className="text-sm text-text-secondary">Searching...</div>}

        {error && (
          <div className="text-sm text-error">
            Search failed: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        )}

        {!isLoading &&
          !error &&
          (searchState.title.trim() || searchState.author.trim()) &&
          works.length === 0 && <div className="text-sm text-text-secondary">No results found</div>}

        {!isLoading && works.length > 0 && (
          <Select
            label="Select Edition"
            placeholder="Choose an edition..."
            selectedKey={selectedWorkKey}
            onSelectionChange={handleSelectionChange}
          >
            {works
              .filter((work) => {
                // Include works that have either edition_key, cover_edition_key, or work key
                return !!(work.edition_key?.[0] || work.cover_edition_key || work.key);
              })
              .map((work) => {
                const key = getWorkKey(work);
                return (
                  <SelectItem key={key} value={key}>
                    {formatWorkOption(work)}
                  </SelectItem>
                );
              })}
          </Select>
        )}
      </div>
    </Card>
  );
}
