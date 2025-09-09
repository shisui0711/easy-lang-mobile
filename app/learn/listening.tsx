import React, { useState, useEffect, useRef } from 'react';
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

interface ListeningExercise {
  id: string;
  title: string;
  audioUrl: string;
  type: string;
  level: string;
  duration?: number;
  questions?: any[];
}

export default function ListeningScreen() {
  const [exercises, setExercises] = useState<ListeningExercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<ListeningExercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    fetchExercises();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const fetchExercises = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/listening/exercises');
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

  const loadAudio = async (audioUrl: string) => {
    try {
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
      console.error('Error loading audio:', error);
      Alert.alert('Error', 'Failed to load audio');
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

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
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
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Listening Exercises</Text>
          
          {selectedExercise ? (
            <View style={styles.playerContainer}>
              <Card style={styles.playerCard}>
                <CardContent style={styles.playerContent}>
                  <Text style={styles.exerciseTitle}>{selectedExercise.title}</Text>
                  
                  <View style={styles.audioControls}>
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
                  </View>
                  
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
                  
                  <Button
                    title="Choose Different Exercise"
                    onPress={() => setSelectedExercise(null)}
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
                  onPress={() => {
                    setSelectedExercise(exercise);
                    loadAudio(exercise.audioUrl);
                  }}
                  style={styles.exerciseCard}
                >
                  <Card>
                    <CardContent style={styles.exerciseContent}>
                      <View style={styles.exerciseHeader}>
                        <Ionicons name="headset" size={32} color="#3B82F6" />
                        <Text style={styles.levelText}>{exercise.level}</Text>
                      </View>
                      <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                      <Text style={styles.exerciseType}>{exercise.type}</Text>
                      {exercise.duration && (
                        <Text style={styles.exerciseDuration}>
                          Duration: {Math.floor(exercise.duration / 60)}:{(exercise.duration % 60).toString().padStart(2, '0')}
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
  exerciseDuration: {
    fontSize: 12,
    color: '#94A3B8',
  },
  playerContainer: {
    marginTop: 20,
  },
  playerCard: {
    backgroundColor: '#FFFFFF',
  },
  playerContent: {
    padding: 24,
    alignItems: 'center',
  },
  audioControls: {
    alignItems: 'center',
    marginVertical: 24,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
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
  backButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
});