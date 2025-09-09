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
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

import { Card, CardContent, Button } from '@/components/ui';
import { apiClient } from '@/lib/api';

interface SpeakingExercise {
  id: string;
  title: string;
  prompt: string;
  type: string;
  level: string;
  timeLimit?: number;
}

interface SpeakingExercisesResponse {
  data: SpeakingExercise[];
}

export default function SpeakingScreen() {
  const [exercises, setExercises] = useState<SpeakingExercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<SpeakingExercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchExercises();
    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
    };
  }, []);

  const fetchExercises = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<SpeakingExercisesResponse>('/speaking/exercises');
      if (response.success && response.data) {
        setExercises(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
      Alert.alert('Error', 'Failed to load speaking exercises');
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission denied', 'Please grant microphone permission to record');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingTime(0);
      
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingInterval(interval);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      Alert.alert(
        'Recording Complete',
        `Recording saved! Duration: ${formatTime(recordingTime)}`,
        [
          { text: 'Record Again', onPress: () => setRecording(null) },
          { text: 'Submit', onPress: () => submitRecording(uri) }
        ]
      );
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const submitRecording = async (uri: string | null) => {
    if (!selectedExercise || !uri) return;

    try {
      // Here you would upload the recording to your server
      Alert.alert('Success', 'Recording submitted for evaluation!');
      setSelectedExercise(null);
      setRecording(null);
      setRecordingTime(0);
    } catch (error) {
      console.error('Failed to submit recording:', error);
      Alert.alert('Error', 'Failed to submit recording');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Speaking Practice</Text>
          
          {selectedExercise ? (
            <View style={styles.practiceContainer}>
              <Card style={styles.promptCard}>
                <CardContent style={styles.promptContent}>
                  <Text style={styles.exerciseTitle}>{selectedExercise.title}</Text>
                  <Text style={styles.promptText}>{selectedExercise.prompt}</Text>
                  {selectedExercise.timeLimit && (
                    <Text style={styles.timeLimitText}>
                      Time limit: {selectedExercise.timeLimit} seconds
                    </Text>
                  )}
                </CardContent>
              </Card>

              <Card style={styles.recordingCard}>
                <CardContent style={styles.recordingContent}>
                  <View style={styles.recordingControls}>
                    <TouchableOpacity
                      onPress={isRecording ? stopRecording : startRecording}
                      style={[
                        styles.recordButton,
                        isRecording && styles.recordButtonActive
                      ]}
                    >
                      <Ionicons 
                        name={isRecording ? 'stop' : 'mic'} 
                        size={32} 
                        color="#FFFFFF" 
                      />
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.recordingStatus}>
                    {isRecording ? 'Recording...' : 'Tap to start recording'}
                  </Text>
                  
                  {recordingTime > 0 && (
                    <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
                  )}
                  
                  <Button
                    title="Choose Different Exercise"
                    onPress={() => setSelectedExercise(null)}
                    variant="secondary"
                    style={styles.backButton}
                  />
                </CardContent>
              </Card>
            </View>
          ) : (
            <View style={styles.exercisesGrid}>
              {exercises.map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  onPress={() => setSelectedExercise(exercise)}
                  style={styles.exerciseCard}
                >
                  <Card>
                    <CardContent style={styles.exerciseContent}>
                      <View style={styles.exerciseHeader}>
                        <Ionicons name="mic" size={32} color="#8B5CF6" />
                        <Text style={styles.levelText}>{exercise.level}</Text>
                      </View>
                      <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                      <Text style={styles.exerciseType}>{exercise.type}</Text>
                      {exercise.timeLimit && (
                        <Text style={styles.timeLimitText}>
                          Time limit: {exercise.timeLimit}s
                        </Text>
                      )}
                    </CardContent>
                  </Card>
                </TouchableOpacity>
              ))}
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
    color: '#64748B',
    marginBottom: 4,
  },
  timeLimitText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  practiceContainer: {
    gap: 20,
  },
  promptCard: {
    backgroundColor: '#FFFFFF',
  },
  promptContent: {
    padding: 20,
  },
  promptText: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 12,
  },
  recordingCard: {
    backgroundColor: '#FFFFFF',
  },
  recordingContent: {
    padding: 24,
    alignItems: 'center',
  },
  recordingControls: {
    alignItems: 'center',
    marginBottom: 20,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonActive: {
    backgroundColor: '#EF4444',
  },
  recordingStatus: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 8,
  },
  recordingTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 20,
  },
  backButton: {
    marginTop: 16,
  },
});