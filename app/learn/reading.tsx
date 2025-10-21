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
import AsyncStorage from '@react-native-async-storage/async-storage';

import { apiClient } from '@/lib/api';
import { PaginationResponse } from '@/types';
import PracticeTab from '@/components/reading/PracticeTab';
import ReadTab from '@/components/reading/ReadTab';
import ProgressTab from '@/components/reading/ProgressTab';
import { gradeAnswers } from '../../components/reading/utils';

interface ReadingExercise {
  id: string;
  title: string;
  content: string;
  type: string;
  level: string;
  wordCount?: number;
  estimatedTime: number;
  questions?: ReadingQuestion[];
  comprehensionQuestions?: ReadingQuestion[];
  topic?: {
    id: string;
    name: string;
  };
}

interface ReadingQuestion {
  id: string;
  question: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK' | 'SHORT_ANSWER' | 
         'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer';
  options?: string[];
  correctAnswer?: string | string[];
  explanation?: string;
  points?: number;
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
  autoGradeResult?: GradingResult;
}

interface GradingResult {
  score: number;
  maxScore: number;
  percentage: number;
  feedback: {
    questionId: string;
    isCorrect: boolean;
    correctAnswer: string | string[];
    explanation?: string;
    userAnswer: string;
  }[];
}

interface QuestionFeedback {
  questionId: string;
  isCorrect: boolean;
  correctAnswer: string | string[];
  explanation?: string;
  userAnswer: string;
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
  const [showResults, setShowResults] = useState(false);
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  // Offline mode states
  const [isOffline, setIsOffline] = useState(false);
  const [offlineExercises, setOfflineExercises] = useState<ReadingExercise[]>([]);
  const [syncPending, setSyncPending] = useState(false);

