import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Card, CardContent, Progress } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { gamificationApi } from '@/lib/api';
import { UserXP } from '@/types';

export default function LevelProgressScreen() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [levelInfo, setLevelInfo] = useState<UserXP | null>(null);
  const [loading, setLoading] = useState(true);
  const [xpHistory, setXpHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchLevelInfo();
    fetchXPHistory();
  }, [userId]);

  const fetchLevelInfo = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await gamificationApi.getUserLevel(userId);
      if (response.success) {
        const data = response.data as UserXP;
        setLevelInfo(data);
      } else {
        Alert.alert('Error', response.error || 'Failed to fetch level info');
      }
    } catch (error) {
      console.error('Error fetching level info:', error);
      Alert.alert('Error', 'Failed to fetch level info');
    } finally {
      setLoading(false);
    }
  };

  const fetchXPHistory = async () => {
    if (!userId) return;
    
    try {
      const response = await gamificationApi.getXPHistory(userId);
      if (response.success) {
        // Assuming the response data is an array of XP transactions
        setXpHistory(response.data as any[] || []);
      } else {
        console.log('Failed to fetch XP history:', response.error);
      }
    } catch (error) {
      console.error('Error fetching XP history:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Level Progress</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="hourglass" size={32} color="#94A3B8" />
          <Text style={styles.loadingText}>Loading level progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!levelInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Level Progress</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="stats-chart-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyText}>No level information available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const tierColors: Record<string, { border: string; bg: string; text: string; badge: string }> = {
    Bronze: { 
      border: '#F59E0B', 
      bg: '#FEF3C7', 
      text: '#92400E',
      badge: '🥉'
    },
    Silver: { 
      border: '#9CA3AF', 
      bg: '#E5E7EB', 
      text: '#4B5563',
      badge: '🥈'
    },
    Gold: { 
      border: '#F59E0B', 
      bg: '#FEF3C7', 
      text: '#92400E',
      badge: '🥇'
    },
    Platinum: { 
      border: '#60A5FA', 
      bg: '#DBEAFE', 
      text: '#1E40AF',
      badge: '🏆'
    },
    Diamond: { 
      border: '#A78BFA', 
      bg: '#EDE9FE', 
      text: '#5B21B6',
      badge: '💎'
    }
  };

  const currentTier = tierColors[levelInfo.levelTier] || tierColors.Bronze;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Level Progress</Text>
        <Text style={styles.headerSubtitle}>Track your learning journey</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Level Card */}
        <View style={styles.section}>
          <Card>
            <CardContent style={styles.levelCardContent}>
              <View style={[styles.levelHeader, { backgroundColor: currentTier.bg }]}>
                <Text style={[styles.levelTitle, { color: currentTier.text }]}>
                  Level {levelInfo.level} {levelInfo.levelName}
                </Text>
                <Text style={[styles.levelBadge, { color: currentTier.text }]}>
                  {currentTier.badge}
                </Text>
              </View>
              
              <View style={styles.levelProgressContainer}>
                <View style={styles.progressInfo}>
                  <Text style={[styles.xpText, { color: currentTier.text }]}>
                    XP: {levelInfo.totalXP?.toLocaleString() || '0'}
                  </Text>
                  <Text style={[styles.progressText, { color: currentTier.text }]}>
                    {Math.round(levelInfo.progress || 0)}% to Level {levelInfo.level + 1}
                  </Text>
                </View>
                <Progress 
                  value={levelInfo.progress || 0} 
                  style={styles.progressBar}
                  gradientColors={[currentTier.border, currentTier.border]}
                />
              </View>
              
              <View style={styles.levelDetails}>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: currentTier.text }]}>Tier</Text>
                  <Text style={[styles.detailValue, { color: currentTier.text }]}>{levelInfo.levelTier}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: currentTier.text }]}>Next Level</Text>
                  <Text style={[styles.detailValue, { color: currentTier.text }]}>
                    {(levelInfo.xpToNextLevel || 0).toLocaleString()} XP
                  </Text>
                </View>
              </View>
              
              {levelInfo.prestigeLevel > 0 && (
                <View style={[styles.prestigeContainer, { borderTopColor: currentTier.border + '40' }]}>
                  <Text style={[styles.prestigeTitle, { color: currentTier.text }]}>
                    Prestige Level {levelInfo.prestigeLevel}
                  </Text>
                  <Text style={[styles.prestigeText, { color: currentTier.text }]}>
                    Prestige Points: {levelInfo.prestigePoints}
                  </Text>
                </View>
              )}
            </CardContent>
          </Card>
        </View>

        {/* XP History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent XP Activity</Text>
          <Card>
            <CardContent style={styles.historyContent}>
              {xpHistory.length > 0 ? (
                xpHistory.slice(0, 10).map((entry, index) => (
                  <View 
                    key={index} 
                    style={[styles.historyItem, index < xpHistory.length - 1 && styles.historyItemBorder]}
                  >
                    <View style={styles.historyItemLeft}>
                      <Text style={styles.historyDescription}>{entry.description}</Text>
                      <Text style={styles.historyDate}>
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={[
                      styles.historyAmount,
                      entry.amount > 0 ? styles.positiveAmount : styles.negativeAmount
                    ]}>
                      {entry.amount > 0 ? '+' : ''}{entry.amount} XP
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyHistory}>
                  <Ionicons name="clipboard-outline" size={32} color="#94A3B8" />
                  <Text style={styles.emptyHistoryText}>No XP activity yet</Text>
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
  levelCard: {
    borderRadius: 16,
  },
  levelCardContent: {
    padding: 20,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  levelBadge: {
    fontSize: 24,
  },
  levelProgressContainer: {
    marginBottom: 20,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  levelDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.8,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  prestigeContainer: {
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
  },
  prestigeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  prestigeText: {
    fontSize: 14,
  },
  historyContent: {
    padding: 0,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  historyItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyItemLeft: {
    flex: 1,
  },
  historyDescription: {
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  positiveAmount: {
    color: '#10B981',
  },
  negativeAmount: {
    color: '#EF4444',
  },
  emptyHistory: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyHistoryText: {
    fontSize: 16,
    color: '#64748B',
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
  bottomSpacer: {
    height: 100,
  },
});