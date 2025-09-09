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
import { Ionicons } from '@expo/vector-icons';

import { Card, CardContent, Button } from '@/components/ui';
import { apiClient } from '@/lib/api';

interface GrammarLesson {
  id: string;
  title: string;
  topic: string;
  level: string;
  content: string;
  examples: string[];
  exercises?: GrammarExercise[];
}

interface GrammarExercise {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

export default function GrammarScreen() {
  const [lessons, setLessons] = useState<GrammarLesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<GrammarLesson | null>(null);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    setIsLoading(true);
    try {
      // Mock data for now - replace with actual API call
      const mockLessons: GrammarLesson[] = [
        {
          id: '1',
          title: 'Present Simple Tense',
          topic: 'Tenses',
          level: 'Beginner',
          content: 'The present simple is used to describe habits, facts, and general truths.',
          examples: [
            'I work every day.',
            'She likes coffee.',
            'The sun rises in the east.'
          ],
          exercises: [
            {
              id: '1',
              question: 'Choose the correct form: He ___ to school every day.',
              options: ['go', 'goes', 'going', 'gone'],
              correctAnswer: 'goes'
            }
          ]
        }
      ];
      setLessons(mockLessons);
    } catch (error) {
      console.error('Failed to fetch lessons:', error);
      Alert.alert('Error', 'Failed to load grammar lessons');
    } finally {
      setIsLoading(false);
    }
  };

  const selectAnswer = (exerciseId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [exerciseId]: answer }));
  };

  const nextExercise = () => {
    if (selectedLesson && currentExercise < (selectedLesson.exercises?.length || 0) - 1) {
      setCurrentExercise(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    if (!selectedLesson?.exercises) return 0;
    let correct = 0;
    selectedLesson.exercises.forEach(exercise => {
      if (answers[exercise.id] === exercise.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / selectedLesson.exercises.length) * 100);
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
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grammar Lessons</Text>
          
          {!selectedLesson ? (
            <View style={styles.lessonsGrid}>
              {lessons.map((lesson) => (
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
                      <Text style={styles.topicText}>{lesson.topic}</Text>
                      {lesson.exercises && (
                        <Text style={styles.exerciseCount}>
                          {lesson.exercises.length} exercises
                        </Text>
                      )}
                    </CardContent>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          ) : showResults ? (
            <Card style={styles.resultsCard}>
              <CardContent style={styles.resultsContent}>
                <Ionicons name="trophy" size={48} color="#F59E0B" />
                <Text style={styles.resultsTitle}>Lesson Complete!</Text>
                <Text style={styles.scoreText}>Your Score: {calculateScore()}%</Text>
                <View style={styles.resultsActions}>
                  <Button
                    title="Choose New Lesson"
                    onPress={() => setSelectedLesson(null)}
                    style={styles.newLessonButton}
                    textStyle={styles.newLessonButtonText}
                  />
                  <Button
                    title="Try Again"
                    onPress={() => {
                      setCurrentExercise(0);
                      setAnswers({});
                      setShowResults(false);
                    }}
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
                  <Text style={styles.lessonTitle}>{selectedLesson.title}</Text>
                  <Text style={styles.contentText}>{selectedLesson.content}</Text>
                  
                  {selectedLesson.examples && (
                    <View style={styles.examplesContainer}>
                      <Text style={styles.examplesTitle}>Examples:</Text>
                      {selectedLesson.examples.map((example, index) => (
                        <Text key={index} style={styles.exampleText}>
                          • {example}
                        </Text>
                      ))}
                    </View>
                  )}
                </CardContent>
              </Card>

              {selectedLesson.exercises && selectedLesson.exercises.length > 0 && (
                <Card style={styles.exerciseCard}>
                  <CardContent style={styles.exerciseContent}>
                    <Text style={styles.exerciseNumber}>
                      Exercise {currentExercise + 1} of {selectedLesson.exercises.length}
                    </Text>
                    <Text style={styles.questionText}>
                      {selectedLesson.exercises[currentExercise].question}
                    </Text>
                    
                    <View style={styles.optionsContainer}>
                      {selectedLesson.exercises[currentExercise].options.map((option, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => selectAnswer(selectedLesson.exercises![currentExercise].id, option)}
                          style={[
                            styles.optionButton,
                            answers[selectedLesson.exercises![currentExercise].id] === option && styles.selectedOption
                          ]}
                        >
                          <Text style={[
                            styles.optionText,
                            answers[selectedLesson.exercises![currentExercise].id] === option && styles.selectedOptionText
                          ]}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Button
                      title={currentExercise === selectedLesson.exercises.length - 1 ? 'Finish' : 'Next'}
                      onPress={nextExercise}
                      disabled={!answers[selectedLesson.exercises[currentExercise].id]}
                      style={{
                        ...styles.nextButton,
                        ...(!answers[selectedLesson.exercises[currentExercise].id] && styles.nextButtonDisabled)
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
    marginBottom: 4,
  },
  exerciseCount: {
    fontSize: 12,
    color: '#94A3B8',
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
  contentText: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 16,
  },
  examplesContainer: {
    marginTop: 16,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
    fontStyle: 'italic',
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