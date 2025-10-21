import React from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet
} from 'react-native';
import { Button } from '@/components/ui';

interface WritingInputAreaProps {
  exerciseType: 'TRANSLATION' | 'CREATIVE' | 'ESSAY' | 'JOURNAL' | 'CHALLENGE';
  userTranslation: string;
  userWriting: string;
  isSubmitting: boolean;
  feedback: any;
  targetLanguage?: string;
  onUserTranslationChange: (text: string) => void;
  onUserWritingChange: (text: string) => void;
  onSubmitTranslation: () => void;
  onSubmitWriting: () => void;
  onTryAgain: () => void;
}

export const WritingInputArea: React.FC<WritingInputAreaProps> = ({
  exerciseType,
  userTranslation,
  userWriting,
  isSubmitting,
  feedback,
  targetLanguage,
  onUserTranslationChange,
  onUserWritingChange,
  onSubmitTranslation,
  onSubmitWriting,
  onTryAgain
}) => {
  return (
    <View style={styles.translationContainer}>
      {exerciseType === 'TRANSLATION' ? (
        // Translation Input
        <>
          <Text style={styles.translationLabel}>
            Your translation ({targetLanguage || 'Vietnamese'}):
          </Text>
          <TextInput
            style={styles.translationInput}
            value={userTranslation}
            onChangeText={onUserTranslationChange}
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
                  onPress={onTryAgain}
                  variant="secondary"
                  style={styles.actionButtonSmall}
                />
              )}
              <Button
                title={isSubmitting ? "Submitting..." : "Submit"}
                onPress={onSubmitTranslation}
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
            onChangeText={onUserWritingChange}
            placeholder="Start writing here..."
            placeholderTextColor="#94A3B8"
            multiline
            textAlignVertical="top"
            editable={!isSubmitting}
          />
          <View style={styles.translationFooter}>
            <Text style={styles.characterCount}>
              {userWriting.length} characters
            </Text>
            <View style={styles.translationActions}>
              <Button
                title={isSubmitting ? "Submitting..." : "Submit"}
                onPress={onSubmitWriting}
                disabled={!userWriting.trim() || isSubmitting}
                variant="primary"
                style={styles.actionButtonSmall}
              />
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
});