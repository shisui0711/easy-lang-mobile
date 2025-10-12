import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

import { Card, CardContent, Button } from '@/components/ui';
import { learningApi } from '@/lib/api';
import { ApiResponse } from '@/types';

interface SpeakingExercise {
  id: string;
  title: string;
  prompt: string;
  type: string;
  level: string;
  timeLimit?: number;
  passage?: string; // Added passage field for the text to read
  estimatedTime?: number;
  topic?: {
    id: string;
    name: string;
  };
}

interface SpeakingSubmission {
  id: string;
  exerciseId: string;
  audioUrl: string;
  duration?: number;
  pronunciationScore?: number;
  fluencyScore?: number;
  vocabularyScore?: number;
  grammarScore?: number;
  overallScore?: number;
  feedback?: any;
  status: string;
  createdAt: string;
}

interface SpeakingExercisesResponse {
  data: SpeakingExercise[];
}

interface SpeakingSubmissionsResponse {
  data: SpeakingSubmission[];
}

export default function SpeakingScreen() {
  const [exercises, setExercises] = useState<SpeakingExercise[]>([]);
  const [submissions, setSubmissions] = useState<SpeakingSubmission[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<SpeakingExercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'practice' | 'record' | 'progress'>('practice');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);
  // Speech recognition states
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [passageWords, setPassageWords] = useState<string[]>([]);
  const [recognizedWords, setRecognizedWords] = useState<string[]>([]);
  const [highlightedWords, setHighlightedWords] = useState<Set<number>>(new Set());
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  // New state for tracking completion
  const [isExerciseComplete, setIsExerciseComplete] = useState(false);
  // Filter states
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  // Speech recognition ref
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchExercises();
    fetchSubmissions();
    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
      // Clear any pending silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, [selectedLevel, selectedType, searchQuery]);

  const fetchExercises = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        pageSize: '20'
      };
      
      if (selectedLevel !== 'all') {
        params.level = selectedLevel;
      }
      
      if (selectedType !== 'all') {
        params.type = selectedType;
      }
      
      if (searchQuery) {
        params.searchQuery = searchQuery;
      }

      const response: any = await learningApi.getSpeakingExercises(params);
      if (response.success && response.data) {
        const exercisesData: SpeakingExercisesResponse = response.data;
        setExercises(exercisesData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
      Alert.alert('Error', 'Failed to load speaking exercises');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response: any = await learningApi.getSpeakingSubmissions();
      if (response.success && response.data) {
        const submissionsData: SpeakingSubmissionsResponse = response.data;
        setSubmissions(submissionsData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      Alert.alert('Error', 'Failed to load speaking submissions');
    }
  };

  // Initialize speech recognition when selected exercise changes
  useEffect(() => {
    if (selectedExercise && selectedExercise.passage) {
      const words = selectedExercise.passage.split(/\s+/).filter(word => word.trim() !== '');
      setPassageWords(words);
      // Reset highlighting state when exercise changes
      setHighlightedWords(new Set());
      setCurrentWordIndex(0);
      setRecognizedWords([]);
      setIsExerciseComplete(false);
    }
    
    // Cleanup function to stop recognition when exercise changes
    return () => {
      if (recognitionRef.current && isRecognizing) {
        try {
          // Stop recognition if needed
        } catch (error) {
          console.error('Error stopping recognition on cleanup:', error);
        }
      }
      // Clear any pending silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    }
  }, [selectedExercise]);

  // Tạo một hàm để reset trạng thái khi chọn exercise mới
  const handleSelectExercise = (exercise: SpeakingExercise) => {
    // Chỉ reset trạng thái khi chọn exercise mới
    if (!selectedExercise || selectedExercise.id !== exercise.id) {
      const words = exercise.passage?.split(/\s+/).filter(word => word.trim() !== '') || [];
      setPassageWords(words);
      setHighlightedWords(new Set());
      setCurrentWordIndex(0);
      setRecognizedWords([]);
      setIsExerciseComplete(false);
    }
    setSelectedExercise(exercise);
    setActiveTab('record');
  };

  // Placeholder for speech recognition initialization
  const initializeSpeechRecognition = () => {
    // This is a placeholder - in a real implementation, you would initialize
    // a speech recognition library like @react-native-voice/voice
    setRecognitionError('Speech recognition not implemented in this demo. In a full implementation, this would use device microphone to recognize speech.');
    return null;
  };

  // Placeholder for processing recognized text
  const processRecognizedText = (text: string) => {
    // This is a placeholder - in a real implementation, this would process
    // the recognized text and update highlighting
    console.log('Recognized text:', text);
  };

  // Placeholder for processing interim results
  const processInterimText = (text: string) => {
    // This is a placeholder - in a real implementation, this would process
    // interim results for real-time feedback
    console.log('Interim text:', text);
  };

  const startRecognition = async () => {
    if (!selectedExercise) return;
    
    // Initialize recognition if not already done
    if (!recognitionRef.current) {
      recognitionRef.current = initializeSpeechRecognition();
    }
    
    if (recognitionRef.current) {
      try {
        console.log('Starting recognition...');
        // Reset error state
        setRecognitionError(null);
        // Reset completion state
        setIsExerciseComplete(false);
        // Start recognition
        setIsRecognizing(true);
        console.log('Recognition started successfully');
      } catch (error: any) {
        console.error('Error starting recognition:', error);
        setRecognitionError(`Failed to start speech recognition: ${error.message || 'Please check your device settings and try again.'}`);
        setIsRecognizing(false);
      }
    } else {
      setRecognitionError('Failed to initialize speech recognition. Speech recognition functionality would be implemented in a full version.');
    }
  };

  const stopRecognition = () => {
    console.log('Stopping recognition...');
    if (recognitionRef.current) {
      try {
        // Stop recognition if needed
        console.log('Recognition stopped successfully');
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    setIsRecognizing(false);
    setRecognitionError(null); // Clear any previous errors when stopping
    
    // Clear any pending silence timeout
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981'; // green-500
    if (score >= 80) return '#3B82F6'; // blue-500
    if (score >= 70) return '#F59E0B'; // amber-500
    return '#EF4444'; // red-500
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading speaking exercises...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'practice' && styles.activeTab]}
          onPress={() => setActiveTab('practice')}
        >
          <Text style={[styles.tabText, activeTab === 'practice' && styles.activeTabText]}>Practice</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'record' && styles.activeTab]}
          onPress={() => setActiveTab('record')}
        >
          <Text style={[styles.tabText, activeTab === 'record' && styles.activeTabText]}>Record</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'progress' && styles.activeTab]}
          onPress={() => setActiveTab('progress')}
        >
          <Text style={[styles.tabText, activeTab === 'progress' && styles.activeTabText]}>Progress</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Practice Tab */}
        {activeTab === 'practice' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Speaking Practice</Text>
            
            {/* Filters */}
            <View style={styles.filterContainer}>
              <View style={styles.filterRow}>
                <TouchableOpacity 
                  style={[styles.filterButton, selectedType === 'all' && styles.activeFilter]}
                  onPress={() => setSelectedType('all')}
                >
                  <Text style={[styles.filterText, selectedType === 'all' && styles.activeFilterText]}>All Types</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterButton, selectedType === 'PRONUNCIATION' && styles.activeFilter]}
                  onPress={() => setSelectedType('PRONUNCIATION')}
                >
                  <Text style={[styles.filterText, selectedType === 'PRONUNCIATION' && styles.activeFilterText]}>Pronunciation</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterButton, selectedType === 'CONVERSATION' && styles.activeFilter]}
                  onPress={() => setSelectedType('CONVERSATION')}
                >
                  <Text style={[styles.filterText, selectedType === 'CONVERSATION' && styles.activeFilterText]}>Conversation</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.filterRow}>
                <TouchableOpacity 
                  style={[styles.filterButton, selectedLevel === 'all' && styles.activeFilter]}
                  onPress={() => setSelectedLevel('all')}
                >
                  <Text style={[styles.filterText, selectedLevel === 'all' && styles.activeFilterText]}>All Levels</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterButton, selectedLevel === 'Beginner' && styles.activeFilter]}
                  onPress={() => setSelectedLevel('Beginner')}
                >
                  <Text style={[styles.filterText, selectedLevel === 'Beginner' && styles.activeFilterText]}>Beginner</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterButton, selectedLevel === 'Intermediate' && styles.activeFilter]}
                  onPress={() => setSelectedLevel('Intermediate')}
                >
                  <Text style={[styles.filterText, selectedLevel === 'Intermediate' && styles.activeFilterText]}>Intermediate</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search exercises..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>
            
            {/* Exercise List */}
            <View style={styles.exercisesGrid}>
              {exercises.map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  onPress={() => handleSelectExercise(exercise)}
                  style={styles.exerciseCard}
                >
                  <Card>
                    <CardContent style={styles.exerciseContent}>
                      <View style={styles.exerciseHeader}>
                        <View style={styles.exerciseTitleContainer}>
                          <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                          <Text style={styles.exerciseTopic}>
                            {exercise.topic?.name || 'General'} • {exercise.level}
                          </Text>
                        </View>
                        <View style={styles.exerciseBadge}>
                          <Text style={styles.exerciseBadgeText}>
                            {exercise.type?.replace('_', ' ') || 'Speaking'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.exercisePrompt} numberOfLines={2}>
                        {exercise.prompt}
                      </Text>
                      <View style={styles.exerciseFooter}>
                        <View style={styles.exerciseInfo}>
                          <Ionicons name="time-outline" size={16} color="#94A3B8" />
                          <Text style={styles.exerciseInfoText}>
                            {exercise.estimatedTime || exercise.timeLimit || 5} min
                          </Text>
                        </View>
                        {exercise.passage && (
                          <Ionicons name="document-text-outline" size={16} color="#94A3B8" />
                        )}
                      </View>
                    </CardContent>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Record Tab */}
        {activeTab === 'record' && (
          <View style={styles.section}>
            {selectedExercise ? (
              <Card style={styles.card}>
                <CardContent style={styles.cardContent}>
                  <View style={styles.exerciseHeaderDetail}>
                    <Text style={styles.exerciseTitleDetail}>{selectedExercise.title}</Text>
                    <Text style={styles.exerciseSubtitle}>
                      {selectedExercise.topic?.name || 'General'} • {selectedExercise.level} • {selectedExercise.estimatedTime || selectedExercise.timeLimit || 5} min
                    </Text>
                  </View>
                  
                  {/* Passage display with word highlighting */}
                  {selectedExercise.passage && (
                    <View style={styles.passageContainer}>
                      <Text style={styles.passageTitle}>Passage to Read:</Text>
                      <View style={styles.passageContent}>
                        {passageWords.map((word, index) => (
                          <Text
                            key={index}
                            style={[
                              styles.passageWord,
                              highlightedWords.has(index) && styles.highlightedWord
                            ]}
                          >
                            {word}
                          </Text>
                        ))}
                      </View>
                    </View>
                  )}
                  
                  {/* Speech recognition controls */}
                  <View style={styles.controlsContainer}>
                    {recognitionError && (
                      <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{recognitionError}</Text>
                      </View>
                    )}
                    
                    <TouchableOpacity
                      onPress={isRecognizing ? stopRecognition : startRecognition}
                      style={[
                        styles.recordButton,
                        isRecognizing ? styles.stopButton : styles.startButton,
                        isExerciseComplete && styles.completedButton
                      ]}
                      disabled={isExerciseComplete}
                    >
                      <Ionicons 
                        name={isExerciseComplete ? 'checkmark' : isRecognizing ? 'stop' : 'mic'} 
                        size={24} 
                        color="#FFFFFF" 
                      />
                      <Text style={styles.recordButtonText}>
                        {isExerciseComplete ? "Exercise Completed" : isRecognizing ? "Stop Speaking" : "Start Speaking"}
                      </Text>
                    </TouchableOpacity>
                    
                    <View style={styles.statusContainer}>
                      {isExerciseComplete ? (
                        <Text style={styles.completedText}>Exercise completed! You can now submit your recording.</Text>
                      ) : isRecognizing ? (
                        <View style={styles.listeningContainer}>
                          <View style={styles.pulseDot} />
                          <Text style={styles.listeningText}>Listening... Speak the passage above</Text>
                        </View>
                      ) : (
                        <Text style={styles.instructionText}>Click &quot;Start Speaking&quot; and read the passage above</Text>
                      )}
                    </View>
                    
                    {/* Progress indicator */}
                    {passageWords.length > 0 && (
                      <View style={styles.progressContainer}>
                        <Text style={styles.progressText}>
                          Progress: {currentWordIndex} / {passageWords.length} words
                        </Text>
                        <View style={styles.progressBarBackground}>
                          <View 
                            style={[
                              styles.progressBar,
                              { width: `${(currentWordIndex / passageWords.length) * 100}%` }
                            ]} 
                          />
                        </View>
                      </View>
                    )}
                  </View>
                  
                  <Button
                    title="Choose Different Exercise"
                    onPress={() => {
                      setSelectedExercise(null);
                      setActiveTab('practice');
                    }}
                    variant="secondary"
                    style={styles.backButton}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card style={styles.card}>
                <CardContent style={styles.emptyState}>
                  <Ionicons name="mic" size={48} color="#94A3B8" />
                  <Text style={styles.emptyStateTitle}>Select an Exercise</Text>
                  <Text style={styles.emptyStateText}>
                    Choose an exercise from the Practice tab to start speaking practice
                  </Text>
                  <Button
                    title="Browse Exercises"
                    onPress={() => setActiveTab('practice')}
                    style={styles.browseButton}
                  />
                </CardContent>
              </Card>
            )}
          </View>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Speaking Progress</Text>
            
            {submissions.length > 0 ? (
              <View style={styles.submissionsList}>
                {submissions.map((submission) => {
                  const exercise = exercises.find(e => e.id === submission.exerciseId);
                  return (
                    <Card key={submission.id} style={styles.submissionCard}>
                      <CardContent style={styles.submissionContent}>
                        <View style={styles.submissionHeader}>
                          <View style={styles.submissionTitleContainer}>
                            <Text style={styles.submissionTitle}>
                              {exercise?.title || 'Unknown Exercise'}
                            </Text>
                            <Text style={styles.submissionDate}>
                              Submitted on {new Date(submission.createdAt).toLocaleDateString()}
                            </Text>
                          </View>
                          <View style={[
                            styles.statusBadge,
                            submission.status === 'analyzed' ? styles.analyzedBadge : styles.pendingBadge
                          ]}>
                            <Text style={[
                              styles.statusText,
                              submission.status === 'analyzed' ? styles.analyzedText : styles.pendingText
                            ]}>
                              {submission.status}
                            </Text>
                          </View>
                        </View>
                        
                        {submission.overallScore && (
                          <View style={styles.scoresContainer}>
                            <View style={styles.overallScoreContainer}>
                              <Text style={[
                                styles.overallScore,
                                { color: getScoreColor(submission.overallScore) }
                              ]}>
                                {submission.overallScore.toFixed(0)}%
                              </Text>
                              <Text style={styles.scoreLabel}>Overall</Text>
                            </View>
                            
                            <View style={styles.scoreGrid}>
                              {submission.pronunciationScore !== undefined && (
                                <View style={styles.scoreItem}>
                                  <Text style={[
                                    styles.scoreValue,
                                    { color: getScoreColor(submission.pronunciationScore) }
                                  ]}>
                                    {submission.pronunciationScore.toFixed(0)}%
                                  </Text>
                                  <Text style={styles.scoreLabel}>Pronunciation</Text>
                                </View>
                              )}
                              
                              {submission.fluencyScore !== undefined && (
                                <View style={styles.scoreItem}>
                                  <Text style={[
                                    styles.scoreValue,
                                    { color: getScoreColor(submission.fluencyScore) }
                                  ]}>
                                    {submission.fluencyScore.toFixed(0)}%
                                  </Text>
                                  <Text style={styles.scoreLabel}>Fluency</Text>
                                </View>
                              )}
                              
                              {submission.vocabularyScore !== undefined && (
                                <View style={styles.scoreItem}>
                                  <Text style={[
                                    styles.scoreValue,
                                    { color: getScoreColor(submission.vocabularyScore) }
                                  ]}>
                                    {submission.vocabularyScore.toFixed(0)}%
                                  </Text>
                                  <Text style={styles.scoreLabel}>Vocabulary</Text>
                                </View>
                              )}
                              
                              {submission.grammarScore !== undefined && (
                                <View style={styles.scoreItem}>
                                  <Text style={[
                                    styles.scoreValue,
                                    { color: getScoreColor(submission.grammarScore) }
                                  ]}>
                                    {submission.grammarScore.toFixed(0)}%
                                  </Text>
                                  <Text style={styles.scoreLabel}>Grammar</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        )}
                        
                        {submission.audioUrl && (
                          <View style={styles.audioContainer}>
                            <Text style={styles.audioLabel}>Your Recording:</Text>
                            {/* In a real implementation, you would add audio playback controls here */}
                            <View style={styles.audioPlaceholder}>
                              <Ionicons name="play" size={24} color="#3B82F6" />
                              <Text style={styles.audioText}>Audio playback would be implemented here</Text>
                            </View>
                          </View>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </View>
            ) : (
              <Card style={styles.card}>
                <CardContent style={styles.emptyState}>
                  <Ionicons name="trophy" size={48} color="#94A3B8" />
                  <Text style={styles.emptyStateTitle}>No Submissions Yet</Text>
                  <Text style={styles.emptyStateText}>
                    Complete your first speaking exercise to see your progress here
                  </Text>
                  <Button
                    title="Start Practicing"
                    onPress={() => setActiveTab('practice')}
                    style={styles.browseButton}
                  />
                </CardContent>
              </Card>
            )}
          </View>
        )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  // Filter styles
  filterContainer: {
    marginBottom: 20,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterButton: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilter: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    color: '#64748B',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  // Exercise list styles
  exercisesGrid: {
    gap: 16,
  },
  exerciseCard: {
    marginBottom: 8,
  },
  exerciseContent: {
    padding: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  exerciseTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  exerciseTopic: {
    fontSize: 14,
    color: '#64748B',
  },
  exerciseBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  exerciseBadgeText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  exercisePrompt: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 12,
  },
  exerciseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseInfoText: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 4,
  },
  // Record tab styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardContent: {
    padding: 20,
  },
  exerciseHeaderDetail: {
    marginBottom: 20,
  },
  exerciseTitleDetail: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  exerciseSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  passageContainer: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  passageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  passageContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  passageWord: {
    fontSize: 16,
    color: '#475569',
    marginRight: 8,
    marginBottom: 8,
    padding: 4,
    borderRadius: 4,
  },
  highlightedWord: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    fontWeight: '600',
  },
  controlsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: '#8B5CF6',
  },
  stopButton: {
    backgroundColor: '#EF4444',
  },
  completedButton: {
    backgroundColor: '#10B981',
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusContainer: {
    marginBottom: 20,
  },
  listeningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    marginRight: 8,
    opacity: 0.8,
  },
  listeningText: {
    fontSize: 14,
    color: '#64748B',
  },
  completedText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  backButton: {
    marginTop: 16,
  },
  // Empty state styles
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    marginHorizontal: 20,
  },
  browseButton: {
    minWidth: 160,
  },
  // Progress tab styles
  submissionsList: {
    gap: 16,
  },
  submissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  submissionContent: {
    padding: 16,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  submissionTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  submissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  submissionDate: {
    fontSize: 12,
    color: '#64748B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  analyzedBadge: {
    backgroundColor: '#DCFCE7',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '500',
  },
  analyzedText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '500',
  },
  pendingText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '500',
  },
  scoresContainer: {
    marginBottom: 16,
  },
  overallScoreContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  overallScore: {
    fontSize: 32,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  scoreItem: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  audioContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 16,
  },
  audioLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  audioPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 16,
  },
  audioText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 12,
  },
});