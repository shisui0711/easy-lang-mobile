import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Card, CardHeader, CardTitle, CardContent, Badge, Progress, Avatar, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { formatNumber, getAchievementColor } from '@/lib/utils';
import { streakApi } from '@/lib/api';
import { ApiResponse } from '@/types';

// Define types for streak data
interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  streakStartDate: string | null;
}

interface FreezeInfo {
  id: string;
  userId: string;
  expiresAt: string;
  days: number;
  createdAt: string;
}

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
  const { session } = useAuth();
  const user = session?.user;
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [freezeInfo, setFreezeInfo] = useState<FreezeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezeDays, setFreezeDays] = useState('3');

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

  // Fetch streak and freeze information
  useEffect(() => {
    const fetchStreakData = async () => {
      try {
        setLoading(true);
        // Fetch streak information
        const streakResponse = await streakApi.getStreak() as ApiResponse<{ streak: StreakInfo }>;
        if (streakResponse.success) {
          setStreakInfo(streakResponse.data!.streak);
        }

        // Fetch freeze information
        const freezeResponse = await streakApi.getFreezeInfo() as ApiResponse<{ freezeInfo: FreezeInfo | null }>;
        if (freezeResponse.success) {
          setFreezeInfo(freezeResponse.data!.freezeInfo);
        }
      } catch (error) {
        console.error('Error fetching streak data:', error);
        Alert.alert('Error', 'Failed to load streak information');
      } finally {
        setLoading(false);
      }
    };

    fetchStreakData();
  }, []);

  // Handle streak freeze
  const handleFreezeStreak = async () => {
    try {
      const days = parseInt(freezeDays);
      if (isNaN(days) || days < 1 || days > 30) {
        Alert.alert('Error', 'Please enter a valid number of days (1-30)');
        return;
      }

      const response = await streakApi.freezeStreak(days) as ApiResponse<any>;
      if (response.success) {
        Alert.alert('Success', `Streak frozen for ${days} days`);
        setShowFreezeModal(false);
        setFreezeDays('3');
        
        // Refresh freeze info
        const freezeResponse = await streakApi.getFreezeInfo() as ApiResponse<{ freezeInfo: FreezeInfo | null }>;
        if (freezeResponse.success) {
          setFreezeInfo(freezeResponse.data!.freezeInfo);
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to freeze streak');
      }
    } catch (error: any) {
      console.error('Error freezing streak:', error);
      Alert.alert('Error', error.message || 'Failed to freeze streak');
    }
  };

  // Handle streak unfreeze
  const handleUnfreezeStreak = async () => {
    try {
      const response = await streakApi.unfreezeStreak() as ApiResponse<any>;
      if (response.success) {
        Alert.alert('Success', 'Streak unfrozen successfully');
        
        // Refresh freeze info
        const freezeResponse = await streakApi.getFreezeInfo() as ApiResponse<{ freezeInfo: FreezeInfo | null }>;
        if (freezeResponse.success) {
          setFreezeInfo(freezeResponse.data!.freezeInfo);
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to unfreeze streak');
      }
    } catch (error: any) {
      console.error('Error unfreezing streak:', error);
      Alert.alert('Error', error.message || 'Failed to unfreeze streak');
    }
  };

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
                  <Text style={styles.userStatValue}>
                    {loading ? '...' : (streakInfo?.currentStreak || 0)}
                  </Text>
                  <Text style={styles.userStatLabel}>Day Streak</Text>
                  {freezeInfo && (
                    <Badge variant="warning" size="small">
                      Frozen
                    </Badge>
                  )}
                  {!freezeInfo && (
                    <TouchableOpacity onPress={() => setShowFreezeModal(true)}>
                      <Text style={styles.freezeLink}>Freeze</Text>
                    </TouchableOpacity>
                  )}
                  {freezeInfo && (
                    <TouchableOpacity onPress={handleUnfreezeStreak}>
                      <Text style={styles.freezeLink}>Unfreeze</Text>
                    </TouchableOpacity>
                  )}
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

      {/* Freeze Streak Modal */}
      <Modal
        visible={showFreezeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFreezeModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Freeze Your Streak</Text>
              <TouchableOpacity onPress={() => setShowFreezeModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>
              Protect your streak by freezing it for a specified number of days. 
              Your streak won{`'`}t decrease during this period.
            </Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Number of Days (1-30):</Text>
              <TextInput
                style={styles.input}
                value={freezeDays}
                onChangeText={setFreezeDays}
                keyboardType="numeric"
                placeholder="Enter days"
              />
            </View>
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowFreezeModal(false)}
                style={styles.modalButton}
              />
              <Button
                title="Freeze Streak"
                variant="primary"
                onPress={handleFreezeStreak}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    gap: 4,
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
  freezeLink: {
    fontSize: 12,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    minWidth: 100,
  },
});