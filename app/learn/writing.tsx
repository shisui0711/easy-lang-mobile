import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Card, CardContent, Badge, Button } from '@/components/ui';
import { apiClient } from '@/lib/api';

interface WritingExercise {
  id: string;
  title: string;
  description: string;
  type: 'SENTENCE' | 'PARAGRAPH' | 'IELTS_TASK_1' | 'IELTS_TASK_2';
  level: string;
  prompt: string;
  requirements?: string[];
  wordLimit?: number;
  timeLimit?: number;
  topic?: {
    id: string;
    name: string;
  };
}

interface WritingSubmission {
  id: string;
  exerciseId: string;
  content: string;
  score?: number;
  feedback?: any;
  status: string;
  submittedAt: string;
  writingTime?: number;
}

export default function WritingScreen() {
  const [exercises, setExercises] = useState<WritingExercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<WritingExercise | null>(null);
  const [writingContent, setWritingContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'practice' | 'write' | 'progress'>('practice');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<WritingSubmission[]>([]);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    fetchExercises();
    fetchSubmissions();
  }, []);

  useEffect(() => {
    // Update word count
    const words = writingContent.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [writingContent]);

  const fetchExercises = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/writing/exercises', {
        type: 'SENTENCE',
        level: 'Beginner',
        pageSize: 20
      });
      if (response.success && response.data) {
        setExercises((response.data as any).data || []);
      }
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
      Alert.alert('Error', 'Failed to load writing exercises');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await apiClient.get('/writing/submissions');
      if (response.success && response.data) {
        setSubmissions((response.data as any).data || []);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
  };

  const startWriting = (exercise: WritingExercise) => {
    setSelectedExercise(exercise);
    setWritingContent('');
    setStartTime(Date.now());
    setActiveTab('write');
  };

  const submitWriting = async () => {
    if (!selectedExercise || !writingContent.trim() || !startTime) {
      Alert.alert('Error', 'Please write something before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      const writingTime = Math.floor((Date.now() - startTime) / 1000);
      
      const response = await apiClient.post('/writing/submissions', {
        exerciseId: selectedExercise.id,
        content: writingContent,
        writingTime
      });

      if (response.success) {
        Alert.alert(
          'Success!',
          'Your writing has been submitted for review.',
          [
            { text: 'Write Another', onPress: () => setActiveTab('practice') },
            { text: 'View Progress', onPress: () => setActiveTab('progress') }
          ]
        );
        setSelectedExercise(null);
        setWritingContent('');
        setStartTime(null);
        fetchSubmissions();
      } else {
        Alert.alert('Error', response.error || 'Failed to submit writing');
      }
    } catch (error) {
      console.error('Failed to submit writing:', error);
      Alert.alert('Error', 'Failed to submit writing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SENTENCE':
        return ['#10B981', '#059669'];
      case 'PARAGRAPH':
        return ['#3B82F6', '#6366F1'];
      case 'IELTS_TASK_1':
        return ['#8B5CF6', '#7C3AED'];
      case 'IELTS_TASK_2':
        return ['#F59E0B', '#D97706'];
      default:
        return ['#6B7280', '#4B5563'];
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'SENTENCE':
        return 'Sentence';
      case 'PARAGRAPH':
        return 'Paragraph';
      case 'IELTS_TASK_1':
        return 'IELTS Task 1';
      case 'IELTS_TASK_2':
        return 'IELTS Task 2';
      default:
        return type;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading writing exercises...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {['practice', 'write', 'progress'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab as any)}
            style={[
              styles.tabButton,
              activeTab === tab && styles.activeTabButton
            ]}
          >
            <Text style={[
              styles.tabButtonText,
              activeTab === tab && styles.activeTabButtonText
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Practice Tab */}
        {activeTab === 'practice' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose a Writing Exercise</Text>
            <View style={styles.exercisesGrid}>
              {exercises.map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  onPress={() => startWriting(exercise)}
                  style={styles.exerciseCard}
                >
                  <LinearGradient
                    colors={getTypeColor(exercise.type)}
                    style={styles.exerciseGradient}
                  >
                    <View style={styles.exerciseHeader}>
                      <Badge style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>
                          {getTypeLabel(exercise.type)}
                        </Text>
                      </Badge>
                      <Text style={styles.levelText}>{exercise.level}</Text>
                    </View>
                    <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                    <Text style={styles.exerciseDescription} numberOfLines={2}>
                      {exercise.description}
                    </Text>
                    <View style={styles.exerciseDetails}>
                      {exercise.wordLimit && (
                        <View style={styles.detailItem}>
                          <Ionicons name="document-text" size={16} color="rgba(255, 255, 255, 0.8)" />
                          <Text style={styles.detailText}>{exercise.wordLimit} words</Text>
                        </View>
                      )}
                      {exercise.timeLimit && (
                        <View style={styles.detailItem}>
                          <Ionicons name="time" size={16} color="rgba(255, 255, 255, 0.8)" />
                          <Text style={styles.detailText}>{exercise.timeLimit} min</Text>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Write Tab */}
        {activeTab === 'write' && selectedExercise && (
          <View style={styles.section}>
            <Card style={styles.promptCard}>
              <CardContent style={styles.promptContent}>
                <View style={styles.promptHeader}>
                  <Badge style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>
                      {getTypeLabel(selectedExercise.type)}
                    </Text>
                  </Badge>
                  <Text style={styles.promptLevel}>{selectedExercise.level}</Text>
                </View>
                <Text style={styles.promptTitle}>{selectedExercise.title}</Text>
                <Text style={styles.promptText}>{selectedExercise.prompt}</Text>
                
                {selectedExercise.requirements && (
                  <View style={styles.requirementsContainer}>
                    <Text style={styles.requirementsTitle}>Requirements:</Text>
                    {selectedExercise.requirements.map((req, index) => (
                      <Text key={index} style={styles.requirementText}>
                        • {req}
                      </Text>
                    ))}
                  </View>
                )}
              </CardContent>
            </Card>

            <View style={styles.writingContainer}>
              <View style={styles.writingHeader}>
                <Text style={styles.writingTitle}>Your Writing</Text>
                <View style={styles.writingStats}>
                  <Text style={styles.wordCountText}>{wordCount} words</Text>
                  {selectedExercise.wordLimit && (
                    <Text style={[
                      styles.limitText,
                      wordCount > selectedExercise.wordLimit && styles.limitExceeded
                    ]}>
                      /{selectedExercise.wordLimit}
                    </Text>
                  )}
                </View>
              </View>
              
              <TextInput
                style={styles.writingInput}
                value={writingContent}
                onChangeText={setWritingContent}
                placeholder="Start writing here..."
                placeholderTextColor="#94A3B8"
                multiline
                textAlignVertical="top"
              />
              
              <View style={styles.actionButtons}>
                <Button
                  title="Choose Different Exercise"
                  onPress={() => setActiveTab('practice')}
                  variant="secondary"
                  style={{ flex: 1 }}
                />
                <Button
                  title={isSubmitting ? 'Submitting...' : 'Submit Writing'}
                  onPress={submitWriting}
                  disabled={isSubmitting || !writingContent.trim()}
                  variant="primary"
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Writing Progress</Text>
            {submissions.length === 0 ? (
              <Card style={styles.emptyCard}>
                <CardContent style={styles.emptyContent}>
                  <Ionicons name="document-text" size={48} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>No submissions yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Start writing to see your progress here
                  </Text>
                </CardContent>
              </Card>
            ) : (
              <View style={styles.submissionsContainer}>
                {submissions.map((submission) => (
                  <Card key={submission.id} style={styles.submissionCard}>
                    <CardContent style={styles.submissionContent}>
                      <View style={styles.submissionHeader}>
                        <Text style={styles.submissionDate}>
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </Text>
                        {submission.score && (
                          <Badge style={styles.scoreBadge}>
                            <Text style={styles.scoreText}>{submission.score}/10</Text>
                          </Badge>
                        )}
                      </View>
                      <Text style={styles.submissionContent} numberOfLines={3}>
                        {submission.content}
                      </Text>
                      {submission.writingTime && (
                        <Text style={styles.submissionTime}>
                          Writing time: {formatTime(submission.writingTime)}
                        </Text>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#3B82F6',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabButtonText: {
    color: '#3B82F6',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
  },
  exercisesGrid: {
    gap: 16,
  },
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
  typeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  levelText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  exerciseDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  exerciseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  promptCard: {
    marginBottom: 20,
  },
  promptContent: {
    padding: 20,
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  promptLevel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  promptText: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 16,
  },
  requirementsContainer: {
    marginTop: 16,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  writingContainer: {
    flex: 1,
  },
  writingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  writingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  writingStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  limitText: {
    fontSize: 14,
    color: '#64748B',
  },
  limitExceeded: {
    color: '#EF4444',
  },
  writingInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
    minHeight: 200,
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyCard: {
    marginTop: 20,
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
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  submissionsContainer: {
    gap: 12,
  },
  submissionCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  submissionContent: {
    padding: 16,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  submissionDate: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  scoreBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submissionTime: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
  },
});