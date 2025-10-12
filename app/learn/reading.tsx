import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
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

  useEffect(() => {
    fetchExercises();
    fetchSubmissions();
  }, [selectedLevel, selectedType, searchQuery]);

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
      // The API returns data directly in the format: { data: [...], pagination: {...} }
      if (response && response.data) {
        console.log('Submissions:', response.data.data)
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

  // Automatic grading function
  const gradeAnswers = (exercise: ReadingExercise, userAnswers: Record<string, string>): GradingResult => {
    const questions = exercise.comprehensionQuestions || exercise.questions || [];
    let totalScore = 0;
    let maxScore = 0;
    const feedback: QuestionFeedback[] = [];

    for (const [index, question] of questions.entries()) {
      // Use the same key format as in the question components (q0, q1, etc.)
      const questionKey = `q${index}`;
      const userAnswer = userAnswers[questionKey] || '';
      const correctAnswer = question.correctAnswer;
      const points = question.points || 1;
      maxScore += points;

      let isCorrect = false;
      let normalizedCorrectAnswer: string | string[] = '';

      switch (question.type) {
        case 'MULTIPLE_CHOICE':
        case 'multiple_choice':
          isCorrect = userAnswer === (Array.isArray(correctAnswer) ? correctAnswer[0] : correctAnswer);
          normalizedCorrectAnswer = Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer || '';
          break;
        case 'TRUE_FALSE':
        case 'true_false':
          isCorrect = userAnswer === (Array.isArray(correctAnswer) ? correctAnswer[0] : correctAnswer);
          normalizedCorrectAnswer = Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer || '';
          break;
        case 'FILL_BLANK':
        case 'fill_blank':
        case 'SHORT_ANSWER':
        case 'short_answer':
          // For text-based answers, we'll do a case-insensitive comparison with some flexibility
          const userAnswerLower = userAnswer.toLowerCase().trim();
          if (Array.isArray(correctAnswer)) {
            isCorrect = correctAnswer.some(ans => 
              userAnswerLower.includes(ans.toLowerCase()) || 
              ans.toLowerCase().includes(userAnswerLower)
            );
            normalizedCorrectAnswer = correctAnswer.join(' or ');
          } else if (typeof correctAnswer === 'string') {
            isCorrect = userAnswerLower === correctAnswer.toLowerCase();
            normalizedCorrectAnswer = correctAnswer;
          }
          break;
      }

      if (isCorrect) {
        totalScore += points;
      }

      feedback.push({
        questionId: questionKey, // Use the same key format
        isCorrect,
        correctAnswer: normalizedCorrectAnswer,
        explanation: question.explanation,
        userAnswer
      });
    }

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    return {
      score: totalScore,
      maxScore,
      percentage,
      feedback
    };
  };

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
      
      const response = await apiClient.post('/reading/submissions', {
        exerciseId: selectedExercise.id,
        answers,
        readingTime,
        autoGradeResult: result
      });

      if (response.success) {
        // Just show a simple success message without navigating away
        Alert.alert('Success!', 'Your answers have been submitted.');
        // Don't navigate away - let the user view their results
        // Don't clear the exercise or results state
        fetchSubmissions(); // Refresh submissions for progress tab
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
            
            {/* Filters */}
            <View style={styles.filterContainer}>
              <View style={styles.filterRow}>
                <TouchableOpacity 
                  key="all-types"
                  style={[styles.filterButton, selectedType === 'all' && styles.activeFilterButton]}
                  onPress={() => setSelectedType('all')}
                >
                  <Text style={[styles.filterButtonText, selectedType === 'all' && styles.activeFilterButtonText]}>
                    All Types
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  key="comprehension"
                  style={[styles.filterButton, selectedType === 'COMPREHENSION' && styles.activeFilterButton]}
                  onPress={() => setSelectedType('COMPREHENSION')}
                >
                  <Text style={[styles.filterButtonText, selectedType === 'COMPREHENSION' && styles.activeFilterButtonText]}>
                    Comprehension
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  key="vocabulary"
                  style={[styles.filterButton, selectedType === 'VOCABULARY' && styles.activeFilterButton]}
                  onPress={() => setSelectedType('VOCABULARY')}
                >
                  <Text style={[styles.filterButtonText, selectedType === 'VOCABULARY' && styles.activeFilterButtonText]}>
                    Vocabulary
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.filterRow}>
                <TouchableOpacity 
                  key="grammar"
                  style={[styles.filterButton, selectedType === 'GRAMMAR' && styles.activeFilterButton]}
                  onPress={() => setSelectedType('GRAMMAR')}
                >
                  <Text style={[styles.filterButtonText, selectedType === 'GRAMMAR' && styles.activeFilterButtonText]}>
                    Grammar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  key="ielts"
                  style={[styles.filterButton, selectedType === 'IELTS_READING' && styles.activeFilterButton]}
                  onPress={() => setSelectedType('IELTS_READING')}
                >
                  <Text style={[styles.filterButtonText, selectedType === 'IELTS_READING' && styles.activeFilterButtonText]}>
                    IELTS Reading
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  key="speed"
                  style={[styles.filterButton, selectedType === 'SPEED_READING' && styles.activeFilterButton]}
                  onPress={() => setSelectedType('SPEED_READING')}
                >
                  <Text style={[styles.filterButtonText, selectedType === 'SPEED_READING' && styles.activeFilterButtonText]}>
                    Speed Reading
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.filterRow}>
                <TouchableOpacity 
                  key="critical"
                  style={[styles.filterButton, selectedType === 'CRITICAL_THINKING' && styles.activeFilterButton]}
                  onPress={() => setSelectedType('CRITICAL_THINKING')}
                >
                  <Text style={[styles.filterButtonText, selectedType === 'CRITICAL_THINKING' && styles.activeFilterButtonText]}>
                    Critical Thinking
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.filterRow}>
                <TouchableOpacity 
                  key="all-levels"
                  style={[styles.filterButton, selectedLevel === 'all' && styles.activeFilterButton]}
                  onPress={() => setSelectedLevel('all')}
                >
                  <Text style={[styles.filterButtonText, selectedLevel === 'all' && styles.activeFilterButtonText]}>
                    All Levels
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  key="beginner"
                  style={[styles.filterButton, selectedLevel === 'Beginner' && styles.activeFilterButton]}
                  onPress={() => setSelectedLevel('Beginner')}
                >
                  <Text style={[styles.filterButtonText, selectedLevel === 'Beginner' && styles.activeFilterButtonText]}>
                    Beginner
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  key="intermediate"
                  style={[styles.filterButton, selectedLevel === 'Intermediate' && styles.activeFilterButton]}
                  onPress={() => setSelectedLevel('Intermediate')}
                >
                  <Text style={[styles.filterButtonText, selectedLevel === 'Intermediate' && styles.activeFilterButtonText]}>
                    Intermediate
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.filterRow}>
                <TouchableOpacity 
                  key="advanced"
                  style={[styles.filterButton, selectedLevel === 'Advanced' && styles.activeFilterButton]}
                  onPress={() => setSelectedLevel('Advanced')}
                >
                  <Text style={[styles.filterButtonText, selectedLevel === 'Advanced' && styles.activeFilterButtonText]}>
                    Advanced
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  key="expert"
                  style={[styles.filterButton, selectedLevel === 'Expert' && styles.activeFilterButton]}
                  onPress={() => setSelectedLevel('Expert')}
                >
                  <Text style={[styles.filterButtonText, selectedLevel === 'Expert' && styles.activeFilterButtonText]}>
                    Expert
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search exercises..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
              </View>
            </View>
            
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
                      <Text style={styles.typeText}>{exercise.type.replace('_', ' ')}</Text>
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
                          <Ionicons name="document-text" size={16} color="rgba(255, 255, 255, 0.8)" />
                          <Text style={styles.detailText}>{exercise.wordCount} words</Text>
                        </View>
                      )}
                      <View key="time" style={styles.detailItem}>
                        <Ionicons name="time" size={16} color="rgba(255, 255, 255, 0.8)" />
                        <Text style={styles.detailText}>{exercise.estimatedTime} min</Text>
                      </View>
                      {(exercise.questions || exercise.comprehensionQuestions) && (
                        <View key="questions" style={styles.detailItem}>
                          <Ionicons name="help-circle" size={16} color="rgba(255, 255, 255, 0.8)" />
                          <Text style={styles.detailText}>{(exercise.questions || exercise.comprehensionQuestions)?.length} questions</Text>
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
                    <View key="words" style={styles.readyStat}>
                      <Ionicons name="document-text" size={20} color="#64748B" />
                      <Text style={styles.readyStatText}>
                        {selectedExercise.wordCount} words
                      </Text>
                    </View>
                    <View key="time" style={styles.readyStat}>
                      <Ionicons name="time" size={20} color="#64748B" />
                      <Text style={styles.readyStatText}>
                        ~{selectedExercise.estimatedTime} minutes
                      </Text>
                    </View>
                    <View key="questions" style={styles.readyStat}>
                      <Ionicons name="help-circle" size={20} color="#64748B" />
                      <Text style={styles.readyStatText}>
                        {(selectedExercise.questions || selectedExercise.comprehensionQuestions)?.length} questions
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
            ) : showResults && gradingResult ? (
              <Card style={styles.resultsCard}>
                <CardContent style={styles.resultsContent}>
                  <Text style={styles.resultsTitle}>Your Results</Text>
                  <Text style={styles.resultsSubtitle}>Here&apos;s how you did on this exercise</Text>
                  
                  <View style={styles.scoreContainer}>
                    <View key="percentage" style={styles.scoreBox}>
                      <Text style={[styles.scoreValue, { color: getScoreColor(gradingResult.percentage) }]}>
                        {gradingResult.percentage}%
                      </Text>
                      <Text style={styles.scoreLabel}>Score</Text>
                    </View>
                    <View key="correct" style={styles.scoreBox}>
                      <Text style={styles.scoreValuePrimary}>
                        {gradingResult.score}/{gradingResult.maxScore}
                      </Text>
                      <Text style={styles.scoreLabel}>Correct Answers</Text>
                    </View>
                    <View key="total" style={styles.scoreBox}>
                      <Text style={styles.scoreValuePrimary}>
                        {(selectedExercise.questions || selectedExercise.comprehensionQuestions)?.length}
                      </Text>
                      <Text style={styles.scoreLabel}>Total Questions</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.questionReviewTitle}>Question Review</Text>
                  {(selectedExercise.comprehensionQuestions || selectedExercise.questions)?.map((question, index) => {
                    // Use the same key format as in the grading function (q0, q1, etc.)
                    const questionKey = `q${index}`;
                    const feedbackItem = gradingResult.feedback.find(f => f.questionId === questionKey);
                    return (
                      <Card 
                        key={questionKey} 
                        style={
                          feedbackItem?.isCorrect 
                            ? {
                                ...styles.feedbackCard,
                                borderLeftColor: styles.correctCard.borderLeftColor,
                                backgroundColor: styles.correctCard.backgroundColor,
                              }
                            : {
                                ...styles.feedbackCard,
                                borderLeftColor: styles.incorrectCard.borderLeftColor,
                                backgroundColor: styles.incorrectCard.backgroundColor,
                              }
                        }
                      >
                        <CardContent style={styles.feedbackContent}>
                          <View style={styles.feedbackHeader}>
                            <Text style={styles.questionNumber}>
                              Question {index + 1}
                            </Text>
                            <Ionicons 
                              name={feedbackItem?.isCorrect ? "checkmark-circle" : "close-circle"} 
                              size={24} 
                              color={feedbackItem?.isCorrect ? "#10B981" : "#EF4444"} 
                            />
                          </View>
                          <Text style={styles.questionText}>{question.question}</Text>
                          
                          <View key="user-answer" style={styles.answerRow}>
                            <Text style={styles.answerLabel}>Your answer:</Text>
                            <Text style={[
                              styles.answerValue,
                              feedbackItem?.isCorrect ? styles.correctAnswer : styles.incorrectAnswer
                            ]}>
                              {feedbackItem?.userAnswer || "(No answer)"}
                            </Text>
                          </View>
                          
                          {!feedbackItem?.isCorrect && (
                            <View key="correct-answer" style={styles.answerRow}>
                              <Text style={styles.answerLabel}>Correct answer:</Text>
                              <Text style={styles.correctAnswer}>
                                {Array.isArray(feedbackItem?.correctAnswer) 
                                  ? feedbackItem?.correctAnswer.join(', ') 
                                  : feedbackItem?.correctAnswer}
                              </Text>
                            </View>
                          )}
                          
                          {feedbackItem?.explanation && (
                            <View key="explanation" style={styles.explanationContainer}>
                              <Text style={styles.explanationLabel}>Explanation:</Text>
                              <Text style={styles.explanationText}>{feedbackItem.explanation}</Text>
                            </View>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  <View style={styles.resultsActions}>
                    <Button
                      key="review"
                      title="Review Exercise"
                      onPress={() => setShowResults(false)}
                      variant="secondary"
                      style={styles.reviewButton}
                    />
                    <Button
                      key="choose"
                      title="Choose Different Exercise"
                      onPress={() => {
                        setShowResults(false);
                        setSelectedExercise(null);
                        setGradingResult(null);
                        setActiveTab('practice'); // Navigate back to practice tab
                      }}
                      style={styles.chooseExerciseButton}
                    />
                  </View>
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
                <View style={styles.questionsContainer}>
                  {/* Debug: Show questions array info */}
                  <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                    Questions: {selectedExercise.questions?.length || 0}, 
                    Comprehension: {selectedExercise.comprehensionQuestions?.length || 0}
                  </Text>
                  
                  {/* Show message if no questions */}
                  {!(selectedExercise.questions || selectedExercise.comprehensionQuestions) && (
                    <Text style={{ fontSize: 14, color: '#f00', marginBottom: 16 }}>
                      No questions found in this exercise!
                    </Text>
                  )}
                  
                  <Text style={styles.questionsTitle}>Questions</Text>
                  {(selectedExercise.comprehensionQuestions || selectedExercise.questions)?.map((question, index) => (
                    <Card key={index} style={styles.questionCard}>
                      <CardContent style={styles.questionContent}>
                        <Text style={styles.questionNumber}>
                          Question {index + 1}
                        </Text>
                        <Text style={styles.questionText}>{question.question}</Text>
                        {/* Multiple choice questions */}
                        {((question.type === 'MULTIPLE_CHOICE' || question.type === 'multiple_choice') && question.options) && (
                          <View style={styles.optionsContainer}>
                            {question.options.map((option, optionIndex) => (
                              <TouchableOpacity
                                key={`${index}-${optionIndex}`}
                                onPress={() => handleAnswerChange(`q${index}`, option)}
                                style={styles.optionItem}
                              >
                                <RadioButton
                                  key={`radio-${index}-${optionIndex}`}
                                  value={option}
                                  status={answers[`q${index}`] === option ? 'checked' : 'unchecked'}
                                  onPress={() => handleAnswerChange(`q${index}`, option)}
                                  color="#3B82F6"
                                />
                                <Text style={styles.optionText}>{option}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}

                        {/* True/False questions */}
                        {(question.type === 'TRUE_FALSE' || question.type === 'true_false') && (
                          <View style={styles.optionsContainer}>
                            {['True', 'False'].map((option, optionIndex) => (
                              <TouchableOpacity
                                key={`${index}-${option}`}
                                onPress={() => handleAnswerChange(`q${index}`, option)}
                                style={styles.optionItem}
                              >
                                <RadioButton
                                  key={`radio-${index}-${optionIndex}`}
                                  value={option}
                                  status={answers[`q${index}`] === option ? 'checked' : 'unchecked'}
                                  onPress={() => handleAnswerChange(`q${index}`, option)}
                                  color="#3B82F6"
                                />
                                <Text style={styles.optionText}>{option}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                        
                        {/* Short answer and fill blank questions */}
                        {(question.type === 'SHORT_ANSWER' || question.type === 'FILL_BLANK' || 
                          question.type === 'short_answer' || question.type === 'fill_blank') && (
                          <View style={styles.textInputContainer}>
                            <TextInput
                              key={`text-${index}`}
                              style={styles.textInput}
                              placeholder="Enter your answer"
                              value={answers[`q${index}`] || ''}
                              onChangeText={(text) => handleAnswerChange(`q${index}`, text)}
                              multiline
                            />
                          </View>
                        )}
                        
                        {/* Debug: Show when no matching type is found */}
                        {question.type !== 'MULTIPLE_CHOICE' && 
                         question.type !== 'TRUE_FALSE' && 
                         question.type !== 'SHORT_ANSWER' && 
                         question.type !== 'FILL_BLANK' &&
                         question.type !== 'multiple_choice' && 
                         question.type !== 'true_false' && 
                         question.type !== 'short_answer' && 
                         question.type !== 'fill_blank' && (
                          <Text style={{ fontSize: 12, color: '#f00', marginTop: 4 }}>
                            Unsupported question type: {question.type}
                          </Text>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  <View style={styles.submitContainer}>
                    <Button
                      title="Choose Different Exercise"
                      onPress={() => setSelectedExercise(null)}
                      style={styles.cancelButton}
                      variant="secondary"
                    />
                    <Button
                      title={isSubmitting ? 'Submitting...' : 'Submit Answers'}
                      onPress={submitAnswers}
                      disabled={isSubmitting || Object.keys(answers).length === 0 || Object.keys(answers).length !== (selectedExercise.questions || selectedExercise.comprehensionQuestions)?.length}
                      loading={isSubmitting}
                      style={styles.submitButton}
                    />
                  </View>
                </View>

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
                {submissions.map((submission) => {
                  const exercise = exercises.find(e => e.id === submission.exerciseId);
                  return (
                    <Card key={submission.id} style={styles.submissionCard}>
                      <CardContent style={styles.submissionContent}>
                        <View style={styles.submissionHeader}>
                          <Text style={styles.submissionTitle}>
                            {exercise?.title || 'Unknown Exercise'}
                          </Text>
                          <Text style={styles.submissionDate}>
                            {new Date(submission.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                        
                        {submission.overallScore && (
                          <View key="overall-score" style={styles.scoreRow}>
                            <Text style={styles.scoreLabelProgress}>Overall Score:</Text>
                            <Badge style={{
                              backgroundColor: getScoreColor(submission.overallScore),
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 8,
                            }}>
                              <Text style={styles.scoreText}>{submission.overallScore}%</Text>
                            </Badge>
                          </View>
                        )}
                        
                        {submission.autoGradeResult && (
                          <View key="correct-answers" style={styles.scoreRow}>
                            <Text style={styles.scoreLabelProgress}>Correct Answers:</Text>
                            <Text style={styles.scoreValueProgress}>
                              {submission.autoGradeResult.score}/{submission.autoGradeResult.maxScore}
                            </Text>
                          </View>
                        )}
                        
                        {submission.readingTime && (
                          <View key="reading-time" style={styles.scoreRow}>
                            <Text style={styles.scoreLabelProgress}>Reading Time:</Text>
                            <Text style={styles.scoreValueProgress}>
                              {formatTime(submission.readingTime)}
                            </Text>
                          </View>
                        )}
                        
                        {exercise?.wordCount && submission.readingTime && (
                          <View key="reading-speed" style={styles.scoreRow}>
                            <Text style={styles.scoreLabelProgress}>Reading Speed:</Text>
                            <Text style={styles.scoreValueProgress}>
                              {calculateReadingSpeed(exercise.wordCount, submission.readingTime)} WPM
                            </Text>
                          </View>
                        )}
                        
                        {submission.autoGradeResult?.feedback && (
                          <View key="feedback" style={styles.feedbackSummary}>
                            <Text style={styles.feedbackTitle}>Summary</Text>
                            <View style={styles.feedbackItems}>
                              {submission.autoGradeResult.feedback.slice(0, 3).map((item, index) => (
                                <View key={`feedback-${index}`} style={styles.feedbackItem}>
                                  <Ionicons 
                                    name={item.isCorrect ? "checkmark-circle" : "close-circle"} 
                                    size={16} 
                                    color={item.isCorrect ? "#10B981" : "#EF4444"} 
                                  />
                                  <Text style={[
                                    styles.feedbackItemText,
                                    item.isCorrect ? styles.correctText : styles.incorrectText
                                  ]}>
                                    Q{index + 1}: {item.isCorrect ? 'Correct' : 'Incorrect'}
                                  </Text>
                                </View>
                              ))}
                              {submission.autoGradeResult.feedback.length > 3 && (
                                <Text key="more" style={styles.moreFeedbackText}>
                                  +{submission.autoGradeResult.feedback.length - 3} more questions
                                </Text>
                              )}
                            </View>
                          </View>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
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
});
