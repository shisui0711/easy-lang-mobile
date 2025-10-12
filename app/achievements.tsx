import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Card, CardContent, Badge, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { gamificationApi } from '@/lib/api';
import { Achievement } from '@/types';

export default function AchievementsScreen() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filteredAchievements, setFilteredAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('rarity');

  // Categories for filtering
  const categories = [
    { id: 'all', name: 'All' },
    { id: 'streak', name: 'Streak' },
    { id: 'vocabulary', name: 'Vocabulary' },
    { id: 'writing', name: 'Writing' },
    { id: 'reading', name: 'Reading' },
    { id: 'listening', name: 'Listening' },
    { id: 'speaking', name: 'Speaking' },
    { id: 'milestone', name: 'Milestone' },
  ];

  useEffect(() => {
    fetchAchievements();
  }, [userId]);

  useEffect(() => {
    filterAndSortAchievements();
  }, [achievements, selectedCategory, sortBy]);

  const fetchAchievements = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await gamificationApi.getUserAchievements(userId);
      if (response.success) {
        // The actual achievements array is in response.data, not response directly
        setAchievements(Array.isArray(response.data) ? response.data : []);
      } else {
        Alert.alert('Error', response.error || 'Failed to fetch achievements');
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
      Alert.alert('Error', 'Failed to fetch achievements');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAchievements();
    setRefreshing(false);
  };

  const filterAndSortAchievements = () => {
    let result = [...achievements];

    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(achievement => achievement.category === selectedCategory);
    }

    // Apply sorting
    switch (sortBy) {
      case 'rarity':
        const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
        result.sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity]);
        break;
      case 'progress':
        result.sort((a, b) => (b.progress || 0) - (a.progress || 0));
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'earned':
        result.sort((a, b) => {
          const aEarned = a.earned ? 1 : 0;
          const bEarned = b.earned ? 1 : 0;
          return bEarned - aEarned;
        });
        break;
    }

    setFilteredAchievements(result);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return ['#F59E0B', '#D97706'];
      case 'epic': return ['#8B5CF6', '#7C3AED'];
      case 'rare': return ['#3B82F6', '#2563EB'];
      case 'uncommon': return ['#10B981', '#059669'];
      default: return ['#64748B', '#475569'];
    }
  };

  const earnedCount = achievements.filter(a => a.earned).length;
  const totalCount = achievements.length;

  const renderAchievement = ({ item }: { item: Achievement }) => {
    const rarityColors = getRarityColor(item.rarity);
    
    return (
      <TouchableOpacity 
        style={styles.achievementCard}
        onPress={() => {}} // Navigate to achievement detail
      >
        <View style={[styles.achievementIcon, { backgroundColor: `${rarityColors[0]}20` }]}>
          <Ionicons 
            name={item.icon as any || 'trophy'} 
            size={24} 
            color={rarityColors[0]} 
          />
        </View>
        <View style={styles.achievementInfo}>
          <View style={styles.achievementHeader}>
            <Text style={[styles.achievementName, !item.earned && styles.unearnedAchievement]}>
              {item.name}
            </Text>
            {item.earned && (
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            )}
          </View>
          <Text style={styles.achievementDescription}>{item.description}</Text>
          
          <View style={styles.achievementMeta}>
            <Badge 
              variant="secondary"
            >
              <Text style={{ color: rarityColors[0], textTransform: 'capitalize' }}>
                {item.rarity}
              </Text>
            </Badge>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          
          {!item.earned && item.progress !== undefined && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${(item.progress / (item.maxProgress || 1)) * 100}%`,
                      backgroundColor: rarityColors[0]
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {item.progress}/{item.maxProgress}
              </Text>
            </View>
          )}
          
          {item.earned && item.earnedAt && (
            <Text style={styles.earnedDate}>
              Earned {new Date(item.earnedAt).toLocaleDateString()}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Achievements</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="hourglass" size={32} color="#94A3B8" />
          <Text style={styles.loadingText}>Loading achievements...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Achievements</Text>
        <Text style={styles.headerSubtitle}>
          {earnedCount} of {totalCount} earned
        </Text>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.selectedCategoryButton
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === category.id && styles.selectedCategoryButtonText
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sortContainer}>
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => {
              const sortOptions = ['rarity', 'progress', 'name', 'earned'];
              const currentIndex = sortOptions.indexOf(sortBy);
              const nextIndex = (currentIndex + 1) % sortOptions.length;
              setSortBy(sortOptions[nextIndex]);
            }}
          >
            <Ionicons name="filter" size={20} color="#64748B" />
            <Text style={styles.sortButtonText}>
              Sort by {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredAchievements}
        renderItem={renderAchievement}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.achievementsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyText}>No achievements found</Text>
            <Text style={styles.emptySubtext}>Try changing your filters</Text>
          </View>
        }
      />

      <View style={styles.bottomSpacer} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  filtersContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  categoryScroll: {
    marginBottom: 12,
  },
  categoryScrollContent: {
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  selectedCategoryButton: {
    backgroundColor: '#3B82F6',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  selectedCategoryButtonText: {
    color: '#FFFFFF',
  },
  sortContainer: {
    alignItems: 'flex-end',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  sortButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  achievementsList: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  achievementCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  unearnedAchievement: {
    color: '#94A3B8',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  achievementMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'capitalize',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
    minWidth: 40,
    textAlign: 'right',
  },
  earnedDate: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 64,
    gap: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
  },
  bottomSpacer: {
    height: 100,
  },
});