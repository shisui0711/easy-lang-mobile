import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Card, CardContent, Button, Badge } from '@/components/ui';

interface WritingExercise {
  id: string;
  title: string;
  instructions?: string;
  level: string;
  difficulty: string;
  type: 'TRANSLATION' | 'CREATIVE' | 'ESSAY' | 'JOURNAL' | 'CHALLENGE';
  sourceLanguage?: string;
  targetLanguage?: string;
  totalSentences?: number;
  estimatedTime: number;
  wordLimit?: number;
  topic?: {
    id: string;
    name: string;
  };
  sentences?: {
    id: string;
    orderIndex: number;
    sourceText: string;
    difficulty: string;
  }[];
  _count: {
    submissions: number;
    sentences: number;
  };
}

interface ExerciseSubmission {
  id: string;
  status: string;
  currentSentenceIndex: number;
  completedSentences: number;
  overallAccuracy?: number;
  totalTimeSpent: number;
  content?: string;
}

interface ExerciseCardProps {
  exercise: WritingExercise;
  submission: ExerciseSubmission | undefined;
  onStartExercise: (exercise: WritingExercise) => void;
  getDifficultyColor: (difficulty: string) => [string, string];
  getStatusColor: (status: string) => [string, string];
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  submission,
  onStartExercise,
  getDifficultyColor,
  getStatusColor
}) => {
  const progress = submission && exercise.totalSentences
    ? (submission.completedSentences / (exercise.totalSentences || 1)) * 100
    : 0;

  return (
    <TouchableOpacity
      key={exercise.id}
      onPress={() => onStartExercise(exercise)}
      style={styles.exerciseItem}
    >
      <Card style={styles.exerciseCard}>
        <CardContent style={styles.cardContent}>
          <View style={styles.exerciseHeader}>
            <Text style={styles.exerciseTitle} numberOfLines={2}>{exercise.title}</Text>
            <View style={styles.exerciseBadges}>
              <LinearGradient
                colors={getDifficultyColor(exercise.difficulty)}
                style={styles.difficultyBadgeSmall}
              >
                <Text style={styles.difficultyBadgeTextSmall}>
                  {exercise.difficulty}
                </Text>
              </LinearGradient>
              {submission && (
                <LinearGradient
                  colors={getStatusColor(submission.status)}
                  style={styles.statusBadge}
                >
                  <Text style={styles.statusBadgeText}>
                    {submission.status.replace('_', ' ')}
                  </Text>
                </LinearGradient>
              )}
            </View>
          </View>
          
          {exercise.instructions && (
            <Text style={styles.exerciseDescription} numberOfLines={2}>
              {exercise.instructions}
            </Text>
          )}
          
          <View style={styles.exerciseDetails}>
            <View style={styles.detailItem}>
              <MaterialIcons name="edit" size={16} color="#94A3B8" />
              <Text style={styles.detailText}>
                {exercise.sourceLanguage || 'EN'} → {exercise.targetLanguage || 'VI'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialIcons name="format-list-numbered" size={16} color="#94A3B8" />
              <Text style={styles.detailText}>{exercise.totalSentences || 0} sentences</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={16} color="#94A3B8" />
              <Text style={styles.detailText}>~{exercise.estimatedTime} min</Text>
            </View>
            {exercise.topic && (
              <View style={styles.detailItem}>
                <Badge style={styles.topicBadgeSmall}>
                  <Text style={styles.topicBadgeTextSmall}>{exercise.topic.name}</Text>
                </Badge>
              </View>
            )}
          </View>
          
          {submission && (
            <View style={styles.progressSection}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressValue}>
                  {submission.completedSentences}/{exercise.totalSentences || 0}
                </Text>
              </View>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${progress}%` }
                  ]} 
                />
              </View>
              {submission.overallAccuracy && (
                <Text style={styles.accuracyText}>
                  Accuracy: {Math.round(submission.overallAccuracy)}%
                </Text>
              )}
            </View>
          )}
          
          <View style={styles.exerciseFooter}>
            <Button
              title={
                submission?.status === 'completed' ? 'Completed' :
                submission?.status === 'in_progress' ? 'Continue' :
                'Start'
              }
              onPress={() => onStartExercise(exercise)}
              disabled={submission?.status === 'completed'}
              variant={
                submission?.status === 'completed' ? 'secondary' :
                submission?.status === 'in_progress' ? 'primary' :
                'primary'
              }
              style={styles.startButton}
            />
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  exerciseItem: {
    marginBottom: 16,
  },
  exerciseCard: {
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 20,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    marginRight: 12,
  },
  exerciseBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyBadgeTextSmall: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  exerciseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#64748B',
  },
  topicBadgeSmall: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topicBadgeTextSmall: {
    fontSize: 10,
    fontWeight: '500',
    color: '#475569',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  accuracyText: {
    fontSize: 12,
    color: '#64748B',
  },
  exerciseFooter: {
    alignItems: 'flex-end',
  },
  startButton: {
    minWidth: 100,
  },
});