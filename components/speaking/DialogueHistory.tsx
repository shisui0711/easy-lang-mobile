import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DialogueTurn } from '../../types/speaking';

interface DialogueHistoryProps {
  dialogueHistory: DialogueTurn[];
  onOptionSelect: (option: string) => void;
}

const DialogueHistory: React.FC<DialogueHistoryProps> = ({ dialogueHistory, onOptionSelect }) => {
  return (
    <View style={styles.dialogueContainer}>
      {dialogueHistory.map(turn => (
        <View key={turn.id} style={styles.dialogueTurn}>
          <Text style={styles.dialogueSpeaker}>{turn.speaker === 'user' ? 'You' : 'AI'}:</Text>
          <Text style={styles.dialogueText}>{turn.text}</Text>
          {turn.options && turn.options.length > 0 && (
            <View style={styles.dialogueOptions}>
              {turn.options.map(option => (
                <TouchableOpacity 
                  key={option} 
                  style={styles.dialogueOption}
                  onPress={() => onOptionSelect(option)}
                >
                  <Text style={styles.dialogueOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  dialogueContainer: {
    marginVertical: 20,
  },
  dialogueTurn: {
    marginBottom: 16,
  },
  dialogueSpeaker: {
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  dialogueText: {
    fontSize: 16,
    color: '#1E293B',
    lineHeight: 22,
  },
  dialogueOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  dialogueOption: {
    backgroundColor: '#DBEAFE',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    margin: 4,
  },
  dialogueOptionText: {
    fontSize: 14,
    color: '#3B82F6',
  },
});

export default DialogueHistory;