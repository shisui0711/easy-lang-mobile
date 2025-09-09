import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { RadioButton } from 'react-native-paper';

import { Card, CardContent, Badge, Button } from '@/components/ui';
import { apiClient } from '@/lib/api';
import { PaginationResponse } from '@/types';

interface ReadingExercise {
  id: string;
  title: string;
  content: string;
  type: string;
  level: string;
  wordCount?: number;
  estimatedTime: number;
  questions?: ReadingQuestion[];
  topic?: {
    id: string;
    name: string;
  };
}

interface ReadingQuestion {
  id: string;
  question: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK' | 'SHORT_ANSWER';
  options?: string[];
  correctAnswer?: string;
}

interface ReadingSubmission {
  id: string;
  exerciseId: string;
  answers: Record<string, string>;
  readingTime?: number;
  comprehensionScore?: number;
  overallScore?: number;
  status: string;
  createdAt: string;
}

export default function ReadingScreen() {
  const [exercises, setExercises] = useState<ReadingExercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<ReadingExercise | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'practice' | 'read' | 'progress'>('practice');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<ReadingSubmission[]>([]);
  const [readingStarted, setReadingStarted] = useState(false);

  useEffect(() => {
    fetchExercises();
    fetchSubmissions();
  }, []);

  const fetchExercises = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<PaginationResponse<ReadingExercise>>('/reading/exercises', {
        type: 'COMPREHENSION',
        level: 'Beginner',
        pageSize: 20
      });
      if (response.success && response.data) {
        setExercises(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
      Alert.alert('Error', 'Failed to load reading exercises');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await apiClient.get<PaginationResponse<ReadingSubmission>>('/reading/submissions');
      if (response.success && response.data) {
        setSubmissions(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
  };

  const startReading = (exercise: ReadingExercise) => {
    setSelectedExercise(exercise);
    setAnswers({});
    setStartTime(Date.now());
    setReadingStarted(false);
    setActiveTab('read');
  };

  const beginReading = () => {
    setReadingStarted(true);
    setStartTime(Date.now());
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const submitAnswers = async () => {
    if (!selectedExercise || !startTime) return;

    if (Object.keys(answers).length !== selectedExercise.questions?.length) {
      Alert.alert('Incomplete', 'Please answer all questions before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const readingTime = Math.floor((Date.now() - startTime) / 1000);
      
      const response = await apiClient.post('/reading/submissions', {
        exerciseId: selectedExercise.id,
        answers,
        readingTime
      });

      if (response.success) {
        Alert.alert(
          'Success!',
          'Your answers have been submitted.',
          [
            { text: 'Read Another', onPress: () => setActiveTab('practice') },
            { text: 'View Results', onPress: () => setActiveTab('progress') }
          ]
        );
        setSelectedExercise(null);
        setAnswers({});
        setStartTime(null);
        setReadingStarted(false);
        fetchSubmissions();
      } else {
        Alert.alert('Error', response.error || 'Failed to submit answers');
      }
    } catch (error) {
      console.error('Failed to submit answers:', error);
      Alert.alert('Error', 'Failed to submit answers');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLevelColor = (level: string) => {
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
          <Text style={styles.loadingText}>Loading reading exercises...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {['practice', 'read', 'progress'].map((tab) => (
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
            <Text style={styles.sectionTitle}>Choose a Reading Exercise</Text>
            <View style={styles.exercisesGrid}>
              {exercises.map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  onPress={() => startReading(exercise)}
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
                      <Text style={styles.typeText}>{exercise.type}</Text>
                    </View>
                    <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                    {exercise.topic && (
                      <Text style={styles.topicText}>{exercise.topic.name}</Text>
                    )}
                    <View style={styles.exerciseDetails}>
                      {exercise.wordCount && (
                        <View style={styles.detailItem}>
                          <Ionicons name="document-text" size={16} color="rgba(255, 255, 255, 0.8)" />
                          <Text style={styles.detailText}>{exercise.wordCount} words</Text>
                        </View>
                      )}
                      <View style={styles.detailItem}>
                        <Ionicons name="time" size={16} color="rgba(255, 255, 255, 0.8)" />
                        <Text style={styles.detailText}>{exercise.estimatedTime} min</Text>
                      </View>
                      {exercise.questions && (
                        <View style={styles.detailItem}>
                          <Ionicons name="help-circle" size={16} color="rgba(255, 255, 255, 0.8)" />
                          <Text style={styles.detailText}>{exercise.questions.length} questions</Text>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Read Tab */}
        {activeTab === 'read' && selectedExercise && (
          <View style={styles.section}>
            {!readingStarted ? (
              <Card style={styles.readyCard}>
                <CardContent style={styles.readyContent}>
                  <Ionicons name="book" size={48} color="#3B82F6" />
                  <Text style={styles.readyTitle}>{selectedExercise.title}</Text>
                  <View style={styles.readyStats}>
                    <View style={styles.readyStat}>
                      <Ionicons name="document-text" size={20} color="#64748B" />
                      <Text style={styles.readyStatText}>
                        {selectedExercise.wordCount} words
                      </Text>
                    </View>
                    <View style={styles.readyStat}>
                      <Ionicons name="time" size={20} color="#64748B" />
                      <Text style={styles.readyStatText}>
                        ~{selectedExercise.estimatedTime} minutes
                      </Text>
                    </View>
                    <View style={styles.readyStat}>
                      <Ionicons name="help-circle" size={20} color="#64748B" />
                      <Text style={styles.readyStatText}>
                        {selectedExercise.questions?.length} questions
                      </Text>
                    </View>
                  </View>
                  <Button
                    title="Start Reading"
                    onPress={beginReading}
                    style={styles.startButton}
                  />
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Reading Content */}
                <Card style={styles.contentCard}>
                  <CardContent style={styles.contentCardContent}>
                    <Text style={styles.contentTitle}>{selectedExercise.title}</Text>
                    <Text style={styles.contentText}>{selectedExercise.content}</Text>
                  </CardContent>
                </Card>

                {/* Questions */}
                {selectedExercise.questions && (
                  <View style={styles.questionsContainer}>
                    <Text style={styles.questionsTitle}>Questions</Text>
                    {selectedExercise.questions.map((question, index) => (
                      <Card key={question.id} style={styles.questionCard}>
                        <CardContent style={styles.questionContent}>
                          <Text style={styles.questionNumber}>
                            Question {index + 1}
                          </Text>
                          <Text style={styles.questionText}>{question.question}</Text>
                          
                          {question.type === 'MULTIPLE_CHOICE' && question.options && (
                            <View style={styles.optionsContainer}>
                              {question.options.map((option, optionIndex) => (
                                <TouchableOpacity
                                  key={optionIndex}
                                  onPress={() => handleAnswerChange(question.id, option)}
                                  style={styles.optionItem}
                                >
                                  <RadioButton
                                    value={option}
                                    status={answers[question.id] === option ? 'checked' : 'unchecked'}
                                    onPress={() => handleAnswerChange(question.id, option)}
                                    color="#3B82F6"
                                  />
                                  <Text style={styles.optionText}>{option}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}

                          {question.type === 'TRUE_FALSE' && (
                            <View style={styles.optionsContainer}>
                              {['True', 'False'].map((option) => (
                                <TouchableOpacity
                                  key={option}
                                  onPress={() => handleAnswerChange(question.id, option)}
                                  style={styles.optionItem}
                                >
                                  <RadioButton
                                    value={option}
                                    status={answers[question.id] === option ? 'checked' : 'unchecked'}
                                    onPress={() => handleAnswerChange(question.id, option)}
                                    color="#3B82F6"
                                  />
                                  <Text style={styles.optionText}>{option}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    <View style={styles.submitContainer}>
                      <Button
                        title="Choose Different Exercise"
                        onPress={() => setActiveTab('practice')}
                        style={styles.cancelButton}
                        variant="secondary"
                      />
                      <Button
                        title={isSubmitting ? 'Submitting...' : 'Submit Answers'}
                        onPress={submitAnswers}
                        disabled={isSubmitting || Object.keys(answers).length !== selectedExercise.questions?.length}
                        loading={isSubmitting}
                        style={styles.submitButton}
                      />
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Reading Progress</Text>
            {submissions.length === 0 ? (
              <Card style={styles.emptyCard}>
                <CardContent style={styles.emptyContent}>
                  <Ionicons name="book" size={48} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>No submissions yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Start reading to see your progress here
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
                          {new Date(submission.createdAt).toLocaleDateString()}
                        </Text>
                        {submission.overallScore && (
                          <Badge style={styles.scoreBadge}>
                            <Text style={styles.scoreText}>{submission.overallScore}%</Text>
                          </Badge>
                        )}
                      </View>
                      {submission.readingTime && (
                        <Text style={styles.submissionTime}>
                          Reading time: {formatTime(submission.readingTime)}
                        </Text>
                      )}
                      {submission.comprehensionScore && (
                        <Text style={styles.submissionScore}>
                          Comprehension: {submission.comprehensionScore}%
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
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  typeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  topicText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  exerciseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
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
  readyCard: {
    alignItems: 'center',
  },
  readyContent: {
    padding: 32,
    alignItems: 'center',
  },
  readyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 16,
    textAlign: 'center',
  },
  readyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 24,
  },
  readyStat: {
    alignItems: 'center',
  },
  readyStatText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  startButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  contentCard: {
    marginBottom: 24,
  },
  contentCardContent: {
    padding: 20,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  contentText: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
  },
  questionsContainer: {
    gap: 16,
  },
  questionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  questionCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  questionContent: {
    padding: 16,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  optionText: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 8,
    flex: 1,
  },
  submitContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
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
    borderLeftColor: '#10B981',
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
    marginBottom: 4,
  },
  submissionScore: {
    fontSize: 12,
    color: '#94A3B8',
  },
});