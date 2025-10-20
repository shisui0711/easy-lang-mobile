import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent } from '@/components/ui';
import { UserProgress } from '../../types/speaking';

interface SkillLevelsProps {
  userProgress: UserProgress;
}

const SkillLevels: React.FC<SkillLevelsProps> = ({ userProgress }) => {
  return (
    <Card style={styles.skillsCard}>
      <CardContent style={styles.skillsCardContent}>
        <View style={styles.skillsHeader}>
          <Ionicons name="bar-chart" size={24} color="#3B82F6" />
          <Text style={styles.skillsTitle}>Skill Levels</Text>
        </View>
        <View style={styles.skillsList}>
          <View style={styles.skill}>
            <Text style={styles.skillLabel}>Conversation:</Text>
            <Text style={styles.skillValue}>{userProgress.speakingSkills.conversation}</Text>
          </View>
          <View style={styles.skill}>
            <Text style={styles.skillLabel}>Pronunciation:</Text>
            <Text style={styles.skillValue}>{userProgress.speakingSkills.pronunciation}</Text>
          </View>
          <View style={styles.skill}>
            <Text style={styles.skillLabel}>Fluency:</Text>
            <Text style={styles.skillValue}>{userProgress.speakingSkills.fluency}</Text>
          </View>
          <View style={styles.skill}>
            <Text style={styles.skillLabel}>Vocabulary:</Text>
            <Text style={styles.skillValue}>{userProgress.speakingSkills.vocabulary}</Text>
          </View>
        </View>
      </CardContent>
    </Card>
  );
};

const styles = StyleSheet.create({
  skillsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  skillsCardContent: {
    padding: 16,
  },
  skillsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  skillsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginLeft: 10,
  },
  skillsList: {
    gap: 12,
  },
  skill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skillLabel: {
    fontSize: 16,
    color: '#1E293B',
  },
  skillValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
});

export default SkillLevels;