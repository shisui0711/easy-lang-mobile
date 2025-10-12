import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Card, CardContent, Avatar, Badge } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { socialApi } from '@/lib/api';
import { LeaderboardEntry } from '@/types';

export default function LeaderboardScreen() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('global');

  // Categories for filtering
  const categories = [
    { id: 'global', name: 'Global' },
    { id: 'weekly', name: 'Weekly' },
    { id: 'monthly', name: 'Monthly' },
    { id: 'friends', name: 'Friends' },
  ];

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedCategory]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      let response;
      
      switch (selectedCategory) {
        case 'friends':
          response = await socialApi.getFriendsLeaderboard(userId!, 20);
          break;
        case 'weekly':
          response = await socialApi.getTimeLeaderboard('weekly', 20);
          break;
        case 'monthly':
          response = await socialApi.getTimeLeaderboard('monthly', 20);
          break;
        default:
          response = await socialApi.getGlobalLeaderboard(20);
      }
      
      if (response.success) {
        // Assuming the response data is an array of leaderboard entries
        setLeaderboard(response.data as LeaderboardEntry[] || []);
      } else {
        Alert.alert('Error', response.error || 'Failed to fetch leaderboard');
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      Alert.alert('Error', 'Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboard();
    setRefreshing(false);
  };

  const renderLeaderboardItem = (item: LeaderboardEntry, index: number) => {
    const isCurrentUser = item.userId === userId;
    
    // Get medal icon for top 3 positions
    const getMedalIcon = (position: number) => {
      switch (position) {
        case 1: return '🥇';
        case 2: return '🥈';
        case 3: return '🥉';
        default: return null;
      }
    };

    const medalIcon = getMedalIcon(item.position);

    return (
      <View 
        key={item.userId} 
        style={[
          styles.leaderboardItem,
          isCurrentUser && styles.currentUserItem
        ]}
      >
        <View style={styles.positionContainer}>
          {medalIcon ? (
            <Text style={styles.medalIcon}>{medalIcon}</Text>
          ) : (
            <Text style={[styles.positionText, isCurrentUser && styles.currentUserPosition]}>
              {item.position}
            </Text>
          )}
        </View>
        
        <Avatar
          src={item.avatar}
          firstName={item.username}
          size="medium"
          style={styles.avatar}
        />
        
        <View style={styles.userInfo}>
          <Text style={[styles.username, isCurrentUser && styles.currentUsername]}>
            {item.username}
          </Text>
          <View style={styles.userStats}>
            <Text style={styles.userStat}>
              Level {item.level}
            </Text>
            <Text style={styles.userStat}>
              {item.totalXP.toLocaleString()} XP
            </Text>
          </View>
        </View>
        
        {item.streak > 0 && (
          <Badge variant="warning" style={styles.streakBadge}>
            <Ionicons name="flame" size={12} color="#92400E" style={{ marginRight: 4 }} />
            <Text style={styles.streakText}>{item.streak}</Text>
          </Badge>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Leaderboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="hourglass" size={32} color="#94A3B8" />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerSubtitle}>See how you rank against other learners</Text>
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
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.section}>
          <Card>
            <CardContent style={styles.leaderboardContent}>
              {leaderboard.length > 0 ? (
                leaderboard.map((item, index) => renderLeaderboardItem(item, index))
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="podium-outline" size={48} color="#94A3B8" />
                  <Text style={styles.emptyText}>No leaderboard data available</Text>
                </View>
              )}
            </CardContent>
          </Card>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  leaderboardContent: {
    padding: 0,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  currentUserItem: {
    backgroundColor: '#EFF6FF',
  },
  positionContainer: {
    width: 30,
    alignItems: 'center',
    marginRight: 12,
  },
  medalIcon: {
    fontSize: 20,
  },
  positionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  currentUserPosition: {
    color: '#3B82F6',
  },
  avatar: {
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  currentUsername: {
    color: '#3B82F6',
  },
  userStats: {
    flexDirection: 'row',
    gap: 8,
  },
  userStat: {
    fontSize: 12,
    color: '#64748B',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
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
    padding: 48,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
  },
  bottomSpacer: {
    height: 100,
  },
});
