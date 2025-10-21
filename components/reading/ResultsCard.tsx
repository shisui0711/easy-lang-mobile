import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import { ReadingExercise, GradingResult, QuestionFeedback } from './types';

interface ResultsCardProps {
  selectedExercise: ReadingExercise;
  gradingResult: GradingResult;
  onShowResults: (show: boolean) => void;
  onSelectExercise: (exercise: ReadingExercise | null) => void;
  setActiveTab: (tab: 'practice' | 'read' | 'progress') => void;
}

export default function ResultsCard({
  selectedExercise,
  gradingResult,
  onShowResults,
  onSelectExercise,
  setActiveTab,
}: ResultsCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981'; // green
    if (score >= 80) return '#3B82F6'; // blue
    if (score >= 70) return '#F59E0B'; // yellow
    return '#EF4444'; // red
  };

  return (
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
            onPress={() => onShowResults(false)}
            variant="secondary"
            style={styles.reviewButton}
          />
          <Button
            key="choose"
            title="Choose Different Exercise"
            onPress={() => {
              onShowResults(false);
              onSelectExercise(null);
              setActiveTab('practice'); // Navigate back to practice tab
            }}
            style={styles.chooseExerciseButton}
          />
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  resultsCard: {
    marginBottom: 24,
  },
  resultsContent: {
    padding: 20,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold' as 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  resultsSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  scoreContainer: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  scoreBox: {
    alignItems: 'center',
    flex: 1,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold' as 'bold',
  },
  scoreValuePrimary: {
    fontSize: 24,
    fontWeight: 'bold' as 'bold',
    color: '#3B82F6',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  questionReviewTitle: {
    fontSize: 18,
    fontWeight: '600' as '600',
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
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600' as '600',
    color: '#3B82F6',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 16,
  },
  answerRow: {
    flexDirection: 'row' as 'row',
    marginVertical: 2,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600' as '600',
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
    fontWeight: '600' as '600',
    color: '#1E293B',
  },
  explanationText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  resultsActions: {
    flexDirection: 'row' as 'row',
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
});