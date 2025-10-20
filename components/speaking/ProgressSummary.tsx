import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent } from '@/components/ui';
import { UserProgress } from '../../types/speaking';

interface ProgressSummaryProps {
  userProgress: UserProgress;
}

const formatTime = (minutes: number) => {
  return `${minutes} min`;
};

const ProgressSummary: React.FC<ProgressSummaryProps> = ({ userProgress }) => {
  return (
    <Card style={styles.progressCard}>
      <CardContent style={styles.progressCardContent}>
        <View style={styles.progressHeader}>
          <Ionicons name="stats-chart" size={24} color="#3B82F6" />
          <Text style={styles.progressTitle}>Progress Summary</Text>
        </View>
        <View style={styles.progressStats}>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatLabel}>Completed Scenarios:</Text>
            <Text style={styles.progressStatValue}>{userProgress.completedScenarios.length}</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatLabel}>Total Practice Time:</Text>
            <Text style={styles.progressStatValue}>{formatTime(userProgress.totalPracticeTime)}</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatLabel}>Current Streak:</Text>
            <Text style={styles.progressStatValue}>{userProgress.streak}</Text>
          </View>
        </View>
      </CardContent>
    </Card>
  );
};

const styles = StyleSheet.create({
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  progressCardContent: {
    padding: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginLeft: 10,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  progressStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B82F6',
  },
});

export default ProgressSummary;