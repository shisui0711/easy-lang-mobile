import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { RadioButton } from 'react-native-paper';
import { Card, CardContent } from '@/components/ui';
import { ReadingQuestion } from './types';

interface QuestionCardProps {
  question: ReadingQuestion;
  questionIndex: number;
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
}

export default function QuestionCard({ question, questionIndex, answers, onAnswerChange }: QuestionCardProps) {
  const questionKey = `q${questionIndex}`;
  
  return (
    <Card key={questionIndex} style={styles.questionCard}>
      <CardContent style={styles.questionContent}>
        <Text style={styles.questionNumber}>
          Question {questionIndex + 1}
        </Text>
        <Text style={styles.questionText}>{question.question}</Text>
        {/* Multiple choice questions */}
        {((question.type === 'MULTIPLE_CHOICE' || question.type === 'multiple_choice') && question.options) && (
          <View style={styles.optionsContainer}>
            {question.options.map((option, optionIndex) => (
              <TouchableOpacity
                key={`${questionIndex}-${optionIndex}`}
                onPress={() => onAnswerChange(questionKey, option)}
                style={styles.optionItem}
              >
                <RadioButton
                  key={`radio-${questionIndex}-${optionIndex}`}
                  value={option}
                  status={answers[questionKey] === option ? 'checked' : 'unchecked'}
                  onPress={() => onAnswerChange(questionKey, option)}
                  color="#3B82F6"
                />
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* True/False questions */}
        {(question.type === 'TRUE_FALSE' || question.type === 'true_false') && (
          <View style={styles.optionsContainer}>
            {['True', 'False'].map((option, optionIndex) => (
              <TouchableOpacity
                key={`${questionIndex}-${option}`}
                onPress={() => onAnswerChange(questionKey, option)}
                style={styles.optionItem}
              >
                <RadioButton
                  key={`radio-${questionIndex}-${optionIndex}`}
                  value={option}
                  status={answers[questionKey] === option ? 'checked' : 'unchecked'}
                  onPress={() => onAnswerChange(questionKey, option)}
                  color="#3B82F6"
                />
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Short answer and fill blank questions */}
        {(question.type === 'SHORT_ANSWER' || question.type === 'FILL_BLANK' || 
          question.type === 'short_answer' || question.type === 'fill_blank') && (
          <View style={styles.textInputContainer}>
            <TextInput
              key={`text-${questionIndex}`}
              style={styles.textInput}
              placeholder="Enter your answer"
              value={answers[questionKey] || ''}
              onChangeText={(text) => onAnswerChange(questionKey, text)}
              multiline
            />
          </View>
        )}
        
        {/* Debug: Show when no matching type is found */}
        {question.type !== 'MULTIPLE_CHOICE' && 
         question.type !== 'TRUE_FALSE' && 
         question.type !== 'SHORT_ANSWER' && 
         question.type !== 'FILL_BLANK' &&
         question.type !== 'multiple_choice' && 
         question.type !== 'true_false' && 
         question.type !== 'short_answer' && 
         question.type !== 'fill_blank' && (
          <Text style={{ fontSize: 12, color: '#f00', marginTop: 4 }}>
            Unsupported question type: {question.type}
          </Text>
        )}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  questionCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  questionContent: {
    padding: 16,
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
  optionsContainer: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row' as 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  optionText: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 8,
    flex: 1,
  },
  textInputContainer: {
    paddingVertical: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1E293B',
  },
});