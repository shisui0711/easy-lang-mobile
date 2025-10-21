import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent, Badge } from '@/components/ui';
import { ReadingSubmission, ReadingExercise } from './types';
import { LineChart } from 'react-native-chart-kit';

interface ProgressTabProps {
  submissions: ReadingSubmission[];
  exercises: ReadingExercise[];
}

export default function ProgressTab({ submissions, exercises }: ProgressTabProps) {
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    if (submissions.length > 0 && exercises.length > 0) {
      calculateAnalytics();
    }
  }, [submissions, exercises]);

  const calculateAnalytics = () => {
    // Calculate reading speed trend
    const speedData = submissions
      .filter(sub => sub.wordsPerMinute && sub.createdAt)
      .map(sub => ({
        date: new Date(sub.createdAt).toLocaleDateString(),
        wpm: sub.wordsPerMinute
      }))
      .slice(-7); // Last 7 entries

    // Calculate comprehension rate trend
    const comprehensionData = submissions
      .filter(sub => sub.accuracyRate !== undefined && sub.createdAt)
      .map(sub => ({
        date: new Date(sub.createdAt).toLocaleDateString(),
        accuracy: sub.accuracyRate
      }))
      .slice(-7); // Last 7 entries

    // Calculate overall statistics
    const totalExercises = submissions.length;
    const avgWPM = submissions.reduce((sum, sub) => sum + (sub.wordsPerMinute || 0), 0) / totalExercises || 0;
    const avgAccuracy = submissions.reduce((sum, sub) => sum + (sub.accuracyRate || 0), 0) / totalExercises || 0;

    setAnalyticsData({
      speedData,
      comprehensionData,
      totalExercises,
      avgWPM: Math.round(avgWPM),
      avgAccuracy: Math.round(avgAccuracy)
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981'; // green
    if (score >= 80) return '#3B82F6'; // blue
    if (score >= 70) return '#F59E0B'; // yellow
    return '#EF4444'; // red
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateReadingSpeed = (wordCount: number, timeInSeconds: number) => {
    const wordsPerMinute = Math.round((wordCount / timeInSeconds) * 60);
    return wordsPerMinute;
  };

  // Chart configuration
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#3B82F6'
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Reading Progress</Text>
        
        {/* Analytics Summary */}
        {analyticsData && (
          <View style={styles.analyticsSummary}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{analyticsData.avgWPM}</Text>
              <Text style={styles.statLabel}>Avg. WPM</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{analyticsData.avgAccuracy}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{analyticsData.totalExercises}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
          </View>
        )}
        
        {/* Reading Speed Chart */}
        {analyticsData && analyticsData.speedData.length > 0 && (
          <Card style={styles.chartCard}>
            <CardContent style={styles.chartContent}>
              <Text style={styles.chartTitle}>Reading Speed Trend</Text>
              <LineChart
                data={{
                  labels: analyticsData.speedData.map((d: any) => d.date),
                  datasets: [{
                    data: analyticsData.speedData.map((d: any) => d.wpm)
                  }]
                }}
                width={StyleSheet.absoluteFillObject.width - 48}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </CardContent>
          </Card>
        )}
        
        {/* Comprehension Rate Chart */}
        {analyticsData && analyticsData.comprehensionData.length > 0 && (
          <Card style={styles.chartCard}>
            <CardContent style={styles.chartContent}>
              <Text style={styles.chartTitle}>Comprehension Rate Trend</Text>
              <LineChart
                data={{
                  labels: analyticsData.comprehensionData.map((d: any) => d.date),
                  datasets: [{
                    data: analyticsData.comprehensionData.map((d: any) => d.accuracy)
                  }]
                }}
                width={StyleSheet.absoluteFillObject.width - 48}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </CardContent>
          </Card>
        )}
        
        {/* Submission History */}
        {submissions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <CardContent style={styles.emptyContent}>
              <Ionicons name="book" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No submissions yet</Text>
              <Text style={styles.emptySubtitle}>
                Start reading to see your progress here
              </Text>
            </CardContent>
          </Card>
        ) : (
          <View style={styles.submissionsContainer}>
            {submissions.map((submission) => {
              const exercise = exercises.find(e => e.id === submission.exerciseId);
              return (
                <Card key={submission.id} style={styles.submissionCard}>
                  <CardContent style={styles.submissionContent}>
                    <View style={styles.submissionHeader}>
                      <Text style={styles.submissionTitle}>
                        {exercise?.title || 'Unknown Exercise'}
                      </Text>
                      <Text style={styles.submissionDate}>
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    
                    {submission.overallScore && (
                      <View key="overall-score" style={styles.scoreRow}>
                        <Text style={styles.scoreLabelProgress}>Overall Score:</Text>
                        <Badge style={{
                          backgroundColor: getScoreColor(submission.overallScore),
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 8,
                        }}>
                          <Text style={styles.scoreText}>{submission.overallScore}%</Text>
                        </Badge>
                      </View>
                    )}
                    
                    {submission.autoGradeResult && (
                      <View key="correct-answers" style={styles.scoreRow}>
                        <Text style={styles.scoreLabelProgress}>Correct Answers:</Text>
                        <Text style={styles.scoreValueProgress}>
                          {submission.autoGradeResult.score}/{submission.autoGradeResult.maxScore}
                        </Text>
                      </View>
                    )}
                    
                    {submission.readingTime && (
                      <View key="reading-time" style={styles.scoreRow}>
                        <Text style={styles.scoreLabelProgress}>Reading Time:</Text>
                        <Text style={styles.scoreValueProgress}>
                          {formatTime(submission.readingTime)}
                        </Text>
                      </View>
                    )}
                    
                    {exercise?.wordCount && submission.readingTime && (
                      <View key="reading-speed" style={styles.scoreRow}>
                        <Text style={styles.scoreLabelProgress}>Reading Speed:</Text>
                        <Text style={styles.scoreValueProgress}>
                          {calculateReadingSpeed(exercise.wordCount, submission.readingTime)} WPM
                        </Text>
                      </View>
                    )}
                    
                    {submission.wordsPerMinute && (
                      <View key="wpm" style={styles.scoreRow}>
                        <Text style={styles.scoreLabelProgress}>Words Per Minute:</Text>
                        <Text style={styles.scoreValueProgress}>
                          {submission.wordsPerMinute} WPM
                        </Text>
                      </View>
                    )}
                    
                    {submission.accuracyRate !== undefined && (
                      <View key="accuracy" style={styles.scoreRow}>
                        <Text style={styles.scoreLabelProgress}>Accuracy Rate:</Text>
                        <Text style={styles.scoreValueProgress}>
                          {submission.accuracyRate}%
                        </Text>
                      </View>
                    )}
                    
                    {submission.autoGradeResult?.feedback && (
                      <View key="feedback" style={styles.feedbackSummary}>
                        <Text style={styles.feedbackTitle}>Summary</Text>
                        <View style={styles.feedbackItems}>
                          {submission.autoGradeResult.feedback.slice(0, 3).map((item, index) => (
                            <View key={`feedback-${index}`} style={styles.feedbackItem}>
                              <Ionicons 
                                name={item.isCorrect ? "checkmark-circle" : "close-circle"} 
                                size={16} 
                                color={item.isCorrect ? "#10B981" : "#EF4444"} 
                              />
                              <Text style={[
                                styles.feedbackItemText,
                                item.isCorrect ? styles.correctText : styles.incorrectText
                              ]}>
                                Q{index + 1}: {item.isCorrect ? 'Correct' : 'Incorrect'}
                              </Text>
                            </View>
                          ))}
                          {submission.autoGradeResult.feedback.length > 3 && (
                            <Text key="more" style={styles.moreFeedbackText}>
                              +{submission.autoGradeResult.feedback.length - 3} more questions
                            </Text>
                          )}
                        </View>
                      </View>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as '700',
    color: '#1E293B',
    marginBottom: 20,
  },
  // Analytics Summary
  analyticsSummary: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as '700',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  // Chart styles
  chartCard: {
    marginBottom: 24,
  },
  chartContent: {
    padding: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600' as '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyCard: {
    marginTop: 20,
  },
  emptyContent: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as '600',
    color: '#1E293B',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  submissionsContainer: {
    gap: 12,
  },
  submissionCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  submissionContent: {
    padding: 16,
  },
  submissionHeader: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  submissionTitle: {
    fontSize: 16,
    fontWeight: '600' as '600',
    color: '#1E293B',
    flex: 1,
  },
  submissionDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  scoreRow: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  scoreLabelProgress: {
    fontSize: 14,
    color: '#64748B',
  },
  scoreValueProgress: {
    fontSize: 14,
    fontWeight: '600' as '600',
    color: '#1E293B',
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600' as '600',
    color: '#FFFFFF',
  },
  feedbackSummary: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '600' as '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  feedbackItems: {
    gap: 4,
  },
  feedbackItem: {
    flexDirection: 'row' as 'row',
    alignItems: 'center',
  },
  feedbackItemText: {
    fontSize: 12,
    marginLeft: 6,
  },
  correctText: {
    color: '#10B981',
  },
  incorrectText: {
    color: '#EF4444',
  },
  moreFeedbackText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
});