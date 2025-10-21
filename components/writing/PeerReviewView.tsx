import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  ScrollView
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { Card, CardContent, Button } from '@/components/ui';

interface WritingSubmissionWithReviews {
  id: string;
  status: string;
  currentSentenceIndex: number;
  completedSentences: number;
  overallAccuracy?: number;
  totalTimeSpent: number;
  content?: string;
  peerReviews?: any[];
  averageRating?: number;
  reviewCount?: number;
}

interface PeerReviewViewProps {
  currentSubmission: WritingSubmissionWithReviews;
  isSubmittingReview: boolean;
  onBack: () => void;
  onSubmitReview: (submissionId: string) => void;
}

export const PeerReviewView: React.FC<PeerReviewViewProps> = ({
  currentSubmission,
  isSubmittingReview,
  onBack,
  onSubmitReview
}) => {
  const [peerReview, setPeerReview] = useState({ rating: 5, feedback: '' });

  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <AntDesign name="arrow-left" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Peer Review</Text>
      </View>
      
      <Card style={styles.peerReviewCard}>
        <CardContent style={styles.cardContent}>
          <Text style={styles.peerReviewTitle}>Review Writing Submission</Text>
          
          {currentSubmission.content && (
            <View style={styles.submissionContent}>
              <Text style={styles.submissionLabel}>Submitted Writing:</Text>
              <Text style={styles.submissionText}>{currentSubmission.content}</Text>
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
            onPress={() => onSubmitReview(currentSubmission.id)}
            disabled={isSubmittingReview || !peerReview.feedback.trim()}
            variant="primary"
            style={styles.submitReviewButton}
          />
        </CardContent>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  peerReviewCard: {
    margin: 24,
    borderRadius: 16,
  },
  cardContent: {
    padding: 20,
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
});