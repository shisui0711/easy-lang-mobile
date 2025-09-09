import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Progress, Avatar } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { formatNumber, getEncouragementMessage } from '@/lib/utils';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { session } = useAuth();
  const user = session?.user;

  // Mock data - replace with real API calls
  const stats = [
    {
      title: "Words Learned",
      value: "1,247",
      change: "+23 this week",
      icon: "book" as const,
      color: ["#3B82F6", "#6366F1"],
      bgColor: "#EEF2FF"
    },
    {
      title: "Writing Score",
      value: "8.5/10",
      change: "+0.5 improvement",
      icon: "create" as const,
      color: ["#10B981", "#059669"],
      bgColor: "#ECFDF5"
    },
    {
      title: "Study Streak",
      value: "7 days",
      change: "Personal best!",
      icon: "flame" as const,
      color: ["#F59E0B", "#D97706"],
      bgColor: "#FFFBEB"
    },
    {
      title: "Achievements",
      value: "12/30",
      change: "3 new unlocked",
      icon: "trophy" as const,
      color: ["#EF4444", "#DC2626"],
      bgColor: "#FEF2F2"
    }
  ];

  const quickActions = [
    {
      title: "Review Vocabulary",
      description: "17 cards ready",
      icon: "book" as const,
      gradient: ["#3B82F6", "#6366F1"],
      action: () => router.push('/learn'),
      urgent: true
    },
    {
      title: "Practice Writing",
      description: "Continue essay",
      icon: "create" as const,
      gradient: ["#10B981", "#059669"],
      action: () => router.push('/learn')
    },
    {
      title: "Speaking Practice",
      description: "Improve pronunciation",
      icon: "mic" as const,
      gradient: ["#8B5CF6", "#7C3AED"],
      action: () => router.push('/learn')
    },
    {
      title: "View Achievements",
      description: "3 new unlocked!",
      icon: "trophy" as const,
      gradient: ["#F59E0B", "#D97706"],
      action: () => router.push('/progress'),
      badge: "NEW"
    }
  ];

  const dailyProgress = {
    vocabulary: { current: 17, target: 20 },
    writing: { current: 2, target: 3 },
    overall: 85
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
              {user?.streak || 7} Day Streak
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

        {/* Today's Progress */}
        <View style={styles.section}>
          <Card>
            <CardHeader>
              <CardTitle>
                <Ionicons name="analytics" size={20} color="#10B981" style={{ marginRight: 8 }} />
                Todays Progress
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
                <Text style={styles.motivationTitle}>🔥 Amazing 7-day streak!</Text>
                <Text style={styles.motivationSubtitle}>
                  {getEncouragementMessage(dailyProgress.overall)}
                </Text>
              </View>
              <View style={styles.motivationStats}>
                <View style={styles.motivationStat}>
                  <Text style={styles.motivationStatValue}>7</Text>
                  <Text style={styles.motivationStatLabel}>Days</Text>
                </View>
                <View style={styles.motivationStat}>
                  <Text style={styles.motivationStatValue}>{formatNumber(user?.xp || 2450)}</Text>
                  <Text style={styles.motivationStatLabel}>Total XP</Text>
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
