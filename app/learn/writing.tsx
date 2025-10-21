import { AntDesign, FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Badge, Button, Card, CardContent } from '@/components/ui';
import { apiClient } from '@/lib/api';
import { useDebounce } from 'use-debounce';

// Define interfaces
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

interface StartExerciseResponse {
  isCompleted: boolean;
  submission: ExerciseSubmission;
  currentSentence?: Sentence;
}

interface SubmitTranslationResponse {
  analysis: FeedbackData;
}

interface SubmitWritingResponse {
  analysis: FeedbackData;
}

interface WritingAnalytics {
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgSentenceLength: number;
  complexityScore: number;
}

interface WritingTemplate {
  id: string;
  type: 'CREATIVE' | 'ESSAY' | 'JOURNAL' | 'CHALLENGE';
  title: string;
  description: string;
  structure: {
    introduction?: string;
    body?: string[];
    conclusion?: string;
  };
  tips: string[];
  example?: string;
  wordLimit?: {
    min: number;
    max: number;
  };
  timeEstimate?: number; // in minutes
}

interface WritingGuidance {
  templates: WritingTemplate[];
  grammarPoints: string[];
  vocabularySuggestions: string[];
  writingPrompts: string[]; // Added for personalized prompts
}

interface PeerReview {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  feedback: string;
  createdAt: string;
}

interface WritingSubmissionWithReviews extends ExerciseSubmission {
  content?: string;
  peerReviews?: PeerReview[];
  averageRating?: number;
  reviewCount?: number;
}

interface VocabularyWord {
  id: string;
  text: string;
  meaning: string;
  translation?: string;
  partOfSpeech?: string;
  difficulty: string;
  language: string;
  createdAt: string;
}

