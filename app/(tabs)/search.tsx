import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { SearchBar } from '@/components/ui/SearchBar';
import { Card, CardContent } from '@/components/ui/Card';
import { useSearch } from '@/contexts/SearchContext';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Spacing, Typography } from '@/constants/Tokens';

export default function SearchScreen() {
  const router = useRouter();
  const { query } = useLocalSearchParams();
  const { searchResults, isSearching, performSearch, setSearchQuery } = useSearch();
  const [error, setError] = useState<string | null>(null);
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({}, 'card');

  useEffect(() => {
    if (query && typeof query === 'string') {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [query, performSearch, setSearchQuery]);

  const handleSearchFocus = () => {
    // Do nothing special on focus
  };

  const handleSearchBlur = () => {
    // Do nothing special on blur
  };

  const renderSearchResult = ({ item }: { item: any }) => {
    const getIconName = () => {
      switch (item.type) {
        case 'vocabulary': return 'book';
        case 'grammar': return 'hammer';
        case 'writing': return 'create';
        case 'reading': return 'reader';
        case 'listening': return 'headset';
        case 'speaking': return 'mic';
        default: return 'document';
      }
    };

    const getModulePath = () => {
      switch (item.type) {
        case 'vocabulary': return '/learn/vocabulary';
        case 'grammar': return '/learn/grammar';
        case 'writing': return '/learn/writing';
        case 'reading': return '/learn/reading';
        case 'listening': return '/learn/listening';
        case 'speaking': return '/learn/speaking';
        default: return '/learn';
      }
    };

    return (
      <TouchableOpacity
        onPress={() => router.push(getModulePath())}
        style={{ marginBottom: Spacing.md }}
      >
        <Card style={[styles.resultCard, { backgroundColor: cardColor }] as any}>
          <CardContent style={styles.resultContent}>
            <View style={styles.resultIconContainer}>
              <Ionicons 
                name={getIconName()} 
                size={24} 
                color="#3B82F6" 
              />
            </View>
            <View style={styles.resultTextContainer}>
              <Text style={[styles.resultTitle, { color: textColor }]}>{item.title}</Text>
              <Text style={[styles.resultDescription, { color: textColor }]} numberOfLines={2}>
                {item.description}
              </Text>
              <Text style={styles.resultType}>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color="#94A3B8" 
            />
          </CardContent>
        </Card>
      </TouchableOpacity>
    );
  };

  if (isSearching) {
    return <LoadingScreen message="Searching..." skeletonType="list" />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Search</Text>
        <View style={styles.headerSpacer} />
      </View>

      <SearchBar 
        placeholder="Search all learning content..."
        onSearchFocus={handleSearchFocus}
        onSearchBlur={handleSearchBlur}
      />

      {error ? (
        <ErrorDisplay
          title="Search Error"
          message={error}
          onRetry={() => performSearch(query as string)}
        />
      ) : (
        <View style={styles.content}>
          {searchResults.length > 0 ? (
            <>
              <Text style={[styles.resultsCount, { color: textColor }]}>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
              </Text>
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.resultsList}
                showsVerticalScrollIndicator={false}
              />
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={64} color="#94A3B8" />
              <Text style={[styles.emptyTitle, { color: textColor }]}>No results found</Text>
              <Text style={[styles.emptySubtitle, { color: textColor }]}>
                Try different keywords or browse our learning modules
              </Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.heading2.fontSize,
    fontWeight: Typography.heading2.fontWeight,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  resultsCount: {
    fontSize: Typography.body.fontSize,
    marginBottom: Spacing.md,
  },
  resultsList: {
    paddingBottom: Spacing.xl,
  },
  resultCard: {
    borderRadius: Spacing.md,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  resultIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  resultTextContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  resultTitle: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  resultDescription: {
    fontSize: Typography.bodySmall.fontSize,
    marginBottom: Spacing.sm,
  },
  resultType: {
    fontSize: Typography.caption.fontSize,
    color: '#3B82F6',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 64,
  },
  emptyTitle: {
    fontSize: Typography.heading3.fontSize,
    fontWeight: Typography.heading3.fontWeight,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.body.fontSize,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});