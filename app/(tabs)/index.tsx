import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ColorValue
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Progress, Avatar } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { formatNumber, getEncouragementMessage } from '@/lib/utils';
import { streakApi, statsApi } from '@/lib/api';
import { ApiResponse } from '@/types';

// Define types for streak data
interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  streakStartDate: string | null;
}

// Define types for stats data
interface StatsData {
  overview: {
    currentStreak: number;
    totalVocabularyCards: number;
    userAchievements: number;
    totalAchievements: number;
    achievementProgress: number;
    writingSubmissions: number;
    averageWritingScore: number;
  };
  period: {
    totalNewCards: number;
    totalReviewCards: number;
    totalStudyTime: number;
    daysStudied: number;
    goalsMet: number;
    averageAccuracy: number;
    averageStudyTime: number;
  };
}

// Define types for quick actions
interface QuickAction {
  title: string;
  description: string;
  icon: "book" | "create" | "mic" | "trophy" | "flame" | "stats-chart" | "podium" | "diamond";
  gradient: [ColorValue, ColorValue];
  action: () => void;
  urgent?: boolean;
  badge?: string;
}

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { session } = useAuth();
  const user = session?.user;
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch streak information
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch streak data
        const streakResponse = await streakApi.getStreak() as ApiResponse<{ streak: StreakInfo }>;
        if (streakResponse.success) {
          setStreakInfo(streakResponse.data!.streak);
        }
        
        // Fetch stats data
        const statsResponse = await statsApi.getStats({ period: 'week' }) as ApiResponse<StatsData>;
        if (statsResponse.success) {
          setStatsData(statsResponse.data!);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Prepare stats data for display
  const stats = [
    {
      title: "Words Learned",
      value: loading ? "..." : (statsData?.period?.totalNewCards?.toString() || "0"),
      change: `+${statsData?.period?.totalReviewCards?.toString() || "0"} this week`,
      icon: "book" as const,
      color: ["#3B82F6", "#6366F1"] as [ColorValue, ColorValue],
      bgColor: "#EEF2FF"
    },
    {
      title: "Writing Score",
      value: loading ? "..." : `${statsData?.overview?.averageWritingScore?.toFixed(1) || "0"}/10`,
      change: "Current average",
      icon: "create" as const,
      color: ["#10B981", "#059669"] as [ColorValue, ColorValue],
      bgColor: "#ECFDF5"
    },
    {
      title: "Study Streak",
      value: `${loading ? '...' : (streakInfo?.currentStreak || 0)} days`,
      change: "Keep it up!",
      icon: "flame" as const,
      color: ["#F59E0B", "#D97706"] as [ColorValue, ColorValue],
      bgColor: "#FFFBEB"
    },
    {
      title: "Achievements",
      value: loading ? "..." : `${statsData?.overview?.userAchievements || 0}/${statsData?.overview?.totalAchievements || 0}`,
      change: `${statsData?.overview?.userAchievements ? statsData.overview.userAchievements : 0} unlocked`,
      icon: "trophy" as const,
      color: ["#EF4444", "#DC2626"] as [ColorValue, ColorValue],
      bgColor: "#FEF2F2"
    }
  ];

  const quickActions: QuickAction[] = [
    {
      title: "Review Vocabulary",
      description: `${statsData?.period?.totalReviewCards || 0} cards ready`,
      icon: "book",
      gradient: ["#3B82F6", "#6366F1"],
      action: () => router.push('/learn'),
      urgent: (statsData?.period?.totalReviewCards || 0) > 0
    },
    {
      title: "Practice Writing",
      description: "Continue essay",
      icon: "create",
      gradient: ["#10B981", "#059669"],
      action: () => router.push('/learn')
    },
    {
      title: "Speaking Practice",
      description: "Improve pronunciation",
      icon: "mic",
      gradient: ["#8B5CF6", "#7C3AED"],
      action: () => router.push('/learn')
    },
    {
      title: "Streak Dashboard",
      description: "View your streak progress",
      icon: "flame",
      gradient: ["#F59E0B", "#D97706"],
      action: () => router.push('/streak')
    }
  ];

  // Menu items for navigation to progress-related screens
  const progressMenuItems: QuickAction[] = [
    {
      title: "Level Progress",
      description: "Track your XP and level",
      icon: "stats-chart",
      gradient: ["#3B82F6", "#6366F1"],
      action: () => router.push('/level-progress')
    },
    {
      title: "Achievements",
      description: "View earned badges",
      icon: "trophy",
      gradient: ["#F59E0B", "#D97706"],
      action: () => router.push('/achievements')
    },
    {
      title: "Streak Dashboard",
      description: "View your streak progress",
      icon: "flame",
      gradient: ["#F59E0B", "#D97706"],
      action: () => router.push('/streak')
    },
    {
      title: "Leaderboard",
      description: "See how you rank",
      icon: "podium",
      gradient: ["#8B5CF6", "#7C3AED"],
      action: () => router.push('/leaderboard')
    },
    {
      title: "Prestige",
      description: "Reach new heights",
      icon: "diamond",
      gradient: ["#EC4899", "#DB2777"],
      action: () => router.push('/prestige')
    }
  ];

  const dailyProgress = {
    vocabulary: { 
      current: statsData?.period?.totalReviewCards || 0, 
      target: Math.max(20, (statsData?.period?.totalReviewCards || 0) + 5) 
    },
    writing: { 
      current: statsData?.overview?.writingSubmissions || 0, 
      target: Math.max(3, (statsData?.overview?.writingSubmissions || 0) + 1) 
    },
    overall: Math.round(statsData?.period?.averageAccuracy || 0)
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.firstName || 'Learner'}! 👋</Text>
              <Text style={styles.subtitle}>Ready to continue your learning journey?</Text>
            </View>
            <Avatar
              src={user?.avatar}
              firstName={user?.firstName}
              lastName={user?.lastName}
              size="large"
              gradientColors={["#3B82F6", "#8B5CF6"]}
            />
          </View>
          
          <View style={styles.badges}>
            <Badge variant="info" style={styles.badge}>
              <Ionicons name="star" size={12} color="#1E40AF" style={{ marginRight: 4 }} />
              Level {user?.level || 5}
            </Badge>
            <Badge variant="warning" style={styles.badge}>
              <Ionicons name="flame" size={12} color="#92400E" style={{ marginRight: 4 }} />
              {loading ? '...' : (streakInfo?.currentStreak || 0)} Day Streak
            </Badge>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <Card key={index} style={styles.statCard}>
              <CardContent style={styles.statCardContent}>
                <View style={styles.statHeader}>
                  <LinearGradient
                    colors={stat.color}
                    style={styles.statIcon}
                  >
                    <Ionicons name={stat.icon} size={20} color="#FFFFFF" />
                  </LinearGradient>
                  <Ionicons name="trending-up" size={16} color="#10B981" />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
                <Text style={styles.statChange}>{stat.change}</Text>
              </CardContent>
            </Card>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionSubtitle}>Continue your learning journey</Text>
          
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity key={index} onPress={action.action} style={styles.quickActionCard}>
                <LinearGradient
                  colors={action.gradient}
                  style={styles.quickActionGradient}
                >
                  <View style={styles.quickActionHeader}>
                    <Ionicons name={action.icon} size={24} color="#FFFFFF" />
                    {action.badge && (
                      <Badge variant="secondary" size="small">
                        {action.badge}
                      </Badge>
                    )}
                    {action.urgent && (
                      <View style={styles.urgentDot} />
                    )}
                  </View>
                  <Text style={styles.quickActionTitle}>{action.title}</Text>
                  <Text style={styles.quickActionDescription}>{action.description}</Text>
                  <View style={styles.quickActionFooter}>
                    <Text style={styles.quickActionCTA}>Start now</Text>
                    <Ionicons name="arrow-forward" size={16} color="rgba(255, 255, 255, 0.9)" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Progress Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress Tracking</Text>
          <Text style={styles.sectionSubtitle}>View your achievements and rankings</Text>
          
          <View style={styles.quickActionsGrid}>
            {progressMenuItems.map((item, index) => (
              <TouchableOpacity key={index} onPress={item.action} style={styles.quickActionCard}>
                <LinearGradient
                  colors={item.gradient}
                  style={styles.quickActionGradient}
                >
                  <View style={styles.quickActionHeader}>
                    <Ionicons name={item.icon} size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.quickActionTitle}>{item.title}</Text>
                  <Text style={styles.quickActionDescription}>{item.description}</Text>
                  <View style={styles.quickActionFooter}>
                    <Text style={styles.quickActionCTA}>View details</Text>
                    <Ionicons name="arrow-forward" size={16} color="rgba(255, 255, 255, 0.9)" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Progress */}
        <View style={styles.section}>
          <Card>
            <CardHeader>
              <CardTitle>
                <Ionicons name="analytics" size={20} color="#10B981" style={{ marginRight: 8 }} />
                Today&apos;s Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.progressSection}>
                <View style={styles.progressItem}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Vocabulary Reviews</Text>
                    <Text style={styles.progressValue}>
                      {dailyProgress.vocabulary.current}/{dailyProgress.vocabulary.target}
                    </Text>
                  </View>
                  <Progress 
                    value={(dailyProgress.vocabulary.current / dailyProgress.vocabulary.target) * 100}
                    gradientColors={["#10B981", "#059669"]}
                    style={styles.progressBar}
                  />
                </View>
                
                <View style={styles.progressItem}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Writing Practice</Text>
                    <Text style={styles.progressValue}>
                      {dailyProgress.writing.current}/{dailyProgress.writing.target}
                    </Text>
                  </View>
                  <Progress 
                    value={(dailyProgress.writing.current / dailyProgress.writing.target) * 100}
                    gradientColors={["#3B82F6", "#6366F1"]}
                    style={styles.progressBar}
                  />
                </View>
              </View>
              
              <Button
                title="Complete Daily Goal"
                variant="gradient"
                gradientColors={["#10B981", "#059669"]}
                fullWidth
                style={styles.completeGoalButton}
                onPress={() => {}}
              />
            </CardContent>
          </Card>
        </View>

        {/* Motivation Card */}
        <View style={styles.section}>
          <Card gradient gradientColors={["#3B82F6", "#8B5CF6", "#EC4899"]}>
            <CardContent style={styles.motivationCard}>
              <View style={styles.motivationContent}>
                <Text style={styles.motivationTitle}>🔥 Amazing {loading ? '...' : (streakInfo?.currentStreak || 0)}-day streak!</Text>
                <Text style={styles.motivationSubtitle}>
                  {getEncouragementMessage(dailyProgress.overall)}
                </Text>
              </View>
              <View style={styles.motivationStats}>
                <View style={styles.motivationStat}>
                  <Text style={styles.motivationStatValue}>{loading ? '...' : (streakInfo?.currentStreak || 0)}</Text>
                  <Text style={styles.motivationStatLabel}>Days</Text>
                </View>
                <View style={styles.motivationStat}>
                  <Text style={styles.motivationStatValue}>{formatNumber(user?.xp || statsData?.overview?.totalVocabularyCards || 0)}</Text>
                  <Text style={styles.motivationStatLabel}>Words</Text>
                </View>
              </View>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 16,
    color: '#64748B',
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 12,
  },
  statCard: {
    width: (width - 60) / 2,
    minHeight: 120,
    backgroundColor: '#FFFFFF',
  },
  statCardContent: {
    padding: 16,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  statChange: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: (width - 60) / 2,
    minHeight: 140,
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickActionGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  quickActionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    position: 'relative',
  },
  urgentDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  quickActionDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  quickActionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickActionCTA: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressItem: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  progressBar: {
    marginBottom: 4,
  },
  completeGoalButton: {
    marginTop: 8,
  },
  motivationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  motivationContent: {
    flex: 1,
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  motivationSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  motivationStats: {
    flexDirection: 'row',
    gap: 16,
  },
  motivationStat: {
    alignItems: 'center',
  },
  motivationStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  motivationStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  bottomSpacer: {
    height: 100,
  },
});