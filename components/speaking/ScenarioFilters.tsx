import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, TextInput } from 'react-native';

interface ScenarioFiltersProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedLevel: string;
  setSelectedLevel: (level: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const ScenarioFilters: React.FC<ScenarioFiltersProps> = ({
  selectedCategory,
  setSelectedCategory,
  selectedLevel,
  setSelectedLevel,
  searchQuery,
  setSearchQuery
}) => {
  return (
    <View style={styles.filterContainer}>
      <View style={styles.filterRow}>
        <TouchableOpacity 
          style={[styles.filterButton, selectedCategory === 'all' && styles.activeFilter]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[styles.filterText, selectedCategory === 'all' && styles.activeFilterText]}>All Categories</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, selectedCategory === 'conversation' && styles.activeFilter]}
          onPress={() => setSelectedCategory('conversation')}
        >
          <Text style={[styles.filterText, selectedCategory === 'conversation' && styles.activeFilterText]}>Conversations</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, selectedCategory === 'roleplay' && styles.activeFilter]}
          onPress={() => setSelectedCategory('roleplay')}
        >
          <Text style={[styles.filterText, selectedCategory === 'roleplay' && styles.activeFilterText]}>Roleplays</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, selectedCategory === 'storytelling' && styles.activeFilter]}
          onPress={() => setSelectedCategory('storytelling')}
        >
          <Text style={[styles.filterText, selectedCategory === 'storytelling' && styles.activeFilterText]}>Storytelling</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, selectedCategory === 'shadow' && styles.activeFilter]}
          onPress={() => setSelectedCategory('shadow')}
        >
          <Text style={[styles.filterText, selectedCategory === 'shadow' && styles.activeFilterText]}>Shadow Speaking</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, selectedCategory === 'sentenceBuilder' && styles.activeFilter]}
          onPress={() => setSelectedCategory('sentenceBuilder')}
        >
          <Text style={[styles.filterText, selectedCategory === 'sentenceBuilder' && styles.activeFilterText]}>Sentence Builder</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, selectedCategory === 'pronunciation' && styles.activeFilter]}
          onPress={() => setSelectedCategory('pronunciation')}
        >
          <Text style={[styles.filterText, selectedCategory === 'pronunciation' && styles.activeFilterText]}>Pronunciation</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, selectedCategory === 'dialogueCoach' && styles.activeFilter]}
          onPress={() => setSelectedCategory('dialogueCoach')}
        >
          <Text style={[styles.filterText, selectedCategory === 'dialogueCoach' && styles.activeFilterText]}>Dialogue Coach</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.filterRow}>
        <TouchableOpacity 
          style={[styles.filterButton, selectedLevel === 'all' && styles.activeFilter]}
          onPress={() => setSelectedLevel('all')}
        >
          <Text style={[styles.filterText, selectedLevel === 'all' && styles.activeFilterText]}>All Levels</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, selectedLevel === 'beginner' && styles.activeFilter]}
          onPress={() => setSelectedLevel('beginner')}
        >
          <Text style={[styles.filterText, selectedLevel === 'beginner' && styles.activeFilterText]}>Beginner</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, selectedLevel === 'intermediate' && styles.activeFilter]}
          onPress={() => setSelectedLevel('intermediate')}
        >
          <Text style={[styles.filterText, selectedLevel === 'intermediate' && styles.activeFilterText]}>Intermediate</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, selectedLevel === 'advanced' && styles.activeFilter]}
          onPress={() => setSelectedLevel('advanced')}
        >
          <Text style={[styles.filterText, selectedLevel === 'advanced' && styles.activeFilterText]}>Advanced</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search scenarios..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    marginBottom: 20,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterButton: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilter: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    color: '#64748B',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
});

export default ScenarioFilters;