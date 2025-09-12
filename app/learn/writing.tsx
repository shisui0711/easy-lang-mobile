import { AntDesign, FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Button, Card, CardContent } from '@/components/ui';
import { apiClient } from '@/lib/api';
import { useDebounce } from 'use-debounce';

// Define interfaces
interface TranslationExercise {
  id: string;
  title: string;
  instructions?: string;
  level: string;
  difficulty: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  totalSentences: number;
  estimatedTime: number;
  topic?: {
    id: string;
    name: string;
  };
  sentences: {
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
}

interface Sentence {
  id: string;
  orderIndex: number;
  sourceText: string;
  context?: string;
  difficulty: string;
  hints?: string[];
  grammarPoints: string[];
  vocabularyFocus: string[];
}

interface FeedbackData {
  isCorrect: boolean;
  accuracyScore: number;
  grammarScore: number;
  vocabularyScore: number;
  fluencyScore: number;
  feedback: {
    accuracy: number;
    strengths: string[];
    improvements: string[];
    alternatives: string[];
  };
  corrections?: {
    suggestion: string;
    explanation: string;
  };
}

export default function WritingScreen() {
  // State for exercise list view
  const [exercises, setExercises] = useState<TranslationExercise[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, ExerciseSubmission>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300); // Debounce search by 300ms
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');

  // State for exercise detail view
  const [currentExercise, setCurrentExercise] = useState<TranslationExercise | null>(null);
  const [currentSubmission, setCurrentSubmission] = useState<ExerciseSubmission | null>(null);
  const [currentSentence, setCurrentSentence] = useState<Sentence | null>(null);
  const [userTranslation, setUserTranslation] = useState('');
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [showHints, setShowHints] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // View state
  const [activeView, setActiveView] = useState<'list' | 'exercise' | 'completed'>('list');

  // Fetch exercises when component mounts or filters change
  useEffect(() => {
    if (activeView === 'list') {
      fetchExercises();
    }
  }, [activeView, selectedLevel, selectedTopic, debouncedSearchQuery]);

  // Reset state when sentence changes
  useEffect(() => {
    if (currentSentence) {
      setStartTime(Date.now());
      setUserTranslation('');
      setFeedback(null);
      setShowHints(false);
    }
  }, [currentSentence]);

  // Fetch exercises for the list view
  const fetchExercises = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        type: 'TRANSLATION',
        level: selectedLevel === 'all' ? 'Intermediate' : selectedLevel,
        pageSize: 20
      };

      if (debouncedSearchQuery) {
        params.searchQuery = debouncedSearchQuery;
      }
      if (selectedTopic !== 'all') {
        params.topic = selectedTopic;
      }

      const response = await apiClient.get('/writing/exercises', { params });
      
