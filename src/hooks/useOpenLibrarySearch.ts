import {useQuery} from '@tanstack/react-query';
import {useEffect, useState} from 'react';

export interface OpenLibraryWork {
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  edition_key?: string[]; // For edition results
  cover_edition_key?: string; // For work results - single edition key
  isbn?: string[];
  cover_i?: number;
  key?: string; // Work key like "/works/OL44966W"
}

interface SearchParams {
  title?: string;
  author?: string;
}

async function searchOpenLibrary(params: SearchParams): Promise<OpenLibraryWork[]> {
  const {title, author} = params;

  // Build query - prefer specific title/author search
  let query = '';
  if (title && author) {
    query = `title:${title} AND author:${author}`;
  } else if (title) {
    query = `title:${title}`;
  } else if (author) {
    query = `author:${author}`;
  }

  if (!query.trim()) return [];

  // Search for editions directly (more specific than works)
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Open Library search failed');
  const data = await res.json();
  return data.docs || [];
}

export function useOpenLibrarySearch(params: SearchParams) {
  const [debouncedParams, setDebouncedParams] = useState<SearchParams>({});

  // Debounce the search params
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedParams(params);
    }, 500);

    return () => clearTimeout(timer);
  }, [params.title, params.author]);

  const {
    data: works = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['openLibrarySearch', debouncedParams.title, debouncedParams.author],
    queryFn: () => searchOpenLibrary(debouncedParams),
    enabled: !!(debouncedParams.title?.trim() || debouncedParams.author?.trim()),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {works, isLoading, error};
}
