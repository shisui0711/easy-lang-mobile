import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent } from '@/components/ui';
import { UserProgress } from '../../types/speaking';
import ProgressSummary from './ProgressSummary';
import SkillLevels from './SkillLevels';
import Achievements from './Achievements';

interface ProgressTabProps {
  userProgress: UserProgress;
}

const ProgressTab: React.FC<ProgressTabProps> = ({ userProgress }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Your Progress</Text>
      <Text style={styles.sectionSubtitle}>Track your speaking skills and achievements</Text>
      
      <ProgressSummary userProgress={userProgress} />
      <SkillLevels userProgress={userProgress} />
      <Achievements userProgress={userProgress} />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 16,
  },
});

export default ProgressTab;