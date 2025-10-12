import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Card, CardContent, Button, Progress } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { gamificationApi } from '@/lib/api';
import { PrestigeInfo } from '@/types';

export default function PrestigeScreen() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [prestigeInfo, setPrestigeInfo] = useState<PrestigeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [canPrestige, setCanPrestige] = useState(false);

  useEffect(() => {
    fetchPrestigeInfo();
  }, [userId]);

  const fetchPrestigeInfo = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await gamificationApi.getUserPrestige(userId);
      if (response.success) {
        // Fix: Use response.data directly instead of response.data.data
        const data = response.data as PrestigeInfo;
        setPrestigeInfo(data);
        // Check if user can prestige (e.g., level 100 or higher)
        setCanPrestige(data?.level >= 100);
      } else {
        Alert.alert('Error', response.error || 'Failed to fetch prestige info');
      }
    } catch (error) {
      console.error('Error fetching prestige info:', error);
      Alert.alert('Error', 'Failed to fetch prestige info');
    } finally {
      setLoading(false);
    }
  };

  const handlePrestige = () => {
    Alert.alert(
      'Prestige Confirmation',
      'Are you sure you want to prestige? This will reset your level and XP, but you\'ll keep your achievements and gain prestige benefits.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Prestige', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await gamificationApi.performPrestige(userId!);
              if (response.success) {
                Alert.alert('Success', 'You have successfully prestiged!');
                // Refresh the prestige info after prestiging
                fetchPrestigeInfo();
              } else {
                Alert.alert('Error', response.error || 'Failed to prestige');
              }
            } catch (error) {
              console.error('Error during prestige:', error);
              Alert.alert('Error', 'Failed to prestige');
            }
          }
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Prestige</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="hourglass" size={32} color="#94A3B8" />
          <Text style={styles.loadingText}>Loading prestige information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!prestigeInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Prestige</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="diamond-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyText}>Prestige information not available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Prestige</Text>
        <Text style={styles.headerSubtitle}>Reach new heights with prestige</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Prestige Status */}
        <View style={styles.section}>
          <Card gradient gradientColors={['#8B5CF6', '#A78BFA']}>
            <CardContent style={styles.prestigeContent}>
              <View style={styles.prestigeHeader}>
                <Ionicons name="diamond" size={32} color="#FFFFFF" />
                <Text style={styles.prestigeTitle}>Prestige Level {prestigeInfo.level}</Text>
                <Text style={styles.prestigeSubtitle}>{prestigeInfo.title}</Text>
              </View>
              
              <View style={styles.prestigeStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{prestigeInfo.points}</Text>
                  <Text style={styles.statLabel}>Prestige Points</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>+{prestigeInfo.level * 10}%</Text>
                  <Text style={styles.statLabel}>XP Bonus</Text>
                </View>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Prestige Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prestige Requirements</Text>
          <Card>
            <CardContent style={styles.requirementsContent}>
              <View style={styles.requirementItem}>
                <View style={styles.requirementHeader}>
                  <Text style={styles.requirementTitle}>Level Requirement</Text>
                  {canPrestige ? (
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  ) : (
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  )}
                </View>
                <View style={styles.requirementProgress}>
                  <View style={styles.progressInfo}>
                    <Text style={styles.progressText}>Level 100</Text>
                    <Text style={styles.progressValue}>Level {prestigeInfo.level}</Text>
                  </View>
                  <Progress 
                    value={Math.min((prestigeInfo.level / 100) * 100, 100)} 
                    style={styles.progressBar}
                  />
                </View>
              </View>
              
              <View style={[styles.requirementItem, styles.requirementItemBorder]}>
                <View style={styles.requirementHeader}>
                  <Text style={styles.requirementTitle}>Achievement Milestones</Text>
                  <Ionicons name="help-circle-outline" size={20} color="#94A3B8" />
                </View>
                <Text style={styles.requirementDescription}>
                  Complete 50% of legendary achievements
                </Text>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Prestige Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prestige Benefits</Text>
          <Card>
            <CardContent style={styles.benefitsContent}>
              {prestigeInfo.benefits && prestigeInfo.benefits.length > 0 ? (
                prestigeInfo.benefits.map((benefit, index) => (
                  <View 
                    key={index} 
                    style={[styles.benefitItem, index < prestigeInfo.benefits.length - 1 && styles.benefitItemBorder]}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" style={styles.benefitIcon} />
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.benefitItem}>
                  <Text style={styles.benefitText}>No benefits available at this time</Text>
                </View>
              )}
            </CardContent>
          </Card>
        </View>

        {/* Prestige Button */}
        <View style={styles.section}>
          <Button
            title={canPrestige ? "Prestige Now" : "Prestige Unavailable"}
            onPress={handlePrestige}
            disabled={!canPrestige}
            variant={canPrestige ? "primary" : "secondary"}
            style={styles.prestigeButton}
            textStyle={styles.prestigeButtonText}
          />
          {!canPrestige && (
            <Text style={styles.prestigeInfoText}>
              Reach level 100 to unlock prestige. You need {100 - prestigeInfo.level} more levels.
            </Text>
          )}
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
  prestigeContent: {
    padding: 24,
    alignItems: 'center',
  },
  prestigeHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  prestigeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginVertical: 8,
  },
  prestigeSubtitle: {
    fontSize: 16,
    color: '#E2E8F0',
  },
  prestigeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#E2E8F0',
  },
  requirementsContent: {
    padding: 0,
  },
  requirementItem: {
    padding: 20,
  },
  requirementItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  requirementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requirementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  requirementProgress: {
    marginBottom: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#64748B',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  requirementDescription: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 28,
  },
  benefitsContent: {
    padding: 0,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  benefitItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  benefitIcon: {
    marginRight: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#1E293B',
    flex: 1,
  },
  prestigeButton: {
    paddingVertical: 16,
  },
  prestigeButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  prestigeInfoText: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
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