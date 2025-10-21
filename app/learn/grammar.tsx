import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Card, CardContent, Button } from '@/components/ui';
import { learningApi } from '@/lib/api';
import { ApiResponse } from '@/types';

// Updated interfaces to match ReadingExercise structure
interface GrammarLesson {
  id: string;
  title: string;
  content: string;
  type: string;
  level: string;
  wordCount?: number;
  estimatedTime: number;
  topic?: {
    id: string;
    name: string;
  };
  questions?: GrammarQuestion[];
  comprehensionQuestions?: GrammarQuestion[];
}

interface GrammarQuestion {
  id: string;
  question: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK' | 'SHORT_ANSWER' | 
         'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer';
  options?: string[];
  correctAnswer?: string | string[];
  explanation?: string;
  points?: number;
}

export default function GrammarScreen() {
  const [lessons, setLessons] = useState<GrammarLesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<GrammarLesson | null>(null);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [offlineLessons, setOfflineLessons] = useState<GrammarLesson[]>([]);

  // Filter states
  const [levels] = useState(['Beginner', 'Intermediate', 'Advanced']);
  const [topics] = useState(['Tenses', 'Prepositions', 'Articles', 'Conditionals', 'Modal Verbs', 'Passive Voice']);

  useEffect(() => {
    fetchLessons();
  }, [selectedLevel, selectedTopic, searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLessons().then(() => setRefreshing(false));
  };

  const checkConnectionStatus = async () => {
    try {
      // Use AbortController for timeout functionality
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://httpbin.org/get', { 
        method: 'HEAD', 
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      setIsOffline(false);
      return true;
    } catch (error) {
      setIsOffline(true);
      return false;
    }
  };

  const fetchLessons = async () => {
    setIsLoading(true);
    try {
      // Check connection status
      const isOnline = await checkConnectionStatus();
      
      if (isOnline) {
        // Fetch from API
        const params: any = {
          type: 'GRAMMAR',
          level: selectedLevel !== 'all' ? selectedLevel : undefined,
          topic: selectedTopic !== 'all' ? selectedTopic : undefined,
          searchQuery: searchQuery || undefined,
          pageSize: 20
        };
        
        const response: ApiResponse<any> = await learningApi.getReadingExercises(params);
        if (response.success && response.data) {
          // Access data correctly based on the pagination structure
          const lessonsData = response.data.data || response.data;
          setLessons(lessonsData);
          // Save to offline storage
          await AsyncStorage.setItem('offlineGrammarLessons', JSON.stringify(lessonsData));
        }
      } else {
        // Load from offline storage
        const offlineData = await AsyncStorage.getItem('offlineGrammarLessons');
        if (offlineData) {
          setOfflineLessons(JSON.parse(offlineData));
          setLessons(JSON.parse(offlineData));
        }
      }
    } catch (error) {
      console.error('Failed to fetch lessons:', error);
      Alert.alert('Error', 'Failed to load grammar lessons');
      
      // Try to load from offline storage as fallback
      try {
        const offlineData = await AsyncStorage.getItem('offlineGrammarLessons');
        if (offlineData) {
          setOfflineLessons(JSON.parse(offlineData));
          setLessons(JSON.parse(offlineData));
        }
      } catch (storageError) {
        console.error('Failed to load offline lessons:', storageError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const selectAnswer = (exerciseId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [exerciseId]: answer }));
  };

  const nextExercise = () => {
    if (selectedLesson && currentExercise < (getQuestions()?.length || 0) - 1) {
      setCurrentExercise(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const getQuestions = () => {
    if (!selectedLesson) return [];
    return selectedLesson.questions || selectedLesson.comprehensionQuestions || [];
  };

  const calculateScore = () => {
    const questions = getQuestions();
    if (!questions.length) return 0;
    
    let correct = 0;
    questions.forEach((question, index) => {
      const userAnswer = answers[question.id];
      const correctAnswer = question.correctAnswer;
      
      if (Array.isArray(correctAnswer)) {
        if (Array.isArray(userAnswer) && 
            userAnswer.length === correctAnswer.length && 
            userAnswer.every((val, idx) => val === correctAnswer[idx])) {
          correct++;
        }
      } else {
        if (userAnswer === correctAnswer) {
          correct++;
        }
      }
    });
    
    return Math.round((correct / questions.length) * 100);
  };

  const getDetailedFeedback = () => {
    const questions = getQuestions();
    if (!questions.length) return [];
    
    return questions.map((question, index) => {
      const userAnswer = answers[question.id];
      const correctAnswer = question.correctAnswer;
      let isCorrect = false;
      
      if (Array.isArray(correctAnswer)) {
        if (Array.isArray(userAnswer) && 
            userAnswer.length === correctAnswer.length && 
            userAnswer.every((val, idx) => val === correctAnswer[idx])) {
          isCorrect = true;
        }
      } else {
        isCorrect = userAnswer === correctAnswer;
      }
      
      return {
        questionId: question.id,
        isCorrect,
        correctAnswer,
        userAnswer,
        explanation: question.explanation
      };
    });
  };

  const submitAnswers = async () => {
    if (!selectedLesson) return;
    
    setIsSubmitting(true);
    try {
      const response = await learningApi.submitReadingAnswers(
        selectedLesson.id,
        answers,
        0 // readingTime - we can implement timing later
      );
      
      if (response.success) {
        Alert.alert('Success', 'Your answers have been submitted!');
      } else {
        throw new Error(response.error || 'Failed to submit answers');
      }
    } catch (error) {
      console.error('Failed to submit answers:', error);
      Alert.alert('Error', 'Failed to submit your answers. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetLesson = () => {
    setCurrentExercise(0);
    setAnswers({});
    setShowResults(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading grammar lessons...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grammar Lessons</Text>
          
          {/* Filters */}
          {!selectedLesson && (
            <View style={styles.filtersContainer}>
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Level:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                  <View style={styles.filterOptions}>
                    <TouchableOpacity
                      style={[
                        styles.filterOption,
                        selectedLevel === 'all' && styles.filterOptionActive
                      ]}
                      onPress={() => setSelectedLevel('all')}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        selectedLevel === 'all' && styles.filterOptionTextActive
                      ]}>All</Text>
                    </TouchableOpacity>
                    {levels.map(level => (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.filterOption,
                          selectedLevel === level && styles.filterOptionActive
                        ]}
                        onPress={() => setSelectedLevel(level)}
                      >
                        <Text style={[
                          styles.filterOptionText,
                          selectedLevel === level && styles.filterOptionTextActive
                        ]}>{level}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Topic:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                  <View style={styles.filterOptions}>
                    <TouchableOpacity
                      style={[
                        styles.filterOption,
                        selectedTopic === 'all' && styles.filterOptionActive
                      ]}
                      onPress={() => setSelectedTopic('all')}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        selectedTopic === 'all' && styles.filterOptionTextActive
                      ]}>All</Text>
                    </TouchableOpacity>
                    {topics.map(topic => (
                      <TouchableOpacity
                        key={topic}
                        style={[
                          styles.filterOption,
                          selectedTopic === topic && styles.filterOptionActive
                        ]}
                        onPress={() => setSelectedTopic(topic)}
                      >
                        <Text style={[
                          styles.filterOptionText,
                          selectedTopic === topic && styles.filterOptionTextActive
                        ]}>{topic}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {isOffline && (
                <View style={styles.offlineBanner}>
                  <Ionicons name="cloud-offline" size={16} color="#EF4444" />
                  <Text style={styles.offlineText}>Offline mode - showing saved lessons</Text>
                </View>
              )}
            </View>
          )}
          
          {!selectedLesson ? (
            <View style={styles.lessonsGrid}>
              {(lessons.length > 0 ? lessons : offlineLessons).map((lesson) => (
                <TouchableOpacity
                  key={lesson.id}
                  onPress={() => {
                    setSelectedLesson(lesson);
                    setCurrentExercise(0);
                    setAnswers({});
                    setShowResults(false);
                  }}
                  style={styles.lessonCard}
                >
                  <Card>
                    <CardContent style={styles.lessonContent}>
                      <View style={styles.lessonHeader}>
                        <Ionicons name="library" size={32} color="#06B6D4" />
                        <Text style={styles.levelText}>{lesson.level}</Text>
                      </View>
                      <Text style={styles.lessonTitle}>{lesson.title}</Text>
                      {lesson.topic && (
                        <Text style={styles.topicText}>{lesson.topic.name}</Text>
                      )}
                      <View style={styles.lessonStats}>
                        <Text style={styles.statItem}>
                          <Ionicons name="time" size={12} color="#64748B" /> {lesson.estimatedTime} min
                        </Text>
                        <Text style={styles.statItem}>
                          <Ionicons name="help-circle" size={12} color="#64748B" /> {getQuestions().length} questions
                        </Text>
                      </View>
                    </CardContent>
                  </Card>
                </TouchableOpacity>
              ))}
              
              {lessons.length === 0 && offlineLessons.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="book-outline" size={48} color="#94A3B8" />
                  <Text style={styles.emptyStateText}>No grammar lessons found</Text>
                  <Text style={styles.emptyStateSubtext}>Try adjusting your filters or check back later</Text>
                </View>
              )}
            </View>
          ) : showResults ? (
            <Card style={styles.resultsCard}>
              <CardContent style={styles.resultsContent}>
                <Ionicons name="trophy" size={48} color="#F59E0B" />
                <Text style={styles.resultsTitle}>Lesson Complete!</Text>
                <Text style={styles.scoreText}>Your Score: {calculateScore()}%</Text>
                
                {/* Detailed feedback */}
                <View style={styles.feedbackContainer}>
                  <Text style={styles.feedbackTitle}>Review Your Answers:</Text>
                  {getDetailedFeedback().map((feedback, index) => (
                    <View 
                      key={feedback.questionId} 
                      style={[
                        styles.feedbackItem,
                        feedback.isCorrect ? styles.correctFeedback : styles.incorrectFeedback
                      ]}
                    >
                      <View style={styles.feedbackHeader}>
                        <Text style={styles.feedbackQuestion}>Question {index + 1}</Text>
                        <Ionicons 
                          name={feedback.isCorrect ? "checkmark-circle" : "close-circle"} 
                          size={20} 
                          color={feedback.isCorrect ? "#10B981" : "#EF4444"} 
                        />
                      </View>
                      {!feedback.isCorrect && (
                        <>
                          <Text style={styles.feedbackText}>
                            <Text style={styles.feedbackLabel}>Your answer: </Text>
                            {Array.isArray(feedback.userAnswer) 
                              ? feedback.userAnswer.join(', ') 
                              : feedback.userAnswer}
                          </Text>
                          <Text style={styles.feedbackText}>
                            <Text style={styles.feedbackLabel}>Correct answer: </Text>
                            {Array.isArray(feedback.correctAnswer) 
                              ? feedback.correctAnswer.join(', ') 
                              : feedback.correctAnswer}
                          </Text>
                          {feedback.explanation && (
                            <Text style={styles.feedbackExplanation}>
                              <Text style={styles.feedbackLabel}>Explanation: </Text>
                              {feedback.explanation}
                            </Text>
                          )}
                        </>
                      )}
                    </View>
                  ))}
                </View>
                
                <View style={styles.resultsActions}>
                  <Button
                    title="Choose New Lesson"
                    onPress={() => setSelectedLesson(null)}
                    style={styles.newLessonButton}
                    textStyle={styles.newLessonButtonText}
                  />
                  <Button
                    title="Try Again"
                    onPress={resetLesson}
                    style={styles.retryButton}
                    textStyle={styles.retryButtonText}
                  />
                </View>
              </CardContent>
            </Card>
          ) : (
            <View style={styles.lessonContainer}>
              <Card style={styles.contentCard}>
                <CardContent style={styles.contentCardContent}>
                  <View style={styles.lessonHeader}>
                    <Text style={styles.lessonTitle}>{selectedLesson.title}</Text>
                    <TouchableOpacity 
                      onPress={() => setSelectedLesson(null)}
                      style={styles.closeButton}
                    >
                      <Ionicons name="close" size={24} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.lessonContentText}>{selectedLesson.content}</Text>
                  
                  {selectedLesson.topic && (
                    <View style={styles.topicBadge}>
                      <Text style={styles.topicBadgeText}>{selectedLesson.topic.name}</Text>
                    </View>
                  )}
                  
                  <View style={styles.lessonMetadata}>
                    <Text style={styles.metadataItem}>
                      <Ionicons name="barbell" size={12} color="#64748B" /> {selectedLesson.level}
                    </Text>
                    <Text style={styles.metadataItem}>
                      <Ionicons name="time" size={12} color="#64748B" /> {selectedLesson.estimatedTime} minutes
                    </Text>
                    <Text style={styles.metadataItem}>
                      <Ionicons name="document-text" size={12} color="#64748B" /> {selectedLesson.wordCount} words
                    </Text>
                  </View>
                </CardContent>
              </Card>

              {getQuestions().length > 0 && (
                <Card style={styles.exerciseCard}>
                  <CardContent style={styles.exerciseContent}>
                    <Text style={styles.exerciseNumber}>
                      Question {currentExercise + 1} of {getQuestions().length}
                    </Text>
                    <Text style={styles.questionText}>
                      {getQuestions()[currentExercise].question}
                    </Text>
                    
                    <View style={styles.optionsContainer}>
                      {getQuestions()[currentExercise].options?.map((option, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => selectAnswer(getQuestions()[currentExercise].id, option)}
                          style={[
                            styles.optionButton,
                            answers[getQuestions()[currentExercise].id] === option && styles.selectedOption
                          ]}
                        >
                          <Text style={[
                            styles.optionText,
                            answers[getQuestions()[currentExercise].id] === option && styles.selectedOptionText
                          ]}>
                            {String.fromCharCode(65 + index)}. {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Button
                      title={currentExercise === getQuestions().length - 1 ? 'Finish' : 'Next'}
                      onPress={currentExercise === getQuestions().length - 1 ? () => {
                        setShowResults(true);
                        submitAnswers();
                      } : nextExercise}
                      disabled={!answers[getQuestions()[currentExercise].id]}
                      loading={isSubmitting}
                      style={{
                        ...styles.nextButton,
                        ...(!answers[getQuestions()[currentExercise].id] && styles.nextButtonDisabled)
                      }}
                      textStyle={styles.nextButtonText}
                    />
                  </CardContent>
                </Card>
              )}
            </View>
          )}
        </View>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
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
  filtersContainer: {
    marginBottom: 20,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  filterOptionActive: {
    backgroundColor: '#3B82F6',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#475569',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  offlineText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  lessonsGrid: {
    gap: 16,
  },
  lessonCard: {
    marginBottom: 8,
  },
  lessonContent: {
    padding: 16,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  topicText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  lessonStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    fontSize: 12,
    color: '#94A3B8',
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  lessonContainer: {
    gap: 20,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
  },
  contentCardContent: {
    padding: 20,
  },
  closeButton: {
    padding: 4,
  },
  lessonContentText: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 16,
  },
  topicBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  topicBadgeText: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: '500',
  },
  lessonMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  metadataItem: {
    fontSize: 12,
    color: '#64748B',
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
  },
  exerciseContent: {
    padding: 20,
  },
  exerciseNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 12,
  },
  questionText: {
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  selectedOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF4FF',
  },
  optionText: {
    fontSize: 14,
    color: '#475569',
  },
  selectedOptionText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultsCard: {
    backgroundColor: '#FFFFFF',
  },
  resultsContent: {
    padding: 32,
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 24,
  },
  feedbackContainer: {
    width: '100%',
    marginBottom: 24,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  feedbackItem: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  correctFeedback: {
    backgroundColor: '#ECFDF5',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  incorrectFeedback: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  feedbackText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
  },
  feedbackExplanation: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 4,
  },
  feedbackLabel: {
    fontWeight: '600',
  },
  resultsActions: {
    flexDirection: 'row',
    gap: 12,
  },
  newLessonButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  newLessonButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});