import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent, Button } from '@/components/ui';
import { UserProgress } from '../../types/speaking';

interface RecommendationCardProps {
  userProgress: UserProgress;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ userProgress }) => {
  return (
    <Card style={styles.recommendationCard}>
      <CardContent style={styles.recommendationCardContent}>
        <View style={styles.recommendationHeader}>
          <Ionicons name="bulb" size={24} color="#F59E0B" />
          <Text style={styles.recommendationTitle}>Personalized Recommendation</Text>
        </View>
        <Text style={styles.recommendationText}>
          Based on your performance, we recommend focusing on{' '}
          {Object.entries(userProgress.speakingSkills)
            .filter(([skill, score]) => score < 70)
            .map(([skill]) => skill)
            .join(', ') || 'maintaining your current practice routine'}
        </Text>
        <Button 
          title="View Recommended Scenarios" 
          onPress={() => {
            // In a real implementation, this would filter to recommended scenarios
            Alert.alert('Recommendations', 'In a real app, this would show scenarios tailored to your needs.');
          }}
          style={styles.recommendationButton}
        />
      </CardContent>
    </Card>
  );
};

const styles = StyleSheet.create({
  recommendationCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  recommendationCardContent: {
    padding: 16,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginLeft: 10,
  },
  recommendationText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 15,
  },
  recommendationButton: {
    alignSelf: 'flex-start',
  },
});

export default RecommendationCard;