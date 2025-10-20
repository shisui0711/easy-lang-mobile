import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SpeakingScenario } from '../../types/speaking';

interface ScenarioListProps {
  scenarios: SpeakingScenario[];
  selectedCategory: string;
  selectedLevel: string;
  searchQuery: string;
  onSelectScenario: (scenario: SpeakingScenario) => void;
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

const ScenarioList: React.FC<ScenarioListProps> = ({
  scenarios,
  selectedCategory,
  selectedLevel,
  searchQuery,
  onSelectScenario
}) => {
  const filteredScenarios = scenarios.filter(scenario => 
    (selectedCategory === 'all' || scenario.category.toLowerCase() === selectedCategory.toLowerCase()) &&
    (selectedLevel === 'all' || scenario.level.toLowerCase() === selectedLevel.toLowerCase()) &&
    scenario.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.scenarioList}>
      {filteredScenarios.map(scenario => (
        <TouchableOpacity 
          key={scenario.id} 
          style={styles.scenarioCard}
          onPress={() => onSelectScenario(scenario)}
        >
          <View style={styles.scenarioHeader}>
            <Ionicons name={getScenarioIcon(scenario.type)} size={24} color="#3B82F6" />
            <Text style={styles.scenarioTitle}>{scenario.title}</Text>
          </View>
          <Text style={styles.scenarioDescription}>{scenario.description}</Text>
          <View style={styles.scenarioFooter}>
            <Text style={styles.scenarioLevel}>{scenario.level}</Text>
            <Text style={styles.scenarioTime}>{formatTime(scenario.estimatedTime)}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  scenarioList: {
    gap: 16,
  },
  scenarioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
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
  },
  scenarioLevel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  scenarioTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
});

export default ScenarioList;