import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SpeakingScenario, DialogueTurn, Feedback } from '../../types/speaking';
import DialogueHistory from './DialogueHistory';
import InputArea from './InputArea';
import FeedbackDisplay from './FeedbackDisplay';
import OfflineSection from './OfflineSection';

interface ScenarioDetailProps {
  selectedScenario: SpeakingScenario;
  dialogueHistory: DialogueTurn[];
  userInput: string;
  setUserInput: (input: string) => void;
  isProcessing: boolean;
  handleUserResponse: () => void;
  handleOptionSelect: (option: string) => void;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  recordingTime: number;
  transcription: string;
  feedback: Feedback | null;
  selectedWords: string[];
  handleWordSelect: (word: string) => void;
  saveScenarioForOffline: (scenario: SpeakingScenario) => void;
  handleSentenceSubmit: () => void;
  handlePronunciationPlay: () => void;
}

const getScenarioIcon = (type: string) => {
  switch (type) {
    case 'conversation': return 'chatbubbles';
    case 'roleplay': return 'people';
    case 'storytelling': return 'book';
    case 'shadow': return 'mic';
    case 'sentenceBuilder': return 'construct';
    case 'pronunciation': return 'volume-high';
    case 'dialogueCoach': return 'school';
    default: return 'mic';
  }
};

const formatTime = (minutes: number) => {
  return `${minutes} min`;
};

const formatRecordingTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const ScenarioDetail: React.FC<ScenarioDetailProps> = ({
  selectedScenario,
  dialogueHistory,
  userInput,
  setUserInput,
  isProcessing,
  handleUserResponse,
  handleOptionSelect,
  isRecording,
  startRecording,
  stopRecording,
  recordingTime,
  transcription,
  feedback,
  selectedWords,
  handleWordSelect,
  saveScenarioForOffline,
  handleSentenceSubmit,
  handlePronunciationPlay
}) => {
  return (
    <View style={styles.scenarioContainer}>
      <View style={styles.scenarioHeader}>
        <Ionicons name={getScenarioIcon(selectedScenario.type)} size={24} color="#3B82F6" />
        <Text style={styles.scenarioTitle}>{selectedScenario.title}</Text>
      </View>
      <Text style={styles.scenarioDescription}>{selectedScenario.description}</Text>
      <View style={styles.scenarioFooter}>
        <Text style={styles.scenarioLevel}>{selectedScenario.level}</Text>
        <Text style={styles.scenarioTime}>{formatTime(selectedScenario.estimatedTime)}</Text>
      </View>

      <OfflineSection 
        scenario={selectedScenario} 
        onSaveForOffline={saveScenarioForOffline} 
      />

      <DialogueHistory 
        dialogueHistory={dialogueHistory} 
        onOptionSelect={handleOptionSelect} 
      />

      <InputArea
        selectedScenario={selectedScenario}
        userInput={userInput}
        setUserInput={setUserInput}
        isProcessing={isProcessing}
        handleUserResponse={handleUserResponse}
        isRecording={isRecording}
        startRecording={startRecording}
        stopRecording={stopRecording}
        selectedWords={selectedWords}
        handleWordSelect={handleWordSelect}
        transcription={transcription}
        handleSentenceSubmit={handleSentenceSubmit}
        handlePronunciationPlay={handlePronunciationPlay}
      />
      
      {/* Recording Status */}
      {isRecording && (
        <View style={styles.recordingStatus}>
          <Text style={styles.recordingStatusText}>
            Recording: {formatRecordingTime(recordingTime)}
          </Text>
        </View>
      )}
      
      <FeedbackDisplay feedback={feedback} />
    </View>
  );
};

const styles = StyleSheet.create({
  scenarioContainer: {
    padding: 16,
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scenarioTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginLeft: 12,
  },
  scenarioDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 12,
  },
  scenarioFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scenarioLevel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  scenarioTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
  recordingStatus: {
    alignItems: 'center',
    marginVertical: 8,
  },
  recordingStatusText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
});

export default ScenarioDetail;