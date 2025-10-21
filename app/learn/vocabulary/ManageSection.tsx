import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Progress, Button, Input } from '@/components/ui';
import { apiClient, learningApi } from '@/lib/api';
import { AddWordForm } from './AddWordForm';
import { VocabularyAchievements } from '@/components/vocabulary/VocabularyAchievements';

interface VocabularyCard {
  id: string;
  wordId: string;
  stability: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  state: string;
  due: string;
  word: {
    id: string;
    text: string;
    meaning: string;
    pronunciation?: string;
    translation?: string;
    partOfSpeech?: string;
    examples?: string[];
  };
}

interface VocabularySet {
  id: string;
  name: string;
  language: string;
}

interface Topic {
  id: string;
  name: string;
}

interface VocabularyCardWithSet extends VocabularyCard {
  vocabularySet: VocabularySet;
  topic?: Topic;
}

export const ManageSection = () => {
  const [vocabularyCards, setVocabularyCards] = useState<VocabularyCardWithSet[]>([]);
  const [vocabularySets, setVocabularySets] = useState<VocabularySet[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    language: "",
    topicId: "",
    setId: "",
    difficulty: "",
    partOfSpeech: "",
    frequencyMin: "",
    frequencyMax: "",
    dateFrom: "",
    dateTo: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showLanguageFilter, setShowLanguageFilter] = useState(false);
  const [showSetFilter, setShowSetFilter] = useState(false);
  const [showTopicFilter, setShowTopicFilter] = useState(false);
  const [showDifficultyFilter, setShowDifficultyFilter] = useState(false);
  const [showPartOfSpeechFilter, setShowPartOfSpeechFilter] = useState(false);
  const [showFrequencyFilter, setShowFrequencyFilter] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [activeTab, setActiveTab] = useState('vocabulary'); // 'vocabulary' or 'achievements'

  const fetchVocabularyCards = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        pageNumber: currentPage.toString(),
        pageSize: "12",
      };

      if (searchQuery) params.searchQuery = searchQuery;
      if (filters.language) params.language = filters.language;
      if (filters.topicId) params.topicId = filters.topicId;
      if (filters.setId) params.setId = filters.setId;
      if (filters.difficulty) params.difficulty = filters.difficulty;
      if (filters.partOfSpeech) params.partOfSpeech = filters.partOfSpeech;
      if (filters.frequencyMin) params.frequencyMin = filters.frequencyMin;
      if (filters.frequencyMax) params.frequencyMax = filters.frequencyMax;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;

      const response = await learningApi.getVocabularyCards(params);
      if (response.success && response.data) {
        setVocabularyCards((response.data as any)?.data || []);
        setTotalPages((response.data as any)?.pagination?.totalPages || 1);
      } else {
        Alert.alert('Error', response.error || 'Failed to fetch vocabulary cards');
      }
    } catch (error) {
      console.error('Error fetching vocabulary cards:', error);
      Alert.alert('Error', 'Failed to fetch vocabulary cards');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVocabularySets = async () => {
    try {
      const response = await apiClient.get('/vocabulary/sets?pageSize=50');
      if (response.success && response.data) {
        setVocabularySets((response.data as any)?.data || []);
      }
    } catch (error) {
      console.error('Error fetching vocabulary sets:', error);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await apiClient.get('/topic?pageSize=50');
      if (response.success && response.data) {
        setTopics((response.data as any)?.data || []);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  useEffect(() => {
    fetchVocabularyCards();
    fetchVocabularySets();
    fetchTopics();
  }, [currentPage, searchQuery, filters]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchVocabularyCards();
  };

  const resetFilters = () => {
    setFilters({ 
      language: "", 
      topicId: "", 
      setId: "", 
      difficulty: "",
      partOfSpeech: "",
      frequencyMin: "",
      frequencyMax: "",
      dateFrom: "",
      dateTo: "",
    });
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Render filter dropdowns
  const renderLanguageFilter = () => (
    <View style={styles.filterDropdown}>
      <TouchableOpacity 
        style={styles.filterOption}
        onPress={() => {
          handleFilterChange('language', '');
          setShowLanguageFilter(false);
        }}
      >
        <Text style={[styles.filterOptionText, !filters.language && styles.filterOptionTextSelected]}>
          All Languages
        </Text>
      </TouchableOpacity>
      {['en', 'vi', 'ja', 'zh'].map((lang) => (
        <TouchableOpacity 
          key={lang}
          style={styles.filterOption}
          onPress={() => {
            handleFilterChange('language', lang);
            setShowLanguageFilter(false);
          }}
        >
          <Text style={[styles.filterOptionText, filters.language === lang && styles.filterOptionTextSelected]}>
            {lang.toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSetFilter = () => (
    <View style={styles.filterDropdown}>
      <TouchableOpacity 
        style={styles.filterOption}
        onPress={() => {
          handleFilterChange('setId', '');
          setShowSetFilter(false);
        }}
      >
        <Text style={[styles.filterOptionText, !filters.setId && styles.filterOptionTextSelected]}>
          All Sets
        </Text>
      </TouchableOpacity>
      {vocabularySets.map((set) => (
        <TouchableOpacity 
          key={set.id}
          style={styles.filterOption}
          onPress={() => {
            handleFilterChange('setId', set.id);
            setShowSetFilter(false);
          }}
        >
          <Text style={[styles.filterOptionText, filters.setId === set.id && styles.filterOptionTextSelected]}>
            {set.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTopicFilter = () => (
    <View style={styles.filterDropdown}>
      <TouchableOpacity 
        style={styles.filterOption}
        onPress={() => {
          handleFilterChange('topicId', '');
          setShowTopicFilter(false);
        }}
      >
        <Text style={[styles.filterOptionText, !filters.topicId && styles.filterOptionTextSelected]}>
          All Topics
        </Text>
      </TouchableOpacity>
      {topics.map((topic) => (
        <TouchableOpacity 
          key={topic.id}
          style={styles.filterOption}
          onPress={() => {
            handleFilterChange('topicId', topic.id);
            setShowTopicFilter(false);
          }}
        >
          <Text style={[styles.filterOptionText, filters.topicId === topic.id && styles.filterOptionTextSelected]}>
            {topic.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDifficultyFilter = () => (
    <View style={styles.filterDropdown}>
      <TouchableOpacity 
        style={styles.filterOption}
        onPress={() => {
          handleFilterChange('difficulty', '');
          setShowDifficultyFilter(false);
        }}
      >
        <Text style={[styles.filterOptionText, !filters.difficulty && styles.filterOptionTextSelected]}>
          All Difficulties
        </Text>
      </TouchableOpacity>
      {['beginner', 'intermediate', 'advanced'].map((difficulty) => (
        <TouchableOpacity 
          key={difficulty}
          style={styles.filterOption}
          onPress={() => {
            handleFilterChange('difficulty', difficulty);
            setShowDifficultyFilter(false);
          }}
        >
          <Text style={[styles.filterOptionText, filters.difficulty === difficulty && styles.filterOptionTextSelected]}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPartOfSpeechFilter = () => (
    <View style={styles.filterDropdown}>
      <TouchableOpacity 
        style={styles.filterOption}
        onPress={() => {
          handleFilterChange('partOfSpeech', '');
          setShowPartOfSpeechFilter(false);
        }}
      >
        <Text style={[styles.filterOptionText, !filters.partOfSpeech && styles.filterOptionTextSelected]}>
          All Types
        </Text>
      </TouchableOpacity>
      {['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection'].map((pos) => (
        <TouchableOpacity 
          key={pos}
          style={styles.filterOption}
          onPress={() => {
            handleFilterChange('partOfSpeech', pos);
            setShowPartOfSpeechFilter(false);
          }}
        >
          <Text style={[styles.filterOptionText, filters.partOfSpeech === pos && styles.filterOptionTextSelected]}>
            {pos.charAt(0).toUpperCase() + pos.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderFrequencyFilter = () => (
    <View style={styles.filterDropdown}>
      <View style={styles.filterOption}>
        <Text style={styles.filterOptionText}>Min Frequency:</Text>
        <TextInput
          style={styles.frequencyInput}
          value={filters.frequencyMin}
          onChangeText={(value) => setFilters(prev => ({ ...prev, frequencyMin: value }))}
          keyboardType="numeric"
          placeholder="0"
        />
      </View>
      <View style={styles.filterOption}>
        <Text style={styles.filterOptionText}>Max Frequency:</Text>
        <TextInput
          style={styles.frequencyInput}
          value={filters.frequencyMax}
          onChangeText={(value) => setFilters(prev => ({ ...prev, frequencyMax: value }))}
          keyboardType="numeric"
          placeholder="100"
        />
      </View>
      <View style={styles.filterActions}>
        <TouchableOpacity 
          style={styles.filterActionButton}
          onPress={() => {
            handleFilterChange('frequencyMin', filters.frequencyMin);
            handleFilterChange('frequencyMax', filters.frequencyMax);
            setShowFrequencyFilter(false);
          }}
        >
          <Text style={styles.filterActionText}>Apply</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.filterActionButton}
          onPress={() => {
            setFilters(prev => ({ ...prev, frequencyMin: '', frequencyMax: '' }));
            handleFilterChange('frequencyMin', '');
            handleFilterChange('frequencyMax', '');
            setShowFrequencyFilter(false);
          }}
        >
          <Text style={styles.filterActionText}>Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDateFilter = () => (
    <View style={styles.filterDropdown}>
      <View style={styles.filterOption}>
        <Text style={styles.filterOptionText}>From Date:</Text>
        <TextInput
          style={styles.frequencyInput}
          value={filters.dateFrom}
          onChangeText={(value) => setFilters(prev => ({ ...prev, dateFrom: value }))}
          placeholder="YYYY-MM-DD"
        />
      </View>
      <View style={styles.filterOption}>
        <Text style={styles.filterOptionText}>To Date:</Text>
        <TextInput
          style={styles.frequencyInput}
          value={filters.dateTo}
          onChangeText={(value) => setFilters(prev => ({ ...prev, dateTo: value }))}
          placeholder="YYYY-MM-DD"
        />
      </View>
      <View style={styles.filterActions}>
        <TouchableOpacity 
          style={styles.filterActionButton}
          onPress={() => {
            handleFilterChange('dateFrom', filters.dateFrom);
            handleFilterChange('dateTo', filters.dateTo);
            setShowDateFilter(false);
          }}
        >
          <Text style={styles.filterActionText}>Apply</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.filterActionButton}
          onPress={() => {
            setFilters(prev => ({ ...prev, dateFrom: '', dateTo: '' }));
            handleFilterChange('dateFrom', '');
            handleFilterChange('dateTo', '');
            setShowDateFilter(false);
          }}
        >
          <Text style={styles.filterActionText}>Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <AddWordForm onWordAdded={fetchVocabularyCards} />
      
      {/* Header with Tabs */}
      <View style={styles.managementHeader}>
        <Text style={styles.managementTitle}>Vocabulary Management</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'vocabulary' && styles.activeTab]}
            onPress={() => setActiveTab('vocabulary')}
          >
            <Text style={[styles.tabText, activeTab === 'vocabulary' && styles.activeTabText]}>Vocabulary</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
            onPress={() => setActiveTab('achievements')}
          >
            <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>Achievements</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.managementSubtitle}>
          {activeTab === 'vocabulary' 
            ? 'Browse, search, and organize your vocabulary cards' 
            : 'Track your vocabulary learning achievements'}
        </Text>
      </View>
      
      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vocabulary words..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>
        
        <View style={styles.filterRow}>
          <View style={styles.filterControls}>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => {
                setShowLanguageFilter(!showLanguageFilter);
                setShowSetFilter(false);
                setShowTopicFilter(false);
                setShowDifficultyFilter(false);
              }}
            >
              <Ionicons name="filter" size={20} color="#3B82F6" />
              <Text style={styles.filterButtonText}>Language</Text>
              {filters.language ? <View style={styles.filterBadge} /> : null}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => {
                setShowSetFilter(!showSetFilter);
                setShowLanguageFilter(false);
                setShowTopicFilter(false);
                setShowDifficultyFilter(false);
              }}
            >
              <Ionicons name="book" size={20} color="#3B82F6" />
              <Text style={styles.filterButtonText}>Vocabulary Set</Text>
              {filters.setId ? <View style={styles.filterBadge} /> : null}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => {
                setShowTopicFilter(!showTopicFilter);
                setShowLanguageFilter(false);
                setShowSetFilter(false);
                setShowDifficultyFilter(false);
              }}
            >
              <Ionicons name="bookmark" size={20} color="#3B82F6" />
              <Text style={styles.filterButtonText}>Topic</Text>
              {filters.topicId ? <View style={styles.filterBadge} /> : null}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => {
                setShowDifficultyFilter(!showDifficultyFilter);
                setShowLanguageFilter(false);
                setShowSetFilter(false);
                setShowTopicFilter(false);
                setShowPartOfSpeechFilter(false);
                setShowFrequencyFilter(false);
                setShowDateFilter(false);
              }}
            >
              <Ionicons name="bar-chart" size={20} color="#3B82F6" />
              <Text style={styles.filterButtonText}>Difficulty</Text>
              {filters.difficulty ? <View style={styles.filterBadge} /> : null}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => {
                setShowPartOfSpeechFilter(!showPartOfSpeechFilter);
                setShowLanguageFilter(false);
                setShowSetFilter(false);
                setShowTopicFilter(false);
                setShowDifficultyFilter(false);
                setShowFrequencyFilter(false);
                setShowDateFilter(false);
              }}
            >
              <Ionicons name="bookmarks" size={20} color="#3B82F6" />
              <Text style={styles.filterButtonText}>Type</Text>
              {filters.partOfSpeech ? <View style={styles.filterBadge} /> : null}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => {
                setShowFrequencyFilter(!showFrequencyFilter);
                setShowLanguageFilter(false);
                setShowSetFilter(false);
                setShowTopicFilter(false);
                setShowDifficultyFilter(false);
                setShowPartOfSpeechFilter(false);
                setShowDateFilter(false);
              }}
            >
              <Ionicons name="stats-chart" size={20} color="#3B82F6" />
              <Text style={styles.filterButtonText}>Frequency</Text>
              {(filters.frequencyMin || filters.frequencyMax) ? <View style={styles.filterBadge} /> : null}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => {
                setShowDateFilter(!showDateFilter);
                setShowLanguageFilter(false);
                setShowSetFilter(false);
                setShowTopicFilter(false);
                setShowDifficultyFilter(false);
                setShowPartOfSpeechFilter(false);
                setShowFrequencyFilter(false);
              }}
            >
              <Ionicons name="calendar" size={20} color="#3B82F6" />
              <Text style={styles.filterButtonText}>Date</Text>
              {(filters.dateFrom || filters.dateTo) ? <View style={styles.filterBadge} /> : null}
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearButton} onPress={resetFilters}>
                <Text style={styles.clearButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
          
        </View>
        
        {/* Filter Dropdowns */}
        {showLanguageFilter && renderLanguageFilter()}
        {showSetFilter && renderSetFilter()}
        {showTopicFilter && renderTopicFilter()}
        {showDifficultyFilter && renderDifficultyFilter()}
        {showPartOfSpeechFilter && renderPartOfSpeechFilter()}
        {showFrequencyFilter && renderFrequencyFilter()}
        {showDateFilter && renderDateFilter()}
      </View>
      
      {/* Vocabulary Cards Grid */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading vocabulary cards...</Text>
        </View>
      ) : (
        <FlatList
          data={vocabularyCards}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.vocabularyGrid}
          renderItem={({ item }) => (
            <View style={styles.vocabularyCardItemManage}>
              <View style={styles.vocabularyCardHeader}>
                <Text style={styles.vocabularyCardLanguage}>
                  {item.vocabularySet?.language?.toUpperCase() || 'EN'}
                </Text>
                <Text style={[
                  styles.vocabularyCardDifficulty,
                  item.difficulty === 'beginner' && styles.difficultyBeginner,
                  item.difficulty === 'intermediate' && styles.difficultyIntermediate,
                  item.difficulty === 'advanced' && styles.difficultyAdvanced
                ]}>
                  {item.difficulty === 'beginner' ? 'Beginner' :
                   item.difficulty === 'intermediate' ? 'Intermediate' : 'Advanced'}
                </Text>
              </View>
              
              <Text style={styles.vocabularyCardWord}>{item.word.text}</Text>
              
              {item.word.pronunciation && (
                <Text style={styles.vocabularyCardPronunciation}>
                  /{item.word.pronunciation}/
                </Text>
              )}
              
              <Text style={styles.vocabularyCardMeaningText} numberOfLines={2}>
                {item.word.meaning}
              </Text>
              
              <View style={styles.vocabularyCardFooter}>
                <Text style={styles.vocabularyCardSetName}>
                  {item.vocabularySet?.name || 'Default Set'}
                </Text>
                {item.topic && (
                  <Text style={styles.vocabularyCardTopic}>
                    {item.topic.name}
                  </Text>
                )}
              </View>
            </View>
          )}
          contentContainerStyle={styles.vocabularyList}
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                  disabled={currentPage === 1}
                  onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                >
                  <Text style={styles.paginationButtonText}>Previous</Text>
                </TouchableOpacity>
                
                <Text style={styles.paginationText}>
                  Page {currentPage} of {totalPages}
                </Text>
                
                <TouchableOpacity
                  style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                  disabled={currentPage === totalPages}
                  onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                >
                  <Text style={styles.paginationButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  managementHeader: {
    marginHorizontal: 24,
    marginBottom: 16,
    paddingVertical: 16,
  },
  managementTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  managementSubtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#EFF6FF',
  },
  tabText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  searchContainer: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  searchIcon: {
    marginLeft: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },
  clearButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearButtonText: {
    color: '#64748B',
    fontWeight: '600',
  },
  filterDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: 8,
    maxHeight: 200,
  },
  filterOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  filterOptionText: {
    fontSize: 14,
    color: '#1E293B',
  },
  filterOptionTextSelected: {
    fontWeight: '600',
    color: '#3B82F6',
  },
  filterBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 4,
  },
  frequencyInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
    fontSize: 14,
    color: '#1E293B',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  filterActionButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  filterActionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  vocabularyList: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  vocabularyGrid: {
    justifyContent: 'space-between',
    marginHorizontal: 16,
  },
  vocabularyCardItemManage: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    width: '45%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    transform: [{ scale: 1 }],
  },
  vocabularyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  vocabularyCardLanguage: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  vocabularyCardDifficulty: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  difficultyBeginner: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
  },
  difficultyIntermediate: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
  },
  difficultyAdvanced: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
  },
  vocabularyCardWord: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  vocabularyCardPronunciation: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  vocabularyCardMeaningText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  vocabularyCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vocabularyCardSetName: {
    fontSize: 12,
    color: '#94A3B8',
  },
  vocabularyCardTopic: {
    fontSize: 12,
    color: '#94A3B8',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 24,
    marginVertical: 24,
  },
  paginationButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  paginationButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  paginationButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  paginationText: {
    fontSize: 14,
    color: '#64748B',
  },
});