export default function WritingScreen() {
  // State for exercise list view
  const [exercises, setExercises] = useState<WritingExercise[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, ExerciseSubmission>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300); // Debounce search by 300ms

  // State for exercise detail view
  const [currentExercise, setCurrentExercise] = useState<WritingExercise | null>(null);
  const [currentSubmission, setCurrentSubmission] = useState<ExerciseSubmission | null>(null);
  const [currentSentence, setCurrentSentence] = useState<Sentence | null>(null);
  const [userTranslation, setUserTranslation] = useState('');
  const [userWriting, setUserWriting] = useState('');
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'exercise' | 'completed' | 'peerReview'>('list');
  const [showHints, setShowHints] = useState(false);
  const [writingGuidance, setWritingGuidance] = useState<WritingGuidance | null>(null);
  const [showGuidance, setShowGuidance] = useState(false);
  const [peerReview, setPeerReview] = useState({ rating: 5, feedback: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [vocabularyWords, setVocabularyWords] = useState<VocabularyWord[]>([]);
  const [writingAnalytics, setWritingAnalytics] = useState<WritingAnalytics | null>(null);

  // State for offline mode
  const [isOffline, setIsOffline] = useState(false);
  const [offlineDrafts, setOfflineDrafts] = useState<Record<string, string>>({});
  const [isSyncing, setIsSyncing] = useState(false);

  // Function to save offline drafts
  const saveOfflineDraft = async (key: string, content: string) => {
    try {
      const updatedDrafts = { ...offlineDrafts, [key]: content };
      setOfflineDrafts(updatedDrafts);
      await AsyncStorage.setItem('writingDrafts', JSON.stringify(updatedDrafts));
    } catch (error) {
      console.error('Error saving offline draft:', error);
      Alert.alert('Error', 'Failed to save draft offline');
    }
  };

  // Function to load offline drafts
  const loadOfflineDraft = async (key: string) => {
    try {
      const savedDrafts = await AsyncStorage.getItem('writingDrafts');
      if (savedDrafts) {
        const drafts = JSON.parse(savedDrafts);
        return drafts[key] || '';
      }
      return '';
    } catch (error) {
      console.error('Error loading offline draft:', error);
      return '';
    }
  };

  // Function to fetch vocabulary words
  const fetchVocabularyWords = async () => {
    try {
      // In a real implementation, you would call an API to fetch vocabulary words
      // For now, we'll use mock data
      const mockVocabulary: VocabularyWord[] = [
        {
          id: '1',
          text: 'serendipity',
          meaning: 'a pleasant surprise',
          translation: 'may mắn bất ngờ',
          partOfSpeech: 'noun',
          difficulty: 'advanced',
          language: 'en',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          text: 'ephemeral',
          meaning: 'lasting for a very short time',
          translation: 'phù du, chóng tàn',
          partOfSpeech: 'adjective',
          difficulty: 'advanced',
          language: 'en',
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          text: 'ubiquitous',
          meaning: 'present, appearing, or found everywhere',
          translation: 'có mặt khắp nơi',
          partOfSpeech: 'adjective',
          difficulty: 'advanced',
          language: 'en',
          createdAt: new Date().toISOString()
        }
      ];
      setVocabularyWords(mockVocabulary);
    } catch (error) {
      console.error('Error fetching vocabulary words:', error);
    }
  };

  // Function to start an exercise
  const startExercise = async (exercise: WritingExercise) => {
    try {
      setIsLoading(true);
      
      // Set current exercise
      setCurrentExercise(exercise);
      
      // Fetch writing guidance for this exercise type
      await fetchWritingGuidance(exercise.type);
      
      // For translation exercises, start with the first sentence
      if (exercise.type === 'TRANSLATION' && exercise.sentences && exercise.sentences.length > 0) {
        // In a real implementation, you would call an API to start the exercise
        // For now, we'll simulate the API response
        const mockSubmission: ExerciseSubmission = {
          id: 'submission-1',
          status: 'in_progress',
          currentSentenceIndex: 0,
          completedSentences: 0,
          totalTimeSpent: 0
        };
        
        const mockSentence: Sentence = {
          id: exercise.sentences[0].id,
          orderIndex: exercise.sentences[0].orderIndex,
          sourceText: exercise.sentences[0].sourceText,
          difficulty: exercise.sentences[0].difficulty,
          grammarPoints: ['Present tense', 'Basic sentence structure'],
          vocabularyFocus: ['common verbs', 'articles']
        };
        
        setCurrentSubmission(mockSubmission);
        setCurrentSentence(mockSentence);
        setUserTranslation('');
        setFeedback(null);
        setActiveView('exercise');
        setStartTime(Date.now());
      } else {
        // For creative writing exercises
        const mockSubmission: ExerciseSubmission = {
          id: 'submission-1',
          status: 'in_progress',
          currentSentenceIndex: 0,
          completedSentences: 0,
          totalTimeSpent: 0
        };
        
        setCurrentSubmission(mockSubmission);
        setUserWriting('');
        setFeedback(null);
        setActiveView('exercise');
        setStartTime(Date.now());
      }
    } catch (error) {
      console.error('Error starting exercise:', error);
      Alert.alert('Error', 'Failed to start exercise');
    } finally {
      setIsLoading(false);
    }
  };

  // Check network status
  useEffect(() => {
    const checkNetworkStatus = () => {
      // In a real implementation, you would check actual network connectivity
      // For now, we'll simulate offline mode
      const offline = !navigator.onLine;
      setIsOffline(offline);
    };

    // Check initial network status
    checkNetworkStatus();

    // Add event listeners for network status changes
    window.addEventListener('online', checkNetworkStatus);
    window.addEventListener('offline', checkNetworkStatus);

    // Clean up event listeners
    return () => {
      window.removeEventListener('online', checkNetworkStatus);
      window.removeEventListener('offline', checkNetworkStatus);
    };
  }, []);

  // Load offline drafts from local storage
  useEffect(() => {
    const loadOfflineDrafts = async () => {
      try {
        const savedDrafts = await AsyncStorage.getItem('writingDrafts');
        if (savedDrafts) {
          setOfflineDrafts(JSON.parse(savedDrafts));
        }
      } catch (error) {
        console.error('Error loading offline drafts:', error);
      }
    };

    loadOfflineDrafts();
  }, []);

  // The saveOfflineDraft function handles saving to AsyncStorage

  // Sync offline drafts when online
  useEffect(() => {
    const syncOfflineDrafts = async () => {
      if (!isOffline && !isSyncing && Object.keys(offlineDrafts).length > 0) {
        setIsSyncing(true);
        try {
          // In a real implementation, you would sync drafts with the server
          // For now, we'll simulate the sync process
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Clear synced drafts
          setOfflineDrafts({});
          Alert.alert('Success', 'Your offline drafts have been synced successfully!');
        } catch (error) {
          console.error('Error syncing offline drafts:', error);
          Alert.alert('Error', 'Failed to sync offline drafts. Please try again.');
        } finally {
          setIsSyncing(false);
        }
      }
    };

    syncOfflineDrafts();
  }, [isOffline, isSyncing, offlineDrafts]);

  // Submit translation (updated to handle offline mode and AI coach)
  const submitTranslation = async () => {
    if (!userTranslation.trim() || !currentSentence || !currentSubmission || !currentExercise) {
      return;
    }

    // If offline, save as draft and show message
    if (isOffline) {
      saveOfflineDraft(`${currentExercise.id}-${currentSentence.id}`, userTranslation);
      Alert.alert(
        'Saved Offline', 
        'Your translation has been saved offline and will be synced when you\'re back online.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const timeSpent = Math.round((Date.now() - startTime) / 1000);

      // In a real implementation, you would call an API to submit the translation
      // For now, we'll simulate the API response with AI coach feedback
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate AI coach feedback
      const aiFeedback = await generateAICoachFeedback(userTranslation, currentExercise.type);
      
      // Perform grammar and style checking
      const grammarAnalysis = await performGrammarStyleCheck(userTranslation);
      
      // Simulate API response with AI coach integration
      const mockResponse: SubmitTranslationResponse = {
        analysis: {
          isCorrect: Math.random() > 0.3, // 70% chance of being correct
          accuracyScore: Math.floor(Math.random() * 20) + 80, // 80-100
          grammarScore: Math.floor(Math.random() * 20) + 75, // 75-95
          vocabularyScore: Math.floor(Math.random() * 25) + 70, // 70-95
          fluencyScore: Math.floor(Math.random() * 30) + 70, // 70-100
          feedback: {
            accuracy: 90,
            strengths: [
              'Good use of vocabulary',
              'Correct grammar structure',
              'Clear meaning'
            ],
            improvements: [
              'Consider more natural phrasing',
              'Check article usage'
            ],
            alternatives: [
              'Alternative translation 1',
              'Alternative translation 2'
            ]
          },
          corrections: {
            suggestion: 'Suggested corrected translation',
            explanation: 'Explanation of the correction'
          },
          aiCoach: aiFeedback || undefined,
          grammarAnalysis: grammarAnalysis || undefined
        }
      };
      
      setFeedback(mockResponse.analysis);
      
      if (mockResponse.analysis.isCorrect) {
        Alert.alert('Success', 'Great translation! Moving to next sentence...');
        
        // Move to next sentence after a short delay
        setTimeout(() => {
          moveToNextSentence();
        }, 1500);
      } else {
        Alert.alert('Needs Improvement', 'Translation needs improvement. Try again!');
      }
    } catch (error) {
      console.error('Error submitting translation:', error);
      Alert.alert('Error', 'Failed to submit translation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Move to next sentence in the exercise
  const moveToNextSentence = async () => {
    if (!currentExercise) return;
    
    try {
      const response = await apiClient.post(`/writing/exercises/${currentExercise.id}/start`);
      
      if (response.success && response.data) {
        const data = response.data as StartExerciseResponse;
        
        if (data.isCompleted) {
          setIsCompleted(true);
          setCurrentSentence(null);
          setCurrentSubmission(data.submission);
          setActiveView('completed');
          Alert.alert('Congratulations!', 'Exercise completed!');
        } else {
          setCurrentSentence(data.currentSentence || null);
          setCurrentSubmission(data.submission);
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to load next sentence');
      }
    } catch (error) {
      console.error('Error moving to next sentence:', error);
      Alert.alert('Error', 'Failed to load next sentence');
    }
  };

  // Try again with current sentence
  const handleTryAgain = () => {
    setFeedback(null);
    setUserTranslation('');
    setStartTime(Date.now());
  };

  // Submit creative writing (updated to handle offline mode and AI coach)
  const submitCreativeWriting = async () => {
    if (!userWriting.trim() || !currentSubmission || !currentExercise) {
      return;
    }

    // If offline, save as draft and show message
    if (isOffline) {
      saveOfflineDraft(currentExercise.id, userWriting);
      Alert.alert(
        'Saved Offline', 
        'Your writing has been saved offline and will be synced when you\'re back online.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      
      // Calculate writing analytics
      const analytics = calculateWritingAnalytics(userWriting);
      setWritingAnalytics(analytics);

      // Generate AI coach feedback
      const aiFeedback = await generateAICoachFeedback(userWriting, currentExercise.type);
      
      // Perform grammar and style checking
      const grammarAnalysis = await performGrammarStyleCheck(userWriting);
      
      // In a real implementation, you would call an API endpoint to submit the writing
      // For now, we'll simulate the API call with AI coach integration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate a successful submission with AI feedback
      const mockFeedback: FeedbackData = {
        isCorrect: true,
        accuracyScore: Math.floor(Math.random() * 10) + 90, // 90-100
        grammarScore: Math.floor(Math.random() * 15) + 80, // 80-95
        vocabularyScore: Math.floor(Math.random() * 20) + 75, // 75-95
        fluencyScore: Math.floor(Math.random() * 15) + 80, // 80-95
        feedback: {
          accuracy: 95,
          strengths: [
            'Creative use of language',
            'Good narrative flow',
            'Strong character development'
          ],
          improvements: [
            'Consider tightening some sentences',
            'Add more sensory details'
          ],
          alternatives: [
            'Alternative phrasing 1',
            'Alternative phrasing 2'
          ]
        },
        aiCoach: aiFeedback || undefined,
        grammarAnalysis: grammarAnalysis || undefined
      };
      
      setFeedback(mockFeedback);
      setIsCompleted(true);
      setCurrentSubmission({
        ...currentSubmission,
        completedSentences: 1,
        overallAccuracy: mockFeedback.accuracyScore
      } as WritingSubmissionWithReviews);
      setActiveView('completed');
      
      Alert.alert('Success', 'Your writing has been submitted successfully!');
    } catch (error) {
      console.error('Error submitting writing:', error);
      Alert.alert('Error', 'Failed to submit writing');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit peer review
  const submitPeerReview = async (submissionId: string) => {
    if (!peerReview.feedback.trim()) {
      Alert.alert('Error', 'Please provide feedback for this writing');
      return;
    }
    
    try {
      setIsSubmittingReview(true);
      
      // In a real implementation, you would call an API endpoint to submit the review
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert('Success', 'Your review has been submitted successfully!');
      
      // Reset peer review form
      setPeerReview({ rating: 5, feedback: '' });
      
      // Go back to exercise list
      setActiveView('list');
      setCurrentExercise(null);
      setCurrentSubmission(null);
      setCurrentSentence(null);
      setIsCompleted(false);
      setFeedback(null);
    } catch (error) {
      console.error('Error submitting peer review:', error);
      Alert.alert('Error', 'Failed to submit peer review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Navigate to peer review view
  const goToPeerReview = (submission: WritingSubmissionWithReviews) => {
    setCurrentSubmission(submission);
    setActiveView('peerReview');
  };

  // Fetch writing guidance for an exercise
  const fetchWritingGuidance = async (exerciseType: string) => {
    // Fetch vocabulary words if not already loaded
    if (vocabularyWords.length === 0) {
      await fetchVocabularyWords();
    }
    
    // In a real implementation, you would call an API to fetch templates and guidance
    // For now, we'll use mock data
    const mockGuidance: Record<string, WritingGuidance> = {
      'CREATIVE': {
        templates: [
          {
            id: '1',
            type: 'CREATIVE',
            title: 'Story Structure',
            description: 'A classic story structure with beginning, middle, and end',
            structure: {
              introduction: 'Introduce characters and setting. Establish the main conflict or situation.',
              body: [
                'Develop the conflict or problem. Build tension and complexity.',
                'Reach the climax - the most intense moment of the story.',
                'Begin resolving the conflict and tying up loose ends.'
              ],
              conclusion: 'Wrap up the story and show resolution. Leave the reader with a final thought.'
            },
            tips: [
              'Use vivid descriptions to paint a picture in the reader\'s mind',
              'Show character emotions through actions rather than telling',
              'Include dialogue to bring characters to life',
              'Use sensory details to engage all five senses',
              'Create a clear beginning, middle, and end'
            ],
            example: 'Once upon a time in a land far away, there lived a young knight who dreamed of adventure...',
            wordLimit: { min: 200, max: 500 },
            timeEstimate: 20
          },
          {
            id: '2',
            type: 'CREATIVE',
            title: 'Character Sketch',
            description: 'A descriptive piece focused on a single character',
            structure: {
              introduction: 'Introduce the character and what makes them unique',
              body: [
                'Describe their physical appearance in detail',
                'Explain their personality traits and quirks',
                'Share their background and motivations',
                'Describe how they interact with others'
              ],
              conclusion: 'Summarize the character\'s essence and what makes them memorable'
            },
            tips: [
              'Focus on distinctive features that make the character memorable',
              'Use specific examples to illustrate personality traits',
              'Show character through actions and dialogue, not just description',
              'Consider the character\'s motivations and goals',
              'Think about how others perceive this character'
            ],
            example: 'Margaret was the kind of person who could find something interesting in everything...',
            wordLimit: { min: 150, max: 300 },
            timeEstimate: 15
          }
        ],
        grammarPoints: [
          'Use past tense for storytelling',
          'Vary sentence lengths for rhythm and flow',
          'Use sensory details and descriptive language',
          'Employ figurative language like metaphors and similes',
          'Maintain consistent point of view'
        ],
        vocabularySuggestions: [
          'descriptive adjectives (vivid, mysterious, radiant)',
          'action verbs (sprinted, whispered, trembled)',
          'dialogue tags (exclaimed, murmured, stammered)',
          'sensory words (fragrant, thunderous, silky)',
          'emotional vocabulary (elated, apprehensive, bewildered)'
        ],
        writingPrompts: [
          'Write about a character who discovers a hidden talent',
          'Describe a day when everything went wrong',
          'Tell the story of a magical object and its owner',
          'Write about someone who overcomes a fear',
          'Create a story that takes place in an unusual setting',
          // Personalized prompts using vocabulary words
          ...vocabularyWords.map(word => `Write a story that includes the word "${word.text}" meaning "${word.meaning}"`),
          ...vocabularyWords.map(word => `Create a character who embodies the concept of "${word.text}"`)
        ]
      },
      'ESSAY': {
        templates: [
          {
            id: '3',
            type: 'ESSAY',
            title: 'Five-Paragraph Essay',
            description: 'A classic essay structure with introduction, three body paragraphs, and conclusion',
            structure: {
              introduction: 'Hook the reader with an interesting opening. Present your thesis statement clearly.',
              body: [
                'First supporting argument with evidence and examples',
                'Second supporting argument with evidence and examples',
                'Third supporting argument with evidence and examples'
              ],
              conclusion: 'Summarize main points and restate thesis. End with a strong closing statement.'
            },
            tips: [
              'Make a clear thesis statement in your introduction',
              'Support each point with evidence, examples, or quotes',
              'Use transition words between paragraphs (furthermore, however, additionally)',
              'Address potential counterarguments',
              'Keep paragraphs focused on one main idea each'
            ],
            example: 'In today\'s society, technology plays a crucial role in our daily lives...',
            wordLimit: { min: 500, max: 800 },
            timeEstimate: 45
          },
          {
            id: '4',
            type: 'ESSAY',
            title: 'Compare and Contrast Essay',
            description: 'An essay that examines similarities and differences between two subjects',
            structure: {
              introduction: 'Introduce both subjects and state your purpose for comparing them',
              body: [
                'Focus on the first subject, discussing its key characteristics',
                'Focus on the second subject, discussing its key characteristics',
                'Compare and contrast the two subjects directly'
              ],
              conclusion: 'Summarize the main points of comparison. State which subject is better or more important.'
            },
            tips: [
              'Choose subjects that have enough in common to be meaningfully compared',
              'Organize either by subject (all about A, then all about B) or by point (A and B together)',
              'Use comparison words (similarly, in contrast, likewise)',
              'Focus on significant similarities and differences, not trivial ones',
              'Conclude with a judgment about which subject is superior or more important'
            ],
            example: 'While both cats and dogs make wonderful pets, they differ significantly in their care requirements...',
            wordLimit: { min: 600, max: 1000 },
            timeEstimate: 50
          }
        ],
        grammarPoints: [
          'Use formal tone and academic language',
          'Maintain consistent verb tense throughout',
          'Use proper citation format for references',
          'Employ complex sentence structures',
          'Ensure subject-verb agreement'
        ],
        vocabularySuggestions: [
          'academic vocabulary (analyze, demonstrate, significant)',
          'transition words (furthermore, however, consequently)',
          'topic-specific terms (depending on essay subject)',
          'formal expressions (it is evident that, one might argue)',
          'comparative language (similarly, in contrast, whereas)'
        ],
        writingPrompts: [
          'Compare and contrast two different educational approaches',
          'Discuss the advantages and disadvantages of technology in education',
          'Analyze the impact of social media on communication',
          'Evaluate the effectiveness of different learning styles',
          'Examine the differences between traditional and modern art',
          // Personalized prompts using vocabulary words
          ...vocabularyWords.map(word => `Discuss the importance of "${word.text}" in modern society`),
          ...vocabularyWords.map(word => `Analyze how "${word.text}" affects people's daily lives`)
        ]
      },
      'JOURNAL': {
        templates: [
          {
            id: '5',
            type: 'JOURNAL',
            title: 'Daily Journal Entry',
            description: 'A personal reflection format for daily journaling',
            structure: {
              introduction: 'Date and mood or overall feeling of the day',
              body: [
                'What happened today that was significant',
                'Your thoughts and feelings about events',
                'What you learned or accomplished',
                'Challenges you faced and how you handled them'
              ],
              conclusion: 'Reflection on the day and plans for tomorrow'
            },
            tips: [
              'Write freely without worrying about grammar or spelling',
              'Be honest and authentic in your reflections',
              'Focus on your personal experiences and emotions',
              'Include both positive and negative experiences',
              'Reflect on what you learned or how you grew'
            ],
            example: 'Dear Diary, Today was an interesting day...',
            wordLimit: { min: 100, max: 300 },
            timeEstimate: 10
          },
          {
            id: '6',
            type: 'JOURNAL',
            title: 'Gratitude Journal',
            description: 'A journal focused on things you are grateful for',
            structure: {
              introduction: 'Briefly set the tone for gratitude',
              body: [
                'List 3-5 specific things you are grateful for today',
                'Explain why you are grateful for each item',
                'Reflect on how these things impact your life'
              ],
              conclusion: 'Express overall appreciation and positive outlook'
            },
            tips: [
              'Be specific rather than general in your gratitude',
              'Include both big and small things you appreciate',
              'Reflect on why these things matter to you',
              'Try to find something to be grateful for even on difficult days',
              'Write regularly to develop a habit of gratitude'
            ],
            example: 'Today I am grateful for...',
            wordLimit: { min: 100, max: 250 },
            timeEstimate: 10
          }
        ],
        grammarPoints: [
          'Use first person perspective (I, me, my)',
          'Mix sentence structures for natural flow',
          'Use contractions naturally (I\'m, don\'t, can\'t)',
          'Write in a conversational tone',
          'Focus on personal expression over perfect grammar'
        ],
        vocabularySuggestions: [
          'personal pronouns (I, me, my, we, us, our)',
          'emotional vocabulary (joyful, frustrated, content, anxious)',
          'time expressions (today, yesterday, recently, soon)',
          'reflective words (realized, noticed, discovered, learned)',
          'appreciation terms (grateful, thankful, blessed, fortunate)'
        ],
        writingPrompts: [
          'What are three things that made you smile today?',
          'Describe a challenge you faced and how you overcame it',
          'Write about someone who has influenced your life',
          'What are you looking forward to this week?',
          'Reflect on a recent accomplishment and what it means to you',
          // Personalized prompts using vocabulary words
          ...vocabularyWords.map(word => `Write about a time when you felt "${word.text}"`),
          ...vocabularyWords.map(word => `Reflect on how learning the word "${word.text}" has impacted your understanding`)
        ]
      },
      'CHALLENGE': {
        templates: [
          {
            id: '7',
            type: 'CHALLENGE',
            title: 'Prompt Response',
            description: 'Structured response to creative writing prompts',
            structure: {
              introduction: 'Interpret the prompt and set the scene. Hook the reader with an engaging opening.',
              body: [
                'Develop the main action or conflict based on the prompt',
                'Build tension or interest as the story progresses',
                'Address the core of the prompt in a meaningful way'
              ],
              conclusion: 'Provide resolution or thought-provoking ending that ties back to the prompt'
            },
            tips: [
              'Stay focused on the prompt but allow for creative interpretation',
              'Be creative but ensure clarity in your writing',
              'Show rather than tell - use actions and dialogue',
              'Make every word count in a short piece',
              'End with impact - a twist, realization, or strong statement'
            ],
            example: 'When I opened the door, I couldn\'t believe what I saw...',
            wordLimit: { min: 150, max: 400 },
            timeEstimate: 20
          },
          {
            id: '8',
            type: 'CHALLENGE',
            title: 'Dialogue-Heavy Piece',
            description: 'A writing piece that relies primarily on dialogue to tell the story',
            structure: {
              introduction: 'Set up the characters and situation with minimal exposition',
              body: [
                'Let the characters\' conversation drive the narrative',
                'Reveal character personalities through speech patterns',
                'Advance the plot through dialogue exchanges',
                'Include just enough action tags to clarify who is speaking'
              ],
              conclusion: 'Resolve the conversation or end on a meaningful note'
            },
            tips: [
              'Use dialogue tags sparingly - let the dialogue speak for itself',
              'Give each character a distinct voice and speech pattern',
              'Include action beats to break up long stretches of dialogue',
              'Show character relationships through how they speak to each other',
              'Use subtext - what characters don\'t say is as important as what they do'
            ],
            example: '"I didn\'t think you\'d come," she said, not looking up from her book.',
            wordLimit: { min: 200, max: 500 },
            timeEstimate: 25
          }
        ],
        grammarPoints: [
          'Use appropriate tense for the scenario',
          'Vary sentence structures to maintain interest',
          'Use descriptive language to set scenes without exposition',
          'Employ proper dialogue punctuation',
          'Balance dialogue with minimal narrative description'
        ],
        vocabularySuggestions: [
          'context-specific vocabulary based on the prompt',
          'descriptive adjectives to enhance setting and characters',
          'action verbs to drive the narrative forward',
          'dialogue-specific words (interrupted, whispered, exclaimed)',
          'emotional expressions to convey character feelings'
        ],
        writingPrompts: [
          'Write a conversation between two people who just met',
          'Create a dialogue that reveals a secret without stating it directly',
          'Write a scene where someone has to deliver bad news',
          'Compose a conversation that takes place in an unusual location',
          'Write a dialogue that shows conflict between two characters without them directly arguing',
          // Personalized prompts using vocabulary words
          ...vocabularyWords.map(word => `Write a dialogue where one character tries to explain the meaning of "${word.text}" to another`),
          ...vocabularyWords.map(word => `Create a scene where the word "${word.text}" is crucial to the plot`)
        ]
      }
    };
    
    setWritingGuidance(mockGuidance[exerciseType] || null);
  };

  // Go back to exercise list
  const goBackToList = () => {
    setActiveView('list');
    setCurrentExercise(null);
    setCurrentSubmission(null);
    setCurrentSentence(null);
    setIsCompleted(false);
    setFeedback(null);
  };

  // Export writing in different formats
  const exportWriting = async (format: 'pdf' | 'txt' | 'docx') => {
    try {
      // Get the writing content based on exercise type
      let content = '';
      let title = currentExercise?.title || 'Writing Exercise';
      
      if (currentExercise?.type === 'TRANSLATION') {
        // For translation exercises, we'd need to collect all translations
        // This is a simplified implementation
        content = userTranslation;
      } else {
        // For creative writing exercises
        content = userWriting;
      }
      
      // In a real implementation, you would use a library like react-native-html-to-pdf
      // or react-native-document-picker to handle the actual export
      
      // For now, we'll simulate the export process
      Alert.alert(
        'Export Started', 
        `Your writing is being exported as ${format.toUpperCase()}. This would open the share dialog in a real implementation.`,
        [{ text: 'OK' }]
      );
      
      // Log the export for analytics
      console.log(`Exported writing as ${format}:`, { title, content });
    } catch (error) {
      console.error(`Error exporting as ${format}:`, error);
      Alert.alert('Error', `Failed to export as ${format.toUpperCase()}`);
    }
  };

  // Start a community writing challenge
  const startChallenge = async (challengeType: string) => {
    try {
      // In a real implementation, you would call an API to start the challenge
      // For now, we'll simulate the process
      
      // Create a mock challenge exercise
      const challengeExercise: WritingExercise = {
        id: `challenge-${challengeType}-${Date.now()}`,
        title: challengeType === 'weekly' ? 'Weekly Writing Challenge' : 'Vocabulary Challenge',
        instructions: challengeType === 'weekly' 
          ? 'Write a short story (200-500 words) based on this week\'s theme: &quot;Unexpected Encounters&quot;'
          : 'Use all 5 vocabulary words in a coherent paragraph: serendipity, ephemeral, ubiquitous, quintessential, mellifluous',
        level: 'intermediate',
        difficulty: 'intermediate',
        type: 'CHALLENGE',
        estimatedTime: challengeType === 'weekly' ? 45 : 20,
        _count: {
          submissions: 0,
          sentences: 1
        }
      };
      
      // Start the exercise
      await startExercise(challengeExercise);
      
      Alert.alert('Challenge Started', `You've successfully started the ${challengeExercise.title}!`);
    } catch (error) {
      console.error('Error starting challenge:', error);
      Alert.alert('Error', 'Failed to start challenge');
    }
  };

  // Generate AI coach feedback for writing
  const generateAICoachFeedback = async (writing: string, exerciseType: string) => {
    try {
      // In a real implementation, you would call an AI service API
      // For now, we'll simulate the AI feedback
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock AI coach feedback based on exercise type
      const mockAIFeedback = {
        personalizedTips: [
          'Try varying your sentence structure to improve flow',
          'Consider using more descriptive language to engage readers',
          'Your opening paragraph effectively sets the scene'
        ],
        styleSuggestions: [
          'For creative writing, try showing rather than telling',
          'Use dialogue to develop character personalities',
          'Vary paragraph lengths to control pacing'
        ],
        vocabularyEnhancements: [
          'Consider replacing "good" with "excellent" or "outstanding" for stronger impact',
          'Use "suddenly" sparingly; try more descriptive alternatives',
          'Your vocabulary choice is appropriate for the audience'
        ],
        coherenceFeedback: [
          'Your ideas flow logically from one to the next',
          'Consider adding transition phrases between paragraphs',
          'The conclusion effectively summarizes your main points'
        ],
        overallRating: Math.floor(Math.random() * 20) + 80, // 80-100
        improvementAreas: [
          'Sentence variety',
          'Descriptive language',
          'Character development'
        ]
      };
      
      return mockAIFeedback;
    } catch (error) {
      console.error('Error generating AI coach feedback:', error);
      return null;
    }
  };

  // Perform advanced grammar and style checking
  const performGrammarStyleCheck = async (writing: string) => {
    try {
      // In a real implementation, you would call a grammar/style checking API
      // For now, we'll simulate the analysis
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate mock grammar and style analysis
      const mockGrammarAnalysis = {
        errors: [
          {
            type: 'subject-verb agreement',
            message: 'Subject and verb do not agree in number',
            suggestion: 'Change "was" to "were" to match the plural subject',
            position: { start: 25, end: 28 }
          },
          {
            type: 'article usage',
            message: 'Missing article before noun',
            suggestion: 'Add "the" before "book"',
            position: { start: 52, end: 56 }
          }
        ],
        styleIssues: [
          {
            type: 'passive voice',
            message: 'Passive voice can make writing less engaging',
            suggestion: 'Consider rewriting in active voice: "The chef prepared the meal"',
            position: { start: 80, end: 110 }
          },
          {
            type: 'wordiness',
            message: 'This phrase is unnecessarily wordy',
            suggestion: 'Replace with "because"',
            position: { start: 120, end: 145 }
          }
        ],
        readabilityScore: Math.floor(Math.random() * 20) + 70, // 70-90
        complexityLevel: ['beginner', 'intermediate', 'advanced', 'expert'][Math.floor(Math.random() * 4)] as 'beginner' | 'intermediate' | 'advanced' | 'expert',
        sentenceStructure: {
          simple: Math.floor(Math.random() * 30) + 40, // 40-70%
          compound: Math.floor(Math.random() * 20) + 15, // 15-35%
          complex: Math.floor(Math.random() * 20) + 10, // 10-30%
          compoundComplex: Math.floor(Math.random() * 15) + 5 // 5-20%
        }
      };
      
      return mockGrammarAnalysis;
    } catch (error) {
      console.error('Error performing grammar/style check:', error);
      return null;
    }
  };

  // Calculate writing analytics
  const calculateWritingAnalytics = (text: string): WritingAnalytics => {
    if (!text.trim()) {
      return {
        wordCount: 0,
        characterCount: 0,
        sentenceCount: 0,
        paragraphCount: 0,
        avgSentenceLength: 0,
        complexityScore: 0
      };
    }
    
    // Basic text analysis
    const words = text.trim().split(/\s+/);
    const characters = text.length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    // Calculate average sentence length
    const avgSentenceLength = sentences.length > 0 
      ? words.length / sentences.length 
      : 0;
    
    // Calculate complexity score (simplified version)
    // This is a basic implementation - in a real app, this would be more sophisticated
    const uniqueWords = new Set(words.map(word => word.toLowerCase().replace(/[^\w]/g, '')));
    const lexicalDiversity = uniqueWords.size / words.length;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    // Complexity score based on multiple factors (0-100)
    const complexityScore = Math.min(100, Math.round(
      (lexicalDiversity * 30) +           // Lexical diversity weight
      (avgWordLength * 10) +              // Average word length weight
      (avgSentenceLength * 2) +           // Sentence length weight
      (sentences.length * 0.5) +          // Sentence count weight
      (paragraphs.length * 2)             // Paragraph count weight
    ));
    
    return {
      wordCount: words.length,
      characterCount: characters,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      avgSentenceLength: parseFloat(avgSentenceLength.toFixed(1)),
      complexityScore: Math.min(100, complexityScore)
    };
  };

  // Get difficulty color for badges
  const getDifficultyColor = (difficulty: string): [string, string] => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return ['#10B981', '#059669']; // green
      case 'intermediate': return ['#F59E0B', '#D97706']; // yellow
      case 'advanced': return ['#EF4444', '#DC2626']; // red
      default: return ['#6B7280', '#4B5563']; // gray
    }
  };

  // Get exercise type label
  const getExerciseTypeLabel = (type: string) => {
    switch (type) {
      case 'TRANSLATION': return 'Translation';
      case 'CREATIVE': return 'Creative Writing';
      case 'ESSAY': return 'Essay';
      case 'JOURNAL': return 'Journal';
      case 'CHALLENGE': return 'Challenge';
      default: return type;
    }
  };

  // Get status color for badges
  const getStatusColor = (status: string): [string, string] => {
    switch (status) {
      case 'completed': return ['#10B981', '#059669']; // green
      case 'in_progress': return ['#3B82F6', '#2563EB']; // blue
      default: return ['#6B7280', '#4B5563']; // gray
    }
  };

  // Render exercise completion screen
  if (activeView === 'completed' && currentExercise && currentSubmission) {
    const progress = currentExercise.totalSentences ? (currentSubmission.completedSentences / currentExercise.totalSentences) * 100 : 0;
    
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={goBackToList} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#3B82F6" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Exercise Completed!</Text>
          </View>
          
          <View style={styles.completionContainer}>
            <View style={styles.completionIcon}>
              <AntDesign name="trophy" size={48} color="#10B981" />
            </View>
            
            <Text style={styles.completionTitle}>Congratulations!</Text>
            <Text style={styles.completionSubtitle}>You&apos;ve successfully completed the {getExerciseTypeLabel(currentExercise.type)} exercise.</Text>
            
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
                  onPress={() => exportWriting('pdf')}
                  variant="primary"
                  style={styles.exportButton}
                />
                <Button
                  title="Export as TXT"
                  onPress={() => exportWriting('txt')}
                  variant="secondary"
                  style={styles.exportButton}
                />
                <Button
                  title="Export as DOCX"
                  onPress={() => exportWriting('docx')}
                  variant="secondary"
                  style={styles.exportButton}
                />
              </View>
            </View>
            
            <View style={styles.actionButtons}>
              <Button
                title="Back to Writing"
                onPress={goBackToList}
                variant="secondary"
                style={styles.actionButton}
              />
              <Button
                title="Try Again"
                onPress={() => startExercise(currentExercise)}
                variant="primary"
                style={styles.actionButton}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render exercise detail view (translation)
  if (activeView === 'exercise' && currentExercise && currentSentence && currentSubmission) {
    const progress = currentExercise.totalSentences ? (currentSubmission.completedSentences / currentExercise.totalSentences) * 100 : 0;
    
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={goBackToList} style={styles.backButton}>
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
              {currentSentence.orderIndex + 1} / {currentExercise.totalSentences}
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
                onPress={() => setShowGuidance(!showGuidance)}
                variant="secondary"
                style={styles.guidanceButton}
              />
            </View>
          )}
          
          {/* Writing Guidance Panel */}
          {showGuidance && writingGuidance && (
            <Card style={styles.guidanceCard}>
              <CardContent style={styles.cardContent}>
                <View style={styles.guidanceHeader}>
                  <Text style={styles.guidanceTitle}>Writing Guidance</Text>
                  <TouchableOpacity onPress={() => setShowGuidance(false)}>
                    <Ionicons name="close" size={24} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
                
                {/* Templates */}
                <View style={styles.guidanceSection}>
                  <Text style={styles.guidanceSectionTitle}>Templates</Text>
                  {writingGuidance.templates.map((template) => (
                    <View key={template.id} style={styles.templateContainer}>
                      <Text style={styles.templateTitle}>{template.title}</Text>
                      <Text style={styles.templateDescription}>{template.description}</Text>
                      
                      {template.wordLimit && (
                        <View style={styles.templateMeta}>
                          <Text style={styles.templateMetaText}>
                            Word Limit: {template.wordLimit.min}-{template.wordLimit.max} words
                          </Text>
                          {template.timeEstimate && (
                            <Text style={styles.templateMetaText}>
                              Time: ~{template.timeEstimate} min
                            </Text>
                          )}
                        </View>
                      )}
                      
                      <View style={styles.templateStructure}>
                        {template.structure.introduction && (
                          <View style={styles.structureItem}>
                            <Text style={styles.structureLabel}>Introduction:</Text>
                            <Text style={styles.structureText}>{template.structure.introduction}</Text>
                          </View>
                        )}
                        
                        {template.structure.body && template.structure.body.map((item, index) => (
                          <View key={index} style={styles.structureItem}>
                            <Text style={styles.structureLabel}>Body {index + 1}:</Text>
                            <Text style={styles.structureText}>{item}</Text>
                          </View>
                        ))}
                        
                        {template.structure.conclusion && (
                          <View style={styles.structureItem}>
                            <Text style={styles.structureLabel}>Conclusion:</Text>
                            <Text style={styles.structureText}>{template.structure.conclusion}</Text>
                          </View>
                        )}
                      </View>
                      
                      <View style={styles.templateTips}>
                        <Text style={styles.tipsTitle}>Writing Tips:</Text>
                        {template.tips.map((tip, index) => (
                          <View key={index} style={styles.tipItem}>
                            <Text style={styles.tipBullet}>•</Text>
                            <Text style={styles.tipText}>{tip}</Text>
                          </View>
                        ))}
                      </View>
                      
                      {template.example && (
                        <View style={styles.exampleContainer}>
                          <Text style={styles.exampleTitle}>Example:</Text>
                          <Text style={styles.exampleText}>{template.example}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
                
                {/* Grammar Points */}
                {writingGuidance.grammarPoints.length > 0 && (
                  <View style={styles.guidanceSection}>
                    <Text style={styles.guidanceSectionTitle}>Grammar Focus</Text>
                    <View style={styles.focusBadges}>
                      {writingGuidance.grammarPoints.map((point, index) => (
                        <Badge key={index} style={styles.focusBadge}>
                          <Text style={styles.focusBadgeText}>{point}</Text>
                        </Badge>
                      ))}
                    </View>
                  </View>
                )}
                
                {/* Vocabulary Suggestions */}
                {writingGuidance.vocabularySuggestions.length > 0 && (
                  <View style={styles.guidanceSection}>
                    <Text style={styles.guidanceSectionTitle}>Vocabulary Suggestions</Text>
                    <View style={styles.focusBadges}>
                      {writingGuidance.vocabularySuggestions.map((word, index) => (
                        <Badge key={index} style={styles.focusBadge}>
                          <Text style={styles.focusBadgeText}>{word}</Text>
                        </Badge>
                      ))}
                    </View>
                  </View>
                )}
                
                {/* Writing Prompts */}
                {writingGuidance.writingPrompts.length > 0 && (
                  <View style={styles.guidanceSection}>
                    <Text style={styles.guidanceSectionTitle}>Writing Prompts</Text>
                    {writingGuidance.writingPrompts.map((prompt, index) => (
                      <View key={index} style={styles.promptItem}>
                        <Text style={styles.promptBullet}>•</Text>
                        <Text style={styles.promptText}>{prompt}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </CardContent>
            </Card>
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
              {currentSentence.hints && currentSentence.hints.length > 0 && (
                <View style={styles.hintsContainer}>
                  <TouchableOpacity 
                    onPress={() => setShowHints(!showHints)} 
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
              {(currentSentence.grammarPoints.length > 0 || currentSentence.vocabularyFocus.length > 0) && (
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
                      onChangeText={setUserTranslation}
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
                            onPress={handleTryAgain}
                            variant="secondary"
                            style={styles.actionButtonSmall}
                          />
                        )}
                        <Button
                          title={isSubmitting ? "Submitting..." : "Submit"}
                          onPress={submitTranslation}
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
                      onChangeText={(text) => {
                        setUserWriting(text);
                        // Update analytics as user types (optional)
                        // const analytics = calculateWritingAnalytics(text);
                        // setWritingAnalytics(analytics);
                      }}
                      placeholder="Start writing here..."
                      placeholderTextColor="#94A3B8"
                      multiline
                      textAlignVertical="top"
                      editable={!isSubmitting && !isCompleted}
                    />
                    <View style={styles.translationFooter}>
                      <Text style={styles.characterCount}>
                        {userWriting.length} characters
                      </Text>
                      <View style={styles.translationActions}>
                        <Button
                          title={isSubmitting ? "Submitting..." : "Submit"}
                          onPress={submitCreativeWriting}
                          disabled={!userWriting.trim() || isSubmitting}
                          variant="primary"
                          style={styles.actionButtonSmall}
                        />
                      </View>
                    </View>
                    
                    {/* Writing Analytics Preview */}
                    {userWriting.trim() && (
                      <View style={styles.analyticsPreview}>
                        <Text style={styles.analyticsTitle}>Writing Analytics Preview</Text>
                        <View style={styles.analyticsGrid}>
                          <View style={styles.analyticsItem}>
                            <Text style={styles.analyticsValue}>
                              {calculateWritingAnalytics(userWriting).wordCount}
                            </Text>
                            <Text style={styles.analyticsLabel}>Words</Text>
                          </View>
                          <View style={styles.analyticsItem}>
                            <Text style={styles.analyticsValue}>
                              {calculateWritingAnalytics(userWriting).sentenceCount}
                            </Text>
                            <Text style={styles.analyticsLabel}>Sentences</Text>
                          </View>
                          <View style={styles.analyticsItem}>
                            <Text style={styles.analyticsValue}>
                              {calculateWritingAnalytics(userWriting).complexityScore}
                            </Text>
                            <Text style={styles.analyticsLabel}>Complexity</Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </>
                )}
              </View>
            </CardContent>
          </Card>
          
          {/* Feedback */}
          {feedback && (
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
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render peer review view
  if (activeView === 'peerReview' && currentSubmission) {
    // Cast to WritingSubmissionWithReviews to access content property
    const peerSubmission = currentSubmission as WritingSubmissionWithReviews;
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={goBackToList} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#3B82F6" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Peer Review</Text>
          </View>
          
          <Card style={styles.peerReviewCard}>
            <CardContent style={styles.cardContent}>
              <Text style={styles.peerReviewTitle}>Review Writing Submission</Text>
              
              {peerSubmission.content && (
                <View style={styles.submissionContent}>
                  <Text style={styles.submissionLabel}>Submitted Writing:</Text>
                  <Text style={styles.submissionText}>{peerSubmission.content}</Text>
                </View>
              )}
              
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingLabel}>Your Rating:</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setPeerReview({ ...peerReview, rating: star })}
                    >
                      <AntDesign 
                        name="star" 
                        size={32} 
                        color={star <= peerReview.rating ? "#FBBF24" : "#D1D5DB"} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.feedbackContainer}>
                <Text style={styles.feedbackLabel}>Your Feedback:</Text>
                <TextInput
                  style={styles.feedbackInput}
                  value={peerReview.feedback}
                  onChangeText={(text) => setPeerReview({ ...peerReview, feedback: text })}
                  placeholder="Provide constructive feedback..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  textAlignVertical="top"
                />
              </View>
              
              <Button
                title={isSubmittingReview ? "Submitting..." : "Submit Review"}
                onPress={() => submitPeerReview(peerSubmission.id)}
                disabled={isSubmittingReview}
                variant="primary"
                style={styles.submitReviewButton}
              />
            </CardContent>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render exercise list view (default)
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Writing Practice</Text>
          <Text style={styles.headerSubtitle}>Practice different types of writing with AI feedback</Text>
        </View>
        
        {/* Hero Card */}
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.heroCard}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroIcon}>
              <MaterialIcons name="edit" size={32} color="white" />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Writing Practice</Text>
              <Text style={styles.heroSubtitle}>Practice different types of writing with AI feedback</Text>
            </View>
          </View>
          <View style={styles.heroFeatures}>
            <View style={styles.featureItem}>
              <AntDesign name="rocket" size={16} color="white" />
              <Text style={styles.featureText}>Multiple Writing Types</Text>
            </View>
            <View style={styles.featureItem}>
              <AntDesign name="star" size={16} color="white" />
              <Text style={styles.featureText}>AI-Powered Feedback</Text>
            </View>
            <View style={styles.featureItem}>
              <AntDesign name="clock-circle" size={16} color="white" />
              <Text style={styles.featureText}>Progress Tracking</Text>
            </View>
          </View>
        </LinearGradient>
        
        {/* Filters */}
        <Card style={styles.filtersCard}>
          <CardContent style={styles.filtersContent}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search exercises..."
                value={searchQuery}
                onChangeText={(text) => setSearchQuery(text)}
              />
            </View>
            {/* For simplicity, we're not implementing level/topic filters in mobile UI */}
          </CardContent>
        </Card>
        
        {/* Community Writing Challenges */}
        <View style={styles.challengesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Community Challenges</Text>
            <TouchableOpacity onPress={() => console.log('View all challenges')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.challengesList}>
            {/* Sample challenges - in a real app, these would come from an API */}
            <TouchableOpacity 
              style={styles.challengeItem}
              onPress={() => startChallenge('weekly')}
            >
              <LinearGradient
                colors={['#8B5CF6', '#6366F1']}
                style={styles.challengeCard}
              >
                <View style={styles.challengeHeader}>
                  <MaterialIcons name="emoji-events" size={24} color="white" />
                  <View style={styles.challengeInfo}>
                    <Text style={styles.challengeTitle}>Weekly Writing Challenge</Text>
                    <Text style={styles.challengeSubtitle}>Creative Fiction</Text>
                  </View>
                </View>
                <Text style={styles.challengeDescription}>
                  Write a short story (200-500 words) based on this week&apos;s theme: &quot;Unexpected Encounters&quot;
                </Text>
                <View style={styles.challengeMeta}>
                  <View style={styles.challengeMetaItem}>
                    <Ionicons name="time-outline" size={16} color="rgba(255, 255, 255, 0.9)" />
                    <Text style={styles.challengeMetaText}>7 days left</Text>
                  </View>
                  <View style={styles.challengeMetaItem}>
                    <Ionicons name="people-outline" size={16} color="rgba(255, 255, 255, 0.9)" />
                    <Text style={styles.challengeMetaText}>142 participants</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.challengeItem}
              onPress={() => startChallenge('vocabulary')}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.challengeCard}
              >
                <View style={styles.challengeHeader}>
                  <MaterialIcons name="school" size={24} color="white" />
                  <View style={styles.challengeInfo}>
                    <Text style={styles.challengeTitle}>Vocabulary Challenge</Text>
                    <Text style={styles.challengeSubtitle}>Advanced Words</Text>
                  </View>
                </View>
                <Text style={styles.challengeDescription}>
                  Use all 5 vocabulary words in a coherent paragraph: serendipity, ephemeral, ubiquitous, quintessential, mellifluous
                </Text>
                <View style={styles.challengeMeta}>
                  <View style={styles.challengeMetaItem}>
                    <Ionicons name="time-outline" size={16} color="rgba(255, 255, 255, 0.9)" />
                    <Text style={styles.challengeMetaText}>3 days left</Text>
                  </View>
                  <View style={styles.challengeMetaItem}>
                    <Ionicons name="people-outline" size={16} color="rgba(255, 255, 255, 0.9)" />
                    <Text style={styles.challengeMetaText}>87 participants</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Exercise List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading writing exercises...</Text>
          </View>
        ) : exercises.length === 0 ? (
          <Card style={styles.emptyCard}>
            <CardContent style={styles.emptyContent}>
              <MaterialIcons name="edit" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Writing Exercises Found</Text>
              <Text style={styles.emptySubtitle}>
                {debouncedSearchQuery ? 'Try adjusting your search.' : 'Writing exercises will appear here when available.'}
              </Text>
              {debouncedSearchQuery && (
                <Button
                  title="Clear Search"
                  onPress={() => setSearchQuery('')}
                  variant="primary"
                  style={styles.clearButton}
                />
              )}
            </CardContent>
          </Card>
        ) : (
          <View style={styles.exercisesList}>
            {exercises.map((exercise) => {
              const submission = submissions[exercise.id];
              const progress = submission && exercise.totalSentences
                ? (submission.completedSentences / (exercise.totalSentences || 1)) * 100
                : 0;
              
              return (
                <TouchableOpacity
                  key={exercise.id}
                  onPress={() => startExercise(exercise)}
                  style={styles.exerciseItem}
                >
                  <Card style={styles.exerciseCard}>
                    <CardContent style={styles.cardContent}>
                      <View style={styles.exerciseHeader}>
                        <Text style={styles.exerciseTitle} numberOfLines={2}>{exercise.title}</Text>
                        <View style={styles.exerciseBadges}>
                          <LinearGradient
                            colors={getDifficultyColor(exercise.difficulty)}
                            style={styles.difficultyBadgeSmall}
                          >
                            <Text style={styles.difficultyBadgeTextSmall}>
                              {exercise.difficulty}
                            </Text>
                          </LinearGradient>
                          {submission && (
                            <LinearGradient
                              colors={getStatusColor(submission.status)}
                              style={styles.statusBadge}
                            >
                              <Text style={styles.statusBadgeText}>
                                {submission.status.replace('_', ' ')}
                              </Text>
                            </LinearGradient>
                          )}
                        </View>
                      </View>
                      
                      {exercise.instructions && (
                        <Text style={styles.exerciseDescription} numberOfLines={2}>
                          {exercise.instructions}
                        </Text>
                      )}
                      
                      <View style={styles.exerciseDetails}>
                        <View style={styles.detailItem}>
                          <MaterialIcons name="edit" size={16} color="#94A3B8" />
                          <Text style={styles.detailText}>
                            {exercise.sourceLanguage || 'EN'} → {exercise.targetLanguage || 'VI'}
                          </Text>
                        </View>
                        <View style={styles.detailItem}>
                          <MaterialIcons name="format-list-numbered" size={16} color="#94A3B8" />
                          <Text style={styles.detailText}>{exercise.totalSentences || 0} sentences</Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Ionicons name="time-outline" size={16} color="#94A3B8" />
                          <Text style={styles.detailText}>~{exercise.estimatedTime} min</Text>
                        </View>
                        {exercise.topic && (
                          <View style={styles.detailItem}>
                            <Badge style={styles.topicBadgeSmall}>
                              <Text style={styles.topicBadgeTextSmall}>{exercise.topic.name}</Text>
                            </Badge>
                          </View>
                        )}
                      </View>
                      
                      {submission && (
                        <View style={styles.progressSection}>
                          <View style={styles.progressRow}>
                            <Text style={styles.progressLabel}>Progress</Text>
                            <Text style={styles.progressValue}>
                              {submission.completedSentences}/{exercise.totalSentences || 0}
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
                          {submission.overallAccuracy && (
                            <Text style={styles.accuracyText}>
                              Accuracy: {Math.round(submission.overallAccuracy)}%
                            </Text>
                          )}
                        </View>
                      )}
                      
                      <View style={styles.exerciseFooter}>
                        <Button
                          title={
                            submission?.status === 'completed' ? 'Completed' :
                            submission?.status === 'in_progress' ? 'Continue' :
                            'Start'
                          }
                          onPress={() => startExercise(exercise)}
                          disabled={submission?.status === 'completed'}
                          variant={
                            submission?.status === 'completed' ? 'secondary' :
                            submission?.status === 'in_progress' ? 'primary' :
                            'primary'
                          }
                          style={styles.startButton}
                        />
                      </View>
                    </CardContent>
                  </Card>
                </TouchableOpacity>
              );
            })}
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
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    flexDirection: 'column',
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
  heroCard: {
    margin: 24,
    borderRadius: 16,
    padding: 20,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  heroFeatures: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    color: 'white',
  },
  filtersCard: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  filtersContent: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  exercisesList: {
    padding: 24,
    paddingTop: 0,
  },
  exerciseItem: {
    marginBottom: 16,
  },
  exerciseCard: {
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 20,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    marginRight: 12,
  },
  exerciseBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyBadgeTextSmall: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  exerciseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#64748B',
  },
  topicBadgeSmall: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topicBadgeTextSmall: {
    fontSize: 10,
    fontWeight: '500',
    color: '#475569',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
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
  accuracyText: {
    fontSize: 12,
    color: '#64748B',
  },
  exerciseFooter: {
    alignItems: 'flex-end',
  },
  startButton: {
    minWidth: 100,
  },
  emptyCard: {
    margin: 24,
  },
  emptyContent: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  clearButton: {
    minWidth: 120,
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
  sentenceCard: {
    marginHorizontal: 24,
    marginBottom: 20,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  actionButton: {
    flex: 1,
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
  peerReviewCard: {
    margin: 24,
    borderRadius: 16,
  },
  peerReviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  submissionContent: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  submissionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  submissionText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  ratingContainer: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  feedbackContainer: {
    marginBottom: 20,
  },
  feedbackLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitReviewButton: {
    marginTop: 10,
  },
  guidanceButtonContainer: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  guidanceButton: {
    minWidth: 150,
  },
  guidanceCard: {
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  guidanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  guidanceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  guidanceSection: {
    marginBottom: 24,
  },
  guidanceSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  templateContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  templateMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  templateMetaText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  templateStructure: {
    marginBottom: 12,
  },
  structureItem: {
    marginBottom: 8,
  },
  structureLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  structureText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  templateTips: {
    marginTop: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  tipBullet: {
    fontSize: 14,
    color: '#64748B',
    marginRight: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  exampleContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 14,
    color: '#475569',
    fontStyle: 'italic',
  },
  promptItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  promptBullet: {
    fontSize: 14,
    color: '#64748B',
    marginRight: 8,
  },
  promptText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  analyticsPreview: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  analyticsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  analyticsHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticsCard: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    minWidth: 100,
    margin: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flex: 1,
  },
  analyticsItem: {
    alignItems: 'center',
  },
  analyticsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B82F6',
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
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
  grammarStructureLabel: {
    width: 120,
    fontSize: 12,
    color: '#475569',
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
  challengesSection: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  challengesList: {
    gap: 16,
  },
  challengeItem: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  challengeCard: {
    padding: 20,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeInfo: {
    marginLeft: 12,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  challengeSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  challengeDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
    lineHeight: 20,
  },
  challengeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  challengeMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  challengeMetaText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  
});