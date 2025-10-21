import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReadingExercise } from './types';
import ExerciseCard from './ExerciseCard';

interface PracticeTabProps {
  exercises: ReadingExercise[];
  selectedLevel: string;
  selectedType: string;
  searchQuery: string;
  onLevelChange: (level: string) => void;
  onTypeChange: (type: string) => void;
  onSearchChange: (query: string) => void;
  onStartReading: (exercise: ReadingExercise) => void;
}

export default function PracticeTab({
  exercises,
  selectedLevel,
  selectedType,
  searchQuery,
  onLevelChange,
  onTypeChange,
  onSearchChange,
  onStartReading,
}: PracticeTabProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Choose a Reading Exercise</Text>
      
      {/* Filters */}
      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          <TouchableOpacity 
            key="all-types"
            style={[styles.filterButton, selectedType === 'all' && styles.activeFilterButton]}
            onPress={() => onTypeChange('all')}
          >
            <Text style={[styles.filterButtonText, selectedType === 'all' && styles.activeFilterButtonText]}>
              All Types
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            key="comprehension"
            style={[styles.filterButton, selectedType === 'COMPREHENSION' && styles.activeFilterButton]}
            onPress={() => onTypeChange('COMPREHENSION')}
          >
            <Text style={[styles.filterButtonText, selectedType === 'COMPREHENSION' && styles.activeFilterButtonText]}>
              Comprehension
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            key="vocabulary"
            style={[styles.filterButton, selectedType === 'VOCABULARY' && styles.activeFilterButton]}
            onPress={() => onTypeChange('VOCABULARY')}
          >
            <Text style={[styles.filterButtonText, selectedType === 'VOCABULARY' && styles.activeFilterButtonText]}>
              Vocabulary
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.filterRow}>
          <TouchableOpacity 
            key="grammar"
            style={[styles.filterButton, selectedType === 'GRAMMAR' && styles.activeFilterButton]}
            onPress={() => onTypeChange('GRAMMAR')}
          >
            <Text style={[styles.filterButtonText, selectedType === 'GRAMMAR' && styles.activeFilterButtonText]}>
              Grammar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            key="ielts"
            style={[styles.filterButton, selectedType === 'IELTS_READING' && styles.activeFilterButton]}
            onPress={() => onTypeChange('IELTS_READING')}
          >
            <Text style={[styles.filterButtonText, selectedType === 'IELTS_READING' && styles.activeFilterButtonText]}>
              IELTS Reading
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            key="speed"
            style={[styles.filterButton, selectedType === 'SPEED_READING' && styles.activeFilterButton]}
            onPress={() => onTypeChange('SPEED_READING')}
          >
            <Text style={[styles.filterButtonText, selectedType === 'SPEED_READING' && styles.activeFilterButtonText]}>
              Speed Reading
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.filterRow}>
          <TouchableOpacity 
            key="critical"
            style={[styles.filterButton, selectedType === 'CRITICAL_THINKING' && styles.activeFilterButton]}
            onPress={() => onTypeChange('CRITICAL_THINKING')}
          >
            <Text style={[styles.filterButtonText, selectedType === 'CRITICAL_THINKING' && styles.activeFilterButtonText]}>
              Critical Thinking
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.filterRow}>
          <TouchableOpacity 
            key="all-levels"
            style={[styles.filterButton, selectedLevel === 'all' && styles.activeFilterButton]}
            onPress={() => onLevelChange('all')}
          >
            <Text style={[styles.filterButtonText, selectedLevel === 'all' && styles.activeFilterButtonText]}>
              All Levels
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            key="beginner"
            style={[styles.filterButton, selectedLevel === 'Beginner' && styles.activeFilterButton]}
            onPress={() => onLevelChange('Beginner')}
          >
            <Text style={[styles.filterButtonText, selectedLevel === 'Beginner' && styles.activeFilterButtonText]}>
              Beginner
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            key="intermediate"
            style={[styles.filterButton, selectedLevel === 'Intermediate' && styles.activeFilterButton]}
            onPress={() => onLevelChange('Intermediate')}
          >
            <Text style={[styles.filterButtonText, selectedLevel === 'Intermediate' && styles.activeFilterButtonText]}>
              Intermediate
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.filterRow}>
          <TouchableOpacity 
            key="advanced"
            style={[styles.filterButton, selectedLevel === 'Advanced' && styles.activeFilterButton]}
            onPress={() => onLevelChange('Advanced')}
          >
            <Text style={[styles.filterButtonText, selectedLevel === 'Advanced' && styles.activeFilterButtonText]}>
              Advanced
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            key="expert"
            style={[styles.filterButton, selectedLevel === 'Expert' && styles.activeFilterButton]}
            onPress={() => onLevelChange('Expert')}
          >
            <Text style={[styles.filterButtonText, selectedLevel === 'Expert' && styles.activeFilterButtonText]}>
              Expert
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            value={searchQuery}
            onChangeText={onSearchChange}
          />
          <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
        </View>
      </View>
      
      <View style={styles.exercisesGrid}>
        {exercises.map((exercise) => (
          <ExerciseCard 
            key={exercise.id} 
            exercise={exercise} 
            onPress={() => onStartReading(exercise)} 
          />
        ))}
      </View>
    </View>
  );
}

const styles = {
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 20,
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterRow: {
    flexDirection: 'row' as const,
    marginBottom: 10,
    flexWrap: 'wrap' as const,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  activeFilterButton: {
    backgroundColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#64748B',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  searchContainer: {
    position: 'relative' as const,
    marginBottom: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1E293B',
    paddingLeft: 36,
  },
  searchIcon: {
    position: 'absolute' as const,
    left: 12,
    top: 10,
  },
  exercisesGrid: {
    gap: 16,
  },
} as const;