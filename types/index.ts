export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  level: number;
  xp: number;
  streak: number;
  prestige?: number;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  user: User;
  isAuthenticated: boolean;
  token?: string;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface VocabularyCard {
  id: string;
  word: string;
  definition: string;
  pronunciation?: string;
  examples: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  repetitions: number;
  nextReview: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  earned?: boolean;
  progress?: number;
  maxProgress?: number;
  earnedAt?: string;
  icon?: string;
  reward?: string;
}

export interface UserStats {
  wordsLearned: number;
  writingScore: number;
  speakingScore: number;
  readingScore: number;
  listeningScore: number;
  streak: number;
  totalXP: number;
  level: number;
  dailyGoalProgress: number;
  weeklyProgress: number;
}

export interface LearningGoal {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  target: number;
  current: number;
  description: string;
  deadline: string;
}

export interface Exercise {
  id: string;
  type: 'vocabulary' | 'writing' | 'speaking' | 'reading' | 'listening';
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  questions: Question[];
  completedAt?: string;
  score?: number;
}

export interface Question {
  id: string;
  type: 'multiple_choice' | 'fill_blank' | 'essay' | 'speaking' | 'listening';
  question: string;
  options?: string[];
  correctAnswer?: string;
  userAnswer?: string;
  points: number;
}

export interface Progress {
  exerciseId: string;
  score: number;
  timeSpent: number;
  completedAt: string;
  answers: Answer[];
}

export interface Answer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeSpent: number;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  exerciseCount: number;
  completedCount: number;
  category: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UserSettings {
  notifications: boolean;
  darkMode: boolean;
  language: string;
  dailyGoal: number;
  reminderTime: string;
  autoPlay: boolean;
  soundEffects: boolean;
}

// Gamification Types
export interface UserXP {
  totalXP: number;
  level: number;
  prestige: number;
  levelName: string;
  levelTier: string;
  progress: number;
  xpToNextLevel: number;
  prestigeLevel: number;
  prestigePoints: number;
}

export interface XPTransaction {
  id: string;
  userId: string;
  amount: number;
  activityType: string;
  description: string;
  createdAt: string;
}

export interface PrestigeInfo {
  level: number;
  title: string;
  points: number;
  benefits: string[];
  nextLevelXP: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  level: number;
  totalXP: number;
  streak: number;
  position: number;
  avatar?: string;
}

// Navigation types
export type RootTabParamList = {
  Dashboard: undefined;
  Learn: undefined;
  Progress: undefined;
  Profile: undefined;
};

export type LearnStackParamList = {
  LearnHome: undefined;
  Vocabulary: undefined;
  Writing: undefined;
  Speaking: undefined;
  Reading: undefined;
  Listening: undefined;
  Exercise: { exerciseId: string; type: string };
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Achievements: undefined;
  Settings: undefined;
  Stats: undefined;
  AchievementDetail: { achievementId: string };
};
