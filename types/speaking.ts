// Types for our speaking practice system
export interface Character {
  id: string;
  name: string;
  personality: string;
  avatar: string;
  greeting: string;
  background?: string; // Add background information
  interests?: string;  // Add character interests
}

export interface SpeakingScenario {
  id: string;
  title: string;
  description: string;
  type: 'conversation' | 'roleplay' | 'storytelling' | 'shadow' | 'sentenceBuilder' | 'pronunciation' | 'dialogueCoach';
  level: string;
  estimatedTime: number;
  characters?: Character[];
  topics?: string[];
  category: string;
  isOfflineAvailable: boolean;
  content?: string; // For shadow speaking and other content
  wordBank?: string[]; // For sentence builder
  culturalContext?: string; // Add cultural context information
}

export interface DialogueTurn {
  id: string;
  speaker: 'user' | 'ai' | 'narrator';
  text: string;
  options?: string[]; // For branching dialogues
  timestamp: number;
}

export interface UserProgress {
  completedScenarios: string[];
  achievements: string[];
  streak: number;
  totalPracticeTime: number;
  speakingSkills: {
    conversation: number;
    pronunciation: number;
    fluency: number;
    vocabulary: number;
  };
  // Add more detailed progress tracking
  scenarioStats: {
    [key: string]: {
      completed: boolean;
      score: number;
      attempts: number;
      lastPracticed: Date;
    };
  };
}

export interface PronunciationFeedback {
  score: number;
  feedback: string;
  suggestions: string[];
}

export interface FluencyFeedback {
  score: number;
  feedback: string;
  suggestions: string[];
}

export interface VocabularyFeedback {
  score: number;
  feedback: string;
  suggestions: string[];
  advanced_words: string[];
}

export interface GrammarError {
  type: string;
  message: string;
  sentence?: string;
}

export interface GrammarFeedback {
  score: number;
  feedback: string;
  errors: GrammarError[];
  suggestions: string[];
}

export interface SpeechAnalysisResponse {
  pronunciation: PronunciationFeedback;
  fluency: FluencyFeedback;
  vocabulary: VocabularyFeedback;
  grammar: GrammarFeedback;
  overall_score: number;
  feedback: string;
}

export interface Feedback {
  grammar: string[];
  vocabulary: string[];
  suggestions: string[];
  score: number;
}