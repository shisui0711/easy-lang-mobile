import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui';
import { SpeakingScenario } from '../../types/speaking';

interface InputAreaProps {
  selectedScenario: SpeakingScenario;
  userInput: string;
  setUserInput: (input: string) => void;
  isProcessing: boolean;
  handleUserResponse: () => void;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  selectedWords: string[];
  handleWordSelect: (word: string) => void;
  transcription: string;
  handleSentenceSubmit?: () => void;
  handlePronunciationPlay?: () => void;
}

const InputArea: React.FC<InputAreaProps> = ({
  selectedScenario,
  userInput,
  setUserInput,
  isProcessing,
  handleUserResponse,
  isRecording,
  startRecording,
  stopRecording,
  selectedWords,
  handleWordSelect,
  transcription,
  handleSentenceSubmit,
  handlePronunciationPlay
}) => {
  return (
    <View style={styles.inputContainer}>
      {selectedScenario.type === 'sentenceBuilder' && (
        <View style={styles.wordBank}>
          {selectedScenario.wordBank?.map(word => (
            <TouchableOpacity 
              key={word} 
              style={[styles.word, selectedWords.includes(word) && styles.selectedWord]}
              onPress={() => handleWordSelect(word)}
            >
              <Text style={styles.wordText}>{word}</Text>
            </TouchableOpacity>
          ))}
          {selectedWords.length > 0 && handleSentenceSubmit && (
            <Button 
              title="Submit Sentence" 
              onPress={handleSentenceSubmit}
              style={styles.sentenceSubmitButton}
            />
          )}
        </View>
      )}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type your response here..."
          value={userInput}
          onChangeText={setUserInput}
          onSubmitEditing={handleUserResponse}
          multiline={selectedScenario.type === 'shadow' || selectedScenario.type === 'pronunciation'}
        />
        {selectedScenario.type === 'pronunciation' && handlePronunciationPlay && (
          <TouchableOpacity 
            style={styles.pronunciationButton}
            onPress={handlePronunciationPlay}
          >
            <Ionicons name="play" size={24} color="#3B82F6" />
          </TouchableOpacity>
        )}
        {/* Recording Button */}
        <TouchableOpacity 
          style={[styles.recordingButton, isRecording && styles.recordingButtonActive]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Ionicons 
            name={isRecording ? "stop" : "mic"} 
            size={24} 
            color={isRecording ? "#EF4444" : "#3B82F6"} 
          />
        </TouchableOpacity>
        <Button 
          title="Submit" 
          onPress={handleUserResponse}
          style={styles.submitButton}
          disabled={isProcessing}
        />
      </View>
      
      {/* Transcription Display */}
      {transcription ? (
        <View style={styles.transcriptionContainer}>
          <Text style={styles.transcriptionLabel}>Transcribed Text:</Text>
          <Text style={styles.transcriptionText}>{transcription}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginTop: 16,
  },
  wordBank: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    alignItems: 'center',
  },
  word: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    margin: 4,
  },
  selectedWord: {
    backgroundColor: '#3B82F6',
  },
  wordText: {
    color: '#1E293B',
  },
  sentenceSubmitButton: {
    margin: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    maxHeight: 100,
  },
  pronunciationButton: {
    backgroundColor: '#3B82F6',
    padding: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  recordingButton: {
    backgroundColor: '#E2E8F0',
    padding: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  recordingButtonActive: {
    backgroundColor: '#FECACA',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  transcriptionContainer: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  transcriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  transcriptionText: {
    fontSize: 16,
    color: '#1E293B',
  },
});

export default InputArea;