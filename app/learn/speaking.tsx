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
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { EncodingType, readAsStringAsync } from 'expo-file-system/legacy';

import { Card, CardContent, Button } from '@/components/ui';
import { learningApi, aiApi } from '@/lib/api';
import { ApiResponse } from '@/types';

// Import our new components
import PracticeTab from '@/components/speaking/PracticeTab';
import ProgressTab from '@/components/speaking/ProgressTab';
import ScenarioDetail from '@/components/speaking/ScenarioDetail';
import TabNavigation from '@/components/speaking/TabNavigation';
import LoadingComponent from '@/components/speaking/LoadingComponent';

// Import types
import { SpeakingScenario, Character, DialogueTurn, UserProgress, Feedback } from '../../types/speaking';

function SpeakingScreen() {
  const [scenarios, setScenarios] = useState<SpeakingScenario[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    completedScenarios: [],
    achievements: [],
    streak: 0,
    totalPracticeTime: 0,
    speakingSkills: {
      conversation: 0,
      pronunciation: 0,
      fluency: 0,
      vocabulary: 0
    },
    scenarioStats: {}
  });
  const [selectedScenario, setSelectedScenario] = useState<SpeakingScenario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'practice' | 'progress'>('practice');
  const [dialogueHistory, setDialogueHistory] = useState<DialogueTurn[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [animation] = useState(new Animated.Value(0));
  // Filter states
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  // Add recording state variables
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcription, setTranscription] = useState('');
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchScenarios();
    fetchUserProgress();
  }, [selectedLevel, selectedCategory, searchQuery]);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [dialogueHistory]);

  // Add error handling utilities at the top of the component
  const handleApiError = (error: any, operation: string) => {
    console.error(`API Error in ${operation}:`, error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error.response) {
      // Server responded with error status
      const statusCode = error.response.status;
      const responseData = error.response.data;
      
      if (statusCode === 401 || statusCode === 403) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (statusCode === 404) {
        errorMessage = 'The requested resource was not found.';
      } else if (statusCode >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = responseData?.message || responseData?.error || error.response.statusText || errorMessage;
      }
    } else if (error.request) {
      // Request was made but no response received
      if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
        errorMessage = 'Network connection failed. Please check your internet connection.';
      } else {
        errorMessage = 'Network error - please check your connection';
      }
    } else {
      // Something happened in setting up the request that triggered an Error
      errorMessage = error.message || errorMessage;
    }
    
    Alert.alert('Error', errorMessage);
    return errorMessage; // Return the error message
  };

  const fetchScenarios = async () => {
    setIsLoading(true);
    try {
      // Map filter parameters to API format
      const params: any = {
        pageSize: 20
      };
      
      // Add level filter if not 'all'
      if (selectedLevel !== 'all') {
        params.level = selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1);
      }
      
      // Add type filter based on category
      if (selectedCategory !== 'all') {
        // Map category to speaking type
        const categoryToTypeMap: Record<string, string> = {
          'conversation': 'CONVERSATION',
          'roleplay': 'CONVERSATION',
          'storytelling': 'STORY_TELLING',
          'shadow': 'PRONUNCIATION',
          'sentenceBuilder': 'PRONUNCIATION',
          'pronunciation': 'PRONUNCIATION',
          'dialogueCoach': 'CONVERSATION'
        };
        
        const type = categoryToTypeMap[selectedCategory];
        if (type) {
          params.type = type;
        }
      }
      
      // Add search query if provided
      if (searchQuery) {
        params.searchQuery = searchQuery;
      }
      
      // Call the real API
      const response = await learningApi.getSpeakingExercises(params);
      
      if (response.success && response.data) {
        // Handle pagination response structure
        let exercisesData: any[] = [];
        if (Array.isArray(response.data)) {
          exercisesData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          // Safely check for data property
          const dataObj = response.data as any;
          if (dataObj.data && Array.isArray(dataObj.data)) {
            exercisesData = dataObj.data;
          } else {
            exercisesData = [];
          }
        } else {
          exercisesData = [];
        }
        
        const mappedScenarios: SpeakingScenario[] = exercisesData.map((exercise: any) => {
          // Map exercise type to mobile scenario type
          let scenarioType: 'conversation' | 'roleplay' | 'storytelling' | 'shadow' | 'sentenceBuilder' | 'pronunciation' | 'dialogueCoach' = 'conversation';
          
          switch (exercise.type) {
            case 'CONVERSATION':
              scenarioType = exercise.title.toLowerCase().includes('interview') ? 'roleplay' : 'conversation';
              break;
            case 'STORY_TELLING':
              scenarioType = 'storytelling';
              break;
            case 'PRONUNCIATION':
              if (exercise.title.toLowerCase().includes('shadow') || exercise.title.toLowerCase().includes('read')) {
                scenarioType = 'shadow';
              } else if (exercise.title.toLowerCase().includes('sentence')) {
                scenarioType = 'sentenceBuilder';
              } else {
                scenarioType = 'pronunciation';
              }
              break;
            case 'PRESENTATION':
              scenarioType = 'roleplay';
              break;
            case 'IELTS_SPEAKING':
              scenarioType = 'roleplay';
              break;
            case 'DEBATE':
              scenarioType = 'dialogueCoach';
              break;
            default:
              scenarioType = 'conversation';
          }
          
          // Create characters for conversation-based scenarios
          let characters: Character[] | undefined;
          if (['conversation', 'roleplay', 'storytelling', 'dialogueCoach'].includes(scenarioType)) {
            characters = [{
              id: 'ai1',
              name: 'AI Assistant',
              personality: 'Helpful and encouraging',
              avatar: 'ai',
              greeting: exercise.instructions || 'Hello! Let\'s practice speaking together.',
              background: 'AI language learning assistant',
              interests: 'Language learning, education, communication'
            }];
          }
          
          return {
            id: exercise.id,
            title: exercise.title,
            description: exercise.description || exercise.instructions || 'Practice speaking exercise',
            type: scenarioType,
            level: exercise.level?.toLowerCase() || 'beginner',
            estimatedTime: exercise.estimatedTime || 5,
            category: selectedCategory !== 'all' ? selectedCategory : 'conversation',
            isOfflineAvailable: false, // Will be set based on actual offline status
            content: exercise.passage || exercise.audioScript,
            culturalContext: exercise.topic ? `Topic: ${exercise.topic.name}` : undefined,
            characters,
            wordBank: scenarioType === 'sentenceBuilder' && exercise.passage 
              ? exercise.passage.split(/\s+/).filter((word: string) => word.trim() !== '') 
              : undefined
          };
        });
        
        setScenarios(mappedScenarios);
      } else {
        throw new Error(response.error || 'Failed to fetch speaking exercises');
      }
    } catch (error: any) {
      const errorMessage = handleApiError(error, 'fetching speaking scenarios');
      console.error('Failed to fetch scenarios:', error);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    try {
      // Fetch user's speaking submissions to calculate progress
      const response = await learningApi.getSpeakingSubmissions();
      
      if (response.success && response.data) {
        // Handle pagination response structure
        let submissionsData: any[] = [];
        if (Array.isArray(response.data)) {
          submissionsData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          // Safely check for data property
          const dataObj = response.data as any;
          if (dataObj.data && Array.isArray(dataObj.data)) {
            submissionsData = dataObj.data;
          } else {
            submissionsData = [];
          }
        } else {
          submissionsData = [];
        }
        
        // Calculate completed scenarios
        const completedScenarios = submissionsData.map((sub: any) => sub.exerciseId);
        
        // Calculate total practice time (estimated from submissions)
        const totalPracticeTime = submissionsData.length * 5; // Assuming 5 minutes per exercise on average
        
        // Calculate streak (simplified - in a real app, this would come from a dedicated API)
        const streak = Math.min(submissionsData.length, 7);
        
        // Calculate skill levels based on submission scores
        let conversationScore = 0;
        let pronunciationScore = 0;
        let fluencyScore = 0;
        let vocabularyScore = 0;
        let totalConversation = 0;
        let totalPronunciation = 0;
        let totalFluency = 0;
        let totalVocabulary = 0;
        
        // Scenario stats
        const scenarioStats: Record<string, any> = {};
        
        submissionsData.forEach((sub: any) => {
          if (sub.overallScore !== undefined) {
            // For simplicity, we'll distribute the overall score across all skills
            const distributedScore = sub.overallScore / 4;
            conversationScore += distributedScore;
            pronunciationScore += distributedScore;
            fluencyScore += distributedScore;
            vocabularyScore += distributedScore;
            
            totalConversation++;
            totalPronunciation++;
            totalFluency++;
            totalVocabulary++;
            
            scenarioStats[sub.exerciseId] = {
              completed: true,
              score: sub.overallScore,
              attempts: 1,
              lastPracticed: new Date(sub.createdAt)
            };
          }
        });
        
        // Calculate average scores
        const conversation = totalConversation > 0 ? Math.round(conversationScore / totalConversation) : 50;
        const pronunciation = totalPronunciation > 0 ? Math.round(pronunciationScore / totalPronunciation) : 50;
        const fluency = totalFluency > 0 ? Math.round(fluencyScore / totalFluency) : 50;
        const vocabulary = totalVocabulary > 0 ? Math.round(vocabularyScore / totalVocabulary) : 50;
        
        setUserProgress({
          completedScenarios,
          achievements: [], // Will be populated from achievements API
          streak,
          totalPracticeTime,
          speakingSkills: {
            conversation,
            pronunciation,
            fluency,
            vocabulary
          },
          scenarioStats
        });
      } else {
        throw new Error(response.error || 'Failed to fetch user progress');
      }
    } catch (error: any) {
      handleApiError(error, 'fetching user progress');
      // Set default values if API call fails
      setUserProgress({
        completedScenarios: [],
        achievements: [],
        streak: 0,
        totalPracticeTime: 0,
        speakingSkills: {
          conversation: 50,
          pronunciation: 50,
          fluency: 50,
          vocabulary: 50
        },
        scenarioStats: {}
      });
    }
  };

  const handleUserInput = (input: string) => {
    setUserInput(input);
  };

  const handleSend = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      // Create a proper DialogueTurn object with all required properties
      const userTurn: DialogueTurn = {
        id: `user-${Date.now()}`,
        speaker: 'user',
        text: userInput,
        timestamp: Date.now()
      };

      setDialogueHistory((prev) => [...prev, userTurn]);
      
      // Clear input and feedback
      setUserInput('');
      setFeedback(null);
    } catch (error) {
      handleApiError(error, 'sending user input');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFeedback = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      // Create mock feedback since we don't have the proper API endpoint
      const mockFeedback: Feedback = {
        grammar: ['Good sentence structure'],
        vocabulary: ['Nice vocabulary choice'],
        suggestions: ['Try to speak more clearly'],
        score: 80
      };

      setFeedback(mockFeedback);
    } catch (error) {
      handleApiError(error, 'getting feedback');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWordDeselect = (word: string) => {
    setSelectedWords((prev) => prev.filter((w) => w !== word));
  };

  const handleStartRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);

      const intervalId = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000) as unknown as NodeJS.Timeout;
      
      recordingIntervalRef.current = intervalId;
    } catch (error) {
      handleApiError(error, 'starting recording');
    }
  };

  const handleStopRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();

        const uri = recording.getURI();
        if (uri) {
          setRecordedUri(uri);
        }

        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
        setRecordingTime(0);

        setIsRecording(false);

        // Transcribe the audio
        if (uri) {
          const transcription = await transcribeAudio(uri);
          setTranscription(transcription);
        }
      }
    } catch (error) {
      handleApiError(error, 'stopping recording');
    }
  };

  const transcribeAudio = async (uri: string) => {
    try {
      // Read the file and convert to base64
      const base64Data = await readAsStringAsync(uri, {
        encoding: EncodingType.Base64
      });
      
      // Prepare data for transcription
      const data = {
        file: base64Data,
        fileName: 'recording.m4a',
        fileType: 'audio/m4a'
      };

      // Submit to AI service for transcription
      const response = await aiApi.transcribeAudio(data);
      
      if (response.success && response.data) {
        // Fix the type issue by accessing the text property correctly
        const data = response.data as { text?: string };
        return data.text || '';
      } else {
        throw new Error(response.error || 'Transcription failed');
      }
    } catch (error: any) {
      handleApiError(error, 'transcribing audio');
      return '';
    }
  };

  const handlePlayRecording = async () => {
    try {
      if (recordedUri) {
        const { sound } = await Audio.Sound.createAsync({ uri: recordedUri });
        await sound.playAsync();
      }
    } catch (error) {
      handleApiError(error, 'playing recording');
    }
  };

  const handleDeleteRecording = () => {
    setRecording(null);
    setRecordedUri(null);
    setRecordingTime(0);
    setTranscription('');
  };

  const handleSaveRecording = async () => {
    try {
      if (recordedUri) {
        // Use the correct API method for submitting speaking recordings
        const response = await learningApi.submitSpeakingRecording(
          selectedScenario?.id || '', 
          recordedUri
        );

        Alert.alert('Success', 'Recording saved successfully!');
      }
    } catch (error: any) {
      const errorMessage = handleApiError(error, 'saving recording');
      Alert.alert('Error', errorMessage);
      return errorMessage;
    }
  };

  const handleSelectScenario = (scenario: SpeakingScenario) => {
    setSelectedScenario(scenario);
    setDialogueHistory([]);
    setUserInput('');
    setFeedback(null);
    setSelectedWords([]);
    
    // Initialize the scenario based on type
    if ((scenario.type === 'conversation' || scenario.type === 'roleplay' || scenario.type === 'storytelling' || scenario.type === 'dialogueCoach') && scenario.characters && scenario.characters.length > 0) {
      setDialogueHistory([
        {
          id: '1',
          speaker: 'ai',
          text: scenario.characters[0].greeting,
          timestamp: Date.now()
        }
      ]);
    } else if (scenario.type === 'shadow') {
      setDialogueHistory([
        {
          id: '1',
          speaker: 'narrator',
          text: 'Read the following passage aloud, focusing on rhythm and intonation:',
          timestamp: Date.now()
        },
        {
          id: '2',
          speaker: 'ai',
          text: scenario.content || '',
          timestamp: Date.now()
        }
      ]);
    } else if (scenario.type === 'pronunciation') {
      setDialogueHistory([
        {
          id: '1',
          speaker: 'narrator',
          text: 'Practice pronouncing the following sentence:',
          timestamp: Date.now()
        },
        {
          id: '2',
          speaker: 'ai',
          text: scenario.content || '',
          timestamp: Date.now()
        }
      ]);
    }
  };

  const getSuggestions = (userText: string): string[] => {
    // Provide real-time suggestions for dialogue coaching
    const suggestions = [
      "Try asking a follow-up question to keep the conversation flowing.",
      "Use transition words like 'however' or 'additionally' to connect ideas.",
      "Consider using more descriptive vocabulary to express your ideas clearly.",
      "Rephrase your sentence to make it more natural and conversational.",
      "Add specific examples to support your point.",
      "Use appropriate tone and register for the context.",
      "Include polite expressions like 'please' or 'thank you' when appropriate.",
      "Vary your sentence structures to make your speech more engaging."
    ];
    
    // Return a few random suggestions
    const shuffled = [...suggestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

  const getStorytellingPrompt = (storyContext: string): string => {
    const prompts = [
      `Continue the story: ${storyContext} What happens next?`,
      `Add a new character to the story: ${storyContext} Who appears and why?`,
      `Create a plot twist: ${storyContext} What unexpected event occurs?`,
      `Develop the setting: ${storyContext} Describe the environment in more detail.`,
      `Deepen character development: ${storyContext} What are the character's motivations?`,
      `Introduce a conflict: ${storyContext} What challenge arises?`,
      `Resolve a subplot: ${storyContext} How is this subplot concluded?`,
      `Foreshadow future events: ${storyContext} What hints about the future appear?`
    ];
    
    const randomIndex = Math.floor(Math.random() * prompts.length);
    return prompts[randomIndex];
  };

  // Enhanced handleUserResponse with better error handling
  const handleUserResponse = async () => {
    if (!userInput.trim() || !selectedScenario || isProcessing) return;
    
    setIsProcessing(true);
    
    // Add user input to dialogue history
    const newUserTurn: DialogueTurn = {
      id: `${dialogueHistory.length + 1}`,
      speaker: 'user',
      text: userInput,
      timestamp: Date.now()
    };
    
    setDialogueHistory(prev => [...prev, newUserTurn]);
    
    try {
      // In a real implementation, this would call the AI service for analysis
      // For now, we'll simulate AI response and feedback using the real API
      
      // Submit the user's response to the AI for analysis
      // This would typically involve:
      // 1. Converting speech to text (if using voice input)
      // 2. Analyzing pronunciation, fluency, vocabulary, grammar

      // 3. Generating feedback and scores
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate response based on scenario type
      let aiResponse: DialogueTurn | null = null;
      let newFeedback: Feedback | null = null;
      
      // For demonstration, we'll create mock feedback based on the user's input

      // In a real implementation, this would come from the AI analysis API
      const grammarIssues = checkGrammar(userInput);
      const suggestions = getSuggestions(userInput);
      
      // Calculate a mock score based on input quality
      const wordCount = userInput.trim().split(/\s+/).length;
      const hasPunctuation = /[.!?]/.test(userInput);
      const hasCapitalization = /[A-Z]/.test(userInput);
      const mockScore = Math.min(100, Math.max(30, 
        (wordCount * 5) + 
        (hasPunctuation ? 10 : 0) + 
        (hasCapitalization ? 10 : 0) +
        (grammarIssues.length === 0 ? 20 : 0)
      ));
      
      newFeedback = {
        grammar: grammarIssues.length > 0 ? grammarIssues : ['Good sentence structure'],
        vocabulary: ['Nice vocabulary choice', 'Consider using more varied expressions'],
        suggestions: suggestions,
        score: mockScore
      };
      
      // Generate AI response based on scenario type using the new AI service
      if (selectedScenario.type === 'conversation' || selectedScenario.type === 'roleplay') {
        const options = getBranchingOptions(selectedScenario.type, userInput);
        const aiText = await getAIResponse(selectedScenario.type, userInput);
        aiResponse = {
          id: `${dialogueHistory.length + 2}`,
          speaker: 'ai',
          text: aiText,
          options: options,
          timestamp: Date.now()
        };
      } else if (selectedScenario.type === 'storytelling') {
        const options = getBranchingOptions('storytelling', userInput);
        const aiText = await getAIResponse('storytelling', userInput);
        aiResponse = {
          id: `${dialogueHistory.length + 2}`,
          speaker: 'ai',
          text: `That's an interesting addition to our story! ${aiText}`,
          options: options,
          timestamp: Date.now()
        };
      } else if (selectedScenario.type === 'dialogueCoach') {
        // Provide comprehensive feedback for dialogue coach
        const options = getBranchingOptions('dialogueCoach', userInput);
        const aiText = await getAIResponse('dialogueCoach', userInput);
        aiResponse = {
          id: `${dialogueHistory.length + 2}`,
          speaker: 'ai',
          text: `Great response! ${aiText}`,
          options: options,
          timestamp: Date.now()
        };
      } else if (selectedScenario.type === 'pronunciation') {
        // For pronunciation practice, provide feedback
        newFeedback = {
          grammar: [],
          vocabulary: [],
          suggestions: ['Try to emphasize the sounds more clearly', 'Work on the rhythm of the sentence'],
          score: 70
        };
        
        aiResponse = {
          id: `${dialogueHistory.length + 2}`,
          speaker: 'narrator',
          text: 'Good attempt! Focus on the pronunciation of each sound.',
          timestamp: Date.now()
        };
      } else if (selectedScenario.type === 'shadow') {
        aiResponse = {
          id: `${dialogueHistory.length + 2}`,
          speaker: 'narrator',
          text: 'Good job following along! Try to match the rhythm and intonation more closely next time.',
          timestamp: Date.now()
        };
      } else if (selectedScenario.type === 'sentenceBuilder') {
        aiResponse = {
          id: `${dialogueHistory.length + 2}`,
          speaker: 'narrator',
          text: 'Well constructed sentence! Try to make it more complex next time.',
          timestamp: Date.now()
        };
      }
      
      if (aiResponse) {
        setDialogueHistory(prev => [...prev, aiResponse!]);
      }
      
      if (newFeedback) {
        setFeedback(newFeedback);
        // Trigger animation for feedback
        Animated.sequence([
          Animated.timing(animation, {
            toValue: 1,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true
          }),
          Animated.timing(animation, {
            toValue: 0,
            duration: 300,
            delay: 2000,
            easing: Easing.ease,
            useNativeDriver: true
          })
        ]).start();
      }
      
      setUserInput('');
      setIsProcessing(false);
    } catch (error: any) {
      const errorMessage = handleApiError(error, 'processing user response');
      console.error('Failed to get AI response:', error);
      Alert.alert('Error', errorMessage);
      setIsProcessing(false);
    }
  };

  const getSimulatedAIResponse = (type: string, userText: string): string => {
    // This is a simplified simulation - in reality, this would call the AI service
    const responses = {
      conversation: [
        "That's interesting! Tell me more about that.",
        "I see. How does that make you feel?",
        "Thanks for sharing. What else would you like to discuss?",
        "I understand. Is there anything specific you'd like help with?"
      ],
      roleplay: [
        "Good point. Let's move on to the next agenda item.",
        "I appreciate that perspective. What do others think?",
        "That's a valid concern. How do you propose we address it?",
        "Excellent suggestion. Let's add that to our action items.",
        "Let's take a five-minute break and then continue with the budget review.",
        "I'd like to hear from the marketing team on this matter.",
        "Can you elaborate on that strategy?",
        "That aligns well with our quarterly objectives.",
        "What metrics will we use to measure success?",
        "Let's schedule a follow-up meeting to discuss implementation."
      ],
      storytelling: [
        "What an interesting development! How do you think the story should continue?",
        "I hadn't considered that angle. What happens next?",
        "That adds a new dimension to the story. How does the character react?",
        "What a twist! Where do you want to take the story from here?",
        "The tension is building! What challenge will the protagonist face next?",
        "I love that character development. How does it affect the plot?",
        "The setting you've described is vivid. What details make it special?",
        "That's a compelling conflict. How will it be resolved?"
      ],
      dialogueCoach: [
        "That's a thoughtful response. How might you expand on that idea?",
        "Interesting perspective. What makes you think that way?",
        "I appreciate your honesty. How do you usually handle similar situations?",
        "That's a great observation. What would be the next step?",
        "Your point is well-taken. Could you provide an example?",
        "That's a nuanced view. What influenced your thinking?",
        "I see your reasoning. What alternatives have you considered?",
        "That's an insightful comment. How does it connect to the broader topic?"
      ]
    };
    
    const responsePool = responses[type as keyof typeof responses] || responses.conversation;
    const randomIndex = Math.floor(Math.random() * responsePool.length);
    return responsePool[randomIndex];
  };

  // New function to get AI-generated response using the AI utilities service
  const getAIResponse = async (type: string, userText: string): Promise<string> => {
    // Use real AI service instead of simulation
    try {
      if (!selectedScenario) {
        // Fallback to simulated responses if no scenario is selected
        return getSimulatedAIResponse(type, userText);
      }

      // Prepare the request data for the AI service
      const requestData = {
        user_input: userText,
        exercise_type: type,
        exercise_topic: selectedScenario.title,
        level: selectedScenario.level || 'intermediate',
        language: 'en', // Default to English, could be based on user settings
        previous_context: dialogueHistory.slice(-3).map(turn => ({
          speaker: turn.speaker,
          text: turn.text
        }))
      };

      // Call the AI service to generate a response
      const response = await aiApi.generateSpeakingResponse(requestData);
      
      if (response.success && response.data) {
        // Check if response.data has a response property or is a string
        if (typeof response.data === 'string') {
          return response.data;
        } else if (typeof response.data === 'object' && response.data.hasOwnProperty('response')) {
          return (response.data as any).response;
        } else {
          // If we can't determine the structure, convert to string
          return JSON.stringify(response.data);
        }
      } else {
        throw new Error(response.error || 'Failed to generate AI response');
      }
    } catch (error) {
      console.error('AI response generation failed:', error);
      // Fallback to simulated responses if AI service fails
      return getSimulatedAIResponse(type, userText);
    }
  };

  // Audio recording functions
  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Microphone permission is required to record audio.');
        return;
      }

      // Set up recording
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

      // Start recording timer
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000) as unknown as NodeJS.Timeout;
    } catch (error) {
      console.error('Failed to start recording', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      // Stop recording timer
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        setRecordedUri(uri);
        setIsRecording(false);
        setRecording(null);
        
        // Automatically submit the recording for transcription
        await submitRecordingForTranscription(uri);
      } else {
        throw new Error('No recording URI available');
      }
    } catch (error) {
      console.error('Failed to stop recording', error);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
      setIsRecording(false);
    }
  };

  const submitRecordingForTranscription = async (uri: string) => {
    if (!selectedScenario) return;

    setIsProcessing(true);
    try {
      // Read the file and convert to base64 using the new API
      const base64Data = await readAsStringAsync(uri, {
        encoding: EncodingType.Base64
      });
      
      // Prepare data for transcription
      const data = {
        file: base64Data,
        fileName: 'recording.m4a',
        fileType: 'audio/m4a'
      };

      console.log('Submitting recording for transcription');
      
      // Submit to AI service for transcription
      const response = await aiApi.transcribeAudio(data);
      
      console.log('Transcription response:', response);
      
      if (response.success && response.data) {
        // Fix the type issue by accessing the text property correctly
        const data = response.data as { text?: string };
        const transcriptionText = data.text || '';
        setTranscription(transcriptionText);
        setUserInput(transcriptionText);
        
        // Process the transcribed text
        await handleUserResponse();
      } else {
        throw new Error(response.error || 'Transcription failed');
      }
    } catch (error: any) {
      console.error('Transcription failed', error);
      let errorMessage = 'Failed to transcribe audio. Please try again.';
      
      // Handle specific error cases
      if (error.message) {
        errorMessage = error.message;
      }
      
      if (error.response) {
        console.log('Error response:', error.response);
        errorMessage = `Server error: ${error.response.status}`;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getBranchingOptions = (type: string, userText: string): string[] => {
    // Provide branching dialogue options based on scenario type
    const options = {
      conversation: [
        "I'd like to talk about something else.",
        "Can you tell me more about that?",
        "How does this relate to what we discussed earlier?",
        "What do you think about this topic?"
      ],
      roleplay: [
        "Let's move to the next agenda item.",
        "I need clarification on that point.",
        "How does this align with our objectives?",
        "What are the potential risks?"
      ],
      storytelling: [
        "The character faces a new challenge.",
        "The setting changes dramatically.",
        "A new character is introduced.",
        "The conflict intensifies."
      ],
      dialogueCoach: [
        "Can you help me rephrase that?",
        "What would be a better way to say this?",
        "How can I make this more natural?",
        "What vocabulary should I use here?"
      ]
    };
    
    return options[type as keyof typeof options] || options.conversation;
  };

  const handleWordSelect = (word: string) => {
    if (selectedScenario?.type === 'sentenceBuilder') {
      if (selectedWords.includes(word)) {
        setSelectedWords(selectedWords.filter(w => w !== word));
      } else {
        setSelectedWords([...selectedWords, word]);
      }
    }
  };

  const handleSentenceSubmit = () => {
    if (selectedWords.length === 0) return;
    
    const sentence = selectedWords.join(' ');
    setUserInput(sentence);
    setSelectedWords([]);
  };

  const handlePronunciationPlay = () => {
    // In a real implementation, this would play TTS
    Alert.alert(
      'Pronunciation Guide', 
      'In a real app, this would play the text-to-speech pronunciation with visual feedback on mouth shapes.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const renderMouthShape = (soundType: string) => {
    // Simplified visual feedback for pronunciation
    const shapes = {
      'th': 'θ', // Theta symbol for "th" sounds
      's': 's',  // S sound
      'sh': 'ʃ', // Sh sound
      'r': 'ɹ',  // R sound
      'l': 'l',  // L sound
      'default': '○' // Default mouth shape
    };
    
    return shapes[soundType as keyof typeof shapes] || shapes.default;
  };

  const handleOptionSelect = (option: string) => {
    setUserInput(option);
  };

  const formatTime = (minutes: number) => {
    return `${minutes} min`;
  };

  const getScenarioIcon = (type: string) => {
    switch (type) {
      case 'conversation': return 'chatbubbles';
      case 'roleplay': return 'people';
      case 'storytelling': return 'book';
      case 'shadow': return 'mic';
      case 'sentenceBuilder': return 'construct';
      case 'pronunciation': return 'volume-high';
      case 'dialogueCoach': return 'school';
      default: return 'mic';
    }
  };

  const handleShadowSpeakingStart = () => {
    // In shadow speaking mode, we don't record but provide visual feedback
    Alert.alert(
      'Shadow Speaking',
      'Read along with the text, focusing on rhythm and intonation. No recording is needed.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const getRhythmPattern = (text: string): number[] => {
    // Simplified rhythm pattern based on sentence structure
    const words = text.split(' ');
    return words.map((_, index) => (index % 4 === 0 ? 2 : index % 2 === 0 ? 1 : 0));
  };

  const checkGrammar = (sentence: string): string[] => {
    // Simplified grammar checking
    const issues: string[] = [];
    
    if (sentence.split(' ').length < 3) {
      issues.push('Sentence is too short. Try to make it more complete.');
    }
    
    if (!sentence.includes('.') && !sentence.includes('?') && !sentence.includes('!')) {
      issues.push('Missing punctuation at the end of the sentence.');
    }
    
    if (sentence.split(' ').length > 20) {
      issues.push('Sentence is quite long. Consider breaking it into shorter sentences.');
    }
    
    return issues;
  };

  const generateDetailedFeedback = (userInput: string, scenario: SpeakingScenario): Feedback => {
    const feedback: Feedback = {
      grammar: [],
      vocabulary: [],
      suggestions: [],
      score: 0
    };

    // Grammar checks
    feedback.grammar = checkGrammar(userInput);

    // Vocabulary checks
    const words = userInput.toLowerCase().split(/\s+/);
    const advancedVocabulary = ['elaborate', 'comprehensive', 'exceptional', 'extraordinary', 'fascinating', 'significant', 'crucial', 'essential'];
    const basicVocabulary = ['good', 'bad', 'big', 'small', 'nice', 'thing', 'stuff'];

    const hasAdvancedVocab = words.some(word => advancedVocabulary.includes(word));
    const hasBasicVocab = words.some(word => basicVocabulary.includes(word));

    if (hasAdvancedVocab) {
      feedback.vocabulary.push('Great use of advanced vocabulary!');
    } else if (hasBasicVocab) {
      feedback.vocabulary.push('Consider using more varied vocabulary to express your ideas.');
    } else {
      feedback.vocabulary.push('Good vocabulary selection.');
    }

    // Suggestions based on scenario type
    if (scenario.type === 'conversation') {
      feedback.suggestions.push('Try asking follow-up questions to keep the conversation flowing.');
      feedback.suggestions.push('Use transition phrases like "That reminds me" or "Speaking of that" to connect topics.');
    } else if (scenario.type === 'roleplay') {
      feedback.suggestions.push('Use more formal language appropriate for business settings.');
      feedback.suggestions.push('Include specific examples to support your points.');
    } else if (scenario.type === 'storytelling') {
      feedback.suggestions.push('Add descriptive details to make your story more engaging.');
      feedback.suggestions.push('Use sensory language to help listeners visualize the scene.');
    } else if (scenario.type === 'sentenceBuilder') {
      feedback.suggestions.push('Try rearranging the words to create different sentence structures.');
    } else if (scenario.type === 'pronunciation') {
      feedback.suggestions.push('Focus on the rhythm and stress patterns of the sentence.');
    } else if (scenario.type === 'dialogueCoach') {
      feedback.suggestions.push('Consider alternative phrasings for more natural expression.');
    }

    // Integration with vocabulary module
    // In a real implementation, this would check against the user's vocabulary learning progress
    const vocabularyWords = ['elaborate', 'comprehensive', 'exceptional', 'extraordinary', 'fascinating'];
    const knownWords = words.filter(word => vocabularyWords.includes(word));
    
    if (knownWords.length > 0) {
      feedback.vocabulary.push(`You used vocabulary words you've learned: ${knownWords.join(', ')}`);
    }

    // Integration with grammar module
    // In a real implementation, this would check against the user's grammar learning progress
    const grammarPatterns = ['conditional', 'passive voice', 'complex sentence'];
    
    if (userInput.includes('if') && userInput.includes('would')) {
      feedback.grammar.push('Good use of conditional grammar pattern!');
    }
    
    if (userInput.includes('by') && (userInput.includes('was') || userInput.includes('were'))) {
      feedback.grammar.push('Good use of passive voice pattern!');
    }

    // Calculate score
    let score = 100;
    score -= feedback.grammar.length * 10;
    score -= (feedback.vocabulary.length - 1) * 5; // Don't penalize for positive feedback
    score = Math.max(0, score);
    feedback.score = score;

    return feedback;
  };

  // Function to update user progress in vocabulary and grammar modules
  const updateLearningModules = (userInput: string, feedback: Feedback) => {
    // In a real implementation, this would update the user's progress in vocabulary and grammar modules
    console.log('Updating vocabulary and grammar modules with user input:', userInput);
    console.log('Feedback:', feedback);
    
    // Example of how this might work:
    // vocabularyApi.updateProgress(userInput, feedback.vocabulary);
    // grammarApi.updateProgress(userInput, feedback.grammar);
  };


  const getFeedbackColor = (score: number) => {
    if (score >= 90) return '#10B981'; // green-500
    if (score >= 80) return '#3B82F6'; // blue-500
    if (score >= 70) return '#F59E0B'; // amber-500
    return '#EF4444'; // red-500
  };

  const getFeedbackMessage = (score: number) => {
    if (score >= 90) return "Excellent work!";
    if (score >= 80) return "Good job!";
    if (score >= 70) return "Not bad, but there's room for improvement.";
    return "Keep practicing to improve your skills.";
  };

  const getFeedbackDetails = (feedback: Feedback) => {
    const details = [];
    if (feedback.grammar.length > 0) {
      details.push(`Grammar issues: ${feedback.grammar.length}`);
    }
    if (feedback.vocabulary.length > 0) {
      details.push(`Vocabulary notes: ${feedback.vocabulary.length}`);
    }
    if (feedback.suggestions.length > 0) {
      details.push(`Suggestions: ${feedback.suggestions.length}`);
    }
    return details.join(', ');
  };

  const saveScenarioForOffline = async (scenario: SpeakingScenario) => {
    try {
      // In a real implementation, this would save the scenario to local storage
      // and potentially download any required assets (audio files, etc.)
      
      // For now, we'll just update the state to indicate it's available offline
      // In a production app, you would use AsyncStorage or another storage solution
      
      // Update the scenario state
      if (selectedScenario && selectedScenario.id === scenario.id) {
        setSelectedScenario({...scenario, isOfflineAvailable: true});
      }
      
      // Also update in the scenarios list
      setScenarios(prevScenarios => 
        prevScenarios.map(s => s.id === scenario.id ? {...s, isOfflineAvailable: true} : s)
      );
      
      Alert.alert(
        'Offline Mode', 
        `${scenario.title} has been marked for offline practice. In a production app, this would download the content for offline use.`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error: any) {
      const errorMessage = handleApiError(error, 'saving scenario for offline use');
      console.error('Failed to save scenario for offline use:', error);
      Alert.alert('Error', errorMessage);
    }
  };

  const loadOfflineScenarios = async () => {
    try {
      // In a real implementation, this would load scenarios from local storage
      // For now, we'll just return scenarios that are marked as offline available
      
      // In a production app, you would use AsyncStorage or another storage solution:
      // const offlineScenarios = await AsyncStorage.getItem('offlineSpeakingScenarios');
      // return offlineScenarios ? JSON.parse(offlineScenarios) : [];
      
      // For now, return scenarios that are marked as offline available
      return scenarios.filter(scenario => scenario.isOfflineAvailable);
    } catch (error: any) {
      const errorMessage = handleApiError(error, 'loading offline scenarios');
      console.error('Failed to load offline scenarios:', error);
      Alert.alert('Error', errorMessage);
      return [];
    }
  };

  const checkAchievements = (scenario: SpeakingScenario, score: number) => {
    const newAchievements: string[] = [];
    
    // Check for scenario completion achievements
    if (scenario.type === 'conversation' && score >= 80) {
      newAchievements.push('conversation_master');
    }
    
    if (scenario.type === 'pronunciation' && score >= 85) {
      newAchievements.push('pronunciation_expert');
    }
    
    if (scenario.type === 'storytelling') {
      newAchievements.push('creative_storyteller');
    }
    
    // Check for streak achievements
    if (userProgress.streak >= 7) {
      newAchievements.push('week_streak');
    }
    
    if (userProgress.streak >= 30) {
      newAchievements.push('month_streak');
    }
    
    // Check for practice time achievements
    if (userProgress.totalPracticeTime >= 60) {
      newAchievements.push('hour_practitioner');
    }
    
    if (userProgress.totalPracticeTime >= 300) {
      newAchievements.push('five_hour_expert');
    }
    
    return newAchievements;
  };

  const getAdaptiveScenario = (userProgress: UserProgress, preferredLevel: string): string => {
    // Determine the appropriate difficulty level based on user performance
    const avgScore = Object.values(userProgress.scenarioStats)
      .filter(stat => stat.completed)
      .reduce((sum, stat) => sum + stat.score, 0) / 
      Object.values(userProgress.scenarioStats).filter(stat => stat.completed).length || 0;
    
    if (avgScore >= 85) {
      return 'Advanced';
    } else if (avgScore >= 70) {
      return 'Intermediate';
    } else {
      return 'Beginner';
    }
  };

  const getSuggestedScenarios = (userProgress: UserProgress): SpeakingScenario[] => {
    // Suggest scenarios based on user's weak areas
    const weakSkills = Object.entries(userProgress.speakingSkills)
      .filter(([skill, score]) => score < 70)
      .map(([skill]) => skill);
    
    // Filter scenarios that target weak skills
    return scenarios.filter(scenario => 
      weakSkills.some(skill => 
        scenario.category.toLowerCase().includes(skill) || 
        scenario.type.toLowerCase().includes(skill)
      )
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingComponent />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <ScrollView style={styles.content}>
        {/* Practice Tab */}
        {activeTab === 'practice' && !selectedScenario && (
          <PracticeTab
            scenarios={scenarios}
            userProgress={userProgress}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedLevel={selectedLevel}
            setSelectedLevel={setSelectedLevel}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelectScenario={handleSelectScenario}
          />
        )}

        {/* Selected Scenario */}
        {activeTab === 'practice' && selectedScenario && (
          <ScenarioDetail
            selectedScenario={selectedScenario}
            dialogueHistory={dialogueHistory}
            userInput={userInput}
            setUserInput={setUserInput}
            isProcessing={isProcessing}
            handleUserResponse={handleUserResponse}
            handleOptionSelect={handleOptionSelect}
            isRecording={isRecording}
            startRecording={startRecording}
            stopRecording={stopRecording}
            recordingTime={recordingTime}
            transcription={transcription}
            feedback={feedback}
            selectedWords={selectedWords}
            handleWordSelect={handleWordSelect}
            saveScenarioForOffline={saveScenarioForOffline}
            handleSentenceSubmit={handleSentenceSubmit}
            handlePronunciationPlay={handlePronunciationPlay}
          />
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <ProgressTab
            userProgress={userProgress}
          />
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
  content: {
    flex: 1,
  },
});

export default SpeakingScreen;