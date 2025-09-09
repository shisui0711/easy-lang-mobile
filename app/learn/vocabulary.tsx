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
import { router } from 'expo-router';

import { Card, CardContent, Progress, Button } from '@/components/ui';
import { apiClient } from '@/lib/api';

interface VocabularyCard {
  id: string;
  wordId: string;
  stability: number;
  difficulty: number;
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

type Rating = 'again' | 'hard' | 'good' | 'easy';

export default function VocabularyScreen() {
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

  useEffect(() => {
    fetchReviewCards();
  }, []);

  const fetchReviewCards = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/review');
      if (response.success && response.data) {
        setCards((response.data as any)?.cards || []);
        setCurrentCardIndex(0);
        setShowAnswer(false);
      } else {
        Alert.alert('Error', 'Failed to fetch vocabulary cards');
      }
    } catch (error) {
      console.error('Failed to fetch cards:', error);
      Alert.alert('Error', 'Failed to load vocabulary cards');
    } finally {
      setIsLoading(false);
    }
  };

  const submitRating = async (rating: Rating) => {
    const currentCard = cards[currentCardIndex];
    if (!currentCard || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/review', {
        cardId: currentCard.id,
        rating: rating
      });

      if (response.success) {
        // Update session stats
        setSessionStats(prev => ({
          ...prev,
          total: prev.total + 1,
          correct: rating === 'good' || rating === 'easy' ? prev.correct + 1 : prev.correct
        }));

        // Move to next card or finish session
        if (currentCardIndex < cards.length - 1) {
          setCurrentCardIndex(currentCardIndex + 1);
          setShowAnswer(false);
        } else {
          // Session complete
          Alert.alert(
            'Session Complete!',
            `You reviewed ${cards.length} cards.\nAccuracy: ${Math.round((sessionStats.correct / sessionStats.total) * 100)}%`,
            [
              { text: 'Continue Learning', onPress: fetchReviewCards },
              { text: 'Back to Learn', onPress: () => router.back() }
            ]
          );
        }
      } else {
        Alert.alert('Error', 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Failed to submit rating:', error);
      Alert.alert('Error', 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading vocabulary cards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (cards.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
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
      </SafeAreaView>
    );
  }

  const currentCard = cards[currentCardIndex];
  const progressPercentage = ((currentCardIndex + 1) / cards.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Header */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Card {currentCardIndex + 1} of {cards.length}
          </Text>
          <Progress
            value={progressPercentage}
            height={8}
            backgroundColor="#E2E8F0"
            progressColor="#3B82F6"
            style={styles.progressBar}
          />
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{sessionStats.correct}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{sessionStats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Vocabulary Card */}
        <TouchableOpacity
          onPress={() => setShowAnswer(true)}
          disabled={showAnswer}
          style={styles.cardContainer}
        >
          <LinearGradient
            colors={['#3B82F6', '#6366F1']}
            style={styles.vocabularyCard}
          >
            <View style={styles.cardContent}>
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
              
              {!showAnswer && (
                <View style={styles.tapHint}>
                  <Ionicons name="finger-print" size={24} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.tapHintText}>Tap to reveal meaning</Text>
                </View>
              )}

              {showAnswer && (
                <View style={styles.answerContainer}>
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

        {/* Rating Buttons */}
        {showAnswer && (
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingTitle}>How well did you know this word?</Text>
            <View style={styles.ratingButtons}>
              <TouchableOpacity
                onPress={() => submitRating('again')}
                disabled={isSubmitting}
                style={[styles.ratingButton, styles.againButton]}
              >
                <Ionicons name="close-circle" size={24} color="#FFFFFF" />
                <Text style={styles.ratingButtonText}>Again</Text>
                <Text style={styles.ratingSubtext}>Didn&apos;t know</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => submitRating('hard')}
                disabled={isSubmitting}
                style={[styles.ratingButton, styles.hardButton]}
              >
                <Ionicons name="alert-circle" size={24} color="#FFFFFF" />
                <Text style={styles.ratingButtonText}>Hard</Text>
                <Text style={styles.ratingSubtext}>Difficult</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => submitRating('good')}
                disabled={isSubmitting}
                style={[styles.ratingButton, styles.goodButton]}
              >
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                <Text style={styles.ratingButtonText}>Good</Text>
                <Text style={styles.ratingSubtext}>Knew it</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => submitRating('easy')}
                disabled={isSubmitting}
                style={[styles.ratingButton, styles.easyButton]}
              >
                <Ionicons name="flash" size={24} color="#FFFFFF" />
                <Text style={styles.ratingButtonText}>Easy</Text>
                <Text style={styles.ratingSubtext}>Too easy</Text>
              </TouchableOpacity>
            </View>
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
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  progressBar: {
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  cardContainer: {
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
  answerContainer: {
    alignItems: 'center',
    marginTop: 16,
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
  ratingButton: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
});