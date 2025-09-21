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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Card, CardContent, Progress, Button, Input } from '@/components/ui';
import { apiClient, learningApi } from '@/lib/api';

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

type Rating = 'again' | 'hard' | 'good' | 'easy';
interface Question {
  id: string;
  vocabularyCardId: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
}

interface VocabularySet {
  id: string;
  name: string;
  language: string;
}

interface Topic {
  id: string;
  name: string;
}

interface VocabularyCardWithSet extends VocabularyCard {
  vocabularySet: VocabularySet;
  topic?: Topic;
}

// Tab navigation component
const TabBar = ({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) => {
  return (
    <View style={styles.tabBar}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'review' && styles.activeTab]}
        onPress={() => setActiveTab('review')}
      >
        <Ionicons 
          name="sparkles" 
          size={20} 
          color={activeTab === 'review' ? '#3B82F6' : '#94A3B8'} 
        />
        <Text style={[styles.tabText, activeTab === 'review' && styles.activeTabText]}>Review</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'practice' && styles.activeTab]}
        onPress={() => setActiveTab('practice')}
      >
        <Ionicons 
          name="book" 
          size={20} 
          color={activeTab === 'practice' ? '#3B82F6' : '#94A3B8'} 
        />
        <Text style={[styles.tabText, activeTab === 'practice' && styles.activeTabText]}>Practice</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'manage' && styles.activeTab]}
        onPress={() => setActiveTab('manage')}
      >
        <Ionicons 
          name="settings" 
          size={20} 
          color={activeTab === 'manage' ? '#3B82F6' : '#94A3B8'} 
        />
        <Text style={[styles.tabText, activeTab === 'manage' && styles.activeTabText]}>Manage</Text>
      </TouchableOpacity>
    </View>
  );
};

