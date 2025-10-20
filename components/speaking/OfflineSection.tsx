import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui';
import { SpeakingScenario } from '../../types/speaking';

interface OfflineSectionProps {
  scenario: SpeakingScenario;
  onSaveForOffline: (scenario: SpeakingScenario) => void;
}

const OfflineSection: React.FC<OfflineSectionProps> = ({ scenario, onSaveForOffline }) => {
  return (
    <View style={styles.offlineSection}>
      <View style={styles.offlineHeader}>
        <Ionicons name="cloud-offline" size={20} color="#64748B" />
        <Text style={styles.offlineTitle}>Offline Practice</Text>
      </View>
      <Text style={styles.offlineDescription}>
        This scenario can be practiced offline. {scenario.isOfflineAvailable 
          ? 'It is already available for offline use.' 
          : 'Save it for offline practice.'}
      </Text>
      {!scenario.isOfflineAvailable && (
        <Button 
          title="Save for Offline Use" 
          onPress={() => onSaveForOffline(scenario)}
          style={styles.offlineButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  offlineSection: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
  },
  offlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  offlineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
  },
  offlineDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  offlineButton: {
    alignSelf: 'flex-start',
  },
});

export default OfflineSection;