import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { Input, Button } from '@/components/ui';
import { learningApi } from '@/lib/api';

interface SimpleAddWordFormProps {
  onWordAdded: () => void;
}

export const SimpleAddWordForm = ({ onWordAdded }: SimpleAddWordFormProps) => {
  const [word, setWord] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addWord = async () => {
    if (!word) {
      setError('Please fill in word field');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await learningApi.addVocabularyCard({
        word,
      });

      if (response.success) {
        Alert.alert('Success', 'Word added successfully!');
        onWordAdded();
        setWord('');
      } else {
        setError(response.error || 'Failed to add word. Please try again.');
      }
    } catch (error: any) {
      console.error('Failed to add word:', error);
      setError(error.message || 'Failed to add word. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.addWordForm}>
      <Input
        label="Word"
        value={word}
        onChangeText={setWord}
        placeholder="Enter the word"
        style={styles.input}
      />
      <Button
        title={isLoading ? 'Adding...' : 'Add Word'}
        onPress={addWord}
        disabled={isLoading}
        style={styles.submitButton}
      />
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  addWordForm: {
    marginHorizontal: 24,
    marginVertical: 16,
  },
  input: {
    marginBottom: 16,
  },
  submitButton: {
    flex: 1,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    marginTop: 8,
  },
});