// Review Section Component
const ReviewSection = () => {
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

  useEffect(() => {
    fetchReviewCards();
  }, []);

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

  const submitRating = async (rating: Rating) => {
    const currentCard = cards[currentCardIndex];
    if (!currentCard || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
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
            `You reviewed ${cards.length} cards.\nAccuracy: ${sessionStats.total > 0 ? Math.round(((sessionStats.correct + (rating === 'good' || rating === 'easy' ? 1 : 0)) / (sessionStats.total + 1)) * 100) : 0}%`,
            [
              { text: 'Continue Learning', onPress: fetchReviewCards },
              { text: 'Back to Learn', onPress: () => router.back() }
            ]
          );
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
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading vocabulary cards...</Text>
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
            onPress={fetchReviewCards}
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

      <SimpleAddWordForm onWordAdded={fetchReviewCards} />

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
            {!showAnswer ? (
              <>
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
              </>
            ) : (
              <>
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
              </>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Rating Buttons */}
      {showAnswer && (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingTitle}>How well did you remember this word?</Text>
          <View style={styles.ratingButtons}>
            <TouchableOpacity
              onPress={() => submitRating('again')}
              disabled={isSubmitting}
              style={[styles.ratingButton, styles.againButton]}
            >
              <View style={styles.ratingButtonCircle} />
              <Text style={styles.ratingButtonText}>Again</Text>
              <Text style={styles.ratingSubtext}>&lt; 10m</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => submitRating('hard')}
              disabled={isSubmitting}
              style={[styles.ratingButton, styles.hardButton]}
            >
              <View style={styles.ratingButtonCircle} />
              <Text style={styles.ratingButtonText}>Hard</Text>
              <Text style={styles.ratingSubtext}>6h</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => submitRating('good')}
              disabled={isSubmitting}
              style={[styles.ratingButton, styles.goodButton]}
            >
              <View style={styles.ratingButtonCircle} />
              <Text style={styles.ratingButtonText}>Good</Text>
              <Text style={styles.ratingSubtext}>3d</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => submitRating('easy')}
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
              <Text style={styles.sessionStatValue}>{currentCardIndex}</Text>
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

// Practice Section Component
const PracticeSection = () => {
  const [vocabularyCards, setVocabularyCards] = useState<VocabularyCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<VocabularyCard | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch vocabulary cards for practice
  useEffect(() => {
    const fetchVocabularyCards = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get('/vocabulary', {
          params: { pageSize: 20 }
        });
        if (response.success) {
          setVocabularyCards((response.data as any)?.data || []);
        } else {
          setError('Failed to fetch vocabulary cards');
        }
      } catch (err) {
        setError('Failed to fetch vocabulary cards');
        console.error('Error fetching vocabulary cards:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVocabularyCards();
  }, []);

  // Generate questions for a selected vocabulary card
  const generateQuestions = async (card: VocabularyCard) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/vocabulary/questions', {
        vocabularyCardId: card.id,
        count: 3
      });
      if (response.success) {
        setQuestions((response.data as any)?.questions || []);
        setSelectedCard(card);
        setCurrentQuestionIndex(0);
        setUserAnswer('');
        setShowResult(false);
      } else {
        setError('Failed to generate questions');
      }
    } catch (err) {
      setError('Failed to generate questions');
      console.error('Error generating questions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Check user's answer
  const checkAnswer = async () => {
    if (!selectedCard || questions.length === 0) return;

    setIsLoading(true);
    try {
      const response = await apiClient.put('/vocabulary/questions', {
        questionId: questions[currentQuestionIndex]?.id,
        userAnswer,
        vocabularyCardId: selectedCard.id,
      });
      if (response.success) {
        setIsCorrect((response.data as any)?.isCorrect || false);
        setShowResult(true);
      } else {
        setError('Failed to check answer');
      }
    } catch (err) {
      setError('Failed to check answer');
      console.error('Error checking answer:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Move to next question or finish practice
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer('');
      setShowResult(false);
    } else {
      // Finish practice session
      setSelectedCard(null);
      setQuestions([]);
      setCurrentQuestionIndex(0);
    }
  };

  // Go back to vocabulary selection
  const goBackToSelection = () => {
    setSelectedCard(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setShowResult(false);
  };

  // If we're showing questions for a selected card
  if (selectedCard && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#3B82F6', '#8B5CF6']}
          style={styles.practiceHeaderGradient}
        >
          <View style={styles.practiceHeaderContent}>
            <View style={styles.practiceHeaderLeft}>
              <Text style={styles.practiceTitle}>Practice Questions</Text>
              <Text style={styles.practiceSubtitle}>Test your knowledge of &quot;{selectedCard.word.text}&quot;</Text>
            </View>
            <TouchableOpacity onPress={goBackToSelection} style={styles.practiceBackButton}>
              <Text style={styles.practiceBackButtonText}>Back to Vocabulary</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
          <Progress
            value={progress}
            height={8}
            backgroundColor="#E2E8F0"
            progressColor="#3B82F6"
            style={styles.progressBar}
          />
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>

          {!showResult ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Your Answer</Text>
                <TextInput
                  style={styles.answerInput}
                  value={userAnswer}
                  onChangeText={setUserAnswer}
                  placeholder="Enter your answer..."
                  editable={!isLoading}
                />
              </View>
              <Button
                title={isLoading ? "Checking..." : "Check Answer"}
                onPress={checkAnswer}
                disabled={isLoading || !userAnswer.trim()}
                style={styles.checkButton}
              />
            </>
          ) : (
            <View style={styles.resultContainer}>
              <View style={[styles.resultIndicator, isCorrect ? styles.correctIndicator : styles.incorrectIndicator]}>
                <Ionicons
                  name={isCorrect ? "checkmark-circle" : "close-circle"}
                  size={32}
                  color={isCorrect ? "#10B981" : "#EF4444"}
                />
                <Text style={styles.resultText}>
                  {isCorrect ? "Correct!" : "Incorrect"}
                </Text>
              </View>
              
              {!isCorrect && (
                <Text style={styles.correctAnswerText}>
                  Correct answer: {currentQuestion.correctAnswer}
                </Text>
              )}
              
              {currentQuestion.explanation && (
                <Text style={styles.explanationText}>
                  {currentQuestion.explanation}
                </Text>
              )}
              
              <Button
                title={currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Practice"}
                onPress={nextQuestion}
                style={styles.nextButton}
              />
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  // Show vocabulary card selection
  return (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Practice Your Vocabulary</Text>
      <Text style={styles.sectionSubtitle}>
        Select a vocabulary word to practice with interactive questions
      </Text>

      {error && (
        <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading vocabulary cards...</Text>
        </View>
      ) : (
        <FlatList
          data={vocabularyCards}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.vocabularyCardItem}
              onPress={() => generateQuestions(item)}
            >
              <Text style={styles.vocabularyCardText}>{item.word.text}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const SimpleAddWordForm = ({ onWordAdded }: { onWordAdded: () => void }) => {
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addWord = async () => {
    if (!word || !meaning) {
      setError('Please fill in both fields');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await learningApi.addVocabularyCard({
        word,
        meaning,
      });

      if (response.success) {
        Alert.alert('Success', 'Word added successfully!');
        onWordAdded();
        setWord('');
        setMeaning('');
      } else {
        setError(response.error || 'Failed to add word. Please try again.');
      }
    } catch (error: any) {
      console.error('Failed to add word:', error);
      setError(error.message || 'Failed to add word. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.addWordForm}>
      <Input
        label="Word"
        value={word}
        onChangeText={setWord}
        placeholder="Enter the word"
        style={styles.input}
      />
      <Input
        label="Meaning"
        value={meaning}
        onChangeText={setMeaning}
        placeholder="Enter the meaning"
        style={styles.input}
      />
      <Button
        title={isLoading ? 'Adding...' : 'Add Word'}
        onPress={addWord}
        disabled={isLoading}
        style={styles.submitButton}
      />
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const Learn = () => {
  const [activeTab, setActiveTab] = useState('review');

  return (
    <SafeAreaView style={styles.container}>
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === 'review' && <ReviewSection />}
      {activeTab === 'practice' && <PracticeSection />}
      {activeTab === 'manage' && <ManageSection />}
    </SafeAreaView>
  );
};

// Add Word Form Component
const AddWordForm = ({ onWordAdded }: { onWordAdded: () => void }) => {
  const [text, setText] = useState('');
  const [reading, setReading] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError('Word/phrase is required');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await learningApi.addVocabularyCard({ text, reading });
      if (response.success) {
        // Clear form and notify parent
        setText('');
        setReading('');
        setShowForm(false);
        onWordAdded();
      } else {
        setError(response.error || 'Failed to add word');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add word');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showForm) {
    return (
      <TouchableOpacity
        onPress={() => setShowForm(true)}
        style={styles.addWordButton}
      >
        <LinearGradient
          colors={['#3B82F6', '#8B5CF6']}
          style={styles.addWordButtonGradient}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
          <Text style={styles.addWordButtonText}>Add New Word</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.addWordForm}>
      <View style={styles.addWordFormHeader}>
        <Text style={styles.addWordFormTitle}>Add New Word</Text>
        <TouchableOpacity onPress={() => setShowForm(false)}>
          <Ionicons name="close" size={24} color="#94A3B8" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.addWordFormDescription}>
        Enter a word or phrase and we&apos;ll automatically generate the meaning for you
      </Text>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <Input
        label="Word / Phrase"
        placeholder="Enter word or phrase..."
        value={text}
        onChangeText={setText}
        style={styles.input}
      />
      
      <Input
        label="Pronunciation (Optional)"
        placeholder="/pronunciation/ or reading..."
        value={reading}
        onChangeText={setReading}
        style={styles.input}
      />
      
      <View style={styles.addWordFormActions}>
        <Button
          title={isSubmitting ? "Adding..." : "Add Word"}
          onPress={handleSubmit}
          disabled={isSubmitting}
          loading={isSubmitting}
          style={styles.submitButton}
        />
        <Button
          title="Cancel"
          variant="outline"
          onPress={() => setShowForm(false)}
          disabled={isSubmitting}
          style={styles.cancelButton}
        />
      </View>
    </View>
  );
};

// Manage Section Component
const ManageSection = () => {
  const [vocabularyCards, setVocabularyCards] = useState<VocabularyCardWithSet[]>([]);
  const [vocabularySets, setVocabularySets] = useState<VocabularySet[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    language: "",
    topicId: "",
    setId: "",
    difficulty: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showLanguageFilter, setShowLanguageFilter] = useState(false);
  const [showSetFilter, setShowSetFilter] = useState(false);
  const [showTopicFilter, setShowTopicFilter] = useState(false);
  const [showDifficultyFilter, setShowDifficultyFilter] = useState(false);

  const fetchVocabularyCards = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        pageNumber: currentPage.toString(),
        pageSize: "12",
      };

      if (searchQuery) params.searchQuery = searchQuery;
      if (filters.language) params.language = filters.language;
      if (filters.topicId) params.topicId = filters.topicId;
      if (filters.setId) params.setId = filters.setId;
      if (filters.difficulty) params.difficulty = filters.difficulty;

      const response = await learningApi.getVocabularyCards(params);
      if (response.success && response.data) {
        setVocabularyCards((response.data as any)?.data || []);
        setTotalPages((response.data as any)?.pagination?.totalPages || 1);
      } else {
        Alert.alert('Error', response.error || 'Failed to fetch vocabulary cards');
      }
    } catch (error) {
      console.error('Error fetching vocabulary cards:', error);
      Alert.alert('Error', 'Failed to fetch vocabulary cards');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVocabularySets = async () => {
    try {
      const response = await apiClient.get('/vocabulary/sets?pageSize=50');
      if (response.success && response.data) {
        setVocabularySets((response.data as any)?.data || []);
      }
    } catch (error) {
      console.error('Error fetching vocabulary sets:', error);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await apiClient.get('/topic?pageSize=50');
      if (response.success && response.data) {
        setTopics((response.data as any)?.data || []);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  useEffect(() => {
    fetchVocabularyCards();
    fetchVocabularySets();
    fetchTopics();
  }, [currentPage, searchQuery, filters]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchVocabularyCards();
  };

  const resetFilters = () => {
    setFilters({ language: "", topicId: "", setId: "", difficulty: "" });
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Render filter dropdowns
  const renderLanguageFilter = () => (
    <View style={styles.filterDropdown}>
      <TouchableOpacity 
        style={styles.filterOption}
        onPress={() => {
          handleFilterChange('language', '');
          setShowLanguageFilter(false);
        }}
      >
        <Text style={[styles.filterOptionText, !filters.language && styles.filterOptionTextSelected]}>
          All Languages
        </Text>
      </TouchableOpacity>
      {['en', 'vi', 'ja', 'zh'].map((lang) => (
        <TouchableOpacity 
          key={lang}
          style={styles.filterOption}
          onPress={() => {
            handleFilterChange('language', lang);
            setShowLanguageFilter(false);
          }}
        >
          <Text style={[styles.filterOptionText, filters.language === lang && styles.filterOptionTextSelected]}>
            {lang.toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSetFilter = () => (
    <View style={styles.filterDropdown}>
      <TouchableOpacity 
        style={styles.filterOption}
        onPress={() => {
          handleFilterChange('setId', '');
          setShowSetFilter(false);
        }}
      >
        <Text style={[styles.filterOptionText, !filters.setId && styles.filterOptionTextSelected]}>
          All Sets
        </Text>
      </TouchableOpacity>
      {vocabularySets.map((set) => (
        <TouchableOpacity 
          key={set.id}
          style={styles.filterOption}
          onPress={() => {
            handleFilterChange('setId', set.id);
            setShowSetFilter(false);
          }}
        >
          <Text style={[styles.filterOptionText, filters.setId === set.id && styles.filterOptionTextSelected]}>
            {set.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTopicFilter = () => (
    <View style={styles.filterDropdown}>
      <TouchableOpacity 
        style={styles.filterOption}
        onPress={() => {
          handleFilterChange('topicId', '');
          setShowTopicFilter(false);
        }}
      >
        <Text style={[styles.filterOptionText, !filters.topicId && styles.filterOptionTextSelected]}>
          All Topics
        </Text>
      </TouchableOpacity>
      {topics.map((topic) => (
        <TouchableOpacity 
          key={topic.id}
          style={styles.filterOption}
          onPress={() => {
            handleFilterChange('topicId', topic.id);
            setShowTopicFilter(false);
          }}
        >
          <Text style={[styles.filterOptionText, filters.topicId === topic.id && styles.filterOptionTextSelected]}>
            {topic.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDifficultyFilter = () => (
    <View style={styles.filterDropdown}>
      <TouchableOpacity 
        style={styles.filterOption}
        onPress={() => {
          handleFilterChange('difficulty', '');
          setShowDifficultyFilter(false);
        }}
      >
        <Text style={[styles.filterOptionText, !filters.difficulty && styles.filterOptionTextSelected]}>
          All Difficulties
        </Text>
      </TouchableOpacity>
      {['beginner', 'intermediate', 'advanced'].map((difficulty) => (
        <TouchableOpacity 
          key={difficulty}
          style={styles.filterOption}
          onPress={() => {
            handleFilterChange('difficulty', difficulty);
            setShowDifficultyFilter(false);
          }}
        >
          <Text style={[styles.filterOptionText, filters.difficulty === difficulty && styles.filterOptionTextSelected]}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <AddWordForm onWordAdded={fetchVocabularyCards} />
      
      {/* Header */}
      <View style={styles.managementHeader}>
        <Text style={styles.managementTitle}>Vocabulary Management</Text>
        <Text style={styles.managementSubtitle}>
          Browse, search, and organize your vocabulary cards
        </Text>
      </View>
      
      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vocabulary words..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>
        
        <View style={styles.filterRow}>
          <View style={styles.filterControls}>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => {
                setShowLanguageFilter(!showLanguageFilter);
                setShowSetFilter(false);
                setShowTopicFilter(false);
                setShowDifficultyFilter(false);
              }}
            >
              <Ionicons name="filter" size={20} color="#3B82F6" />
              <Text style={styles.filterButtonText}>Language</Text>
              {filters.language ? <View style={styles.filterBadge} /> : null}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => {
                setShowSetFilter(!showSetFilter);
                setShowLanguageFilter(false);
                setShowTopicFilter(false);
                setShowDifficultyFilter(false);
              }}
            >
              <Ionicons name="book" size={20} color="#3B82F6" />
              <Text style={styles.filterButtonText}>Vocabulary Set</Text>
              {filters.setId ? <View style={styles.filterBadge} /> : null}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => {
                setShowTopicFilter(!showTopicFilter);
                setShowLanguageFilter(false);
                setShowSetFilter(false);
                setShowDifficultyFilter(false);
              }}
            >
              <Ionicons name="bookmark" size={20} color="#3B82F6" />
              <Text style={styles.filterButtonText}>Topic</Text>
              {filters.topicId ? <View style={styles.filterBadge} /> : null}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => {
                setShowDifficultyFilter(!showDifficultyFilter);
                setShowLanguageFilter(false);
                setShowSetFilter(false);
                setShowTopicFilter(false);
              }}
            >
              <Ionicons name="bar-chart" size={20} color="#3B82F6" />
              <Text style={styles.filterButtonText}>Difficulty</Text>
              {filters.difficulty ? <View style={styles.filterBadge} /> : null}
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.clearButton} onPress={resetFilters}>
            <Text style={styles.clearButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
        
        {/* Filter Dropdowns */}
        {showLanguageFilter && renderLanguageFilter()}
        {showSetFilter && renderSetFilter()}
        {showTopicFilter && renderTopicFilter()}
        {showDifficultyFilter && renderDifficultyFilter()}
      </View>
      
      {/* Vocabulary Cards Grid */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading vocabulary cards...</Text>
        </View>
      ) : (
        <FlatList
          data={vocabularyCards}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.vocabularyGrid}
          renderItem={({ item }) => (
            <View style={styles.vocabularyCardItemManage}>
              <View style={styles.vocabularyCardHeader}>
                <Text style={styles.vocabularyCardLanguage}>
                  {item.vocabularySet?.language?.toUpperCase() || 'EN'}
                </Text>
                <Text style={[
                  styles.vocabularyCardDifficulty,
                  item.difficulty === 'beginner' && styles.difficultyBeginner,
                  item.difficulty === 'intermediate' && styles.difficultyIntermediate,
                  item.difficulty === 'advanced' && styles.difficultyAdvanced
                ]}>
                  {item.difficulty === 'beginner' ? 'Beginner' :
                   item.difficulty === 'intermediate' ? 'Intermediate' : 'Advanced'}
                </Text>
              </View>
              
              <Text style={styles.vocabularyCardWord}>{item.word.text}</Text>
              
              {item.word.pronunciation && (
                <Text style={styles.vocabularyCardPronunciation}>
                  /{item.word.pronunciation}/
                </Text>
              )}
              
              <Text style={styles.vocabularyCardMeaningText} numberOfLines={2}>
                {item.word.meaning}
              </Text>
              
              <View style={styles.vocabularyCardFooter}>
                <Text style={styles.vocabularyCardSetName}>
                  {item.vocabularySet?.name || 'Default Set'}
                </Text>
                {item.topic && (
                  <Text style={styles.vocabularyCardTopic}>
                    {item.topic.name}
                  </Text>
                )}
              </View>
            </View>
          )}
          contentContainerStyle={styles.vocabularyList}
        />
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
            disabled={currentPage === 1}
            onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          >
            <Text style={styles.paginationButtonText}>Previous</Text>
          </TouchableOpacity>
          
          <Text style={styles.paginationText}>
            Page {currentPage} of {totalPages}
          </Text>
          
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
            disabled={currentPage === totalPages}
            onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          >
            <Text style={styles.paginationButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

export default function VocabularyScreen() {
  const [activeTab, setActiveTab] = useState('review');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Vocabulary Learning</Text>
        <Text style={styles.headerSubtitle}>
          Master new words through spaced repetition and smart organization
        </Text>
      </View>
      
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {activeTab === 'review' && <ReviewSection />}
      {activeTab === 'practice' && <PracticeSection />}
      {activeTab === 'manage' && <ManageSection />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    padding: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    // Add gradient effect similar to web version
    backgroundColor: 'transparent',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    // Enhance shadow effect to match web version
    // Add gradient background effect
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    flexDirection: 'row',
    // Add transition effect similar to web
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#3B82F6',
    // Make active tab more prominent
  },
  tabText: {
    fontSize: 16,
    color: '#94A3B8',
    marginLeft: 8,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '700',
    // Make active text bolder
  },
  sectionContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
  },
  comingSoonContainer: {
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
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
    // Add gradient background similar to web version
    // Note: Using LinearGradient component for this effect
  },
  cardContent: {
    padding: 32,
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
    // Add smooth visual effect
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
    // Add press effect
    transform: [{ scale: 1 }],
    // Add gradient background effect similar to web version
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
    // Add gradient border effect similar to web version
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
  // Practice section styles
  practiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  practiceHeaderGradient: {
    padding: 24,
    paddingBottom: 16,
    // Add gradient effect similar to web version
    borderRadius: 12,
    marginBottom: 16,
  },
  practiceHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  practiceHeaderLeft: {
    flex: 1,
  },
  practiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  practiceSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  practiceBackButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  practiceBackButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  practiceProgressContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: '#FECACA',
    padding: 16,
    marginHorizontal: 24,
    borderRadius: 8,
    marginBottom: 16,
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
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  errorButton: {
    flex: 1,
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

  questionContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    marginBottom: 24,
    // Add gradient border effect similar to web version
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  answerInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  checkButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  resultContainer: {
    alignItems: 'center',
  },
  resultIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  correctIndicator: {
    // Inherits from resultIndicator
  },
  incorrectIndicator: {
    // Inherits from resultIndicator
  },
  resultText: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 8,
  },
  correctAnswerText: {
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  explanationText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  vocabularyList: {
    paddingHorizontal: 24,
  },
  vocabularyCardItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  vocabularyCardText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  vocabularyCardMeaning: {
    fontSize: 14,
    color: '#64748B',
  },
  // Add Word Form styles
  addWordButton: {
    marginHorizontal: 24,
    marginVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addWordButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  addWordButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  addWordForm: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginVertical: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addWordFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addWordFormTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  addWordFormDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  addWordFormActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  submitButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
  // Management section styles
  managementHeader: {
    marginHorizontal: 24,
    marginBottom: 16,
    // Add gradient text effect similar to web version
    paddingVertical: 16,
  },
  managementTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  managementSubtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  searchContainer: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  searchIcon: {
    marginLeft: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },
  clearButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearButtonText: {
    color: '#64748B',
    fontWeight: '600',
  },
  filterDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: 8,
    maxHeight: 200,
  },
  filterOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  filterOptionText: {
    fontSize: 14,
    color: '#1E293B',
  },
  filterOptionTextSelected: {
    fontWeight: '600',
    color: '#3B82F6',
  },
  filterBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 4,
  },
  vocabularyGrid: {
    justifyContent: 'space-between',
    marginHorizontal: 16,
  },
  vocabularyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  vocabularyCardLanguage: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  vocabularyCardDifficulty: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  difficultyBeginner: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
  },
  difficultyIntermediate: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
  },
  difficultyAdvanced: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
  },
  vocabularyCardItemManage: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    width: '45%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Add hover effect similar to web version
    transform: [{ scale: 1 }],
  },
  vocabularyCardWord: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  vocabularyCardPronunciation: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  vocabularyCardMeaningText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  vocabularyCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vocabularyCardSetName: {
    fontSize: 12,
    color: '#94A3B8',
  },
  vocabularyCardTopic: {
    fontSize: 12,
    color: '#94A3B8',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 24,
    marginVertical: 24,
  },
  paginationButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  paginationButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  paginationButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  paginationText: {
    fontSize: 14,
    color: '#64748B',
  },
});