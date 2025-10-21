import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  ScrollView
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { Card, CardContent, Button } from '@/components/ui';

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

interface ExerciseSubmission {
  id: string;
  status: string;
  currentSentenceIndex: number;
  completedSentences: number;
  overallAccuracy?: number;
  totalTimeSpent: number;
  content?: string;
}

interface WritingAnalytics {
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgSentenceLength: number;
  complexityScore: number;
}

interface CompletionViewProps {
  currentExercise: WritingExercise;
  currentSubmission: ExerciseSubmission;
  writingAnalytics: WritingAnalytics | null;
  onBack: () => void;
  onTryAgain: () => void;
  onExport: (format: 'pdf' | 'txt' | 'docx') => void;
  getExerciseTypeLabel: (type: string) => string;
}

export const CompletionView: React.FC<CompletionViewProps> = ({
  currentExercise,
  currentSubmission,
  writingAnalytics,
  onBack,
  onTryAgain,
  onExport,
  getExerciseTypeLabel
}) => {
  const progress = currentExercise.totalSentences ? (currentSubmission.completedSentences / currentExercise.totalSentences) * 100 : 0;
  
  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <AntDesign name="arrow-left" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exercise Completed!</Text>
      </View>
      
      <View style={styles.completionContainer}>
        <View style={styles.completionIcon}>
          <AntDesign name="trophy" size={48} color="#10B981" />
        </View>
        
        <Text style={styles.completionTitle}>Congratulations!</Text>
        <Text style={styles.completionSubtitle}>You've successfully completed the {getExerciseTypeLabel(currentExercise.type)} exercise.</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{currentSubmission.completedSentences}</Text>
            <Text style={styles.statLabel}>Sentences Completed</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {currentSubmission.overallAccuracy ? Math.round(currentSubmission.overallAccuracy) : 0}%
            </Text>
            <Text style={styles.statLabel}>Overall Accuracy</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {Math.round(currentSubmission.totalTimeSpent / 60)}
            </Text>
            <Text style={styles.statLabel}>Minutes Spent</Text>
          </View>
        </View>
        
        {/* Writing Analytics */}
        {writingAnalytics && (
          <View style={styles.statsContainer}>
            <Text style={styles.completionTitle}>Writing Analytics</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{writingAnalytics.wordCount}</Text>
                <Text style={styles.statLabel}>Words</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{writingAnalytics.characterCount}</Text>
                <Text style={styles.statLabel}>Characters</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{writingAnalytics.sentenceCount}</Text>
                <Text style={styles.statLabel}>Sentences</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{writingAnalytics.paragraphCount}</Text>
                <Text style={styles.statLabel}>Paragraphs</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{writingAnalytics.avgSentenceLength.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Avg Sentence Length</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{writingAnalytics.complexityScore}</Text>
                <Text style={styles.statLabel}>Complexity Score</Text>
              </View>
            </View>
          </View>
        )}
        
        {/* Export Options */}
        <View style={styles.exportSection}>
          <Text style={styles.completionTitle}>Export Your Writing</Text>
          <View style={styles.exportButtons}>
            <Button
              title="Export as PDF"
              onPress={() => onExport('pdf')}
              variant="primary"
              style={styles.exportButton}
            />
            <Button
              title="Export as TXT"
              onPress={() => onExport('txt')}
              variant="secondary"
              style={styles.exportButton}
            />
            <Button
              title="Export as DOCX"
              onPress={() => onExport('docx')}
              variant="secondary"
              style={styles.exportButton}
            />
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          <Button
            title="Back to Writing"
            onPress={onBack}
            variant="secondary"
            style={styles.actionButton}
          />
          <Button
            title="Try Again"
            onPress={onTryAgain}
            variant="primary"
            style={styles.actionButton}
          />
        </View>
      </View>
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
    padding: 24,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  completionContainer: {
    padding: 24,
    alignItems: 'center',
  },
  completionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#047857',
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 16,
    color: '#047857',
    textAlign: 'center',
    marginBottom: 32,
  },
  statsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    flexWrap: 'wrap',
  },
  statCard: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minWidth: 100,
    margin: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  exportSection: {
    width: '100%',
    marginBottom: 32,
  },
  exportButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  exportButton: {
    flex: 1,
    minWidth: 120,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  actionButton: {
    flex: 1,
  },
});