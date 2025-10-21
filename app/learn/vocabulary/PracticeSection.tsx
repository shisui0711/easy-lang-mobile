import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Progress, Button } from '@/components/ui';
import { apiClient } from '@/lib/api';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';

interface VocabularyCard {
  id: string;
  wordId: string;
  stability: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  state: string;
  due: string;
  text: string;
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

interface Question {
  id: string;
  vocabularyCardId: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
}

export const PracticeSection = () => {
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
  if (isLoading) {
    return <LoadingScreen message="Loading vocabulary cards..." skeletonType="list" />;
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load vocabulary cards"
        message={error}
        onRetry={() => {
          // Re-fetch vocabulary cards
          const fetchVocabularyCards = async () => {
            setIsLoading(true);
            setError(null);
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
        }}
      />
    );
  }

  return (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Practice Your Vocabulary</Text>
      <Text style={styles.sectionSubtitle}>
        Select a vocabulary word to practice with interactive questions
      </Text>

      <FlatList
        data={vocabularyCards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.vocabularyCardItem}
            onPress={() => generateQuestions(item)}
          >
            <Text style={styles.vocabularyCardText}>{item.text}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    padding: 24,
    paddingBottom: 0,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    padding: 24,
    paddingTop: 0,
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
    backgroundColor: '#FECACA',
    padding: 16,
    marginHorizontal: 24,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
  },
  practiceHeaderGradient: {
    padding: 24,
    paddingBottom: 16,
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
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
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
    marginHorizontal: 24,
  },
  vocabularyCardText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
});