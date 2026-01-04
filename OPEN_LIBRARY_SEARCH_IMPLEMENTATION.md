# Open Library Search Implementation Guide

This document provides step-by-step instructions for implementing Open Library search functionality
to support books without ISBNs.

## Overview

We'll add a separate "Search by Title/Author" mode that uses Open Library's search API. When a book
doesn't have an ISBN, we'll use the Open Library edition key (e.g., "OL123456M") as the identifier
stored in the ISBN field.

## Step-by-Step Implementation

### Step 1: Create Open Library Search Hook

**File**: `src/hooks/useOpenLibrarySearch.ts`

1. Create a new file `src/hooks/useOpenLibrarySearch.ts`
2. Import necessary dependencies:
   ```typescript
   import {useQuery} from '@tanstack/react-query';
   import {useState, useEffect} from 'react';
   ```
3. Define the Open Library search result interface:
   ```typescript
   export interface OpenLibraryEdition {
     title: string;
     author_name?: string[];
     first_publish_year?: number;
     edition_key: string[];
     isbn?: string[];
     cover_i?: number;
   }
   ```
4. Create a debounced search function:
   - Use `useState` to store the debounced query
   - Use `useEffect` with a 500ms timeout to debounce input
   - Return the debounced query value
5. Create the search query function:
   ```typescript
   async function searchOpenLibrary(query: string): Promise<OpenLibraryEdition[]> {
     if (!query.trim()) return [];

     const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`;
     const res = await fetch(url);
     if (!res.ok) throw new Error('Open Library search failed');
     const data = await res.json();
     return data.docs || [];
   }
   ```
6. Create the hook:
   - Use `useQuery` with the debounced query
   - Enable query only when debounced query has value
   - Return `{editions, isLoading, error}`

### Step 2: Create Open Library Search Component

**File**: `src/components/OpenLibrarySearch.tsx`

1. Create a new file `src/components/OpenLibrarySearch.tsx`
2. Import dependencies:
   ```typescript
   import {useState} from 'react';
   import {useOpenLibrarySearch} from '../hooks/useOpenLibrarySearch';
   import Select from './ui/Select';
   ```
3. Define component props:
   ```typescript
   interface OpenLibrarySearchProps {
     activeGroupId: string | null;
     onBookSelected: (book: {
       title: string;
       authors: string[];
       identifier: string; // ISBN or edition_key
     }) => void;
     onError: (message: string) => void;
   }
   ```
4. Implement the component:
   - Add state for search input: `const [searchQuery, setSearchQuery] = useState('')`
   - Use the `useOpenLibrarySearch` hook with the search query
   - Render a search input field
   - Show loading state when `isLoading` is true
   - Display error message if search fails
   - Render a dropdown/select with edition results
   - Format each option as: `{title} - {author} ({year})`
   - Handle selection:
     - Extract title, authors, ISBN (if available), edition_key
     - Use ISBN if available, otherwise use first edition_key
     - Call `onBookSelected` with the book data
   - Clear search after selection

### Step 3: Update ScannerInterface Component

**File**: `src/components/ScannerInterface.tsx`

1. Add search mode state:
   ```typescript
   const [searchMode, setSearchMode] = useState(false);
   ```
2. Add a toggle button or mode switcher in the header:
   - Add buttons/tabs to switch between "Scan ISBN" and "Search by Title/Author"
   - Update `searchMode` state when switching
3. Conditionally render components:
   ```typescript
   {searchMode ? (
     <OpenLibrarySearch
       activeGroupId={activeGroupId}
       onBookSelected={handleBookSelected}
       onError={handleFetchError}
     />
   ) : (
     <Scanner ... />
   )}
   ```
4. Implement `handleBookSelected` function:
   ```typescript
   async function handleBookSelected(book: {title: string; authors: string[]; identifier: string}) {
     if (!activeGroupId) {
       handleFetchError('Please select a group before adding a book');
       return;
     }

     try {
       await addBook({
         isbn: book.identifier, // This will be ISBN or edition_key
         title: book.title,
         authors: book.authors,
         group_id: activeGroupId,
       });
       handleFetchSuccess(`Added ${book.title}`);
     } catch (err) {
       handleFetchError(`Failed to save book: ${err.message}`);
     }
   }
   ```

### Step 4: Update ISBNFetcher Component

**File**: `src/components/ISBNFetcher.tsx`

1. Add a function to detect Open Library edition keys:
   ```typescript
   function isOpenLibraryEditionKey(identifier: string): boolean {
     // Pattern: OL followed by digits, ending with uppercase letter
     return /^OL\d+[A-Z]$/.test(identifier);
   }
   ```
2. Update the `useEffect` in `ISBNFetcher`:
   - Check if the ISBN is an edition key using the detection function
   - If it's an edition key, skip the metadata fetch
   - Optionally show a message that this is an Open Library edition
   - For edition keys, you could directly save without fetching metadata
   - Or fetch from Open Library using: `https://openlibrary.org/books/{edition_key}.json`

