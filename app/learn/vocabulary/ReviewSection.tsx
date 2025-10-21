import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
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
import { apiClient, learningApi, aiApi, gamificationApi } from '@/lib/api';
import { SimpleAddWordForm } from './SimpleAddWordForm';
import { ProgressChart } from '@/components/vocabulary/ProgressChart';
import { AchievementNotification } from '@/components/vocabulary/AchievementNotification';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { useDebounce, useThrottle } from '@/lib/performance';
import eventEmitter from '@/lib/eventEmitter';

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

enum Rating {
  Manual = 0,
  Again = 1,
  Hard = 2,
  Good = 3,
  Easy = 4
}

// Memoized components for better performance
const VocabularyCardComponent = memo(({ 
  card, 
  showAnswer, 
  isPlayingAudio, 
  onPlayPronunciation,
  onRevealAnswer
}: {
  card: VocabularyCard;
  showAnswer: boolean;
  isPlayingAudio: boolean;
  onPlayPronunciation: (text: string) => void;
  onRevealAnswer: () => void;
}) => {
  return (
    <TouchableOpacity
      onPress={onRevealAnswer}
      disabled={showAnswer}
    >
      <LinearGradient
        colors={['#3B82F6', '#6366F1']}
        style={styles.vocabularyCard}
      >
        <View style={styles.cardContent}>
          {!showAnswer ? (
            <View style={styles.cardFront}>
              <Text style={styles.wordText}>{card.word.text}</Text>
              {card.word.pronunciation && (
                <View style={styles.pronunciationContainer}>
                  <Text style={styles.pronunciationText}>
                    /{card.word.pronunciation}/
                  </Text>
                  <TouchableOpacity 
                    onPress={() => onPlayPronunciation(card.word.text)}
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
              {card.word.partOfSpeech && (
                <Text style={styles.partOfSpeechText}>
                  {card.word.partOfSpeech}
                </Text>
              )}
              <View style={styles.tapHint}>
                <Ionicons name="finger-print" size={24} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.tapHintText}>Tap to reveal meaning</Text>
              </View>
            </View>
          ) : (
            <View style={styles.cardBack}>
              <Text style={styles.meaningText}>{card.word.meaning}</Text>
              {card.word.translation && (
                <Text style={styles.translationText}>{card.word.translation}</Text>
              )}
              {card.word.examples && card.word.examples.length > 0 && (
                <View style={styles.examplesContainer}>
                  <Text style={styles.examplesTitle}>Examples:</Text>
                  {card.word.examples.slice(0, 2).map((example, index) => (
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
  );
});

VocabularyCardComponent.displayName = 'VocabularyCardComponent';

export const ReviewSection = () => {
  const [cards, setCards] = useState<VocabularyCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
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
  const achievementNotificationRef = useRef<any>(null);

  // Throttled pronunciation function to prevent multiple rapid calls
  const throttledPlayPronunciation = useThrottle(playPronunciation, 1000);

  // Play pronunciation using TTS
  async function playPronunciation(text: string) {
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

  const fetchReviewCards = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/review');
      if (response.success && response.data) {
        setCards(response.data as VocabularyCard[] || []);
        setCurrentCardIndex(0);
        setShowAnswer(false);
      } else {
        setError(response.error || 'Failed to fetch vocabulary cards');
      }
    } catch (error: any) {
      console.error('Failed to fetch cards:', error);
      setError(error.message || 'Failed to load vocabulary cards. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced fetch function to prevent multiple rapid calls
  const debouncedFetchReviewCards = useDebounce(fetchReviewCards, 300);

  useEffect(() => {
    fetchReviewCards();
  }, []);

  // Memoized rating submit function
  const handleRatingSubmit = useCallback(async (rating: Rating) => {
    const currentCard = cards[currentCardIndex];
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
        if (currentCardIndex < cards.length - 1) {
          setIsAnimating(true);
          setShowAnswer(false);
          // Wait for animation to complete before changing cards
          setTimeout(() => {
            setCurrentCardIndex(currentCardIndex + 1);
            setIsAnimating(false);
          }, 300);
        } else {
          // Session complete
          Alert.alert(
            'Session Complete!',
            `You reviewed ${cards.length} cards.\nAccuracy: ${sessionStats.total > 0 ? Math.round(((sessionStats.correct + (rating === Rating.Good || rating === Rating.Easy ? 1 : 0)) / (sessionStats.total + 1)) * 100) : 0}%`,
            [
              { text: 'Continue Learning', onPress: debouncedFetchReviewCards },
              { text: 'Back to Learn', onPress: () => router.back() }
            ]
          );
        }

        // Check for new achievements after completing a review
        try {
          const achievementResponse: any = await gamificationApi.checkAchievementsAfterVocabularyReview();
          if (achievementResponse.success && achievementResponse.data && Array.isArray(achievementResponse.data.newAchievements) && achievementResponse.data.newAchievements.length > 0) {
            // Show notification for each new achievement
            achievementResponse.data.newAchievements.forEach((achievement: any) => {
              // Emit event to notify the AchievementNotification component
              eventEmitter.emit('achievementUnlocked', achievement);
            });
          }
        } catch (achievementError) {
          console.error('Failed to check achievements:', achievementError);
        }

      } else {
        setError(response.error || 'Failed to submit rating. Please try again.');
      }
    } catch (error: any) {
      console.error('Failed to submit rating:', error);
      setError(error.message || 'Failed to submit rating. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [cards, currentCardIndex, isSubmitting, sessionStats, debouncedFetchReviewCards]);

  if (isLoading) {
    return <LoadingScreen message="Loading vocabulary cards..." skeletonType="list" />;
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Oops! Something went wrong"
        message={error}
        onRetry={debouncedFetchReviewCards}
        onGoBack={() => router.back()}
      />
    );
  }

  if (cards.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="checkmark-circle" size={80} color="#10B981" />
        <Text style={styles.emptyTitle}>Great Work!</Text>
        <Text style={styles.emptySubtitle}>
          You&apos;ve completed all your vocabulary reviews for now.
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

  const currentCard = cards[currentCardIndex];
  const progressPercentage = ((currentCardIndex + 1) / cards.length) * 100;

  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <AchievementNotification />
      {/* Header with Progress */}
      <View style={styles.reviewHeader}>
        <View>
          <Text style={styles.reviewTitle}>Vocabulary Review</Text>
          <Text style={styles.reviewSubtitle}>
            Card {currentCardIndex + 1} of {cards.length}
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

      <SimpleAddWordForm onWordAdded={debouncedFetchReviewCards} />

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

      {/* Vocabulary Card with Flip Animation */}
      <View style={styles.cardContainer}>
        <VocabularyCardComponent
          card={currentCard}
          showAnswer={showAnswer}
          isPlayingAudio={isPlayingAudio}
          onPlayPronunciation={throttledPlayPronunciation}
          onRevealAnswer={() => {
            if (!showAnswer) {
              setIsAnimating(true);
              setTimeout(() => {
                setShowAnswer(true);
                setIsAnimating(false);
              }, 50);
            }
          }}
        />
      </View>

      {/* Rating Buttons */}
      {showAnswer && (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingTitle}>How well did you remember this word?</Text>
          <View style={styles.ratingButtons}>
            <TouchableOpacity
              onPress={() => handleRatingSubmit(Rating.Again)}
              disabled={isSubmitting}
              style={[styles.ratingButton, styles.againButton]}
            >
              <View style={styles.ratingButtonCircle} />
              <Text style={styles.ratingButtonText}>Again</Text>
              <Text style={styles.ratingSubtext}>&lt; 10m</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleRatingSubmit(Rating.Hard)}
              disabled={isSubmitting}
              style={[styles.ratingButton, styles.hardButton]}
            >
              <View style={styles.ratingButtonCircle} />
              <Text style={styles.ratingButtonText}>Hard</Text>
              <Text style={styles.ratingSubtext}>6h</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleRatingSubmit(Rating.Good)}
              disabled={isSubmitting}
              style={[styles.ratingButton, styles.goodButton]}
            >
              <View style={styles.ratingButtonCircle} />
              <Text style={styles.ratingButtonText}>Good</Text>
              <Text style={styles.ratingSubtext}>3d</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleRatingSubmit(Rating.Easy)}
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
              <Text style={styles.sessionStatValue}>{cards.length - currentCardIndex - 1}</Text>
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