import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, AntDesign, FontAwesome } from '@expo/vector-icons';
import { Card, CardContent, Button, Badge } from '@/components/ui';

interface WritingExercise {
  id: string;
  title: string;
  instructions?: string;
  level: string;
  difficulty: string;
  type: 'TRANSLATION' | 'CREATIVE' | 'ESSAY' | 'JOURNAL' | 'CHALLENGE';
  sourceLanguage?: string;
  targetLanguage?: string;
  totalSentences?: number;
  estimatedTime: number;
  wordLimit?: number;
  topic?: {
    id: string;
    name: string;
  };
  sentences?: {
    id: string;
    orderIndex: number;
    sourceText: string;
    difficulty: string;
  }[];
  _count: {
    submissions: number;
    sentences: number;
  };
}

interface Sentence {
  id: string;
  orderIndex: number;
  sourceText: string;
  context?: string;
  difficulty: string;
  hints?: string[];
  grammarPoints: string[];
  vocabularyFocus: string[];
}

interface ExerciseSubmission {
  id: string;
  status: string;
  currentSentenceIndex: number;
  completedSentences: number;
  overallAccuracy?: number;
  totalTimeSpent: number;
  content?: string;
}

interface ExerciseDetailViewProps {
  currentExercise: WritingExercise;
  currentSubmission: ExerciseSubmission;
  currentSentence: Sentence | null;
  userTranslation: string;
  userWriting: string;
  feedback: any;
  isSubmitting: boolean;
  showHints: boolean;
  writingGuidance: any;
  showGuidance: boolean;
  startTime: number;
  onBack: () => void;
  onToggleHints: () => void;
  onToggleGuidance: () => void;
  onUserTranslationChange: (text: string) => void;
  onUserWritingChange: (text: string) => void;
  onSubmitTranslation: () => void;
  onSubmitWriting: () => void;
  onTryAgain: () => void;
  getDifficultyColor: (difficulty: string) => [string, string];
  getExerciseTypeLabel: (type: string) => string;
}