### Step 5: UI/UX Enhancements

1. **Visual Mode Indicator**:
   - Add active/inactive styling to mode toggle buttons
   - Use different colors or borders to show which mode is active

2. **Search Instructions**:
   - Add helper text: "Search by title, author, or both"
   - Show example: "e.g., 'Moby Dick' or 'Herman Melville'"

3. **Dropdown Display**:
   - Show edition details clearly: Title, Author(s), Year, ISBN (if available)
   - Indicate when an edition has no ISBN
   - Limit dropdown height and make it scrollable

4. **Empty States**:
   - Show "No results found" when search returns empty
   - Show "Start typing to search..." when input is empty

5. **Loading States**:
   - Show spinner or loading text while searching
   - Disable dropdown during loading

6. **Keyboard Navigation**:
   - Allow Enter key to select first result
   - Arrow keys to navigate dropdown
   - Escape to close dropdown

### Step 6: Testing

1. **Test Search Functionality**:
   - Type a book title and verify results appear
   - Test debouncing (rapid typing should only search after pause)
   - Test empty search results
   - Test books with ISBNs in results
   - Test books without ISBNs in results

2. **Test Selection**:
   - Select an edition with ISBN - verify ISBN is used
   - Select an edition without ISBN - verify edition_key is used
   - Verify book is saved to correct group
   - Verify success message appears

3. **Test ISBNFetcher**:
   - Verify edition keys don't trigger ISBN-based metadata fetches
   - Verify books with real ISBNs still work normally

4. **Test Edge Cases**:
   - Search with special characters
   - Very long search queries
   - Network errors during search
   - Selecting before group is chosen

## Open Library API Details

### Search Endpoint

- **URL**: `https://openlibrary.org/search.json?q={query}&limit=20`
- **Method**: GET
- **Response**: JSON with `docs` array containing edition objects

### Response Structure

```json
{
  "docs": [
    {
      "title": "The Great Gatsby",
      "author_name": ["F. Scott Fitzgerald"],
      "first_publish_year": 1925,
      "edition_key": ["OL123456M"],
      "isbn": ["9780743273565", "0743273567"],
      "cover_i": 12345
    }
  ]
}
```

### Edition Key Format

- Pattern: `OL{numbers}{letter}`
- Examples: `OL123456M`, `OL7890123W`
- Always starts with "OL"
- Contains digits
- Ends with a single uppercase letter

## Identifier Strategy

### Books with ISBN

- Use the first ISBN from the `isbn[]` array
- Store directly in the `isbn` field
- Normal ISBN format (10 or 13 digits, may include X)

### Books without ISBN

- Use the first edition key from the `edition_key[]` array
- Store directly in the `isbn` field (even though it's not an ISBN)
- Format: `OL{numbers}{letter}` (e.g., `OL123456M`)
- Can be detected by pattern: `/^OL\d+[A-Z]$/`

## Notes

- Edition keys are stable identifiers that won't change
- Edition keys can be used for future metadata lookups if needed
- The database schema doesn't need changes - we're storing edition keys in the existing `isbn` field
- Consider adding a separate field in the future to distinguish between ISBNs and edition keys if
  needed
