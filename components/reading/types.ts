export interface ReadingExercise {
  id: string;
  title: string;
  content: string;
  type: string;
  level: string;
  wordCount?: number;
  estimatedTime: number;
  questions?: ReadingQuestion[];
  comprehensionQuestions?: ReadingQuestion[];
  topic?: {
    id: string;
    name: string;
  };
}

export interface ReadingQuestion {
  id: string;
  question: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK' | 'SHORT_ANSWER' | 
         'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer';
  options?: string[];
  correctAnswer?: string | string[];
  explanation?: string;
  points?: number;
}

export interface ReadingSubmission {
  id: string;
  exerciseId: string;
  answers: Record<string, string>;
  readingTime?: number;
  comprehensionScore?: number;
  overallScore?: number;
  status: string;
  createdAt: string;
  autoGradeResult?: GradingResult;
}

export interface GradingResult {
  score: number;
  maxScore: number;
  percentage: number;
  feedback: QuestionFeedback[];
}

export interface QuestionFeedback {
  questionId: string;
  isCorrect: boolean;
  correctAnswer: string | string[];
  explanation?: string;
  userAnswer: string;
}