      if (response.success && response.data) {
        const exerciseData = (response.data as any).data || [];
        setExercises(exerciseData);
        
        // Fetch submissions for these exercises
        await fetchSubmissions(exerciseData.map((ex: TranslationExercise) => ex.id));
      } else {
        Alert.alert('Error', response.error || 'Failed to load translation exercises');
      }
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
      Alert.alert('Error', 'Failed to load translation exercises');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch submissions for exercises
  const fetchSubmissions = async (exerciseIds: string[]) => {
    try {
      // For now, we'll initialize an empty submissions object
      // In a real implementation, you would fetch actual submission data
      const submissionMap: Record<string, ExerciseSubmission> = {};
      setSubmissions(submissionMap);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  // Start a translation exercise
  const startExercise = async (exercise: TranslationExercise) => {
    try {
      setIsLoading(true);
      
      // Start the exercise session
      const startResponse = await apiClient.post(`/writing/exercises/${exercise.id}/start`);
      
      if (startResponse.success && startResponse.data) {
        const startData = startResponse.data;
        
        if (startData.isCompleted) {
          setIsCompleted(true);
          setCurrentSubmission(startData.submission);
          setCurrentExercise(exercise);
          setActiveView('completed');
        } else {
          setCurrentSubmission(startData.submission);
          setCurrentSentence(startData.currentSentence);
          setCurrentExercise(exercise);
          setActiveView('exercise');
        }
      } else {
        Alert.alert('Error', startResponse.error || 'Failed to start exercise');
      }
    } catch (error) {
      console.error('Error starting exercise:', error);
      Alert.alert('Error', 'Failed to start translation exercise');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit translation for current sentence
  const submitTranslation = async () => {
    if (!userTranslation.trim() || !currentSentence || !currentSubmission || !currentExercise) {
      return;
    }

    try {
      setIsSubmitting(true);
      const timeSpent = Math.round((Date.now() - startTime) / 1000);

      const response = await apiClient.post(`/writing/exercises/${currentExercise.id}/submit`, {
        sentenceId: currentSentence.id,
        userTranslation: userTranslation.trim(),
        timeSpent
      });

      if (response.success && response.data) {
        const data = response.data;
        setFeedback(data.analysis);
        
        if (data.analysis.isCorrect) {
          Alert.alert('Success', 'Great translation! Moving to next sentence...');
          
          // Move to next sentence after a short delay
          setTimeout(() => {
            moveToNextSentence();
          }, 1500);
        } else {
          Alert.alert('Needs Improvement', 'Translation needs improvement. Try again!');
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to submit translation');
      }
    } catch (error) {
      console.error('Error submitting translation:', error);
      Alert.alert('Error', 'Failed to submit translation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Move to next sentence in the exercise
  const moveToNextSentence = async () => {
    if (!currentExercise) return;
    
    try {
      const response = await apiClient.post(`/writing/exercises/${currentExercise.id}/start`);
      
      if (response.success && response.data) {
        const data = response.data;
        
        if (data.isCompleted) {
          setIsCompleted(true);
          setCurrentSentence(null);
          setCurrentSubmission(data.submission);
          setActiveView('completed');
          Alert.alert('Congratulations!', 'Exercise completed!');
        } else {
          setCurrentSentence(data.currentSentence);
          setCurrentSubmission(data.submission);
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to load next sentence');
      }
    } catch (error) {
      console.error('Error moving to next sentence:', error);
      Alert.alert('Error', 'Failed to load next sentence');
    }
  };

  // Try again with current sentence
  const handleTryAgain = () => {
    setFeedback(null);
    setUserTranslation('');
    setStartTime(Date.now());
  };

  // Go back to exercise list
  const goBackToList = () => {
    setActiveView('list');
    setCurrentExercise(null);
    setCurrentSubmission(null);
    setCurrentSentence(null);
    setIsCompleted(false);
    setFeedback(null);
  };

  // Get difficulty color for badges
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return ['#10B981', '#059669']; // green
      case 'intermediate': return ['#F59E0B', '#D97706']; // yellow
      case 'advanced': return ['#EF4444', '#DC2626']; // red
      default: return ['#6B7280', '#4B5563']; // gray
    }
  };

  // Get status color for badges
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return ['#10B981', '#059669']; // green
      case 'in_progress': return ['#3B82F6', '#2563EB']; // blue
      default: return ['#6B7280', '#4B5563']; // gray
    }
  };

  // Render exercise completion screen
  if (activeView === 'completed' && currentExercise && currentSubmission) {
    const progress = (currentSubmission.completedSentences / currentExercise.totalSentences) * 100;
    
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={goBackToList} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#3B82F6" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Exercise Completed!</Text>
          </View>
          
          <View style={styles.completionContainer}>
            <View style={styles.completionIcon}>
              <AntDesign name="Trophy" size={48} color="#10B981" />
            </View>
            
            <Text style={styles.completionTitle}>Congratulations!</Text>
            <Text style={styles.completionSubtitle}>You&apos;ve successfully completed the translation exercise.</Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{currentSubmission.completedSentences}</Text>
                <Text style={styles.statLabel}>Sentences Completed</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {currentSubmission.overallAccuracy ? Math.round(currentSubmission.overallAccuracy) : 0}%
                </Text>
                <Text style={styles.statLabel}>Overall Accuracy</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {Math.round(currentSubmission.totalTimeSpent / 60)}
                </Text>
                <Text style={styles.statLabel}>Minutes Spent</Text>
              </View>
            </View>
            
            <View style={styles.actionButtons}>
              <Button
                title="Back to Writing"
                onPress={goBackToList}
                variant="secondary"
                style={styles.actionButton}
              />
              <Button
                title="Try Again"
                onPress={() => startExercise(currentExercise)}
                variant="primary"
                style={styles.actionButton}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render exercise detail view (translation)
  if (activeView === 'exercise' && currentExercise && currentSentence && currentSubmission) {
    const progress = (currentSubmission.completedSentences / currentExercise.totalSentences) * 100;
    
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={goBackToList} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#3B82F6" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle} numberOfLines={1}>{currentExercise.title}</Text>
              <View style={styles.headerSubtitle}>
                <Text style={styles.headerSubtitleText}>
                  {currentExercise.sourceLanguage || 'EN'} → {currentExercise.targetLanguage || 'VI'}
                </Text>
                {currentExercise.topic && (
                  <Badge style={styles.topicBadge}>
                    <Text style={styles.topicBadgeText}>{currentExercise.topic.name}</Text>
                  </Badge>
                )}
              </View>
            </View>
            <Text style={styles.sentenceCounter}>
              {currentSentence.orderIndex + 1} / {currentExercise.totalSentences}
            </Text>
          </View>
          
          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>Progress</Text>
              <Text style={styles.progressText}>
                {currentSubmission.completedSentences}/{currentExercise.totalSentences} completed
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
          </View>
          
          {/* Current Sentence Card */}
          <Card style={styles.sentenceCard}>
            <CardContent style={styles.cardContent}>
              <View style={styles.sentenceHeader}>
                <View style={styles.sentenceHeaderLeft}>
                  <MaterialIcons name="translate" size={20} color="#3B82F6" />
                  <Text style={styles.sentenceHeaderTitle}>Translate this sentence</Text>
                </View>
                <LinearGradient
                  colors={getDifficultyColor(currentSentence.difficulty)}
                  style={styles.difficultyBadge}
                >
                  <Text style={styles.difficultyBadgeText}>
                    {currentSentence.difficulty}
                  </Text>
                </LinearGradient>
              </View>
              
              <View style={styles.sourceSentenceContainer}>
                <Text style={styles.sourceSentence}>{currentSentence.sourceText}</Text>
                {currentSentence.context && (
                  <Text style={styles.sentenceContext}>{currentSentence.context}</Text>
                )}
              </View>
              
              {/* Hints */}
              {currentSentence.hints && currentSentence.hints.length > 0 && (
                <View style={styles.hintsContainer}>
                  <TouchableOpacity 
                    onPress={() => setShowHints(!showHints)} 
                    style={styles.hintsButton}
                  >
                    <AntDesign name="bulb1" size={16} color="#F59E0B" />
                    <Text style={styles.hintsButtonText}>
                      {showHints ? 'Hide' : 'Show'} Hints
                    </Text>
                  </TouchableOpacity>
                  
                  {showHints && (
                    <View style={styles.hintsContent}>
                      {Array.isArray(currentSentence.hints) ? (
                        <View style={styles.hintsList}>
                          {currentSentence.hints.map((hint, index) => (
                            <View key={index} style={styles.hintItem}>
                              <Text style={styles.hintBullet}>•</Text>
                              <Text style={styles.hintText}>{hint}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.hintsText}>{currentSentence.hints}</Text>
                      )}
                    </View>
                  )}
                </View>
              )}
              
              {/* Focus Areas */}
              {(currentSentence.grammarPoints.length > 0 || currentSentence.vocabularyFocus.length > 0) && (
                <View style={styles.focusAreasContainer}>
                  {currentSentence.grammarPoints.length > 0 && (
                    <View style={styles.focusArea}>
                      <Text style={styles.focusAreaTitle}>Grammar Focus:</Text>
                      <View style={styles.focusBadges}>
                        {currentSentence.grammarPoints.map((point, index) => (
                          <Badge key={index} style={styles.focusBadge}>
                            <Text style={styles.focusBadgeText}>{point}</Text>
                          </Badge>
                        ))}
                      </View>
                    </View>
                  )}
                  
                  {currentSentence.vocabularyFocus.length > 0 && (
                    <View style={styles.focusArea}>
                      <Text style={styles.focusAreaTitle}>Key Vocabulary:</Text>
                      <View style={styles.focusBadges}>
                        {currentSentence.vocabularyFocus.map((word, index) => (
                          <Badge key={index} style={styles.focusBadge}>
                            <Text style={styles.focusBadgeText}>{word}</Text>
                          </Badge>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
              
              {/* Translation Input */}
              <View style={styles.translationContainer}>
                <Text style={styles.translationLabel}>
                  Your translation ({currentExercise.targetLanguage || 'Vietnamese'}):
                </Text>
                <TextInput
                  style={styles.translationInput}
                  value={userTranslation}
                  onChangeText={setUserTranslation}
                  placeholder="Enter your translation here..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  textAlignVertical="top"
                  editable={!isSubmitting && !feedback}
                />
                <View style={styles.translationFooter}>
                  <Text style={styles.characterCount}>
                    {userTranslation.length} characters
                  </Text>
                  <View style={styles.translationActions}>
                    {feedback && !feedback.isCorrect && (
                      <Button
                        title="Try Again"
                        onPress={handleTryAgain}
                        variant="secondary"
                        style={styles.actionButtonSmall}
                      />
                    )}
                    <Button
                      title={isSubmitting ? "Submitting..." : "Submit"}
                      onPress={submitTranslation}
                      disabled={!userTranslation.trim() || isSubmitting || !!feedback}
                      variant="primary"
                      style={styles.actionButtonSmall}
                    />
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>
          
          {/* Feedback */}
          {feedback && (
            <Card style={[
              styles.feedbackCard,
              feedback.isCorrect ? styles.feedbackCardCorrect : styles.feedbackCardIncorrect
            ]}>
              <CardContent style={styles.cardContent}>
                <View style={styles.feedbackHeader}>
                  {feedback.isCorrect ? (
                    <>
                      <AntDesign name="checkcircle" size={24} color="#10B981" />
                      <Text style={styles.feedbackTitle}>Excellent Translation!</Text>
                    </>
                  ) : (
                    <>
                      <AntDesign name="closecircle" size={24} color="#EF4444" />
                      <Text style={styles.feedbackTitle}>Needs Improvement</Text>
                    </>
                  )}
                </View>
                
                {/* Scores */}
                <View style={styles.scoresContainer}>
                  <View style={styles.scoreItem}>
                    <Text style={styles.scoreValue}>{feedback.accuracyScore}%</Text>
                    <Text style={styles.scoreLabel}>Accuracy</Text>
                  </View>
                  <View style={styles.scoreItem}>
                    <Text style={styles.scoreValue}>{feedback.grammarScore}%</Text>
                    <Text style={styles.scoreLabel}>Grammar</Text>
                  </View>
                  <View style={styles.scoreItem}>
                    <Text style={styles.scoreValue}>{feedback.vocabularyScore}%</Text>
                    <Text style={styles.scoreLabel}>Vocabulary</Text>
                  </View>
                  <View style={styles.scoreItem}>
                    <Text style={styles.scoreValue}>{feedback.fluencyScore}%</Text>
                    <Text style={styles.scoreLabel}>Fluency</Text>
                  </View>
                </View>
                
                {/* Feedback Details */}
                <View style={styles.feedbackDetails}>
                  {feedback.feedback.strengths.length > 0 && (
                    <View style={styles.feedbackSection}>
                      <View style={styles.feedbackSectionHeader}>
                        <AntDesign name="like1" size={16} color="#10B981" />
                        <Text style={styles.feedbackSectionTitle}>What You Did Well</Text>
                      </View>
                      {feedback.feedback.strengths.map((strength, index) => (
                        <View key={index} style={styles.feedbackItem}>
                          <Text style={styles.feedbackItemText}>• {strength}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {feedback.feedback.improvements.length > 0 && (
                    <View style={styles.feedbackSection}>
                      <View style={styles.feedbackSectionHeader}>
                        <AntDesign name="dislike1" size={16} color="#F59E0B" />
                        <Text style={styles.feedbackSectionTitle}>Areas for Improvement</Text>
                      </View>
                      {feedback.feedback.improvements.map((improvement, index) => (
                        <View key={index} style={styles.feedbackItem}>
                          <Text style={styles.feedbackItemText}>• {improvement}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {feedback.corrections && (
                    <View style={styles.feedbackSection}>
                      <View style={styles.feedbackSectionHeader}>
                        <FontAwesome name="lightbulb-o" size={16} color="#3B82F6" />
                        <Text style={styles.feedbackSectionTitle}>Suggested Translation</Text>
                      </View>
                      <View style={styles.suggestionContainer}>
                        <Text style={styles.suggestionText}>{feedback.corrections.suggestion}</Text>
                        <Text style={styles.suggestionExplanation}>{feedback.corrections.explanation}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </CardContent>
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render exercise list view (default)
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Translation Practice</Text>
          <Text style={styles.headerSubtitle}>Practice translation sentence by sentence with AI feedback</Text>
        </View>
        
        {/* Hero Card */}
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.heroCard}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroIcon}>
              <MaterialIcons name="translate" size={32} color="white" />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Translation Practice</Text>
              <Text style={styles.heroSubtitle}>Practice translation sentence by sentence with AI feedback</Text>
            </View>
          </View>
          <View style={styles.heroFeatures}>
            <View style={styles.featureItem}>
              <AntDesign name="rocket1" size={16} color="white" />
              <Text style={styles.featureText}>Progressive Learning</Text>
            </View>
            <View style={styles.featureItem}>
              <AntDesign name="star" size={16} color="white" />
              <Text style={styles.featureText}>AI-Powered Feedback</Text>
            </View>
            <View style={styles.featureItem}>
              <AntDesign name="clockcircleo" size={16} color="white" />
              <Text style={styles.featureText}>Real-time Analysis</Text>
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
                onChangeText={(text) => setSearchQuery(text)}
              />
            </View>
            {/* For simplicity, we're not implementing level/topic filters in mobile UI */}
          </CardContent>
        </Card>
        
        {/* Exercise List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading translation exercises...</Text>
          </View>
        ) : exercises.length === 0 ? (
          <Card style={styles.emptyCard}>
            <CardContent style={styles.emptyContent}>
              <MaterialIcons name="translate" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Translation Exercises Found</Text>
              <Text style={styles.emptySubtitle}>
                {debouncedSearchQuery ? 'Try adjusting your search.' : 'Translation exercises will appear here when available.'}
              </Text>
              {debouncedSearchQuery && (
                <Button
                  title="Clear Search"
                  onPress={() => setSearchQuery('')}
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
              const progress = submission
                ? (submission.completedSentences / exercise.totalSentences) * 100
                : 0;
              
              return (
                <TouchableOpacity
                  key={exercise.id}
                  onPress={() => startExercise(exercise)}
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
                          <MaterialIcons name="translate" size={16} color="#94A3B8" />
                          <Text style={styles.detailText}>
                            {exercise.sourceLanguage || 'EN'} → {exercise.targetLanguage || 'VI'}
                          </Text>
                        </View>
                        <View style={styles.detailItem}>
                          <MaterialIcons name="format-list-numbered" size={16} color="#94A3B8" />
                          <Text style={styles.detailText}>{exercise.totalSentences} sentences</Text>
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
                              {submission.completedSentences}/{exercise.totalSentences}
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
                          onPress={() => startExercise(exercise)}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
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
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  headerSubtitleText: {
    fontSize: 14,
    color: '#64748B',
  },
  sentenceCounter: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
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
  progressContainer: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#64748B',
  },
  sentenceCard: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  sentenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sentenceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sentenceHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  difficultyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sourceSentenceContainer: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    marginBottom: 20,
  },
  sourceSentence: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1E293B',
    lineHeight: 24,
  },
  sentenceContext: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    fontStyle: 'italic',
  },
  hintsContainer: {
    marginBottom: 20,
  },
  hintsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  hintsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  hintsContent: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  hintsList: {
    gap: 8,
  },
  hintItem: {
    flexDirection: 'row',
    gap: 8,
  },
  hintBullet: {
    fontSize: 14,
    color: '#92400E',
  },
  hintText: {
    fontSize: 14,
    color: '#92400E',
    flex: 1,
  },
  hintsText: {
    fontSize: 14,
    color: '#92400E',
  },
  focusAreasContainer: {
    marginBottom: 20,
  },
  focusArea: {
    marginBottom: 12,
  },
  focusAreaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  focusBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  focusBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  focusBadgeText: {
    fontSize: 12,
    color: '#475569',
  },
  translationContainer: {
    marginBottom: 8,
  },
  translationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  translationInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  translationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  characterCount: {
    fontSize: 12,
    color: '#64748B',
  },
  translationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButtonSmall: {
    minWidth: 100,
  },
  feedbackCard: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  feedbackCardCorrect: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  feedbackCardIncorrect: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  feedbackDetails: {
    gap: 16,
  },
  feedbackSection: {
    gap: 8,
  },
  feedbackSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  feedbackSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  feedbackItem: {
    paddingVertical: 4,
  },
  feedbackItemText: {
    fontSize: 14,
    color: '#475569',
  },
  suggestionContainer: {
    padding: 16,
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  suggestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  suggestionExplanation: {
    fontSize: 14,
    color: '#1E3A8A',
  },
  completionContainer: {
    padding: 24,
    alignItems: 'center',
  },
  completionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#047857',
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 16,
    color: '#047857',
    textAlign: 'center',
    marginBottom: 32,
  },
  statsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minWidth: 100,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  actionButton: {
    flex: 1,
  },
  topicBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topicBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
});