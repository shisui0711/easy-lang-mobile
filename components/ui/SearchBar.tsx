import React, { useState, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSearch } from '@/contexts/SearchContext';
import { useDebounce } from '@/lib/performance';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Spacing, Typography } from '@/constants/Tokens';

interface SearchBarProps {
  placeholder?: string;
  autoFocus?: boolean;
  onSearchFocus?: () => void;
  onSearchBlur?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  placeholder = 'Search vocabulary, grammar, lessons...', 
  autoFocus = false,
  onSearchFocus,
  onSearchBlur
}) => {
  const router = useRouter();
  const { searchQuery, setSearchQuery, performSearch } = useSearch();
  const [isFocused, setIsFocused] = useState(false);
  
  const backgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#1E293B' }, 'background');
  const textColor = useThemeColor({ light: '#1E293B', dark: '#F8FAFC' }, 'text');
  const borderColor = useThemeColor({ light: '#CBD5E1', dark: '#334155' }, 'border');
  const iconColor = useThemeColor({ light: '#94A3B8', dark: '#94A3B8' }, 'icon');

  // Debounced search to prevent too many API calls
  const debouncedSearch = useDebounce(performSearch, 300);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  }, [setSearchQuery, debouncedSearch]);

  const handleClear = useCallback(() => {
    setSearchQuery('');
    // Don't perform search with empty query to avoid unnecessary API calls
  }, [setSearchQuery]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onSearchFocus?.();
  }, [onSearchFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onSearchBlur?.();
  }, [onSearchBlur]);

  const handleSubmit = useCallback(() => {
    if (searchQuery.trim()) {
      // Navigate to search results screen
      router.push({
        pathname: '/(tabs)/learn',
        params: { query: searchQuery }
      });
    }
  }, [searchQuery, router]);

  return (
    <View style={[styles.container, { backgroundColor, borderColor, elevation: isFocused ? 4 : 2 }]}>
      <View style={styles.searchContainer}>
        <Ionicons 
          name="search" 
          size={20} 
          color={iconColor} 
          style={styles.searchIcon} 
        />
        <TextInput
          style={[styles.input, { color: textColor }]}
          placeholder={placeholder}
          placeholderTextColor={useThemeColor({ light: '#94A3B8', dark: '#94A3B8' }, 'text')}
          value={searchQuery}
          onChangeText={handleSearch}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoFocus={autoFocus}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          accessibilityLabel="Search input"
          accessibilityHint="Enter text to search across all learning content"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            onPress={handleClear}
            style={styles.clearButton}
            accessibilityLabel="Clear search"
            accessibilityHint="Clear the search text"
          >
            <Ionicons 
              name="close-circle" 
              size={20} 
              color={iconColor} 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.lg,
    borderWidth: 1,
    marginHorizontal: Spacing.xl,
    marginVertical: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: Typography.body.fontSize,
    fontWeight: '400',
  },
  clearButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
});