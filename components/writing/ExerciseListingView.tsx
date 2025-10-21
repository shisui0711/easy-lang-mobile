import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, AntDesign } from '@expo/vector-icons';
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

interface ExerciseListingViewProps {
  exercises: WritingExercise[];
  submissions: Record<string, ExerciseSubmission>;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onStartExercise: (exercise: WritingExercise) => void;
  onStartChallenge: (challengeType: string) => void;
  getDifficultyColor: (difficulty: string) => [string, string];
  getStatusColor: (status: string) => [string, string];
}

export const ExerciseListingView: React.FC<ExerciseListingViewProps> = ({
  exercises,
  submissions,
  isLoading,
  searchQuery,
  onSearchChange,
  onStartExercise,
  onStartChallenge,
  getDifficultyColor,
  getStatusColor
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Writing Practice</Text>
        <Text style={styles.headerSubtitle}>Practice different types of writing with AI feedback</Text>
      </View>
      
      {/* Hero Card */}
      <LinearGradient
        colors={['#6366F1', '#8B5CF6']}
        style={styles.heroCard}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroIcon}>
            <MaterialIcons name="edit" size={32} color="white" />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Writing Practice</Text>
            <Text style={styles.heroSubtitle}>Practice different types of writing with AI feedback</Text>
          </View>
        </View>
        <View style={styles.heroFeatures}>
          <View style={styles.featureItem}>
            <AntDesign name="rocket" size={16} color="white" />
            <Text style={styles.featureText}>Multiple Writing Types</Text>
          </View>
          <View style={styles.featureItem}>
            <AntDesign name="star" size={16} color="white" />
            <Text style={styles.featureText}>AI-Powered Feedback</Text>
          </View>
          <View style={styles.featureItem}>
            <AntDesign name="clock-circle" size={16} color="white" />
            <Text style={styles.featureText}>Progress Tracking</Text>
          </View>
        </View>
      </LinearGradient>
      
      {/* Filters */}
      <Card style={styles.filtersCard}>
        <CardContent style={styles.filtersContent}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              value={searchQuery}
              onChangeText={onSearchChange}
            />
          </View>
        </CardContent>
      </Card>
      
      {/* Community Writing Challenges */}
      <View style={styles.challengesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Community Challenges</Text>
          <TouchableOpacity onPress={() => console.log('View all challenges')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.challengesList}>
          <TouchableOpacity 
            style={styles.challengeItem}
            onPress={() => onStartChallenge('weekly')}
          >
            <LinearGradient
              colors={['#8B5CF6', '#6366F1']}
              style={styles.challengeCard}
            >
              <View style={styles.challengeHeader}>
                <MaterialIcons name="emoji-events" size={24} color="white" />
                <View style={styles.challengeInfo}>
                  <Text style={styles.challengeTitle}>Weekly Writing Challenge</Text>
                  <Text style={styles.challengeSubtitle}>Creative Fiction</Text>
                </View>
              </View>
              <Text style={styles.challengeDescription}>
                Write a short story (200-500 words) based on this week's theme: "Unexpected Encounters"
              </Text>
              <View style={styles.challengeMeta}>
                <View style={styles.challengeMetaItem}>
                  <Ionicons name="time-outline" size={16} color="rgba(255, 255, 255, 0.9)" />
                  <Text style={styles.challengeMetaText}>7 days left</Text>
                </View>
                <View style={styles.challengeMetaItem}>
                  <Ionicons name="people-outline" size={16} color="rgba(255, 255, 255, 0.9)" />
                  <Text style={styles.challengeMetaText}>142 participants</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.challengeItem}
            onPress={() => onStartChallenge('vocabulary')}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.challengeCard}
            >
              <View style={styles.challengeHeader}>
                <MaterialIcons name="school" size={24} color="white" />
                <View style={styles.challengeInfo}>
                  <Text style={styles.challengeTitle}>Vocabulary Challenge</Text>
                  <Text style={styles.challengeSubtitle}>Advanced Words</Text>
                </View>
              </View>
              <Text style={styles.challengeDescription}>
                Use all 5 vocabulary words in a coherent paragraph: serendipity, ephemeral, ubiquitous, quintessential, mellifluous
              </Text>
              <View style={styles.challengeMeta}>
                <View style={styles.challengeMetaItem}>
                  <Ionicons name="time-outline" size={16} color="rgba(255, 255, 255, 0.9)" />
                  <Text style={styles.challengeMetaText}>3 days left</Text>
                </View>
                <View style={styles.challengeMetaItem}>
                  <Ionicons name="people-outline" size={16} color="rgba(255, 255, 255, 0.9)" />
                  <Text style={styles.challengeMetaText}>87 participants</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Exercise List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading writing exercises...</Text>
        </View>
      ) : exercises.length === 0 ? (
        <Card style={styles.emptyCard}>
          <CardContent style={styles.emptyContent}>
            <MaterialIcons name="edit" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Writing Exercises Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search.' : 'Writing exercises will appear here when available.'}
            </Text>
            {searchQuery && (
              <Button
                title="Clear Search"
                onPress={() => onSearchChange('')}
                variant="primary"
                style={styles.clearButton}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <View style={styles.exercisesList}>
          {exercises.map((exercise) => {
            const submission = submissions[exercise.id];
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
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  heroCard: {
    margin: 24,
    borderRadius: 16,
    padding: 20,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  heroFeatures: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    color: 'white',
  },
  filtersCard: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  filtersContent: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  challengesSection: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  challengesList: {
    gap: 16,
  },
  challengeItem: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  challengeCard: {
    padding: 20,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeInfo: {
    marginLeft: 12,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  challengeSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  challengeDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
    lineHeight: 20,
  },
  challengeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  challengeMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  challengeMetaText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  emptyCard: {
    margin: 24,
  },
  emptyContent: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  clearButton: {
    minWidth: 120,
  },
  exercisesList: {
    padding: 24,
    paddingTop: 0,
  },
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