export const ExerciseDetailView: React.FC<ExerciseDetailViewProps> = ({
  currentExercise,
  currentSubmission,
  currentSentence,
  userTranslation,
  userWriting,
  feedback,
  isSubmitting,
  showHints,
  writingGuidance,
  showGuidance,
  startTime,
  onBack,
  onToggleHints,
  onToggleGuidance,
  onUserTranslationChange,
  onUserWritingChange,
  onSubmitTranslation,
  onSubmitWriting,
  onTryAgain,
  getDifficultyColor,
  getExerciseTypeLabel
}) => {
  const progress = currentExercise.totalSentences ? (currentSubmission.completedSentences / currentExercise.totalSentences) * 100 : 0;
  
  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle} numberOfLines={1}>{currentExercise.title}</Text>
          <View style={styles.headerSubtitle}>
            <Text style={styles.headerSubtitleText}>
              {currentExercise.sourceLanguage || 'EN'} → {currentExercise.targetLanguage || 'VI'}
            </Text>
            {currentExercise.topic && (
              <Badge style={styles.topicBadge}>
                <Text style={styles.topicBadgeText}>{currentExercise.topic.name}</Text>
              </Badge>
            )}
          </View>
        </View>
        <Text style={styles.sentenceCounter}>
          {currentSentence?.orderIndex !== undefined ? currentSentence.orderIndex + 1 : 0} / {currentExercise.totalSentences}
        </Text>
      </View>
      
      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>Progress</Text>
          <Text style={styles.progressText}>
            {currentSubmission.completedSentences}/{currentExercise.totalSentences} completed
          </Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${progress}%` }
            ]} 
          />
        </View>
      </View>
      
      {/* Writing Guidance Button */}
      {writingGuidance && (
        <View style={styles.guidanceButtonContainer}>
          <Button
            title={showGuidance ? "Hide Guidance" : "Show Writing Guidance"}
            onPress={onToggleGuidance}
            variant="secondary"
            style={styles.guidanceButton}
          />
        </View>
      )}
      
      {/* Exercise Content Card */}
      <Card style={styles.sentenceCard}>
        <CardContent style={styles.cardContent}>
          {currentExercise.type === 'TRANSLATION' && currentSentence ? (
            // Translation Exercise UI
            <>
              <View style={styles.sentenceHeader}>
                <View style={styles.sentenceHeaderLeft}>
                  <MaterialIcons name="translate" size={20} color="#3B82F6" />
                  <Text style={styles.sentenceHeaderTitle}>Translate this sentence</Text>
                </View>
                <LinearGradient
                  colors={getDifficultyColor(currentSentence.difficulty)}
                  style={styles.difficultyBadge}
                >
                  <Text style={styles.difficultyBadgeText}>
                    {currentSentence.difficulty}
                  </Text>
                </LinearGradient>
              </View>
              
              <View style={styles.sourceSentenceContainer}>
                <Text style={styles.sourceSentence}>{currentSentence.sourceText}</Text>
                {currentSentence.context && (
                  <Text style={styles.sentenceContext}>{currentSentence.context}</Text>
                )}
              </View>
            </>
          ) : (
            // Creative Writing Exercise UI
            <>
              <View style={styles.sentenceHeader}>
                <View style={styles.sentenceHeaderLeft}>
                  <MaterialIcons name="edit" size={20} color="#3B82F6" />
                  <Text style={styles.sentenceHeaderTitle}>{getExerciseTypeLabel(currentExercise.type)} Exercise</Text>
                </View>
                <LinearGradient
                  colors={getDifficultyColor(currentExercise.difficulty)}
                  style={styles.difficultyBadge}
                >
                  <Text style={styles.difficultyBadgeText}>
                    {currentExercise.difficulty}
                  </Text>
                </LinearGradient>
              </View>
              
              <View style={styles.sourceSentenceContainer}>
                <Text style={styles.sourceSentence}>{currentExercise.title}</Text>
                {currentExercise.instructions && (
                  <Text style={styles.sentenceContext}>{currentExercise.instructions}</Text>
                )}
              </View>
            </>
          )}
          
          {/* Hints */}
          {currentSentence && currentSentence.hints && currentSentence.hints.length > 0 && (
            <View style={styles.hintsContainer}>
              <TouchableOpacity 
                onPress={onToggleHints} 
                style={styles.hintsButton}
              >
                <AntDesign name="bulb" size={16} color="#F59E0B" />
                <Text style={styles.hintsButtonText}>
                  {showHints ? 'Hide' : 'Show'} Hints
                </Text>
              </TouchableOpacity>
              
              {showHints && (
                <View style={styles.hintsContent}>
                  {Array.isArray(currentSentence.hints) ? (
                    <View style={styles.hintsList}>
                      {currentSentence.hints.map((hint, index) => (
                        <View key={index} style={styles.hintItem}>
                          <Text style={styles.hintBullet}>•</Text>
                          <Text style={styles.hintText}>{hint}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.hintsText}>{currentSentence.hints}</Text>
                  )}
                </View>
              )}
            </View>
          )}
          
          {/* Focus Areas */}
          {currentSentence && (currentSentence.grammarPoints.length > 0 || currentSentence.vocabularyFocus.length > 0) && (
            <View style={styles.focusAreasContainer}>
              {currentSentence.grammarPoints.length > 0 && (
                <View style={styles.focusArea}>
                  <Text style={styles.focusAreaTitle}>Grammar Focus:</Text>
                  <View style={styles.focusBadges}>
                    {currentSentence.grammarPoints.map((point, index) => (
                      <Badge key={index} style={styles.focusBadge}>
                        <Text style={styles.focusBadgeText}>{point}</Text>
                      </Badge>
                    ))}
                  </View>
                </View>
              )}
              
              {currentSentence.vocabularyFocus.length > 0 && (
                <View style={styles.focusArea}>
                  <Text style={styles.focusAreaTitle}>Key Vocabulary:</Text>
                  <View style={styles.focusBadges}>
                    {currentSentence.vocabularyFocus.map((word, index) => (
                      <Badge key={index} style={styles.focusBadge}>
                        <Text style={styles.focusBadgeText}>{word}</Text>
                      </Badge>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
          
          {/* Writing Input */}
          <View style={styles.translationContainer}>
            {currentExercise.type === 'TRANSLATION' ? (
              // Translation Input
              <>
                <Text style={styles.translationLabel}>
                  Your translation ({currentExercise.targetLanguage || 'Vietnamese'}):
                </Text>
                <TextInput
                  style={styles.translationInput}
                  value={userTranslation}
                  onChangeText={onUserTranslationChange}
                  placeholder="Enter your translation here..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  textAlignVertical="top"
                  editable={!isSubmitting && !feedback}
                />
                <View style={styles.translationFooter}>
                  <Text style={styles.characterCount}>
                    {userTranslation.length} characters
                  </Text>
                  <View style={styles.translationActions}>
                    {feedback && !feedback.isCorrect && (
                      <Button
                        title="Try Again"
                        onPress={onTryAgain}
                        variant="secondary"
                        style={styles.actionButtonSmall}
                      />
                    )}
                    <Button
                      title={isSubmitting ? "Submitting..." : "Submit"}
                      onPress={onSubmitTranslation}
                      disabled={!userTranslation.trim() || isSubmitting || !!feedback}
                      variant="primary"
                      style={styles.actionButtonSmall}
                    />
                  </View>
                </View>
              </>
            ) : (
              // Creative Writing Input
              <>
                <Text style={styles.translationLabel}>
                  Your writing:
                </Text>
                <TextInput
                  style={styles.translationInput}
                  value={userWriting}
                  onChangeText={onUserWritingChange}
                  placeholder="Start writing here..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  textAlignVertical="top"
                  editable={!isSubmitting}
                />
                <View style={styles.translationFooter}>
                  <Text style={styles.characterCount}>
                    {userWriting.length} characters
                  </Text>
                  <View style={styles.translationActions}>
                    <Button
                      title={isSubmitting ? "Submitting..." : "Submit"}
                      onPress={onSubmitWriting}
                      disabled={!userWriting.trim() || isSubmitting}
                      variant="primary"
                      style={styles.actionButtonSmall}
                    />
                  </View>
                </View>
              </>
            )}
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  headerSubtitleText: {
    fontSize: 14,
    color: '#64748B',
  },
  sentenceCounter: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  progressContainer: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#64748B',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  guidanceButtonContainer: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  guidanceButton: {
    minWidth: 150,
  },
  sentenceCard: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  cardContent: {
    padding: 20,
  },
  sentenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sentenceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sentenceHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  difficultyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sourceSentenceContainer: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    marginBottom: 20,
  },
  sourceSentence: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1E293B',
    lineHeight: 24,
  },
  sentenceContext: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    fontStyle: 'italic',
  },
  hintsContainer: {
    marginBottom: 20,
  },
  hintsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  hintsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  hintsContent: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  hintsList: {
    gap: 8,
  },
  hintItem: {
    flexDirection: 'row',
    gap: 8,
  },
  hintBullet: {
    fontSize: 14,
    color: '#92400E',
  },
  hintText: {
    fontSize: 14,
    color: '#92400E',
    flex: 1,
  },
  hintsText: {
    fontSize: 14,
    color: '#92400E',
  },
  focusAreasContainer: {
    marginBottom: 20,
  },
  focusArea: {
    marginBottom: 12,
  },
  focusAreaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  focusBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  focusBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  focusBadgeText: {
    fontSize: 12,
    color: '#475569',
  },
  translationContainer: {
    marginBottom: 8,
  },
  translationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  translationInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  translationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  characterCount: {
    fontSize: 12,
    color: '#64748B',
  },
  translationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButtonSmall: {
    minWidth: 100,
  },
  topicBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topicBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
});