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

import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Avatar } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { streakApi } from '@/lib/api';
import { ApiResponse } from '@/types';

// Define types for streak data
interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  streakStartDate: string | null;
  freezesAvailable: number;
  freezesUsed: number;
}

const { width } = Dimensions.get('window');

export default function StreakDashboardScreen() {
  const { session } = useAuth();
  const user = session?.user;
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch streak information
  useEffect(() => {
    const fetchStreakData = async () => {
      try {
        setLoading(true);
        const streakResponse = await streakApi.getStreak() as ApiResponse<{ streak: StreakInfo }>;
        if (streakResponse.success) {
          setStreakInfo(streakResponse.data!.streak);
        }
      } catch (error) {
        console.error('Error fetching streak data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStreakData();
  }, []);

  // Function to use a freeze
  const useFreeze = async () => {
    try {
      const response = await streakApi.freezeStreak(1) as ApiResponse<{ streak: StreakInfo }>;
      if (response.success) {
        setStreakInfo(response.data!.streak);
      }
    } catch (error) {
      console.error('Error using freeze:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Streak Dashboard</Text>
            <View style={{ width: 24 }} /> {/* Spacer for alignment */}
          </View>
          
          <View style={styles.streakHeader}>
            <View style={styles.streakInfo}>
              <Text style={styles.streakCount}>
                {loading ? '...' : (streakInfo?.currentStreak || 0)}
              </Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </View>
            <LinearGradient
              colors={["#F59E0B", "#D97706"]}
              style={styles.streakIcon}
            >
              <Ionicons name="flame" size={40} color="#FFFFFF" />
            </LinearGradient>
          </View>
          
          <View style={styles.streakStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {loading ? '...' : (streakInfo?.longestStreak || 0)}
              </Text>
              <Text style={styles.statLabel}>Longest</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {loading ? '...' : (streakInfo?.freezesAvailable || 0)}
              </Text>
              <Text style={styles.statLabel}>Freezes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {loading ? '...' : (streakInfo?.freezesUsed || 0)}
              </Text>
              <Text style={styles.statLabel}>Used</Text>
            </View>
          </View>
        </View>

        {/* Streak Calendar */}
        <View style={styles.section}>
          <Card>
            <CardHeader>
              <CardTitle>
                <Ionicons name="calendar" size={20} color="#3B82F6" style={{ marginRight: 8 }} />
                Streak Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={styles.placeholderText}>Calendar visualization would appear here</Text>
              <Text style={styles.comingSoonText}>Feature coming soon</Text>
            </CardContent>
          </Card>
        </View>

        {/* Streak Achievements */}
        <View style={styles.section}>
          <Card>
            <CardHeader>
              <CardTitle>
                <Ionicons name="trophy" size={20} color="#F59E0B" style={{ marginRight: 8 }} />
                Streak Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={styles.placeholderText}>Achievement tracking would appear here</Text>
              <Text style={styles.comingSoonText}>Feature coming soon</Text>
            </CardContent>
          </Card>
        </View>

        {/* Freeze Control */}
        <View style={styles.section}>
          <Card>
            <CardHeader>
              <CardTitle>
                <Ionicons name="snow" size={20} color="#3B82F6" style={{ marginRight: 8 }} />
                Streak Freeze
              </CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.freezeInfo}>
                <Text style={styles.freezeDescription}>
                  Protect your streak from being broken if you miss a day of learning.
                </Text>
                <View style={styles.freezeCount}>
                  <Ionicons name="snow" size={20} color="#3B82F6" />
                  <Text style={styles.freezeCountText}>
                    {loading ? '...' : (streakInfo?.freezesAvailable || 0)} available
                  </Text>
                </View>
              </View>
              <Button
                title="Use Freeze"
                variant="gradient"
                gradientColors={["#3B82F6", "#6366F1"]}
                disabled={loading || (streakInfo?.freezesAvailable || 0) <= 0}
                onPress={useFreeze}
                style={styles.freezeButton}
              />
            </CardContent>
          </Card>
        </View>

        {/* Streak Analytics */}
        <View style={styles.section}>
          <Card>
            <CardHeader>
              <CardTitle>
                <Ionicons name="analytics" size={20} color="#10B981" style={{ marginRight: 8 }} />
                Streak Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={styles.placeholderText}>Analytics visualization would appear here</Text>
              <Text style={styles.comingSoonText}>Feature coming soon</Text>
            </CardContent>
          </Card>
        </View>

        {/* Streak Tips */}
        <View style={styles.section}>
          <Card>
            <CardHeader>
              <CardTitle>
                <Ionicons name="bulb" size={20} color="#8B5CF6" style={{ marginRight: 8 }} />
                Streak Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.tipsGrid}>
                <View style={styles.tipCard}>
                  <View style={styles.tipIcon}>
                    <Ionicons name="calendar" size={20} color="#3B82F6" />
                  </View>
                  <Text style={styles.tipTitle}>Set a Routine</Text>
                  <Text style={styles.tipDescription}>Study at the same time each day to build a habit.</Text>
                </View>
                
                <View style={styles.tipCard}>
                  <View style={styles.tipIcon}>
                    <Ionicons name="time" size={20} color="#10B981" />
                  </View>
                  <Text style={styles.tipTitle}>Start Small</Text>
                  <Text style={styles.tipDescription}>Even 10 minutes daily is better than nothing.</Text>
                </View>
                
                <View style={styles.tipCard}>
                  <View style={styles.tipIcon}>
                    <Ionicons name="trophy" size={20} color="#F59E0B" />
                  </View>
                  <Text style={styles.tipTitle}>Celebrate Wins</Text>
                  <Text style={styles.tipDescription}>Acknowledge your progress to stay motivated.</Text>
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
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  streakInfo: {
    alignItems: 'flex-start',
  },
  streakCount: {
    fontSize: 48,
    fontWeight: '800',
    color: '#1E293B',
  },
  streakLabel: {
    fontSize: 16,
    color: '#64748B',
  },
  streakIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginVertical: 16,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  freezeInfo: {
    marginBottom: 16,
  },
  freezeDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 20,
  },
  freezeCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  freezeCountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
  },
  freezeButton: {
    alignSelf: 'flex-start',
  },
  tipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tipCard: {
    width: (width - 72) / 2,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  bottomSpacer: {
    height: 100,
  },
});