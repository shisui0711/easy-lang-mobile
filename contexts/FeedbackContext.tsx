import React, { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';
import { apiClient } from '@/lib/api';

interface FeedbackContextValue {
  submitFeedback: (feedback: FeedbackData) => Promise<boolean>;
  isSubmitting: boolean;
}

interface FeedbackData {
  type: 'bug' | 'feature' | 'general';
  message: string;
  rating?: number;
  contactEmail?: string;
}

const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

export const useFeedback = (): FeedbackContextValue => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

interface FeedbackProviderProps {
  children: React.ReactNode;
}

export const FeedbackProvider: React.FC<FeedbackProviderProps> = ({ children }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitFeedback = async (feedback: FeedbackData): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      // In a real app, this would send feedback to your backend
      const response = await apiClient.post('/feedback', feedback);
      
      if (response.success) {
        Alert.alert('Thank You!', 'Your feedback has been submitted successfully.');
        return true;
      } else {
        Alert.alert('Error', 'Failed to submit feedback. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('Feedback submission failed:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const value: FeedbackContextValue = {
    submitFeedback,
    isSubmitting
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  );
};