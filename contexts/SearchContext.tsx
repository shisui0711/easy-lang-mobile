import React, { createContext, useContext, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';

interface SearchResult {
  id: string;
  type: 'vocabulary' | 'grammar' | 'writing' | 'reading' | 'listening' | 'speaking';
  title: string;
  description: string;
  moduleId?: string;
  lessonId?: string;
}

interface SearchContextValue {
  searchQuery: string;
  searchResults: SearchResult[];
  isSearching: boolean;
  setSearchQuery: (query: string) => void;
  performSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export const useSearch = (): SearchContextValue => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

interface SearchProviderProps {
  children: React.ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // In a real app, this would call an API endpoint to search across all content
      // For now, we'll simulate search results
      const response = await apiClient.get('/search', {
        params: { query }
      });
      
      if (response.success) {
        setSearchResults(response.data as SearchResult[]);
      } else {
        // Fallback to simulated results for demo
        const simulatedResults: SearchResult[] = [
          {
            id: '1',
            type: 'vocabulary',
            title: 'Hello',
            description: 'A common greeting in English',
            moduleId: 'vocabulary-1'
          },
          {
            id: '2',
            type: 'grammar',
            title: 'Present Tense',
            description: 'Learn how to use present tense verbs',
            moduleId: 'grammar-1'
          },
          {
            id: '3',
            type: 'writing',
            title: 'Essay Structure',
            description: 'How to structure an effective essay',
            moduleId: 'writing-1'
          }
        ];
        setSearchResults(simulatedResults);
      }
    } catch (error) {
      console.error('Search failed:', error);
      // Fallback to simulated results for demo
      const simulatedResults: SearchResult[] = [
        {
          id: '1',
          type: 'vocabulary',
          title: 'Hello',
          description: 'A common greeting in English',
          moduleId: 'vocabulary-1'
        },
        {
          id: '2',
          type: 'grammar',
          title: 'Present Tense',
          description: 'Learn how to use present tense verbs',
          moduleId: 'grammar-1'
        },
        {
          id: '3',
          type: 'writing',
          title: 'Essay Structure',
          description: 'How to structure an effective essay',
          moduleId: 'writing-1'
        }
      ];
      setSearchResults(simulatedResults);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const value: SearchContextValue = {
    searchQuery,
    searchResults,
    isSearching,
    setSearchQuery,
    performSearch,
    clearSearch
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};