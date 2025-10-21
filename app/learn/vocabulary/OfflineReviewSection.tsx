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
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

import { Progress, Button } from '@/components/ui';
import { apiClient, learningApi } from '@/lib/api';
import { SimpleAddWordForm } from './SimpleAddWordForm';

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

export const OfflineReviewSection = () => {
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
  const [isAnimating, setIsAnimating] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'syncing'>('synced');

  useEffect(() => {
    // Check network status
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    fetchOfflineReviewCards();
    
    return () => {
      unsubscribe();
    };
  }, []);

  const fetchOfflineReviewCards = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Try to get cards from AsyncStorage first
      const storedCards = await AsyncStorage.getItem('offline_vocabulary_cards');
      if (storedCards) {
        setCards(JSON.parse(storedCards));
      } else {
        // If no stored cards, try to fetch from API and store locally
        const response = await apiClient.get('/review');
        if (response.success && response.data) {
          const cardsData = response.data as VocabularyCard[] || [];
          setCards(cardsData);
          // Store in AsyncStorage for offline use
          await AsyncStorage.setItem('offline_vocabulary_cards', JSON.stringify(cardsData));
        } else {
          setError(response.error || 'Failed to fetch vocabulary cards');
        }
      }
      
      setCurrentCardIndex(0);
      setShowAnswer(false);
    } catch (error: any) {
      console.error('Failed to fetch offline review cards:', error);
      setError(error.message || 'Failed to load offline review cards.');
    } finally {
      setIsLoading(false);
    }
  };

  const syncOfflineData = async () => {
    if (!isOnline) {
      Alert.alert('No Internet Connection', 'Please connect to the internet to sync your data.');
      return;
    }

    setSyncStatus('syncing');
    try {
      // Get pending ratings from AsyncStorage
      const pendingRatings = await AsyncStorage.getItem('pending_vocabulary_ratings');
      if (pendingRatings) {
        const ratings = JSON.parse(pendingRatings);
        
        // Submit all pending ratings
        for (const rating of ratings) {
          try {
            await learningApi.submitVocabularyRating(rating.wordId, rating.rating);
          } catch (error) {
            console.error('Failed to sync rating:', error);
            // Keep this rating for next sync attempt
            continue;
          }
        }
        
        // Clear pending ratings after successful sync
        await AsyncStorage.removeItem('pending_vocabulary_ratings');
        setSyncStatus('synced');
        
        Alert.alert('Success', 'Your offline data has been synced successfully!');
      } else {
        setSyncStatus('synced');
      }
    } catch (error: any) {
      console.error('Failed to sync offline data:', error);
      setSyncStatus('pending');
      Alert.alert('Sync Failed', 'Failed to sync your data. Please try again later.');
    }
  };

  const storeOfflineRating = async (wordId: string, rating: Rating) => {
    try {
      // Get existing pending ratings
      const pendingRatings = await AsyncStorage.getItem('pending_vocabulary_ratings');
      const ratings = pendingRatings ? JSON.parse(pendingRatings) : [];
      
      // Add new rating
      ratings.push({ wordId, rating, timestamp: Date.now() });
      
      // Store updated ratings
      await AsyncStorage.setItem('pending_vocabulary_ratings', JSON.stringify(ratings));
      setSyncStatus('pending');
    } catch (error) {
      console.error('Failed to store offline rating:', error);
    }
  };

  const submitRating = async (rating: Rating) => {
    const currentCard = cards[currentCardIndex];
    if (!currentCard || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      if (isOnline) {
        // Online mode - submit directly to API
        const response = await learningApi.submitVocabularyRating(currentCard.wordId, rating);
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to submit rating');
        }
      } else {
        // Offline mode - store rating locally
        await storeOfflineRating(currentCard.wordId, rating);
      }

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
            { 
              text: 'Continue Learning', 
              onPress: () => {
                if (isOnline) {
                  fetchOfflineReviewCards();
                }
              }
            },
            { text: 'Back to Learn', onPress: () => {} }
          ]
        );
      }
    } catch (error: any) {
      console.error('Failed to submit rating:', error);
      setError(error.message || 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading offline vocabulary cards...</Text>
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
            onPress={fetchOfflineReviewCards}
            style={styles.errorButton}
          />
        </View>
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="book-outline" size={80} color="#94A3B8" />
        <Text style={styles.emptyTitle}>No Cards Available</Text>
        <Text style={styles.emptySubtitle}>
          Download vocabulary cards for offline review when you're online.
        </Text>
        {isOnline ? (
          <Button
            title="Download Cards"
            onPress={fetchOfflineReviewCards}
            style={styles.downloadButton}
          />
        ) : (
          <Text style={styles.offlineHint}>
            Please connect to the internet to download cards.
          </Text>
        )}
      </View>
    );
  }

  const currentCard = cards[currentCardIndex];
  const progressPercentage = ((currentCardIndex + 1) / cards.length) * 100;

  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header with Progress */}
      <View style={styles.reviewHeader}>
        <View>
          <Text style={styles.reviewTitle}>Offline Vocabulary Review</Text>
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

      {/* Offline Status */}
      <View style={styles.offlineStatusContainer}>
        <View style={[styles.statusIndicator, isOnline ? styles.onlineIndicator : styles.offlineIndicator]} />
        <Text style={styles.statusText}>
          {isOnline ? 'Online Mode' : 'Offline Mode'}
        </Text>
        {syncStatus !== 'synced' && (
          <TouchableOpacity 
            style={styles.syncButton}
            onPress={syncOfflineData}
            disabled={syncStatus === 'syncing'}
          >
            <Text style={styles.syncButtonText}>
              {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

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
                  <Text style={styles.wordText}>{currentCard.word.text}</Text>
                  {currentCard.word.pronunciation && (
                    <Text style={styles.pronunciationText}>
                      /{currentCard.word.pronunciation}/
                    </Text>
                  )}
                  {currentCard.word.partOfSpeech && (
                    <Text style={styles.partOfSpeechText}>
                      {currentCard.word.partOfSpeech}
                    </Text>
                  )}
                  <View style={styles.tapHint}>
                    <Ionicons name="finger-print" size={24} color="rgba(255, 255, 255, 0.8)" />
                    <Text style={styles.tapHintText}>Tap to reveal meaning</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.cardBack}>
                  <Text style={styles.meaningText}>{currentCard.word.meaning}</Text>
                  {currentCard.word.translation && (
                    <Text style={styles.translationText}>{currentCard.word.translation}</Text>
                  )}
                  {currentCard.word.examples && currentCard.word.examples.length > 0 && (
                    <View style={styles.examplesContainer}>
                      <Text style={styles.examplesTitle}>Examples:</Text>
                      {currentCard.word.examples.slice(0, 2).map((example, index) => (
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

      {/* Rating Buttons */}
      {showAnswer && (
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  offlineHint: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
  },
  downloadButton: {
    width: '80%',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  reviewSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  progressContainer: {
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  progressBar: {
    width: 60,
  },
  offlineStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  onlineIndicator: {
    backgroundColor: '#10B981',
  },
  offlineIndicator: {
    backgroundColor: '#F59E0B',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  syncButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
  pronunciationText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
    marginBottom: 8,
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
    fontSize: 16,
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