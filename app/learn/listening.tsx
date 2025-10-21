import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import RNPickerSelect from 'react-native-picker-select';

import { Card, CardContent, Button, Input } from '@/components/ui';
import { aiApi, learningApi } from '@/lib/api';

interface ListeningExercise {
  id: string;
  title: string;
 description?: string;
  audioUrl?: string;
  type: string;
  level: string;
  accent?: string;
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

interface Question {
  id: string
  question: string
  type: 'multiple_choice' | 'short_answer' | 'fill_blank'
  options?: string[]
  correctAnswer: string | string[]
  explanation?: string
  points?: number
}

interface GradingResult {
  score: number
  maxScore: number
  percentage: number
  feedback: {
    questionId: string
    isCorrect: boolean
    correctAnswer: string | string[]
    explanation?: string
    userAnswer: string
  }[]
  dictationAccuracy?: number
  dictationFeedback?: string
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
  const [selectedAccent, setSelectedAccent] = useState<string>('all'); // Add accent filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  // New states for grading functionality
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null)
  const [showResults, setShowResults] = useState(false)
  // New state for audio loading
  const [isAudioLoading, setIsAudioLoading] = useState(false)
  const [selectedWord, setSelectedWord] = useState<string | null>(null); // State for selected word
  const [wordDefinition, setWordDefinition] = useState<string | null>(null); // State for word definition
  const [selectedSubtitleLanguage, setSelectedSubtitleLanguage] = useState<string>('en'); // State for subtitle language
  const [subtitleContent, setSubtitleContent] = useState<Record<string, string>>({}); // State for subtitles in different languages
  const [bookmarkedExercises, setBookmarkedExercises] = useState<Set<string>>(new Set()); // State for bookmarked exercises
  const [recommendedExercises, setRecommendedExercises] = useState<ListeningExercise[]>([]); // State for recommended exercises

  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false); // State for bookmark filter
  const [downloadedExercises, setDownloadedExercises] = useState<Set<string>>(new Set()); // State for downloaded exercises
  const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>({}); // State for download progress
  const [userProficiency, setUserProficiency] = useState<string>('Intermediate'); // State for user proficiency level

  useEffect(() => {
    fetchExercises();
    fetchSubmissions();
    fetchRecommendedExercises(); // Fetch recommendations on component mount
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [selectedLevel, selectedType, selectedAccent, searchQuery, userProficiency]);

  const fetchExercises = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        ...(selectedType !== 'all' && { type: selectedType }),
        ...(selectedLevel !== 'all' && { level: selectedLevel }),
        ...(selectedAccent !== 'all' && { accent: selectedAccent }), // Add accent filter
        // Filter exercises based on user proficiency level
        ...(userProficiency && { userProficiency }),
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

  // Mock function to fetch recommended exercises
  const fetchRecommendedExercises = async () => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock recommended exercises
      const mockRecommendations = [
        {
          id: 'rec1',
          title: 'Travel Conversations',
          type: 'CONVERSATION',
          level: 'Intermediate',
          accent: 'American',
          estimatedTime: 12,
          description: 'Common phrases and expressions used during travel'
        },
        {
          id: 'rec2',
          title: 'Business English',
          type: 'LECTURE',
          level: 'Advanced',
          accent: 'British',
          estimatedTime: 15,
          description: 'Professional vocabulary and expressions for business settings'
        },
        {
          id: 'rec3',
          title: 'Movie Dialogues',
          type: 'PODCAST',
          level: 'Intermediate',
          accent: 'Australian',
          estimatedTime: 10,
          description: 'Popular movie quotes and dialogues for casual learning'
        }
      ];
      
      setRecommendedExercises(mockRecommendations);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    }
  };

  const loadAudioFromScript = async (script: string) => {
    try {
      setIsAudioLoading(true);
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
    } finally {
      setIsAudioLoading(false);
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
    setSelectedSubtitleLanguage('en'); // Reset to default language
    
    // Fetch subtitles for the exercise
    if (exercise.id) {
      await fetchSubtitles(exercise.id);
    }
    
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

  // Automatic grading function
  const gradeAnswers = (exercise: ListeningExercise, userAnswers: Record<string, string>, userTranscription: string): GradingResult => {
    const questions = exercise.questions || []
    let totalScore = 0
    let maxScore = 0
    const feedback = []

    // Grade questions
    for (const [index, question] of questions.entries()) {
      const questionId = `q${index}`
      const userAnswer = userAnswers[questionId] || ''
      const correctAnswer = question.correctAnswer
      const points = question.points || 1
      maxScore += points

      let isCorrect = false
      let normalizedCorrectAnswer = ''

      switch (question.type) {
        case 'multiple_choice':
          isCorrect = userAnswer === (Array.isArray(correctAnswer) ? correctAnswer[0] : correctAnswer)
          normalizedCorrectAnswer = Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer
          break
        case 'short_answer':
        case 'fill_blank':
          // For text-based answers, we'll do a case-insensitive comparison with some flexibility
          const userAnswerLower = userAnswer.toLowerCase().trim()
          if (Array.isArray(correctAnswer)) {
            isCorrect = correctAnswer.some(ans => 
              userAnswerLower.includes(ans.toLowerCase()) || 
              ans.toLowerCase().includes(userAnswerLower)
            )
            normalizedCorrectAnswer = correctAnswer.join(' or ')
          } else {
            isCorrect = userAnswerLower === correctAnswer.toLowerCase()
            normalizedCorrectAnswer = correctAnswer
          }
          break
      }

      if (isCorrect) {
        totalScore += points
      }

      feedback.push({
        questionId,
        isCorrect,
        correctAnswer: normalizedCorrectAnswer,
        explanation: question.explanation,
        userAnswer
      })
    }

    // Grade dictation if applicable
    let dictationAccuracy = 0
    let dictationFeedback = ''
    if (exercise.type === 'DICTATION' && exercise.audioScript && userTranscription) {
      // Simple word matching for dictation accuracy
      const correctWords = exercise.audioScript.toLowerCase().match(/\b(\w+)\b/g) || []
      const userWords = userTranscription.toLowerCase().match(/\b(\w+)\b/g) || []
      
      // Calculate accuracy based on word matches
      const correctWordSet = new Set(correctWords)
      const userWordSet = new Set(userWords)
      let matchingWords = 0
      
      for (const word of userWordSet) {
        if (correctWordSet.has(word)) {
          matchingWords++
        }
      }
      
      dictationAccuracy = correctWords.length > 0 ? Math.round((matchingWords / correctWords.length) * 100) : 0
      dictationFeedback = `You correctly transcribed ${matchingWords} out of ${correctWords.length} words.`
      
      // Add dictation score to total
      const dictationPoints = 5 // Fixed points for dictation
      maxScore += dictationPoints
      totalScore += Math.round((dictationAccuracy / 100) * dictationPoints)
    }

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

    return {
      score: totalScore,
      maxScore,
      percentage,
      feedback,
      dictationAccuracy: dictationAccuracy || undefined,
      dictationFeedback: dictationFeedback || undefined
    }
  }

  const submitAnswers = async () => {
    if (!selectedExercise || !startTime) return;

    // Perform automatic grading
    const result = gradeAnswers(selectedExercise, answers, transcription)
    setGradingResult(result)
    setShowResults(true)

    setIsSubmitting(true)
    try {
      const listeningTime = Math.floor((Date.now() - startTime) / 1000)
      
      const response = await learningApi.submitListeningAnswers(
        selectedExercise.id,
        answers,
        transcription || undefined,
        listeningTime
      )
      
      if (response.success) {
        // Show success message
        Alert.alert('Success', 'Answers submitted successfully! Review your results below.');
        // Keep the exercise displayed to show results
        // Only clear the answers and transcription, but don't reset the exercise
        setAnswers({})
        setTranscription('')
        setStartTime(null)
        fetchSubmissions()
        // Results are already visible, no need to set them again
      } else {
        Alert.alert('Error', 'Failed to submit answers')
        // Keep results visible but show error
      }
    } catch (error) {
      console.error('Failed to submit answers:', error)
      Alert.alert('Error', 'Failed to submit answers')
      // Keep results visible but show error
    } finally {
      setIsSubmitting(false)
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

  const handleWordSelect = async (word: string) => {
    setSelectedWord(word);
    // In a real implementation, this would call an API to get the definition
    // For now, we'll simulate with a mock definition
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock definitions for common words
      const mockDefinitions: Record<string, string> = {
        'hello': 'A greeting or expression of goodwill.',
        'world': 'The earth, together with all of its countries and peoples.',
        'language': 'The method of human communication, either spoken or written.',
        'learning': 'The acquisition of knowledge or skills through study, experience, or being taught.',
        'practice': 'The actual application or use of an idea, belief, or method.',
        'listen': 'To give one\'s attention to sound.',
        'speak': 'To say words aloud.',
        'understand': 'To perceive the intended meaning of words, language, or behavior.',
        'improve': 'To make or become better.',
        'skill': 'An ability to do an activity or job well, especially because you have practiced it.',
        'vocabulary': 'The body of words used in a particular language.',
        'exercise': 'An activity requiring physical effort, carried out to sustain or improve health and fitness.',
        'comprehension': 'The ability to understand something.',
        'pronunciation': 'The way in which a word is spoken.',
        'accent': 'A distinctive mode of pronunciation of a language, associated with a particular region or social group.',
        'conversation': 'A talk between two or more people in which thoughts, feelings, and ideas are expressed.',
        'lecture': 'A talk given to an audience, especially to students in a university.',
        'news': 'Newly received or noteworthy information, especially about recent events.',
        'podcast': 'A digital audio file made available on the internet for downloading to a computer or mobile device.',
        'book': 'A written or printed work consisting of pages glued or sewn together.',
      };
      
      const normalizedWord = word.toLowerCase().replace(/[^\w]/g, '');
      const definition = mockDefinitions[normalizedWord] || `Definition for "${word}" would appear here in a real implementation.`;
      setWordDefinition(definition);
    } catch (error) {
      setWordDefinition(`Could not retrieve definition for "${word}".`);
    }
  };

  const renderInteractiveTranscript = (transcript: string) => {
    if (!transcript) return null;
    
    // Split transcript into words while preserving spaces and punctuation
    const words = transcript.split(/(\s+)/).filter(word => word.length > 0);
    
    return (
      <View style={styles.interactiveTranscriptContainer}>
        {words.map((word, index) => {
          // Check if it's a space or punctuation
          if (/^\s+$/.test(word)) {
            return <Text key={index} style={styles.transcriptText}>{word}</Text>;
          }
          
          // Render clickable word
          return (
            <TouchableOpacity 
              key={index} 
              onPress={() => handleWordSelect(word)}
              style={[
                styles.wordContainer,
                selectedWord === word && styles.selectedWord
              ]}
            >
              <Text 
                style={[
                  styles.transcriptText,
                  styles.interactiveWord,
                  selectedWord === word && styles.selectedWordText
                ]}
              >
                {word}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // Simulate fetching subtitles in different languages
  const fetchSubtitles = async (exerciseId: string) => {
    // In a real implementation, this would call an API to get subtitles
    // For now, we'll simulate with mock subtitles
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock subtitles for different languages
      const mockSubtitles: Record<string, string> = {
        'en': 'Hello, welcome to our language learning app. Today we will practice listening skills.',
        'es': 'Hola, bienvenido a nuestra aplicación de aprendizaje de idiomas. Hoy practicaremos habilidades de escucha.',
        'fr': 'Bonjour, bienvenue dans notre application d\'apprentissage des langues. Aujourd\'hui, nous allons pratiquer les compétences d\'écoute.',
        'de': 'Hallo, willkommen in unserer Sprachlern-App. Heute üben wir Hörfähigkeiten.',
        'it': 'Ciao, benvenuto nella nostra app di apprendimento linguistico. Oggi eserciteremo le abilità di ascolto.',
        'pt': 'Olá, bem-vindo ao nosso aplicativo de aprendizagem de idiomas. Hoje vamos praticar habilidades de escuta.',
        'ru': 'Привет, добро пожаловать в наше приложение для изучения языков. Сегодня мы будем практиковать навыки аудирования.',
        'zh': '你好，欢迎使用我们的语言学习应用程序。今天我们将 практикуем слушательные навыки.',
        'ja': 'こんにちは、言語学習アプリへようこそ。今日はリスニングスキルを練習します。',
        'ko': '안녕하세요, 우리 언어 학습 앱에 오신 것을 환영합니다. 오늘은 듣기 기술을 연습할 것입니다.',
      };
      
      setSubtitleContent(mockSubtitles);
    } catch (error) {
      console.error('Failed to fetch subtitles:', error);
    }
  };

  // Toggle bookmark for an exercise
  const toggleBookmark = (exerciseId: string) => {
    setBookmarkedExercises(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(exerciseId)) {
        newBookmarks.delete(exerciseId);
      } else {
        newBookmarks.add(exerciseId);
      }
      // In a real implementation, this would be saved to persistent storage or backend
      return newBookmarks;
    });
  };

  // Check if an exercise is bookmarked
  const isBookmarked = (exerciseId: string) => {
    return bookmarkedExercises.has(exerciseId);
  };

  // Download exercise for offline use
  const downloadExercise = async (exercise: ListeningExercise) => {
    setIsDownloading(prev => ({ ...prev, [exercise.id]: true }));
    
    try {
      // In a real implementation, this would download the audio file and transcript
      // For now, we'll simulate with a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add to downloaded exercises set
      setDownloadedExercises(prev => new Set(prev).add(exercise.id));
      
      // Show success message
      Alert.alert('Success', `${exercise.title} has been downloaded for offline use.`);
    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert('Error', `Failed to download ${exercise.title}. Please try again.`);
    } finally {
      setIsDownloading(prev => ({ ...prev, [exercise.id]: false }));
    }
  };

  // Check if an exercise is downloaded
  const isDownloaded = (exerciseId: string) => {
    return downloadedExercises.has(exerciseId);
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
                
                <View style={styles.pickerContainer}>
                  <Text style={styles.filterLabel}>Accent</Text>
                  <View style={styles.pickerWrapper}>
                    <RNPickerSelect
                      onValueChange={setSelectedAccent}
                      items={[
                        { label: 'All Accents', value: 'all' },
                        { label: 'American', value: 'American' },
                        { label: 'British', value: 'British' },
                        { label: 'Australian', value: 'Australian' },
                        { label: 'Canadian', value: 'Canadian' },
                        { label: 'Indian', value: 'Indian' },
                        { label: 'Irish', value: 'Irish' },
                        { label: 'Scottish', value: 'Scottish' },
                      ]}
                      style={pickerSelectStyles}
                      value={selectedAccent}
                      placeholder={{}}
                    />
                  </View>
                </View>
              </View>
              
              <View style={styles.filterRow}>
                <View style={styles.pickerContainer}>
                  <Text style={styles.filterLabel}>Your Proficiency</Text>
                  <View style={styles.pickerWrapper}>
                    <RNPickerSelect
                      onValueChange={setUserProficiency}
                      items={[
                        { label: 'Beginner', value: 'Beginner' },
                        { label: 'Elementary', value: 'Elementary' },
                        { label: 'Intermediate', value: 'Intermediate' },
                        { label: 'Upper Intermediate', value: 'Upper Intermediate' },
                        { label: 'Advanced', value: 'Advanced' },
                        { label: 'Proficient', value: 'Proficient' },
                      ]}
                      style={pickerSelectStyles}
                      value={userProficiency}
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
              <Button
                title={showBookmarkedOnly ? "Show All Exercises" : "Show Bookmarked Only"}
                onPress={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
                variant={showBookmarkedOnly ? "primary" : "outline"}
                style={styles.bookmarkFilterButton}
              />
            </View>
            
            {/* Exercise List */}
            <View style={styles.exercisesGrid}>
              {(showBookmarkedOnly ? exercises.filter(ex => isBookmarked(ex.id)) : exercises).map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  onPress={() => startListening(exercise)}
                  style={styles.exerciseCard}
                >
                  <Card>
                    <CardContent style={styles.exerciseContent}>
                      <View style={styles.exerciseHeaderTop}>
                        <Ionicons name="headset" size={32} color="#3B82F6" />
                        <View style={styles.headerActions}>
                          <Text style={styles.levelText}>{exercise.level}</Text>
                          <TouchableOpacity 
                            onPress={(e) => {
                              e.stopPropagation(); // Prevent card selection when bookmarking
                              toggleBookmark(exercise.id);
                            }}
                            style={styles.bookmarkButton}
                          >
                            <Ionicons 
                              name={isBookmarked(exercise.id) ? "bookmark" : "bookmark-outline"} 
                              size={24} 
                              color={isBookmarked(exercise.id) ? "#3B82F6" : "#94A3B8"} 
                            />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            onPress={(e) => {
                              e.stopPropagation(); // Prevent card selection when downloading
                              downloadExercise(exercise);
                            }}
                            style={styles.downloadButton}
                            disabled={isDownloading[exercise.id] || isDownloaded(exercise.id)}
                          >
                            {isDownloading[exercise.id] ? (
                              <ActivityIndicator size="small" color="#3B82F6" />
                            ) : (
                              <Ionicons 
                                name={isDownloaded(exercise.id) ? "cloud-download" : "cloud-download-outline"} 
                                size={24} 
                                color={isDownloaded(exercise.id) ? "#10B981" : "#3B82F6"} 
                              />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                      <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                      <Text style={styles.exerciseType}>{exercise.type.replace('_', ' ')}</Text>
                      {exercise.accent && (
                        <Text style={styles.exerciseAccent}>{exercise.accent} Accent</Text>
                      )}
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
            
            {/* Community Recommendations */}
            {recommendedExercises.length > 0 && (
              <View style={styles.recommendationsSection}>
                <View style={styles.recommendationsHeader}>
                  <Text style={styles.sectionTitle}>Recommended for You</Text>
                  <Text style={styles.recommendationsSubtitle}>
                    Based on your learning activity
                  </Text>
                </View>
                <View style={styles.recommendationsGrid}>
                  {recommendedExercises.map((exercise) => (
                    <TouchableOpacity
                      key={exercise.id}
                      onPress={() => startListening(exercise)}
                      style={styles.recommendationCard}
                    >
                      <Card>
                        <CardContent style={styles.recommendationContent}>
                          <View style={styles.recommendationHeader}>
                            <Ionicons name="people" size={20} color="#3B82F6" />
                            <Text style={styles.recommendationLevel}>{exercise.level}</Text>
                          </View>
                          <Text style={styles.recommendationTitle} numberOfLines={2}>
                            {exercise.title}
                          </Text>
                          <Text style={styles.recommendationType}>
                            {exercise.type.replace('_', ' ')}
                          </Text>
                          {exercise.accent && (
                            <Text style={styles.recommendationAccent}>
                              {exercise.accent} Accent
                            </Text>
                          )}
                          <View style={styles.recommendationFooter}>
                            <Text style={styles.recommendationDuration}>
                              {exercise.estimatedTime} min
                            </Text>
                          </View>
                        </CardContent>
                      </Card>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Listen Tab */}
        {activeTab === 'listen' && (
          <View style={styles.section}>
            {selectedExercise ? (
              <View style={styles.playerContainer}>
                {/* Results Display */}
                {showResults && gradingResult && (
                  <Card style={styles.resultsCard}>
                    <CardContent style={styles.resultsContent}>
                      <Text style={styles.resultsTitle}>Your Results</Text>
                      <Text style={styles.resultsDescription}>
                        Here&apos;s how you did on this exercise
                      </Text>
                      
                      <View style={styles.scoreGrid}>
                        <View style={styles.scoreItem}>
                          <Text style={[styles.scoreValue, { color: getScoreColor(gradingResult.percentage) }]}>
                            {gradingResult.percentage}%
                          </Text>
                          <Text style={styles.scoreLabel}>Score</Text>
                        </View>
                        <View style={styles.scoreItem}>
                          <Text style={[styles.scoreValue, { color: '#3B82F6' }]}>
                            {gradingResult.score}/{gradingResult.maxScore}
                          </Text>
                          <Text style={styles.scoreLabel}>Correct Points</Text>
                        </View>
                        <View style={styles.scoreItem}>
                          <Text style={[styles.scoreValue, { color: '#3B82F6' }]}>
                            {(selectedExercise.questions?.length || 0) + (selectedExercise.type === 'DICTATION' ? 1 : 0)}
                          </Text>
                          <Text style={styles.scoreLabel}>Total Tasks</Text>
                        </View>
                      </View>

                      {gradingResult.dictationAccuracy !== undefined && (
                        <View style={styles.dictationAccuracyContainer}>
                          <Text style={styles.dictationAccuracyTitle}>Dictation Accuracy</Text>
                          <View style={styles.dictationAccuracyContent}>
                            <Text style={[styles.dictationAccuracyValue, { color: getScoreColor(gradingResult.dictationAccuracy || 0) }]}>
                              {gradingResult.dictationAccuracy}%
                            </Text>
                            <Text style={styles.dictationAccuracyText}>{gradingResult.dictationFeedback}</Text>
                          </View>
                        </View>
                      )}

                      <View style={styles.questionReviewContainer}>
                        <Text style={styles.questionReviewTitle}>Question Review</Text>
                        {gradingResult.feedback.map((feedbackItem, index) => {
                          const question = selectedExercise.questions?.[index]
                          return (
                            <View key={feedbackItem.questionId} style={[
                              styles.feedbackItem, 
                              feedbackItem.isCorrect ? styles.correctFeedback : styles.incorrectFeedback
                            ]}>
                              <View style={styles.feedbackHeader}>
                                {feedbackItem.isCorrect ? (
                                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                ) : (
                                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                                )}
                                <Text style={styles.feedbackQuestionNumber}>{index + 1}.</Text>
                                <Text style={styles.feedbackQuestion} numberOfLines={2}>
                                  {question?.question}
                                </Text>
                              </View>
                              <View style={styles.feedbackContent}>
                                <View style={styles.feedbackRow}>
                                  <Text style={styles.feedbackLabel}>Your answer:</Text>
                                  <Text style={[
                                    styles.feedbackValue, 
                                    feedbackItem.isCorrect ? styles.correctAnswer : styles.incorrectAnswer
                                  ]}>
                                    {feedbackItem.userAnswer || "(No answer)"}
                                  </Text>
                                </View>
                                {!feedbackItem.isCorrect && (
                                  <View style={styles.feedbackRow}>
                                    <Text style={styles.feedbackLabel}>Correct answer:</Text>
                                    <Text style={styles.correctAnswer}>
                                      {Array.isArray(feedbackItem.correctAnswer) ? feedbackItem.correctAnswer.join(', ') : feedbackItem.correctAnswer}
                                    </Text>
                                  </View>
                                )}
                                {feedbackItem.explanation && (
                                  <View style={styles.explanationContainer}>
                                    <Text style={styles.explanationLabel}>Explanation:</Text>
                                    <Text style={styles.explanationText}>{feedbackItem.explanation}</Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>

                      <View style={styles.resultsButtonContainer}>
                        <Button
                          title="Review Exercise"
                          variant="outline"
                          onPress={() => {
                            setShowResults(false)
                            setGradingResult(null)
                          }}
                          style={styles.reviewButton}
                        />
                        <Button
                          title="Choose Different Exercise"
                          onPress={() => {
                            setShowResults(false)
                            setGradingResult(null)
                            setSelectedExercise(null)
                            setAnswers({})
                            setTranscription('')
                            setStartTime(null)
                          }}
                          style={styles.chooseExerciseButton}
                        />
                      </View>
                      <Text style={styles.resultsFooterNote}>
                        Review your results above. Click &quot;Choose Different Exercise&quot; to select another exercise.
                      </Text>
                    </CardContent>
                  </Card>
                )}

                {/* Exercise Header */}
                {!showResults && (
                  <Card style={styles.exerciseHeaderCard}>
                    <CardContent style={styles.exerciseHeaderContent}>
                      <View style={styles.exerciseHeaderTop}>
                        <Text style={styles.exerciseTitle}>{selectedExercise.title}</Text>
                        {isDownloaded(selectedExercise.id) && (
                          <View style={styles.offlineBadge}>
                            <Ionicons name="cloud-download" size={16} color="#FFFFFF" />
                            <Text style={styles.offlineBadgeText}>Offline</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseInfoText}>
                          {selectedExercise.topic?.name} • {selectedExercise.level} • 
                          {selectedExercise.estimatedTime} min
                          {selectedExercise.accent && ` • ${selectedExercise.accent} Accent`}
                        </Text>
                        {startTime && (
                          <Text style={styles.timerText}>
                            {formatTime(Date.now() - startTime)}
                          </Text>
                        )}
                      </View>
                    </CardContent>
                  </Card>
                )}
                
                {/* Audio Loading Indicator */}
                {isAudioLoading && (
                  <View style={styles.audioLoadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.audioLoadingText}>Generating audio...</Text>
                  </View>
                )}
                
                {/* Audio Player */}
                {!showResults && !isAudioLoading && (
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
                        <View style={styles.scriptControls}>
                          <Button
                            title={showScript ? 'Hide Transcript' : 'Show Transcript'}
                            variant="outline"
                            onPress={() => setShowScript(!showScript)}
                            style={styles.scriptButton}
                          />
                          
                          {/* Subtitle Language Selector */}
                          {showScript && (
                            <View style={styles.subtitleSelector}>
                              <Text style={styles.subtitleLabel}>Subtitle Language:</Text>
                              <RNPickerSelect
                                onValueChange={setSelectedSubtitleLanguage}
                                items={[
                                  { label: 'English', value: 'en' },
                                  { label: 'Spanish', value: 'es' },
                                  { label: 'French', value: 'fr' },
                                  { label: 'German', value: 'de' },
                                  { label: 'Italian', value: 'it' },
                                  { label: 'Portuguese', value: 'pt' },
                                  { label: 'Russian', value: 'ru' },
                                  { label: 'Chinese', value: 'zh' },
                                  { label: 'Japanese', value: 'ja' },
                                  { label: 'Korean', value: 'ko' },
                                ]}
                                style={pickerSelectStyles}
                                value={selectedSubtitleLanguage}
                                placeholder={{}}
                              />
                            </View>
                          )}
                        </View>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {/* Transcript */}
                {!showResults && !isAudioLoading && showScript && selectedExercise.audioScript && (
                  <Card>
                    <CardContent style={styles.transcriptContent}>
                      <Text style={styles.transcriptTitle}>Transcript</Text>
                      {renderInteractiveTranscript(subtitleContent[selectedSubtitleLanguage] || selectedExercise.audioScript)}
                      
                      {/* Word Definition Modal */}
                      {selectedWord && wordDefinition && (
                        <View style={styles.definitionModal}>
                          <View style={styles.definitionContent}>
                            <Text style={styles.definitionWord}>{selectedWord}</Text>
                            <Text style={styles.definitionText}>{wordDefinition}</Text>
                            <Button 
                              title="Close" 
                              onPress={() => {
                                setSelectedWord(null);
                                setWordDefinition(null);
                              }} 
                              style={styles.closeButton}
                            />
                          </View>
                        </View>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {/* Questions */}
                {!showResults && !isAudioLoading && selectedExercise.questions && selectedExercise.questions.length > 0 && (
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
                {!showResults && !isAudioLoading && selectedExercise.type === 'DICTATION' && (
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
                {!showResults && !isAudioLoading && (
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
                )}
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
            {/* Downloaded Exercises */}
            {downloadedExercises.size > 0 && (
              <View style={styles.downloadedSection}>
                <Text style={styles.sectionTitle}>Downloaded Exercises</Text>
                <Text style={styles.downloadedDescription}>
                  These exercises are available for offline practice
                </Text>
                <View style={styles.downloadedExercisesGrid}>
                  {exercises.filter(ex => isDownloaded(ex.id)).map((exercise) => (
                    <TouchableOpacity
                      key={exercise.id}
                      onPress={() => {
                        setActiveTab('listen');
                        startListening(exercise);
                      }}
                      style={styles.downloadedExerciseCard}
                    >
                      <Card>
                        <CardContent style={styles.downloadedExerciseContent}>
                          <View style={styles.downloadedExerciseHeader}>
                            <Ionicons name="headset" size={24} color="#3B82F6" />
                            <View style={styles.downloadedBadge}>
                              <Text style={styles.downloadedBadgeText}>Offline</Text>
                            </View>
                          </View>
                          <Text style={styles.downloadedExerciseTitle} numberOfLines={2}>
                            {exercise.title}
                          </Text>
                          <Text style={styles.downloadedExerciseType}>
                            {exercise.type.replace('_', ' ')}
                          </Text>
                          {exercise.accent && (
                            <Text style={styles.downloadedExerciseAccent}>
                              {exercise.accent} Accent
                            </Text>
                          )}
                        </CardContent>
                      </Card>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            {/* Bookmarked Exercises */}
            {bookmarkedExercises.size > 0 && (
              <View style={styles.bookmarkedSection}>
                <Text style={styles.sectionTitle}>Bookmarked Exercises</Text>
                <View style={styles.bookmarkedExercisesGrid}>
                  {exercises.filter(ex => isBookmarked(ex.id)).map((exercise) => (
                    <TouchableOpacity
                      key={exercise.id}
                      onPress={() => {
                        setActiveTab('listen');
                        startListening(exercise);
                      }}
                      style={styles.bookmarkedExerciseCard}
                    >
                      <Card>
                        <CardContent style={styles.bookmarkedExerciseContent}>
                          <View style={styles.bookmarkedExerciseHeader}>
                            <Ionicons name="headset" size={24} color="#3B82F6" />
                            <Ionicons 
                              name="bookmark" 
                              size={20} 
                              color="#3B82F6" 
                            />
                          </View>
                          <Text style={styles.bookmarkedExerciseTitle} numberOfLines={2}>
                            {exercise.title}
                          </Text>
                          <Text style={styles.bookmarkedExerciseType}>
                            {exercise.type.replace('_', ' ')}
                          </Text>
                        </CardContent>
                      </Card>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            {/* Previous Submissions */}
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
  // Audio loading styles
  audioLoadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 8,
  },
  audioLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
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
  bookmarkFilterButton: {
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
  exerciseHeaderContent: {
    padding: 16,
  },
  exerciseHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookmarkButton: {
    padding: 4,
  },
  downloadButton: {
    padding: 4,
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
  exerciseAccent: {
    fontSize: 12,
    color: '#8B5CF6',
    fontStyle: 'italic',
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
  scriptControls: {
    width: '100%',
  },
  subtitleSelector: {
    marginTop: 16,
  },
  subtitleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
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
  interactiveTranscriptContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  wordContainer: {
    borderRadius: 4,
  },
  interactiveWord: {
    textDecorationLine: 'underline',
  },
  selectedWord: {
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  selectedWordText: {
    color: '#FFFFFF',
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
  bookmarkedSection: {
    marginBottom: 24,
  },
  bookmarkedExercisesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bookmarkedExerciseCard: {
    width: '48%',
    marginBottom: 8,
  },
  bookmarkedExerciseContent: {
    padding: 12,
  },
  bookmarkedExerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookmarkedExerciseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  bookmarkedExerciseType: {
    fontSize: 12,
    color: '#3B82F6',
  },
  downloadedSection: {
    marginBottom: 24,
  },
  downloadedDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  downloadedExercisesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  downloadedExerciseCard: {
    width: '48%',
    marginBottom: 8,
  },
  downloadedExerciseContent: {
    padding: 12,
  },
  downloadedExerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  downloadedBadge: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  downloadedBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  downloadedExerciseTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  offlineBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  downloadedExerciseType: {
    fontSize: 12,
    color: '#3B82F6',
    marginBottom: 2,
  },
  downloadedExerciseAccent: {
    fontSize: 11,
    color: '#8B5CF6',
    fontStyle: 'italic',
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
  // Recommendations section styles
  recommendationsSection: {
    marginTop: 24,
  },
  recommendationsHeader: {
    marginBottom: 16,
  },
  recommendationsSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  recommendationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recommendationCard: {
    width: '48%',
    marginBottom: 8,
  },
  recommendationContent: {
    padding: 12,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationLevel: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  recommendationType: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  recommendationAccent: {
    fontSize: 11,
    color: '#8B5CF6',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  recommendationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendationDuration: {
    fontSize: 12,
    color: '#94A3B8',
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
    fontSize: 24,
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
  resultsCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  resultsContent: {
    padding: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  resultsDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  scoreGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  dictationAccuracyContainer: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  dictationAccuracyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  dictationAccuracyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dictationAccuracyValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 12,
  },
  dictationAccuracyText: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  questionReviewContainer: {
    marginBottom: 24,
  },
  questionReviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  feedbackItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  correctFeedback: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  incorrectFeedback: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  feedbackQuestionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginRight: 8,
  },
  feedbackQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  feedbackContent: {
    paddingLeft: 28,
  },
  feedbackRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  correctAnswer: {
    color: '#10B981',
  },
  incorrectAnswer: {
    color: '#EF4444',
  },
  explanationContainer: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  explanationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 14,
    color: '#1E293B',
  },
  resultsButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewButton: {
    flex: 1,
    marginRight: 8,
  },
  chooseExerciseButton: {
    flex: 1,
    marginLeft: 8,
  },
  resultsFooterNote: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 16,
  },
  closeButton: {
    marginTop: 16,
  },
  definitionModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  definitionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    maxWidth: '90%',
  },
  definitionWord: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  definitionText: {
    fontSize: 16,
    color: '#1E293B',
    lineHeight: 22,
    textAlign: 'center',
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