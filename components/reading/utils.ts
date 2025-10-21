import { ReadingExercise, ReadingQuestion, GradingResult, QuestionFeedback } from './types';

export const getLevelColor = (level: string): [string, string] => {
  switch (level) {
    case 'Beginner':
      return ['#10B981', '#059669'];
    case 'Intermediate':
      return ['#3B82F6', '#6366F1'];
    case 'Advanced':
      return ['#8B5CF6', '#7C3AED'];
    default:
      return ['#6B7280', '#4B5563'];
  }
};

export const getScoreColor = (score: number) => {
  if (score >= 90) return '#10B981'; // green
  if (score >= 80) return '#3B82F6'; // blue
  if (score >= 70) return '#F59E0B'; // yellow
  return '#EF4444'; // red
};

export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const calculateReadingSpeed = (wordCount: number, timeInSeconds: number) => {
  const wordsPerMinute = Math.round((wordCount / timeInSeconds) * 60);
  return wordsPerMinute;
};

// Automatic grading function
export const gradeAnswers = (exercise: ReadingExercise, userAnswers: Record<string, string>): GradingResult => {
  const questions = exercise.comprehensionQuestions || exercise.questions || [];
  let totalScore = 0;
  let maxScore = 0;
  const feedback: QuestionFeedback[] = [];

  for (const [index, question] of questions.entries()) {
    // Use the same key format as in the question components (q0, q1, etc.)
    const questionKey = `q${index}`;
    const userAnswer = userAnswers[questionKey] || '';
    const correctAnswer = question.correctAnswer;
    const points = question.points || 1;
    maxScore += points;

    let isCorrect = false;
    let normalizedCorrectAnswer: string | string[] = '';

    switch (question.type) {
      case 'MULTIPLE_CHOICE':
      case 'multiple_choice':
        isCorrect = userAnswer === (Array.isArray(correctAnswer) ? correctAnswer[0] : correctAnswer);
        normalizedCorrectAnswer = Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer || '';
        break;
      case 'TRUE_FALSE':
      case 'true_false':
        isCorrect = userAnswer === (Array.isArray(correctAnswer) ? correctAnswer[0] : correctAnswer);
        normalizedCorrectAnswer = Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer || '';
        break;
      case 'FILL_BLANK':
      case 'fill_blank':
      case 'SHORT_ANSWER':
      case 'short_answer':
        // For text-based answers, we'll do a case-insensitive comparison with some flexibility
        const userAnswerLower = userAnswer.toLowerCase().trim();
        if (Array.isArray(correctAnswer)) {
          isCorrect = correctAnswer.some(ans => 
            userAnswerLower.includes(ans.toLowerCase()) || 
            ans.toLowerCase().includes(userAnswerLower)
          );
          normalizedCorrectAnswer = correctAnswer.join(' or ');
        } else if (typeof correctAnswer === 'string') {
          isCorrect = userAnswerLower === correctAnswer.toLowerCase();
          normalizedCorrectAnswer = correctAnswer;
        }
        break;
    }

    if (isCorrect) {
      totalScore += points;
    }

    feedback.push({
      questionId: questionKey, // Use the same key format
      isCorrect,
      correctAnswer: normalizedCorrectAnswer,
      explanation: question.explanation,
      userAnswer
    });
  }

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  return {
    score: totalScore,
    maxScore,
    percentage,
    feedback
  };
};