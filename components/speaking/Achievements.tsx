import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent } from '@/components/ui';
import { UserProgress } from '../../types/speaking';

interface AchievementsProps {
  userProgress: UserProgress;
}

const Achievements: React.FC<AchievementsProps> = ({ userProgress }) => {
  return (
    <Card style={styles.achievementsCard}>
      <CardContent style={styles.achievementsCardContent}>
        <View style={styles.achievementsHeader}>
          <Ionicons name="trophy" size={24} color="#3B82F6" />
          <Text style={styles.achievementsTitle}>Achievements</Text>
        </View>
        <View style={styles.achievementsList}>
          {userProgress.achievements.map(achievement => (
            <View key={achievement} style={styles.achievement}>
              <Text style={styles.achievementText}>{achievement}</Text>
            </View>
          ))}
        </View>
      </CardContent>
    </Card>
  );
};

const styles = StyleSheet.create({
  achievementsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  achievementsCardContent: {
    padding: 16,
  },
  achievementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginLeft: 10,
  },
  achievementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  achievement: {
    backgroundColor: '#F0FDF4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    margin: 4,
  },
  achievementText: {
    fontSize: 14,
    color: '#15803D',
  },
});

export default Achievements;