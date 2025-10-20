import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent, Button } from '@/components/ui';
import { SpeakingScenario } from '../../types/speaking';
import ScenarioList from './ScenarioList';
import ScenarioFilters from './ScenarioFilters';
import RecommendationCard from './RecommendationCard';

interface PracticeTabProps {
  scenarios: SpeakingScenario[];
  userProgress: any;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedLevel: string;
  setSelectedLevel: (level: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectScenario: (scenario: SpeakingScenario) => void;
}

const PracticeTab: React.FC<PracticeTabProps> = ({
  scenarios,
  userProgress,
  selectedCategory,
  setSelectedCategory,
  selectedLevel,
  setSelectedLevel,
  searchQuery,
  setSearchQuery,
  onSelectScenario
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Speaking Practice</Text>
      <Text style={styles.sectionSubtitle}>Improve your speaking skills through interactive scenarios</Text>
      
      <RecommendationCard userProgress={userProgress} />
      
      <ScenarioFilters
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedLevel={selectedLevel}
        setSelectedLevel={setSelectedLevel}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      
      <ScenarioList
        scenarios={scenarios}
        selectedCategory={selectedCategory}
        selectedLevel={selectedLevel}
        searchQuery={searchQuery}
        onSelectScenario={onSelectScenario}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 16,
  },
});

export default PracticeTab;