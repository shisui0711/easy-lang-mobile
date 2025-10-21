import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Badge } from '@/components/ui';
import { ReadingExercise } from './types';

interface ExerciseCardProps {
  exercise: ReadingExercise;
  onPress: () => void;
}

export default function ExerciseCard({ exercise, onPress }: ExerciseCardProps) {
  const getLevelColor = (level: string): [string, string] => {
    switch (level) {
      case 'Beginner':
        return ['#10B981', '#059669'];
      case 'Intermediate':
        return ['#3B82F6', '#6366F1'];
      case 'Advanced':
        return ['#8B5CF6', '#7C3AED'];
      default:
        return ['#6B7280', '#4B5563'];
    }
  };

  // Function to get readability indicator
  const getReadabilityIndicator = (exercise: ReadingExercise) => {
    if (exercise.readabilityScore === undefined) return null;
    
    let indicator = '';
    let color = '#6B7280';
    
    if (exercise.readabilityScore >= 80) {
      indicator = 'Easy';
      color = '#10B981';
    } else if (exercise.readabilityScore >= 50) {
      indicator = 'Medium';
      color = '#3B82F6';
    } else {
      indicator = 'Hard';
      color = '#EF4444';
    }
    
    return (
      <Badge style={[styles.readabilityBadge, { backgroundColor: color }]}>
        <Text style={styles.readabilityBadgeText}>{indicator}</Text>
      </Badge>
    );
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.exerciseCard}
    >
      <LinearGradient
        colors={getLevelColor(exercise.level)}
        style={styles.exerciseGradient}
      >
        <View style={styles.exerciseHeader}>
          <Badge style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>{exercise.level}</Text>
          </Badge>
          <Text style={styles.typeText}>{exercise.type.replace('_', ' ')}</Text>
          {getReadabilityIndicator(exercise)}
        </View>
        <Text style={styles.exerciseTitle}>{exercise.title}</Text>
        {exercise.topic && (
          <Text style={styles.topicText}>{exercise.topic.name} • {exercise.level}</Text>
        )}
        <Text style={styles.exerciseContentPreview}>
          {exercise.content.substring(0, 100)}...
        </Text>
        <View style={styles.exerciseDetails}>
          {exercise.wordCount && (
            <View key="word-count" style={styles.detailItem}>
              <Text style={styles.detailText}>{exercise.wordCount} words</Text>
            </View>
          )}
          <View key="time" style={styles.detailItem}>
            <Text style={styles.detailText}>{exercise.estimatedTime} min</Text>
          </View>
          {(exercise.questions || exercise.comprehensionQuestions) && (
            <View key="questions" style={styles.detailItem}>
              <Text style={styles.detailText}>{(exercise.questions || exercise.comprehensionQuestions)?.length} questions</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  exerciseCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  exerciseGradient: {
    padding: 20,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '600' as '600',
    color: '#FFFFFF',
  },
  typeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500' as '500',
  },
  readabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  readabilityBadgeText: {
    fontSize: 10,
    fontWeight: '600' as '600',
    color: '#FFFFFF',
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: 'bold' as 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  topicText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  exerciseContentPreview: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
    lineHeight: 20,
  },
  exerciseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as 'wrap',
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
});