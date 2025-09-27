import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '@/components/ui';
import { learningApi } from '@/lib/api';

interface AddWordFormProps {
  onWordAdded: () => void;
}

export const AddWordForm = ({ onWordAdded }: AddWordFormProps) => {
  const [text, setText] = useState('');
  const [reading, setReading] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError('Word/phrase is required');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await learningApi.addVocabularyCard({ text, reading });
      if (response.success) {
        // Clear form and notify parent
        setText('');
        setReading('');
        setShowForm(false);
        onWordAdded();
      } else {
        setError(response.error || 'Failed to add word');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add word');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showForm) {
    return (
      <TouchableOpacity
        onPress={() => setShowForm(true)}
        style={styles.addWordButton}
      >
        <LinearGradient
          colors={['#3B82F6', '#8B5CF6']}
          style={styles.addWordButtonGradient}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
          <Text style={styles.addWordButtonText}>Add New Word</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.addWordForm}>
      <View style={styles.addWordFormHeader}>
        <Text style={styles.addWordFormTitle}>Add New Word</Text>
        <TouchableOpacity onPress={() => setShowForm(false)}>
          <Ionicons name="close" size={24} color="#94A3B8" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.addWordFormDescription}>
        Enter a word or phrase and we{'\''}ll automatically generate the meaning for you
      </Text>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <Input
        label="Word / Phrase"
        placeholder="Enter word or phrase..."
        value={text}
        onChangeText={setText}
        style={styles.input}
      />
      
      <Input
        label="Pronunciation (Optional)"
        placeholder="/pronunciation/ or reading..."
        value={reading}
        onChangeText={setReading}
        style={styles.input}
      />
      
      <View style={styles.addWordFormActions}>
        <Button
          title={isSubmitting ? "Adding..." : "Add Word"}
          onPress={handleSubmit}
          disabled={isSubmitting}
          loading={isSubmitting}
          style={styles.submitButton}
        />
        <Button
          title="Cancel"
          variant="outline"
          onPress={() => setShowForm(false)}
          disabled={isSubmitting}
          style={styles.cancelButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  addWordButton: {
    marginHorizontal: 24,
    marginVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addWordButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  addWordButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  addWordForm: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginVertical: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addWordFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addWordFormTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  addWordFormDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  errorContainer: {
    backgroundColor: '#FECACA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
  },
  input: {
    marginBottom: 16,
  },
  addWordFormActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  submitButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
});