import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import RNPickerSelect from 'react-native-picker-select';
import * as SecureStore from 'expo-secure-store';

import { Card, CardContent, Button, Input } from '@/components/ui';
import { aiApi, apiClient, learningApi } from '@/lib/api';

interface ListeningExercise {
  id: string;
  title: string;
 description?: string;
  audioUrl?: string;
  type: string;
  level: string;
  duration?: number;
  estimatedTime: number;
  questions?: any[];
  dictationTasks?: any[];
  audioScript?: string;
  topic?: {
    id: string;
    name: string;
  };
}

interface ListeningSubmission {
  id: string;
  exerciseId: string;
  answers: any;
  transcription?: string;
  listeningTime?: number;
  comprehensionScore?: number;
  accuracyScore?: number;
  overallScore?: number;
  feedback?: any;
  status: string;
  createdAt: string;
}

export default function ListeningScreen() {
  const [exercises, setExercises] = useState<ListeningExercise[]>([]);
  const [submissions, setSubmissions] = useState<ListeningSubmission[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<ListeningExercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [transcription, setTranscription] = useState('');
  const [showScript, setShowScript] = useState(false);
  const [activeTab, setActiveTab] = useState<'practice' | 'listen' | 'progress'>('practice');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    fetchExercises();
    fetchSubmissions();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [selectedLevel, selectedType, searchQuery]);

  const fetchExercises = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        type: selectedType === 'all' ? 'CONVERSATION' : selectedType,
        level: selectedLevel === 'all' ? 'Beginner' : selectedLevel,
        pageSize: 20,
      };
      
      if (searchQuery) {
        params.searchQuery = searchQuery;
      }
      
      const response = await learningApi.getListeningExercises(params);
      if (response.success && response.data) {
        setExercises((response.data as any).data || []);
      }
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
      Alert.alert('Error', 'Failed to load listening exercises');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await learningApi.getListeningSubmissions();
      if (response.success && response.data) {
        setSubmissions((response.data as any).data || []);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
  };

  const loadAudioFromScript = async (script: string) => {
    try {
      // Check if script exists
      if (!script) {
        console.warn('No audio script provided');
        return;
      }
      
      const response = await aiApi.quickTTS({
        text: script,
        language: 'en',
      });

      if (!response.success) {
        throw new Error(`Failed to generate audio: ${response.message}`);
      }

      const data = response.data as any;
      const audioUrl = data.audioUrl;
      
      if (sound) {
        await sound.unloadAsync();
      }
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: false }
      );
      
      setSound(newSound);
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis || 0);
          setDuration(status.durationMillis || 0);
          setIsPlaying(status.isPlaying || false);
        }
      });
    } catch (error) {
      console.error('Error loading audio from script:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to generate audio from script: ${errorMessage}`);
    }
  };

  const playPause = async () => {
    if (!sound) return;
    
    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const seekTo = async (position: number) => {
    if (!sound) return;
    
    try {
      await sound.setPositionAsync(position);
      setPosition(position);
    } catch (error) {
      console.error('Error seeking audio:', error);
    }
  };

  const changePlaybackRate = async (rate: number) => {
    if (!sound) return;
    
    try {
      await sound.setRateAsync(rate, true);
      setPlaybackRate(rate);
    } catch (error) {
      console.error('Error changing playback rate:', error);
    }
  };

  const startListening = async (exercise: ListeningExercise) => {
    setSelectedExercise(exercise);
    setAnswers({});
    setTranscription('');
    setStartTime(Date.now());
    setShowScript(false);
    setPosition(0);
    setIsPlaying(false);
    
    // Generate audio from script if available
    if (exercise.audioScript) {
      await loadAudioFromScript(exercise.audioScript);
    } else {
      console.warn('No audio script available for this exercise');
      Alert.alert('Warning', 'This exercise does not have an audio script available.');
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const submitAnswers = async () => {
    if (!selectedExercise || !startTime) return;

    setIsSubmitting(true);
    try {
      const listeningTime = Math.floor((Date.now() - startTime) / 1000);
      
      const response = await learningApi.submitListeningAnswers(
        selectedExercise.id,
        answers,
        transcription || undefined,
        listeningTime
      );
      
      if (response.success) {
        Alert.alert('Success', 'Answers submitted successfully!');
        setSelectedExercise(null);
        setAnswers({});
        setTranscription('');
        setStartTime(null);
        fetchSubmissions();
      } else {
        Alert.alert('Error', 'Failed to submit answers');
      }
    } catch (error) {
      console.error('Failed to submit answers:', error);
      Alert.alert('Error', 'Failed to submit answers');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981'; // green
    if (score >= 80) return '#3B82F6'; // blue
    if (score >= 70) return '#F59E0B'; // yellow
    return '#EF4444'; // red
 };

  if (isLoading && activeTab === 'practice') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading listening exercises...</Text>
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
          <Text style={[styles.tabText, activeTab === 'practice' && styles.activeTabText]}>
            Practice
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'listen' && styles.activeTab]}
          onPress={() => setActiveTab('listen')}
        >
          <Text style={[styles.tabText, activeTab === 'listen' && styles.activeTabText]}>
            Listen
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'progress' && styles.activeTab]}
          onPress={() => setActiveTab('progress')}
        >
          <Text style={[styles.tabText, activeTab === 'progress' && styles.activeTabText]}>
            Progress
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Practice Tab */}
        {activeTab === 'practice' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Listening Exercises</Text>
            
            {/* Filters */}
            <View style={styles.filtersContainer}>
              <View style={styles.filterRow}>
                <View style={styles.pickerContainer}>
                  <Text style={styles.filterLabel}>Type</Text>
                  <View style={styles.pickerWrapper}>
                    <RNPickerSelect
                      onValueChange={setSelectedType}
                      items={[
                        { label: 'All Types', value: 'all' },
                        { label: 'Conversation', value: 'CONVERSATION' },
                        { label: 'Lecture', value: 'LECTURE' },
                        { label: 'News', value: 'NEWS' },
                        { label: 'Podcast', value: 'PODCAST' },
                        { label: 'IELTS Listening', value: 'IELTS_LISTENING' },
                        { label: 'Dictation', value: 'DICTATION' },
                        { label: 'Audio Book', value: 'AUDIO_BOOK' },
                      ]}
                      style={pickerSelectStyles}
                      value={selectedType}
                      placeholder={{}}
                    />
                  </View>
                </View>
                
                <View style={styles.pickerContainer}>
                  <Text style={styles.filterLabel}>Level</Text>
                  <View style={styles.pickerWrapper}>
                    <RNPickerSelect
                      onValueChange={setSelectedLevel}
                      items={[
                        { label: 'All Levels', value: 'all' },
                        { label: 'Beginner', value: 'Beginner' },
                        { label: 'Intermediate', value: 'Intermediate' },
                        { label: 'Advanced', value: 'Advanced' },
                        { label: 'Expert', value: 'Expert' },
                      ]}
                      style={pickerSelectStyles}
                      value={selectedLevel}
                      placeholder={{}}
                    />
                  </View>
                </View>
              </View>
              
              <Input
                placeholder="Search exercises..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
            </View>
            
            {/* Exercise List */}
            <View style={styles.exercisesGrid}>
              {exercises.map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  onPress={() => startListening(exercise)}
                  style={styles.exerciseCard}
                >
                  <Card>
                    <CardContent style={styles.exerciseContent}>
                      <View style={styles.exerciseHeader}>
                        <Ionicons name="headset" size={32} color="#3B82F6" />
                        <Text style={styles.levelText}>{exercise.level}</Text>
                      </View>
                      <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                      <Text style={styles.exerciseType}>{exercise.type.replace('_', ' ')}</Text>
                      {exercise.topic && (
                        <Text style={styles.exerciseTopic}>{exercise.topic.name}</Text>
                      )}
                      <Text style={styles.exerciseDuration}>
                        Duration: {exercise.estimatedTime} min
                      </Text>
                      {exercise.description && (
                        <Text style={styles.exerciseDescription} numberOfLines={2}>
                          {exercise.description}
                        </Text>
                      )}
                    </CardContent>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Listen Tab */}
        {activeTab === 'listen' && (
          <View style={styles.section}>
            {selectedExercise ? (
              <View style={styles.playerContainer}>
                {/* Exercise Header */}
                <Card style={styles.exerciseHeaderCard}>
                  <CardContent style={styles.exerciseHeaderContent}>
                    <Text style={styles.exerciseTitle}>{selectedExercise.title}</Text>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseInfoText}>
                        {selectedExercise.topic?.name} • {selectedExercise.level} • 
                        {selectedExercise.estimatedTime} min
                      </Text>
                      {startTime && (
                        <Text style={styles.timerText}>
                          {formatTime(Date.now() - startTime)}
                        </Text>
                      )}
                    </View>
                  </CardContent>
                </Card>
                
                {/* Audio Player */}
                <Card style={styles.playerCard}>
                  <CardContent style={styles.playerContent}>
                    <View style={styles.audioControls}>
                      <TouchableOpacity
                        onPress={() => seekTo(Math.max(0, position - 1000))}
                        style={styles.controlButton}
                        disabled={!sound}
                      >
                        <Ionicons name="play-back" size={24} color="#3B82F6" />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={playPause}
                        style={styles.playButton}
                        disabled={!sound}
                      >
                        <Ionicons 
                          name={isPlaying ? 'pause' : 'play'} 
                          size={32} 
                          color="#FFFFFF" 
                        />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={() => seekTo(position + 10000)}
                        style={styles.controlButton}
                        disabled={!sound}
                      >
                        <Ionicons name="play-forward" size={24} color="#3B82F6" />
                      </TouchableOpacity>
                    </View>
                    
                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                      <Text style={styles.timeText}>{formatTime(position)}</Text>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { width: `${duration > 0 ? (position / duration) * 100 : 0}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.timeText}>{formatTime(duration)}</Text>
                    </View>
                    
                    {/* Playback Speed */}
                    <View style={styles.speedContainer}>
                      <Text style={styles.speedLabel}>Speed:</Text>
                      <View style={styles.speedButtons}>
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                          <TouchableOpacity
                            key={rate}
                            onPress={() => changePlaybackRate(rate)}
                            style={[
                              styles.speedButton,
                              playbackRate === rate && styles.activeSpeedButton
                            ]}
                            disabled={!sound}
                          >
                            <Text 
                              style={[
                                styles.speedButtonText,
                                playbackRate === rate && styles.activeSpeedButtonText
                              ]}
                            >
                              {rate}x
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    
                    {/* Script Toggle */}
                    {selectedExercise.audioScript && (
                      <Button
                        title={showScript ? 'Hide Transcript' : 'Show Transcript'}
                        variant="outline"
                        onPress={() => setShowScript(!showScript)}
                        style={styles.scriptButton}
                      />
                    )}
                  </CardContent>
                </Card>
                
                {/* Transcript */}
                {showScript && selectedExercise.audioScript && (
                  <Card>
                    <CardContent style={styles.transcriptContent}>
                      <Text style={styles.transcriptTitle}>Transcript</Text>
                      <Text style={styles.transcriptText}>
                        {selectedExercise.audioScript}
                      </Text>
                    </CardContent>
                  </Card>
                )}
                
                {/* Questions */}
                {selectedExercise.questions && selectedExercise.questions.length > 0 && (
                  <Card>
                    <CardContent style={styles.questionsContent}>
                      <Text style={styles.questionsTitle}>Questions</Text>
                      <Text style={styles.questionsDescription}>
                        Listen to the audio and answer the following questions
                      </Text>
                      
                      {selectedExercise.questions.map((question: any, index: number) => (
                        <View key={index} style={styles.questionContainer}>
                          <Text style={styles.questionText}>
                            {index + 1}. {question.question}
                          </Text>
                          
                          {question.type === 'multiple_choice' && question.options && (
                            <View style={styles.optionsContainer}>
                              {question.options.map((option: string, optionIndex: number) => (
                                <TouchableOpacity
                                  key={optionIndex}
                                  style={[
                                    styles.optionButton,
                                    answers[`q${index}`] === option && styles.selectedOption
                                  ]}
                                  onPress={() => handleAnswerChange(`q${index}`, option)}
                                >
                                  <Text 
                                    style={[
                                      styles.optionText,
                                      answers[`q${index}`] === option && styles.selectedOptionText
                                    ]}
                                  >
                                    {option}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                          
                          {(question.type === 'short_answer' || question.type === 'fill_blank') && (
                            <Input
                              placeholder="Enter your answer"
                              value={answers[`q${index}`] || ''}
                              onChangeText={(text) => handleAnswerChange(`q${index}`, text)}
                              style={styles.answerInput}
                            />
                          )}
                        </View>
                      ))}
                    </CardContent>
                  </Card>
                )}
                
                {/* Dictation */}
                {selectedExercise.type === 'DICTATION' && (
                  <Card>
                    <CardContent style={styles.dictationContent}>
                      <Text style={styles.dictationTitle}>Dictation</Text>
                      <Text style={styles.dictationDescription}>
                        Listen carefully and write what you hear
                      </Text>
                      <Input
                        placeholder="Type what you hear..."
                        value={transcription}
                        onChangeText={setTranscription}
                        multiline
                        numberOfLines={6}
                        style={styles.dictationInput}
                        inputStyle={styles.dictationInputText}
                      />
                    </CardContent>
                  </Card>
                )}
                
                {/* Submit Button */}
                <View style={styles.buttonContainer}>
                  <Button
                    title="Choose Different Exercise"
                    variant="outline"
                    onPress={() => setSelectedExercise(null)}
                    style={styles.backButton}
                  />
                  <Button
                    title={isSubmitting ? 'Submitting...' : 'Submit Answers'}
                    onPress={submitAnswers}
                    disabled={isSubmitting}
                    style={styles.submitButton}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Card>
                  <CardContent style={styles.emptyStateContent}>
                    <Ionicons name="headset" size={48} color="#94A3B8" />
                    <Text style={styles.emptyStateTitle}>Select an Exercise</Text>
                    <Text style={styles.emptyStateDescription}>
                      Choose an exercise from the Practice tab to start listening
                    </Text>
                    <Button
                      title="Browse Exercises"
                      onPress={() => setActiveTab('practice')}
                      style={styles.browseButton}
                    />
                  </CardContent>
                </Card>
              </View>
            )}
          </View>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <View style={styles.section}>
            {submissions.length > 0 ? (
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
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{submission.status}</Text>
                          </View>
                        </View>
                        
                        <Text style={styles.submissionDate}>
                          Completed on {new Date(submission.createdAt).toLocaleDateString()}
                          {submission.listeningTime && (
                            <> • Listened for {formatTime(submission.listeningTime * 1000)}</>
                          )}
                        </Text>
                        
                        {submission.overallScore && (
                          <View style={styles.scoresContainer}>
                            <View style={styles.scoreItem}>
                              <Text style={[styles.scoreValue, { color: getScoreColor(submission.overallScore) }]}>
                                {submission.overallScore.toFixed(0)}%
                              </Text>
                              <Text style={styles.scoreLabel}>Overall</Text>
                            </View>
                            
                            {submission.comprehensionScore && (
                              <View style={styles.scoreItem}>
                                <Text style={[styles.scoreValue, { color: getScoreColor(submission.comprehensionScore) }]}>
                                  {submission.comprehensionScore.toFixed(0)}%
                                </Text>
                                <Text style={styles.scoreLabel}>Comprehension</Text>
                              </View>
                            )}
                            
                            {submission.accuracyScore && (
                              <View style={styles.scoreItem}>
                                <Text style={[styles.scoreValue, { color: getScoreColor(submission.accuracyScore) }]}>
                                  {submission.accuracyScore.toFixed(0)}%
                                </Text>
                                <Text style={styles.scoreLabel}>Accuracy</Text>
                              </View>
                            )}
                          </View>
                        )}
                        
                        {submission.transcription && (
                          <View style={styles.transcriptionSection}>
                            <Text style={styles.transcriptionLabel}>Your Transcription:</Text>
                            <Text style={styles.transcriptionValue}>
                              {submission.transcription}
                            </Text>
                          </View>
                        )}
                        
                        {submission.feedback && (
                          <View style={styles.feedbackSection}>
                            <Text style={styles.feedbackLabel}>Feedback:</Text>
                            <Text style={styles.feedbackValue}>
                              {JSON.stringify(submission.feedback)}
                            </Text>
                          </View>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Card>
                  <CardContent style={styles.emptyStateContent}>
                    <Ionicons name="trophy" size={48} color="#94A3B8" />
                    <Text style={styles.emptyStateTitle}>No Submissions Yet</Text>
                    <Text style={styles.emptyStateDescription}>
                      Complete your first listening exercise to see your progress here
                    </Text>
                    <Button
                      title="Start Listening"
                      onPress={() => setActiveTab('practice')}
                      style={styles.browseButton}
                    />
                  </CardContent>
                </Card>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

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
  content: {
    flex: 1,
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
  filtersContainer: {
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pickerContainer: {
    flex: 1,
    marginRight: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  picker: {
    height: 40,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  searchInput: {
    marginBottom: 16,
  },
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
    alignItems: 'center',
    marginBottom: 8,
  },
  levelText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  exerciseType: {
    fontSize: 14,
    color: '#3B82F6',
    marginBottom: 2,
  },
  exerciseTopic: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  exerciseDuration: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  exerciseDescription: {
    fontSize: 12,
    color: '#64748B',
  },
  playerContainer: {
    gap: 16,
  },
  exerciseHeaderCard: {
    backgroundColor: '#FFFFFF',
  },
  exerciseHeaderContent: {
    padding: 16,
  },
  exerciseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  exerciseInfoText: {
    fontSize: 14,
    color: '#64748B',
  },
  timerText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  playerCard: {
    backgroundColor: '#FFFFFF',
  },
  playerContent: {
    padding: 24,
    alignItems: 'center',
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  controlButton: {
    padding: 12,
    marginHorizontal: 8,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
    width: 40,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginHorizontal: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  speedContainer: {
    width: '100%',
    marginBottom: 24,
  },
  speedLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  speedButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
 },
  speedButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  activeSpeedButton: {
    backgroundColor: '#3B82F6',
  },
  speedButtonText: {
    fontSize: 14,
    color: '#64748B',
  },
  activeSpeedButtonText: {
    color: '#FFFFFF',
  },
  scriptButton: {
    marginTop: 16,
  },
  transcriptContent: {
    padding: 16,
  },
  transcriptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  transcriptText: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
  },
  questionsContent: {
    padding: 16,
  },
  questionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  questionsDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  questionContainer: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedOption: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  optionText: {
    fontSize: 14,
    color: '#1E293B',
  },
  selectedOptionText: {
    color: '#FFFFFF',
  },
  answerInput: {
    marginTop: 8,
  },
  dictationContent: {
    padding: 16,
  },
  dictationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  dictationDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  dictationInput: {
    minHeight: 120,
  },
  dictationInputText: {
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  backButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContent: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    width: '100%',
  },
  submissionsContainer: {
    gap: 16,
  },
  submissionCard: {
    backgroundColor: '#FFFFFF',
  },
  submissionContent: {
    padding: 16,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  submissionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    flex: 1,
  },
  badge: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  submissionDate: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
  },
 scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  transcriptionSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  transcriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  transcriptionValue: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
  },
  feedbackSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  feedbackValue: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    color: '#1E293B',
    paddingRight: 30, // to ensure the text is never behind the icon
    backgroundColor: '#FFFFFF',
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    color: '#1E293B',
    paddingRight: 30, // to ensure the text is never behind the icon
    backgroundColor: '#FFFFFF',
  },
  iconContainer: {
    top: 10,
    right: 12,
  },
});