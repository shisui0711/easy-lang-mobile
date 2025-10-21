import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet
} from 'react-native';
import { AntDesign, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { Card, CardContent, Badge } from '@/components/ui';

interface FeedbackData {
  isCorrect: boolean;
  accuracyScore: number;
  grammarScore: number;
  vocabularyScore: number;
  fluencyScore: number;
  feedback: {
    accuracy: number;
    strengths: string[];
    improvements: string[];
    alternatives: string[];
  };
  corrections?: {
    suggestion: string;
    explanation: string;
  };
  // AI Coach features
  aiCoach?: {
    personalizedTips: string[];
    styleSuggestions: string[];
    vocabularyEnhancements: string[];
    coherenceFeedback: string[];
    overallRating: number;
    improvementAreas: string[];
  };
  // Advanced grammar and style checking
  grammarAnalysis?: {
    errors: {
      type: string;
      message: string;
      suggestion: string;
      position: { start: number; end: number };
    }[];
    styleIssues: {
      type: string;
      message: string;
      suggestion: string;
      position: { start: number; end: number };
    }[];
    readabilityScore: number;
    complexityLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    sentenceStructure: {
      simple: number;
      compound: number;
      complex: number;
      compoundComplex: number;
    };
  };
}

interface FeedbackDisplayProps {
  feedback: FeedbackData;
}

export const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ feedback }) => {
  return (
    <Card style={
      Object.assign({}, styles.feedbackCard, feedback.isCorrect ? styles.feedbackCardCorrect : styles.feedbackCardIncorrect)
    }>
      <CardContent style={styles.cardContent}>
        <View style={styles.feedbackHeader}>
          {feedback.isCorrect ? (
            <>
              <AntDesign name="check-circle" size={24} color="#10B981" />
              <Text style={styles.feedbackTitle}>Excellent Translation!</Text>
            </>
          ) : (
            <>
              <AntDesign name="close-circle" size={24} color="#EF4444" />
              <Text style={styles.feedbackTitle}>Needs Improvement</Text>
            </>
          )}
        </View>
        
        {/* Scores */}
        <View style={styles.scoresContainer}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValue}>{feedback.accuracyScore}%</Text>
            <Text style={styles.scoreLabel}>Accuracy</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValue}>{feedback.grammarScore}%</Text>
            <Text style={styles.scoreLabel}>Grammar</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValue}>{feedback.vocabularyScore}%</Text>
            <Text style={styles.scoreLabel}>Vocabulary</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValue}>{feedback.fluencyScore}%</Text>
            <Text style={styles.scoreLabel}>Fluency</Text>
          </View>
        </View>
        
        {/* Feedback Details */}
        <View style={styles.feedbackDetails}>
          {feedback.feedback.strengths.length > 0 && (
            <View style={styles.feedbackSection}>
              <View style={styles.feedbackSectionHeader}>
                <AntDesign name="like" size={16} color="#10B981" />
                <Text style={styles.feedbackSectionTitle}>What You Did Well</Text>
              </View>
              {feedback.feedback.strengths.map((strength, index) => (
                <View key={index} style={styles.feedbackItem}>
                  <Text style={styles.feedbackItemText}>• {strength}</Text>
                </View>
              ))}
            </View>
          )}
          
          {feedback.feedback.improvements.length > 0 && (
            <View style={styles.feedbackSection}>
              <View style={styles.feedbackSectionHeader}>
                <AntDesign name="dislike" size={16} color="#F59E0B" />
                <Text style={styles.feedbackSectionTitle}>Areas for Improvement</Text>
              </View>
              {feedback.feedback.improvements.map((improvement, index) => (
                <View key={index} style={styles.feedbackItem}>
                  <Text style={styles.feedbackItemText}>• {improvement}</Text>
                </View>
              ))}
            </View>
          )}
          
          {feedback.corrections && (
            <View style={styles.feedbackSection}>
              <View style={styles.feedbackSectionHeader}>
                <FontAwesome name="lightbulb-o" size={16} color="#3B82F6" />
                <Text style={styles.feedbackSectionTitle}>Suggested Translation</Text>
              </View>
              <View style={styles.suggestionContainer}>
                <Text style={styles.suggestionText}>{feedback.corrections.suggestion}</Text>
                <Text style={styles.suggestionExplanation}>{feedback.corrections.explanation}</Text>
              </View>
            </View>
          )}
          
          {/* AI Coach Feedback */}
          {feedback.aiCoach && (
            <View style={styles.feedbackSection}>
              <View style={styles.feedbackSectionHeader}>
                <MaterialIcons name="auto-fix-high" size={16} color="#8B5CF6" />
                <Text style={styles.feedbackSectionTitle}>AI Writing Coach</Text>
                <View style={styles.aiCoachRating}>
                  <Text style={styles.aiCoachRatingText}>{feedback.aiCoach.overallRating}/100</Text>
                </View>
              </View>
              
              {feedback.aiCoach.personalizedTips.length > 0 && (
                <View style={styles.aiCoachSection}>
                  <Text style={styles.aiCoachSectionTitle}>Personalized Tips</Text>
                  {feedback.aiCoach.personalizedTips.map((tip, index) => (
                    <View key={index} style={styles.feedbackItem}>
                      <Text style={styles.feedbackItemText}>• {tip}</Text>
                    </View>
                  ))}
                </View>
              )}
              
              {feedback.aiCoach.styleSuggestions.length > 0 && (
                <View style={styles.aiCoachSection}>
                  <Text style={styles.aiCoachSectionTitle}>Style Suggestions</Text>
                  {feedback.aiCoach.styleSuggestions.map((suggestion, index) => (
                    <View key={index} style={styles.feedbackItem}>
                      <Text style={styles.feedbackItemText}>• {suggestion}</Text>
                    </View>
                  ))}
                </View>
              )}
              
              {feedback.aiCoach.vocabularyEnhancements.length > 0 && (
                <View style={styles.aiCoachSection}>
                  <Text style={styles.aiCoachSectionTitle}>Vocabulary Enhancements</Text>
                  {feedback.aiCoach.vocabularyEnhancements.map((enhancement, index) => (
                    <View key={index} style={styles.feedbackItem}>
                      <Text style={styles.feedbackItemText}>• {enhancement}</Text>
                    </View>
                  ))}
                </View>
              )}
              
              {feedback.aiCoach.coherenceFeedback.length > 0 && (
                <View style={styles.aiCoachSection}>
                  <Text style={styles.aiCoachSectionTitle}>Coherence & Flow</Text>
                  {feedback.aiCoach.coherenceFeedback.map((coherence, index) => (
                    <View key={index} style={styles.feedbackItem}>
                      <Text style={styles.feedbackItemText}>• {coherence}</Text>
                    </View>
                  ))}
                </View>
              )}
              
              {feedback.aiCoach.improvementAreas.length > 0 && (
                <View style={styles.aiCoachSection}>
                  <Text style={styles.aiCoachSectionTitle}>Focus Areas for Improvement</Text>
                  <View style={styles.focusBadges}>
                    {feedback.aiCoach.improvementAreas.map((area, index) => (
                      <Badge key={index} style={styles.focusBadge}>
                        <Text style={styles.focusBadgeText}>{area}</Text>
                      </Badge>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
          
          {/* Advanced Grammar and Style Analysis */}
          {feedback.grammarAnalysis && (
            <View style={styles.feedbackSection}>
              <View style={styles.feedbackSectionHeader}>
                <MaterialIcons name="spellcheck" size={16} color="#10B981" />
                <Text style={styles.feedbackSectionTitle}>Grammar & Style Analysis</Text>
              </View>
              
              {/* Readability and Complexity */}
              <View style={styles.grammarStats}>
                <View style={styles.grammarStat}>
                  <Text style={styles.grammarStatLabel}>Readability</Text>
                  <Text style={styles.grammarStatValue}>{feedback.grammarAnalysis.readabilityScore}/100</Text>
                </View>
                <View style={styles.grammarStat}>
                  <Text style={styles.grammarStatLabel}>Complexity</Text>
                  <Text style={styles.grammarStatValue}>{feedback.grammarAnalysis.complexityLevel}</Text>
                </View>
              </View>
              
              {/* Sentence Structure */}
              <View style={styles.sentenceStructure}>
                <Text style={styles.grammarSectionTitle}>Sentence Structure</Text>
                <View style={styles.structureBars}>
                  <View style={styles.structureBarContainer}>
                    <Text style={styles.structureLabel}>Simple</Text>
                    <View style={styles.structureBarBackground}>
                      <View 
                        style={[styles.structureBarFill, { width: `${feedback.grammarAnalysis.sentenceStructure.simple}%` }]}
                      />
                    </View>
                    <Text style={styles.structurePercentage}>{feedback.grammarAnalysis.sentenceStructure.simple}%</Text>
                  </View>
                  <View style={styles.structureBarContainer}>
                    <Text style={styles.structureLabel}>Compound</Text>
                    <View style={styles.structureBarBackground}>
                      <View 
                        style={[styles.structureBarFill, { width: `${feedback.grammarAnalysis.sentenceStructure.compound}%` }]}
                      />
                    </View>
                    <Text style={styles.structurePercentage}>{feedback.grammarAnalysis.sentenceStructure.compound}%</Text>
                  </View>
                  <View style={styles.structureBarContainer}>
                    <Text style={styles.structureLabel}>Complex</Text>
                    <View style={styles.structureBarBackground}>
                      <View 
                        style={[styles.structureBarFill, { width: `${feedback.grammarAnalysis.sentenceStructure.complex}%` }]}
                      />
                    </View>
                    <Text style={styles.structurePercentage}>{feedback.grammarAnalysis.sentenceStructure.complex}%</Text>
                  </View>
                  <View style={styles.structureBarContainer}>
                    <Text style={styles.structureLabel}>Compound-Complex</Text>
                    <View style={styles.structureBarBackground}>
                      <View 
                        style={[styles.structureBarFill, { width: `${feedback.grammarAnalysis.sentenceStructure.compoundComplex}%` }]}
                      />
                    </View>
                    <Text style={styles.structurePercentage}>{feedback.grammarAnalysis.sentenceStructure.compoundComplex}%</Text>
                  </View>
                </View>
              </View>
              
              {/* Grammar Errors */}
              {feedback.grammarAnalysis.errors.length > 0 && (
                <View style={styles.grammarIssues}>
                  <Text style={styles.grammarSectionTitle}>Grammar Issues</Text>
                  {feedback.grammarAnalysis.errors.map((error, index) => (
                    <View key={index} style={styles.grammarIssue}>
                      <View style={styles.grammarIssueHeader}>
                        <Text style={styles.grammarIssueType}>{error.type}</Text>
                        <Text style={styles.grammarIssueMessage}>{error.message}</Text>
                      </View>
                      <Text style={styles.grammarIssueSuggestion}>Suggestion: {error.suggestion}</Text>
                    </View>
                  ))}
                </View>
              )}
              
              {/* Style Issues */}
              {feedback.grammarAnalysis.styleIssues.length > 0 && (
                <View style={styles.grammarIssues}>
                  <Text style={styles.grammarSectionTitle}>Style Issues</Text>
                  {feedback.grammarAnalysis.styleIssues.map((issue, index) => (
                    <View key={index} style={styles.grammarIssue}>
                      <View style={styles.grammarIssueHeader}>
                        <Text style={styles.grammarIssueType}>{issue.type}</Text>
                        <Text style={styles.grammarIssueMessage}>{issue.message}</Text>
                      </View>
                      <Text style={styles.grammarIssueSuggestion}>Suggestion: {issue.suggestion}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </CardContent>
    </Card>
  );
};

const styles = StyleSheet.create({
  feedbackCard: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  feedbackCardCorrect: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  feedbackCardIncorrect: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  cardContent: {
    padding: 20,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  feedbackDetails: {
    gap: 16,
  },
  feedbackSection: {
    gap: 8,
  },
  feedbackSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  feedbackSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  feedbackItem: {
    paddingVertical: 4,
  },
  feedbackItemText: {
    fontSize: 14,
    color: '#475569',
  },
  suggestionContainer: {
    padding: 16,
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  suggestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  suggestionExplanation: {
    fontSize: 14,
    color: '#1E3A8A',
  },
  aiCoachRating: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  aiCoachRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  aiCoachSection: {
    marginBottom: 16,
  },
  aiCoachSectionTitle: {
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
  grammarStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  grammarStat: {
    alignItems: 'center',
  },
  grammarStatLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  grammarStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  sentenceStructure: {
    marginBottom: 16,
  },
  grammarSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  structureBars: {
    gap: 12,
  },
  structureBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  structureBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  structureBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  structurePercentage: {
    width: 40,
    fontSize: 12,
    color: '#475569',
    textAlign: 'right',
  },
  grammarIssues: {
    marginBottom: 16,
  },
  grammarIssue: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  grammarIssueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  grammarIssueType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  grammarIssueMessage: {
    fontSize: 14,
    color: '#1E293B',
    flex: 1,
  },
  grammarIssueSuggestion: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  structureLabel: {
    width: 120,
    fontSize: 12,
    color: '#475569',
  },
});