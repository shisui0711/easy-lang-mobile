import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Card, CardContent, Button, Avatar, Badge } from '@/components/ui';
import { ProgressChart } from '@/components/vocabulary/ProgressChart';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { FadeInLeftView, FadeInRightView } from '@/components/ui/AnimatedComponents';
import { SearchBar } from '@/components/ui/SearchBar';
import { FeedbackButton } from '@/components/ui/FeedbackButton';
import { Spacing, Typography } from '@/constants/Tokens';
import { useThemeColor } from '@/hooks/useThemeColor';

interface UserStats {
  level: number;
  xp: number;
  streak: number;
  wordsLearned: number;
  exercisesCompleted: number;
  timeStudied: number;
}

interface RecentActivity {
  id: string;
  type: 'vocabulary' | 'exercise' | 'writing' | 'speaking' | 'reading' | 'listening';
  title: string;
  description: string;
  timestamp: string;
  xp?: number;
}

export default function DashboardScreen() {
  const { session } = useAuth();
  const user = session?.user;
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({}, 'card');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch user stats
      const statsResponse = await apiClient.get('/user/stats');
      if (statsResponse.success) {
        setStats(statsResponse.data as UserStats);
      }

      // Fetch recent activities
      const activitiesResponse = await apiClient.get('/user/activities');
      if (activitiesResponse.success && Array.isArray(activitiesResponse.data)) {
        // Transform activities to match the expected format
        const transformedActivities = activitiesResponse.data.map((activity: any) => ({
          id: activity.id,
          type: activity.type as 'vocabulary' | 'exercise' | 'writing' | 'speaking' | 'reading' | 'listening',
          title: activity.title,
          description: activity.description,
          timestamp: activity.timestamp,
        }));
        setRecentActivities(transformedActivities);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const quickActions = [
    {
      title: 'Vocabulary',
      icon: 'book',
      color: '#3B82F6',
      onPress: () => router.push('/learn/vocabulary'),
    },
    {
      title: 'Speaking',
      icon: 'mic',
      color: '#10B981',
      onPress: () => router.push('/learn/speaking'),
    },
    {
      title: 'Listening',
      icon: 'headset',
      color: '#8B5CF6',
      onPress: () => router.push('/learn/listening'),
    },
    {
      title: 'Reading',
      icon: 'reader',
      color: '#F59E0B',
      onPress: () => router.push('/learn/reading'),
    },
  ];

  if (isLoading) {
    return <LoadingScreen message="Loading your dashboard..." skeletonType="card" />;
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load dashboard"
        message={error}
        onRetry={loadDashboardData}
        onGoBack={() => router.back()}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <FadeInLeftView>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, { color: textColor }]}>Dashboard</Text>
              <Text style={[styles.headerSubtitle, { color: textColor }]}>
                Welcome back, {user?.firstName}!
              </Text>
            </View>
            <Avatar
              src={user?.avatar}
              firstName={user?.firstName}
              lastName={user?.lastName}
              size="medium"
              gradientColors={['#3B82F6', '#8B5CF6']}
            />
          </View>
          <SearchBar placeholder="Search vocabulary, grammar, lessons..." />
        </FadeInLeftView>

        {/* Stats Cards */}
        <FadeInRightView>
          <View style={styles.statsGrid}>
            <Card style={[styles.statCard, { backgroundColor: cardColor }] as any}>
              <CardContent style={styles.statContent}>
                <View style={[styles.statIconContainer, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="star" size={20} color="#3B82F6" />
                </View>
                <Text style={[styles.statValue, { color: textColor }]}>{stats?.level || 0}</Text>
                <Text style={[styles.statLabel, { color: textColor }]}>Level</Text>
              </CardContent>
            </Card>

            <Card style={[styles.statCard, { backgroundColor: cardColor }] as any}>
              <CardContent style={styles.statContent}>
                <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="flame" size={20} color="#F59E0B" />
                </View>
                <Text style={[styles.statValue, { color: textColor }]}>{stats?.streak || 0}</Text>
                <Text style={[styles.statLabel, { color: textColor }]}>Day Streak</Text>
              </CardContent>
            </Card>

            <Card style={[styles.statCard, { backgroundColor: cardColor }] as any}>
              <CardContent style={styles.statContent}>
                <View style={[styles.statIconContainer, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="book" size={20} color="#10B981" />
                </View>
                <Text style={[styles.statValue, { color: textColor }]}>{stats?.wordsLearned || 0}</Text>
                <Text style={[styles.statLabel, { color: textColor }]}>Words</Text>
              </CardContent>
            </Card>

            <Card style={[styles.statCard, { backgroundColor: cardColor }] as any}>
              <CardContent style={styles.statContent}>
                <View style={[styles.statIconContainer, { backgroundColor: '#E0E7FF' }]}>
                  <Ionicons name="time" size={20} color="#3B82F6" />
                </View>
                <Text style={[styles.statValue, { color: textColor }]}>
                  {stats?.timeStudied ? Math.round(stats.timeStudied / 60) : 0}
                </Text>
                <Text style={[styles.statLabel, { color: textColor }]}>Minutes</Text>
              </CardContent>
            </Card>
          </View>
        </FadeInRightView>

        {/* Quick Actions */}
        <FadeInLeftView>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.quickActionCard, { backgroundColor: cardColor }] as any}
                  onPress={action.onPress}
                >
                  <View
                    style={[
                      styles.quickActionIconContainer,
                      { backgroundColor: `${action.color}20` },
                    ] as any}
                  >
                    <Ionicons name={action.icon as any} size={24} color={action.color} />
                  </View>
                  <Text style={[styles.quickActionTitle, { color: textColor }]}>{action.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </FadeInLeftView>

        {/* Progress Chart */}
        {/* <FadeInRightView>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Your Progress</Text>
            <Card style={[styles.chartCard, { backgroundColor: cardColor }] as any}>
              <CardContent style={styles.chartContent}>
                <ProgressChart />
              </CardContent>
            </Card>
          </View>
        </FadeInRightView> */}

        {/* Recent Activities */}
        <FadeInLeftView>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Recent Activity</Text>
            <Card style={[styles.activitiesCard, { backgroundColor: cardColor }] as any}>
              <CardContent style={styles.activitiesContent}>
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <View key={activity.id} style={styles.activityItem}>
                      <View style={styles.activityIconContainer}>
                        <Ionicons
                          name={renderActivityIcon(activity.type)}
                          size={20}
                          color={renderActivityColor(activity.type)}
                        />
                      </View>
                      <View style={styles.activityInfo}>
                        <Text style={[styles.activityTitle, { color: textColor }]}>
                          {activity.title}
                        </Text>
                        <Text style={[styles.activityDescription, { color: textColor }]}>
                          {activity.description}
                        </Text>
                      </View>
                      <Text style={[styles.activityTime, { color: textColor }]}>
                        {new Date(activity.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.noActivityText, { color: textColor }]}>
                    No recent activity
                  </Text>
                )}
              </CardContent>
            </Card>
          </View>
        </FadeInLeftView>

        <View style={styles.bottomSpacer} />
      </ScrollView>
      <FeedbackButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.heading1.fontSize,
    fontWeight: Typography.heading1.fontWeight,
    marginBottom: Spacing.sm,
  },
  headerSubtitle: {
    fontSize: Typography.body.fontSize,
  },
  statsGrid: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    width: '100%',
  },
  statContent: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: Typography.heading3.fontSize,
    fontWeight: Typography.heading3.fontWeight,
    marginBottom: Spacing.sm,
  },
  statLabel: {
    fontSize: Typography.bodySmall.fontSize,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.heading2.fontSize,
    fontWeight: Typography.heading2.fontWeight,
    marginBottom: Spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  quickActionCard: {
    width: '100%',
    borderRadius: Spacing.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  quickActionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionTitle: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
  },
  chartCard: {
    borderRadius: Spacing.md,
  },
  chartContent: {
    padding: Spacing.lg,
  },
  activitiesCard: {
    borderRadius: Spacing.md,
  },
  activitiesContent: {
    padding: 0,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  activityDescription: {
    fontSize: Typography.bodySmall.fontSize,
  },
  activityTime: {
    fontSize: Typography.caption.fontSize,
    color: '#94A3B8',
  },
  noActivityText: {
    textAlign: 'center',
    padding: Spacing.xl,
    fontSize: Typography.body.fontSize,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});

const renderActivityIcon = (type: string) => {
  switch (type) {
    case 'vocabulary':
      return 'book';
    case 'writing':
      return 'create';
    case 'speaking':
      return 'mic';
    case 'reading':
      return 'reader';
    case 'listening':
      return 'headset';
    default:
      return 'document';
  }
};

const renderActivityColor = (type: string) => {
  switch (type) {
    case 'vocabulary':
      return '#3B82F6';
    case 'writing':
      return '#10B981';
    case 'speaking':
      return '#8B5CF6';
    case 'reading':
      return '#F59E0B';
    case 'listening':
      return '#EF4444';
    default:
      return '#64748B';
  }
};