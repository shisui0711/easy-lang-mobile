import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feedback } from '../../types/speaking';

interface FeedbackDisplayProps {
  feedback: Feedback | null;
}

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ feedback }) => {
  if (!feedback) return null;

  return (
    <View style={styles.feedbackContainer}>
      <Text style={styles.feedbackTitle}>Feedback</Text>
      <View style={styles.feedbackSection}>
        <Text style={styles.feedbackLabel}>Grammar:</Text>
        <Text style={styles.feedbackText}>{feedback.grammar.join(', ')}</Text>
      </View>
      <View style={styles.feedbackSection}>
        <Text style={styles.feedbackLabel}>Vocabulary:</Text>
        <Text style={styles.feedbackText}>{feedback.vocabulary.join(', ')}</Text>
      </View>
      <View style={styles.feedbackSection}>
        <Text style={styles.feedbackLabel}>Suggestions:</Text>
        <Text style={styles.feedbackText}>{feedback.suggestions.join(', ')}</Text>
      </View>
      <View style={styles.feedbackSection}>
        <Text style={styles.feedbackLabel}>Score:</Text>
        <Text style={styles.feedbackText}>{feedback.score}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  feedbackContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 16,
    marginVertical: 20,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 10,
  },
  feedbackSection: {
    marginBottom: 10,
  },
  feedbackLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 5,
  },
  feedbackText: {
    fontSize: 14,
    color: '#475569',
  },
});

export default FeedbackDisplay;