  useEffect(() => {
    checkConnectionStatus();
    fetchExercises();
    fetchSubmissions();
    loadOfflineData();
  }, [selectedLevel, selectedType, searchQuery]);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('https://httpbin.org/get', { method: 'HEAD', timeout: 5000 });
      setIsOffline(false);
    } catch (error) {
      setIsOffline(true);
    }
  };

  const fetchExercises = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        pageSize: 20
      };
      
      if (selectedLevel !== 'all') {
        params.level = selectedLevel;
      }
      
      if (selectedType !== 'all') {
        params.type = selectedType;
      }
      
      if (searchQuery) {
        params.searchQuery = searchQuery;
      }

      const response = await apiClient.get<PaginationResponse<ReadingExercise>>('/reading/exercises', params);
      if (response.success && response.data) {
        setExercises(response.data.data || []);
        // Save to offline storage if online
        if (!isOffline) {
          await AsyncStorage.setItem('offlineExercises', JSON.stringify(response.data.data || []));
        }
      }
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
      // Try to load from offline storage
      loadOfflineData();
      Alert.alert('Error', 'Failed to load reading exercises. Showing offline content.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await apiClient.get<PaginationResponse<ReadingSubmission>>('/reading/submissions');
      if (response && response.data) {
        console.log('Submissions:', response.data.data)
        setSubmissions(response.data.data || []);
        // Save to offline storage if online
        if (!isOffline) {
          await AsyncStorage.setItem('offlineSubmissions', JSON.stringify(response.data.data || []));
        }
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      // Try to load from offline storage
      loadOfflineSubmissions();
    }
  };

  const loadOfflineData = async () => {
    try {
      const offlineData = await AsyncStorage.getItem('offlineExercises');
      if (offlineData) {
        setOfflineExercises(JSON.parse(offlineData));
      }
    } catch (error) {
      console.error('Failed to load offline exercises:', error);
    }
  };

  const loadOfflineSubmissions = async () => {
    try {
      const offlineData = await AsyncStorage.getItem('offlineSubmissions');
      if (offlineData) {
        setSubmissions(JSON.parse(offlineData));
      }
    } catch (error) {
      console.error('Failed to load offline submissions:', error);
    }
  };

  const syncOfflineData = async () => {
    setSyncPending(true);
    try {
      // Try to sync any pending submissions
      const pendingSubmissions = await AsyncStorage.getItem('pendingSubmissions');
      if (pendingSubmissions) {
        const submissions = JSON.parse(pendingSubmissions);
        for (const submission of submissions) {
          await apiClient.post('/reading/submissions', submission);
        }
        // Clear pending submissions after successful sync
        await AsyncStorage.removeItem('pendingSubmissions');
        Alert.alert('Success', 'Offline data synced successfully!');
      }
      // Refresh data after sync
      fetchExercises();
      fetchSubmissions();
    } catch (error) {
      console.error('Failed to sync offline data:', error);
      Alert.alert('Sync Error', 'Failed to sync offline data. Please try again later.');
    } finally {
      setSyncPending(false);
    }
  };

  const startReading = (exercise: ReadingExercise) => {
    setSelectedExercise(exercise);
    setAnswers({});
    setStartTime(Date.now());
    setReadingStarted(false);
    setActiveTab('read');
    setGradingResult(null);
    setShowResults(false);
  };

  const beginReading = () => {
    setReadingStarted(true);
    setStartTime(Date.now());
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  // Use imported gradeAnswers function

  const submitAnswers = async () => {
    if (!selectedExercise || !startTime) return;

    const questions = selectedExercise.comprehensionQuestions || selectedExercise.questions || [];
    const totalQuestions = questions.length;
    const answeredQuestions = Object.keys(answers).length;

    if (answeredQuestions !== totalQuestions) {
      Alert.alert('Incomplete', `Please answer all questions before submitting. (${answeredQuestions}/${totalQuestions} answered)`);
      return;
    }

    // Perform automatic grading
    const result = gradeAnswers(selectedExercise, answers);
    setGradingResult(result);
    setShowResults(true);

    setIsSubmitting(true);
    try {
      const readingTime = Math.floor((Date.now() - startTime) / 1000);
      
      const submissionData = {
        exerciseId: selectedExercise.id,
        answers,
        readingTime,
        autoGradeResult: result
      };

      if (isOffline) {
        // Save to pending submissions for later sync
        const pendingSubmissions = await AsyncStorage.getItem('pendingSubmissions');
        const submissions = pendingSubmissions ? JSON.parse(pendingSubmissions) : [];
        submissions.push(submissionData);
        await AsyncStorage.setItem('pendingSubmissions', JSON.stringify(submissions));
        Alert.alert('Saved Offline', 'Your answers have been saved and will be synced when you\'re online.');
      } else {
        // Submit directly if online
        const response = await apiClient.post('/reading/submissions', submissionData);

        if (response.success) {
          Alert.alert('Success!', 'Your answers have been submitted.');
          fetchSubmissions(); // Refresh submissions for progress tab
        } else {
          Alert.alert('Error', response.error || 'Failed to submit answers');
        }
      }
    } catch (error) {
      console.error('Failed to submit answers:', error);
      Alert.alert('Error', 'Failed to submit answers');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981'; // green
    if (score >= 80) return '#3B82F6'; // blue
    if (score >= 70) return '#F59E0B'; // yellow
    return '#EF4444'; // red
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateReadingSpeed = (wordCount: number, timeInSeconds: number) => {
    const wordsPerMinute = Math.round((wordCount / timeInSeconds) * 60);
    return wordsPerMinute;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading reading exercises...</Text>
          {isOffline && (
            <View style={styles.offlineIndicator}>
              <Text style={styles.offlineText}>Offline Mode</Text>
              <TouchableOpacity 
                style={styles.syncButton}
                onPress={syncOfflineData}
                disabled={syncPending}
              >
                <Text style={styles.syncButtonText}>
                  {syncPending ? 'Syncing...' : 'Sync Data'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Offline indicator */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>Offline Mode - Using cached content</Text>
          <TouchableOpacity 
            style={styles.syncButton}
            onPress={syncOfflineData}
            disabled={syncPending}
          >
            <Text style={styles.syncButtonText}>
              {syncPending ? 'Syncing...' : 'Sync'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

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
          <PracticeTab
            exercises={isOffline ? offlineExercises : exercises}
            selectedLevel={selectedLevel}
            selectedType={selectedType}
            searchQuery={searchQuery}
            onLevelChange={setSelectedLevel}
            onTypeChange={setSelectedType}
            onSearchChange={setSearchQuery}
            onStartReading={startReading}
          />
        )}

        {/* Read Tab */}
        {activeTab === 'read' && selectedExercise && (
          <ReadTab
            selectedExercise={selectedExercise}
            readingStarted={readingStarted}
            showResults={showResults}
            gradingResult={gradingResult}
            answers={answers}
            isSubmitting={isSubmitting}
            onBeginReading={beginReading}
            onShowResults={setShowResults}
            onAnswerChange={handleAnswerChange}
            onSubmitAnswers={submitAnswers}
            onSelectExercise={setSelectedExercise}
            setActiveTab={setActiveTab}
            isOffline={isOffline}
          />
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <ProgressTab
            submissions={submissions}
            exercises={exercises}
          />
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
  filterContainer: {
    marginBottom: 20,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  activeFilterButton: {
    backgroundColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#64748B',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1E293B',
    paddingLeft: 36,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 10,
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
  textInputContainer: {
    paddingVertical: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1E293B',
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
  resultsCard: {
    marginBottom: 24,
  },
  resultsContent: {
    padding: 20,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  resultsSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  scoreBox: {
    alignItems: 'center',
    flex: 1,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreValuePrimary: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  questionReviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  feedbackCard: {
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  correctCard: {
    borderLeftColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  incorrectCard: {
    borderLeftColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  feedbackContent: {
    padding: 16,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  answerRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginRight: 8,
  },
  answerValue: {
    fontSize: 14,
    flex: 1,
  },
  correctAnswer: {
    color: '#10B981',
  },
  incorrectAnswer: {
    color: '#EF4444',
  },
  explanationContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
  },
  explanationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  explanationText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  resultsActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  reviewButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 8,
  },
  chooseExerciseButton: {
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
  submissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  submissionDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  scoreLabelProgress: {
    fontSize: 14,
    color: '#64748B',
  },
  scoreValueProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
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
  feedbackSummary: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  feedbackItems: {
    gap: 4,
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackItemText: {
    fontSize: 12,
    marginLeft: 6,
  },
  correctText: {
    color: '#10B981',
  },
  incorrectText: {
    color: '#EF4444',
  },
  moreFeedbackText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  offlineBanner: {
    backgroundColor: '#F59E0B',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offlineBannerText: {
    color: '#FFF',
    fontWeight: '600',
  },
  syncButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  syncButtonText: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  offlineIndicator: {
    marginTop: 16,
    alignItems: 'center',
  },
  offlineText: {
    color: '#6B7280',
    marginBottom: 8,
  },
});
