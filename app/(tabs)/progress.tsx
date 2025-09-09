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

import { Card, CardHeader, CardTitle, CardContent, Badge, Progress, Avatar } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { formatNumber, getAchievementColor } from '@/lib/utils';

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
  const { session } = useAuth();
  const user = session?.user;

  // Mock data - replace with real API calls
  const weeklyStats = [
    { day: 'Mon', xp: 120, completed: true },
    { day: 'Tue', xp: 85, completed: true },
    { day: 'Wed', xp: 150, completed: true },
    { day: 'Thu', xp: 95, completed: true },
    { day: 'Fri', xp: 110, completed: true },
    { day: 'Sat', xp: 75, completed: true },
    { day: 'Sun', xp: 0, completed: false },
  ];

  const achievements = [
    {
      id: '1',
      name: 'Word Master',
      description: 'Learned 1000 words',
      icon: 'book',
      rarity: 'epic',
      unlocked: true,
      progress: 100,
      maxProgress: 100,
    },
    {
      id: '2',
      name: 'Perfect Week',
      description: '7 day study streak',
      icon: 'flame',
      rarity: 'rare',
      unlocked: true,
      progress: 100,
      maxProgress: 100,
    },
    {
      id: '3',
      name: 'Writing Expert',
      description: 'Complete 50 writing exercises',
      icon: 'create',
      rarity: 'rare',
      unlocked: false,
      progress: 32,
      maxProgress: 50,
    },
    {
      id: '4',
      name: 'Speed Reader',
      description: 'Read 100 articles',
      icon: 'eye',
      rarity: 'common',
      unlocked: false,
      progress: 67,
      maxProgress: 100,
    },
  ];

  const skillLevels = [
    { skill: 'Vocabulary', level: 8, progress: 75, color: ['#3B82F6', '#6366F1'] },
    { skill: 'Grammar', level: 6, progress: 45, color: ['#10B981', '#059669'] },
    { skill: 'Speaking', level: 7, progress: 60, color: ['#8B5CF6', '#7C3AED'] },
    { skill: 'Listening', level: 5, progress: 30, color: ['#F59E0B', '#D97706'] },
    { skill: 'Reading', level: 6, progress: 55, color: ['#EF4444', '#DC2626'] },
    { skill: 'Writing', level: 4, progress: 20, color: ['#06B6D4', '#0891B2'] },
  ];

  const renderWeeklyChart = () => {
    const maxXP = Math.max(...weeklyStats.map(stat => stat.xp));
    
    return (
      <View style={styles.chartContainer}>
        {weeklyStats.map((stat, index) => (
          <View key={index} style={styles.chartItem}>
            <View style={styles.chartBar}>
              <View
                style={[
                  styles.chartBarFill,
                  {
                    height: `${(stat.xp / maxXP) * 100}%`,
                    backgroundColor: stat.completed ? '#10B981' : '#E2E8F0',
                  },
                ]}
              />
            </View>
            <Text style={styles.chartDay}>{stat.day}</Text>
            <Text style={styles.chartXP}>{stat.xp}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderAchievement = (achievement: any) => (
    <TouchableOpacity key={achievement.id} style={styles.achievementCard}>
      <View style={[
        styles.achievementIcon,
        { backgroundColor: getAchievementColor(achievement.rarity) + '20' }
      ]}>
        <Ionicons
          name={achievement.icon as any}
          size={24}
          color={getAchievementColor(achievement.rarity)}
        />
      </View>
      <View style={styles.achievementInfo}>
        <View style={styles.achievementHeader}>
          <Text style={[
            styles.achievementName,
            { opacity: achievement.unlocked ? 1 : 0.6 }
          ]}>
            {achievement.name}
          </Text>
          <Badge
            variant={achievement.unlocked ? 'success' : 'secondary'}
            size="small"
          >
            {achievement.rarity}
          </Badge>
        </View>
        <Text style={styles.achievementDescription}>
          {achievement.description}
        </Text>
        {!achievement.unlocked && (
          <View style={styles.achievementProgress}>
            <Progress
              value={(achievement.progress / achievement.maxProgress) * 100}
              height={4}
              gradientColors={[getAchievementColor(achievement.rarity), getAchievementColor(achievement.rarity)]}
            />
            <Text style={styles.achievementProgressText}>
              {achievement.progress}/{achievement.maxProgress}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSkillLevel = (skill: any, index: number) => (
    <View key={index} style={styles.skillItem}>
      <View style={styles.skillHeader}>
        <Text style={styles.skillName}>{skill.skill}</Text>
        <Badge variant="info" size="small">Level {skill.level}</Badge>
      </View>
      <Progress
        value={skill.progress}
        gradientColors={skill.color}
        style={styles.skillProgress}
      />
      <Text style={styles.skillProgressText}>{skill.progress}% to next level</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress</Text>
        <Text style={styles.headerSubtitle}>Track your learning journey</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* User Stats Overview */}
        <View style={styles.section}>
          <Card gradient gradientColors={['#3B82F6', '#8B5CF6']}>
            <CardContent style={styles.userStatsContent}>
              <View style={styles.userStatsHeader}>
                <Avatar
                  src={user?.avatar}
                  firstName={user?.firstName}
                  lastName={user?.lastName}
                  size="large"
                  gradientColors={['#FFFFFF', '#F1F5F9']}
                />
                <View style={styles.userStatsInfo}>
                  <Text style={styles.userStatsName}>
                    {user?.firstName} {user?.lastName}
                  </Text>
                  <Text style={styles.userStatsLevel}>Level {user?.level || 5}</Text>
                  <Text style={styles.userStatsXP}>
                    {formatNumber(user?.xp || 2450)} XP
                  </Text>
                </View>
              </View>
              <View style={styles.userStatsGrid}>
                <View style={styles.userStatItem}>
                  <Text style={styles.userStatValue}>7</Text>
                  <Text style={styles.userStatLabel}>Day Streak</Text>
                </View>
                <View style={styles.userStatItem}>
                  <Text style={styles.userStatValue}>1,247</Text>
                  <Text style={styles.userStatLabel}>Words Learned</Text>
                </View>
                <View style={styles.userStatItem}>
                  <Text style={styles.userStatValue}>85%</Text>
                  <Text style={styles.userStatLabel}>Weekly Goal</Text>
                </View>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Weekly Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Activity</Text>
          <Card>
            <CardContent style={styles.weeklyContent}>
              {renderWeeklyChart()}
              <Text style={styles.weeklyTotal}>
                Total this week: {weeklyStats.reduce((sum, stat) => sum + stat.xp, 0)} XP
              </Text>
            </CardContent>
          </Card>
        </View>

        {/* Skill Levels */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skill Levels</Text>
          <Card>
            <CardContent style={styles.skillsContent}>
              {skillLevels.map((skill, index) => renderSkillLevel(skill, index))}
            </CardContent>
          </Card>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <View style={styles.achievementsHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Badge variant="info" size="small">
              {achievements.filter(a => a.unlocked).length}/{achievements.length}
            </Badge>
          </View>
          <View style={styles.achievementsList}>
            {achievements.map(renderAchievement)}
          </View>
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
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  userStatsContent: {
    padding: 20,
  },
  userStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  userStatsInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userStatsName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userStatsLevel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  userStatsXP: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  userStatItem: {
    alignItems: 'center',
  },
  userStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  weeklyContent: {
    padding: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 16,
  },
  chartItem: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    height: 80,
    width: 24,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  chartBarFill: {
    borderRadius: 12,
    minHeight: 4,
  },
  chartDay: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  chartXP: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  weeklyTotal: {
    textAlign: 'center',
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  skillsContent: {
    padding: 20,
  },
  skillItem: {
    marginBottom: 20,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  skillProgress: {
    marginBottom: 4,
  },
  skillProgressText: {
    fontSize: 12,
    color: '#64748B',
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementsList: {
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
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
  achievementDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  achievementProgress: {
    gap: 4,
  },
  achievementProgressText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
  },
  bottomSpacer: {
    height: 100,
  },
});