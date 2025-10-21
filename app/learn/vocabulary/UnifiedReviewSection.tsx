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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Audio } from 'expo-av';

import { Progress, Button } from '@/components/ui';
import { apiClient, learningApi, aiApi } from '@/lib/api';
import { SimpleAddWordForm } from './SimpleAddWordForm';
import { ProgressChart } from '@/components/vocabulary/ProgressChart';
import { AchievementNotification } from '@/components/vocabulary/AchievementNotification';

interface VocabularyCard {
  id: string;
  wordId: string;
  stability: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  state: string;
  due: string;
  word: {
    id: string;
    text: string;
    meaning: string;
    pronunciation?: string;
    translation?: string;
    partOfSpeech?: string;
    examples?: string[];
  };
}

interface Exercise {
  id: string;
  type: 'vocabulary' | 'writing' | 'speaking';
  title: string;
  description?: string;
  difficulty: string;
  estimatedTime: number;
  progress?: number;
}

enum Rating {
  Manual = 0,
  Again = 1,
  Hard = 2,
  Good = 3,
  Easy = 4
}

export const UnifiedReviewSection = () => {
  const [cards, setCards] = useState<VocabularyCard[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    correct: 0,
    time: 0
  });
  const [showStats, setShowStats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mode, setMode] = useState<'vocabulary' | 'mixed'>('mixed'); // 'vocabulary' or 'mixed' (includes writing/speaking)

  useEffect(() => {
    fetchReviewItems();
  }, [mode]);

  const fetchReviewItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'vocabulary') {
        // Fetch vocabulary cards only
        const response = await apiClient.get('/review');
        if (response.success && response.data) {
          setCards(response.data as VocabularyCard[] || []);
          setExercises([]); // Clear exercises
        } else {
          setError(response.error || 'Failed to fetch vocabulary cards');
        }
      } else {
        // Fetch mixed review items (vocabulary + exercises)
        const vocabResponse = await apiClient.get('/review');
        const writingResponse = await learningApi.getWritingExercises({ pageSize: 5 });
        const speakingResponse = await learningApi.getSpeakingExercises({ pageSize: 5 });
        
        const vocabCards = vocabResponse.success ? (vocabResponse.data as VocabularyCard[] || []) : [];
        const writingExercises = writingResponse.success ? (writingResponse.data as any)?.data || [] : [];
        const speakingExercises = speakingResponse.success ? (speakingResponse.data as any)?.data || [] : [];
        
        // Combine all items into a single array
        const allItems: any[] = [
          ...vocabCards.map(card => ({ ...card, type: 'vocabulary' })),
          ...writingExercises.map((ex: any) => ({ ...ex, type: 'writing' })),
          ...speakingExercises.map((ex: any) => ({ ...ex, type: 'speaking' }))
        ];
        
        // Shuffle the items
        const shuffledItems = [...allItems].sort(() => Math.random() - 0.5);
        
        // Separate back into cards and exercises
        const combinedCards = shuffledItems.filter(item => item.type === 'vocabulary') as VocabularyCard[];
        const combinedExercises = shuffledItems.filter(item => item.type !== 'vocabulary').map(item => ({
          id: item.id,
          type: item.type,
          title: item.title,
          description: item.description || item.instructions,
          difficulty: item.difficulty || item.level,
          estimatedTime: item.estimatedTime || 5,
          progress: 0
        })) as Exercise[];
        
        setCards(combinedCards);
        setExercises(combinedExercises);
      }
      
      setCurrentItemIndex(0);
      setShowAnswer(false);
    } catch (error: any) {
      console.error('Failed to fetch review items:', error);
      setError(error.message || 'Failed to load review items. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Play pronunciation using TTS
  const playPronunciation = async (text: string) => {
    if (!text) return;
    
    setIsPlayingAudio(true);
    try {
        const response = await aiApi.quickTTS({
            text: text,
            language: 'en',
        });

        if (!response.success) {
        throw new Error(`Failed to generate audio: ${response.message}`);
        }

        const data = response.data as any;
        const audioUrl = data.audioUrl;
      const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true }
        );
        
        // Play the sound
        await sound.playAsync();
        
        // Clean up the sound object when playback finishes
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync();
          }
        });
    } catch (err) {
      console.error("Pronunciation failed:", err);
      Alert.alert("Error", "Failed to play pronunciation. Please try again.");
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const submitRating = async (rating: Rating) => {
    const currentCard = cards[currentItemIndex];
    if (!currentCard || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await learningApi.submitVocabularyRating(currentCard.wordId, rating);

      if (response.success) {
        // Update session stats
        setSessionStats(prev => ({
          ...prev,
          total: prev.total + 1,
          correct: rating === Rating.Good || rating === Rating.Easy ? prev.correct + 1 : prev.correct
        }));

        // Move to next card with animation
        if (currentItemIndex < cards.length - 1) {
          setIsAnimating(true);
          setShowAnswer(false);
          // Wait for animation to complete before changing cards
          setTimeout(() => {
            setCurrentItemIndex(currentItemIndex + 1);
            setIsAnimating(false);
          }, 300);
        } else {
          // Session complete
          Alert.alert(
            'Session Complete!',
            `You reviewed ${cards.length} items.\nAccuracy: ${sessionStats.total > 0 ? Math.round(((sessionStats.correct + (rating === Rating.Good || rating === Rating.Easy ? 1 : 0)) / (sessionStats.total + 1)) * 100) : 0}%`,
            [
              { text: 'Continue Learning', onPress: fetchReviewItems },
              { text: 'Back to Learn', onPress: () => router.back() }
            ]
          );
        }

        // Check for new achievements after completing a review
        console.log('Checking for new achievements after vocabulary review');

      } else {
        setError(response.error || 'Failed to submit rating. Please try again.');
      }
    } catch (error: any) {
      console.error('Failed to submit rating:', error);
      setError(error.message || 'Failed to submit rating. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startExercise = (exercise: Exercise) => {
    // Navigate to the appropriate exercise screen based on type
    switch (exercise.type) {
      case 'writing':
        router.push(`/learn/writing?id=${exercise.id}`);
        break;
      case 'speaking':
        router.push(`/learn/speaking?id=${exercise.id}`);
        break;
      default:
        console.warn('Unknown exercise type:', exercise.type);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading review items...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={60} color="#EF4444" />
        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
        <Text style={styles.errorText}>{error}</Text>
        <View style={styles.errorActions}>
          <Button
            title="Try Again"
            onPress={fetchReviewItems}
            style={styles.errorButton}
          />
          <Button
            title="Back to Learn"
            variant="outline"
            onPress={() => router.back()}
            style={styles.errorButton}
          />
        </View>
      </View>
    );
  }

  // Show mode selection if no items
  if (cards.length === 0 && exercises.length === 0) {
    return (
      <View style={styles.modeSelectionContainer}>
        <Text style={styles.modeTitle}>Choose Review Mode</Text>
        <Text style={styles.modeSubtitle}>Select how you'd like to review your vocabulary</Text>
        
        <View style={styles.modeOptions}>
          <TouchableOpacity 
            style={[styles.modeOption, mode === 'vocabulary' && styles.selectedMode]}
            onPress={() => setMode('vocabulary')}
          >
            <Ionicons name="book" size={32} color="#3B82F6" />
            <Text style={styles.modeOptionTitle}>Vocabulary Only</Text>
            <Text style={styles.modeOptionDescription}>Traditional flashcard review</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modeOption, mode === 'mixed' && styles.selectedMode]}
            onPress={() => setMode('mixed')}
          >
            <Ionicons name="layers" size={32} color="#10B981" />
            <Text style={styles.modeOptionTitle}>Mixed Practice</Text>
            <Text style={styles.modeOptionDescription}>Vocabulary + Writing + Speaking</Text>
          </TouchableOpacity>
        </View>
        
        <Button
          title="Start Review"
          onPress={fetchReviewItems}
          style={styles.startButton}
        />
      </View>
    );
  }

  // Show empty state if no items to review
  if (cards.length === 0 && exercises.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="checkmark-circle" size={80} color="#10B981" />
        <Text style={styles.emptyTitle}>Great Work!</Text>
        <Text style={styles.emptySubtitle}>
          You've completed all your reviews for now.
        </Text>
        <Text style={styles.emptyHint}>
          Come back later for more reviews!
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Back to Learn</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentItem = cards[currentItemIndex];
  const progressPercentage = cards.length > 0 
    ? ((currentItemIndex + 1) / cards.length) * 100 
    : 0;

  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <AchievementNotification />
      
      {/* Header with Progress */}
      <View style={styles.reviewHeader}>
        <View>
          <Text style={styles.reviewTitle}>Unified Review</Text>
          <Text style={styles.reviewSubtitle}>
            Item {currentItemIndex + 1} of {cards.length + exercises.length}
          </Text>
        </View>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>{Math.round(progressPercentage)}%</Text>
          <Progress
            value={progressPercentage}
            height={8}
            backgroundColor="#E2E8F0"
            progressColor="#3B82F6"
            style={styles.progressBar}
          />
        </View>
      </View>

      {/* Mode Toggle */}
      <View style={styles.modeToggleContainer}>
        <TouchableOpacity 
          style={[styles.modeToggle, mode === 'vocabulary' && styles.activeMode]}
          onPress={() => setMode('vocabulary')}
        >
          <Text style={[styles.modeToggleText, mode === 'vocabulary' && styles.activeModeText]}>Vocabulary</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.modeToggle, mode === 'mixed' && styles.activeMode]}
          onPress={() => setMode('mixed')}
        >
          <Text style={[styles.modeToggleText, mode === 'mixed' && styles.activeModeText]}>Mixed Practice</Text>
        </TouchableOpacity>
      </View>

      <SimpleAddWordForm onWordAdded={fetchReviewItems} />

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <View style={styles.errorBannerContent}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.errorBannerText}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <Ionicons name="close" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Current Item Display */}
      {currentItem && (
        <View style={styles.cardContainer}>
          <TouchableOpacity
            onPress={() => {
              if (!showAnswer) {
                setIsAnimating(true);
                setTimeout(() => {
                  setShowAnswer(true);
                  setIsAnimating(false);
                }, 50);
              }
            }}
            disabled={showAnswer || isAnimating}
          >
            <LinearGradient
              colors={['#3B82F6', '#6366F1']}
              style={styles.vocabularyCard}
            >
              <View style={styles.cardContent}>
                {!showAnswer ? (
                  <View style={styles.cardFront}>
                    <Text style={styles.wordText}>{currentItem.word.text}</Text>
                    {currentItem.word.pronunciation && (
                      <View style={styles.pronunciationContainer}>
                        <Text style={styles.pronunciationText}>
                          /{currentItem.word.pronunciation}/
                        </Text>
                        <TouchableOpacity 
                          onPress={() => playPronunciation(currentItem.word.text)}
                          disabled={isPlayingAudio}
                          style={styles.audioButton}
                        >
                          {isPlayingAudio ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Ionicons name="volume-high" size={20} color="#FFFFFF" />
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                    {currentItem.word.partOfSpeech && (
                      <Text style={styles.partOfSpeechText}>
                        {currentItem.word.partOfSpeech}
                      </Text>
                    )}
                    <View style={styles.tapHint}>
                      <Ionicons name="finger-print" size={24} color="rgba(255, 255, 255, 0.8)" />
                      <Text style={styles.tapHintText}>Tap to reveal meaning</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.cardBack}>
                    <Text style={styles.meaningText}>{currentItem.word.meaning}</Text>
                    {currentItem.word.translation && (
                      <Text style={styles.translationText}>{currentItem.word.translation}</Text>
                    )}
                    {currentItem.word.examples && currentItem.word.examples.length > 0 && (
                      <View style={styles.examplesContainer}>
                        <Text style={styles.examplesTitle}>Examples:</Text>
                        {currentItem.word.examples.slice(0, 2).map((example, index) => (
                          <Text key={index} style={styles.exampleText}>
                            • {example}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Exercise Display */}
      {exercises.length > 0 && currentItemIndex >= cards.length && (
        <View style={styles.exerciseContainer}>
          <LinearGradient
            colors={['#10B981', '#3B82F6']}
            style={styles.exerciseCard}
          >
            <View style={styles.exerciseContent}>
              <Text style={styles.exerciseTitle}>Practice Exercise</Text>
              <Text style={styles.exerciseDescription}>
                {exercises[currentItemIndex - cards.length]?.title}
              </Text>
              <View style={styles.exerciseMeta}>
                <Text style={styles.exerciseType}>
                  {exercises[currentItemIndex - cards.length]?.type?.toUpperCase()}
                </Text>
                <Text style={styles.exerciseTime}>
                  {exercises[currentItemIndex - cards.length]?.estimatedTime} min
                </Text>
              </View>
              <Button
                title="Start Exercise"
                onPress={() => startExercise(exercises[currentItemIndex - cards.length])}
                style={styles.startExerciseButton}
              />
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Rating Buttons (for vocabulary items) */}
      {currentItem && showAnswer && (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingTitle}>How well did you remember this word?</Text>
          <View style={styles.ratingButtons}>
            <TouchableOpacity
              onPress={() => submitRating(Rating.Again)}
              disabled={isSubmitting}
              style={[styles.ratingButton, styles.againButton]}
            >
              <View style={styles.ratingButtonCircle} />
              <Text style={styles.ratingButtonText}>Again</Text>
              <Text style={styles.ratingSubtext}>&lt; 10m</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => submitRating(Rating.Hard)}
              disabled={isSubmitting}
              style={[styles.ratingButton, styles.hardButton]}
            >
              <View style={styles.ratingButtonCircle} />
              <Text style={styles.ratingButtonText}>Hard</Text>
              <Text style={styles.ratingSubtext}>6h</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => submitRating(Rating.Good)}
              disabled={isSubmitting}
              style={[styles.ratingButton, styles.goodButton]}
            >
              <View style={styles.ratingButtonCircle} />
              <Text style={styles.ratingButtonText}>Good</Text>
              <Text style={styles.ratingSubtext}>3d</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => submitRating(Rating.Easy)}
              disabled={isSubmitting}
              style={[styles.ratingButton, styles.easyButton]}
            >
              <View style={styles.ratingButtonCircle} />
              <Text style={styles.ratingButtonText}>Easy</Text>
              <Text style={styles.ratingSubtext}>1w</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Session Stats */}
      {showStats && (
        <View style={styles.sessionStatsContainer}>
          <View style={styles.sessionStatsHeader}>
            <Text style={styles.sessionStatsTitle}>Session Stats</Text>
            <TouchableOpacity 
              onPress={() => setShowStats(!showStats)}
              style={styles.toggleStatsButton}
            >
              <Text style={styles.toggleStatsText}>Hide</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sessionStatsContent}>
            <View style={styles.sessionStatItem}>
              <Text style={styles.sessionStatValue}>{sessionStats.total}</Text>
              <Text style={styles.sessionStatLabel}>Reviewed</Text>
            </View>
            <View style={styles.sessionStatItem}>
              <Text style={styles.sessionStatValue}>{cards.length + exercises.length - currentItemIndex - 1}</Text>
              <Text style={styles.sessionStatLabel}>Remaining</Text>
            </View>
            <View style={styles.sessionStatItem}>
              <Text style={styles.sessionStatValue}>{sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0}%</Text>
              <Text style={styles.sessionStatLabel}>Accuracy</Text>
            </View>
          </View>
        </View>
      )}
      
      {/* Progress Charts */}
      <ProgressChart />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 8,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    textAlign: 'center',
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  errorButton: {
    flex: 1,
  },
  modeSelectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  modeSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
  },
  modeOptions: {
    width: '100%',
    marginBottom: 32,
  },
  modeOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedMode: {
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  modeOptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 12,
    marginBottom: 8,
  },
  modeOptionDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  startButton: {
    width: '80%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 8,
  },
  backButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  reviewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  reviewSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
  },
  progressContainer: {
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  progressBar: {
    width: 80,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  modeToggle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  activeMode: {
    backgroundColor: '#EFF6FF',
  },
  modeToggleText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
  },
  activeModeText: {
    color: '#3B82F6',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  errorBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorBannerText: {
    flex: 1,
    color: '#B91C1C',
    fontSize: 14,
    marginLeft: 8,
  },
  cardContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  vocabularyCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  cardContent: {
    padding: 32,
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFront: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cardBack: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  wordText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  pronunciationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pronunciationText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
    marginRight: 12,
  },
  audioButton: {
    padding: 8,
  },
  partOfSpeechText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginBottom: 24,
  },
  tapHint: {
    alignItems: 'center',
    marginTop: 32,
  },
  tapHintText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  meaningText: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 12,
  },
  translationText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  examplesContainer: {
    marginTop: 16,
    alignItems: 'flex-start',
  },
  examplesTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  exerciseContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  exerciseCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  exerciseContent: {
    padding: 32,
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  exerciseDescription: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  exerciseMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
  },
  exerciseType: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  exerciseTime: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  startExerciseButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  ratingContainer: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 20,
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  ratingButtonCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  ratingButton: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    transform: [{ scale: 1 }],
  },
  againButton: {
    backgroundColor: '#EF4444',
  },
  hardButton: {
    backgroundColor: '#F59E0B',
  },
  goodButton: {
    backgroundColor: '#10B981',
  },
  easyButton: {
    backgroundColor: '#3B82F6',
  },
  ratingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
  },
  ratingSubtext: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  sessionStatsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    marginBottom: 24,
  },
  sessionStatsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sessionStatsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  toggleStatsButton: {
    padding: 4,
  },
  toggleStatsText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  sessionStatsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sessionStatItem: {
    alignItems: 'center',
  },
  sessionStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  sessionStatLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
});