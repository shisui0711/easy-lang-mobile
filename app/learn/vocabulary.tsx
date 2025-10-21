import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TabBar } from './vocabulary/TabBar';
import { ReviewSection } from './vocabulary/ReviewSection';
import { PracticeSection } from './vocabulary/PracticeSection';
import { ManageSection } from './vocabulary/ManageSection';
import { UnifiedReviewSection } from './vocabulary/UnifiedReviewSection';
import { OfflineReviewSection } from './vocabulary/OfflineReviewSection';
import { FlashcardMode } from './vocabulary/FlashcardMode';

export default function VocabularyScreen() {
  const [activeTab, setActiveTab] = useState('review');

  // Extended tabs for new features
  const extendedTabs = [
    { id: 'review', label: 'Review' },
    { id: 'unified', label: 'Unified Practice' },
    { id: 'offline', label: 'Offline Review' },
    { id: 'flashcards', label: 'Flashcards' },
    { id: 'practice', label: 'Practice' },
    { id: 'manage', label: 'Manage' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Vocabulary Learning</Text>
        <Text style={styles.headerSubtitle}>
          Master new words through spaced repetition and smart organization
        </Text>
      </View>
      
      <TabBar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        tabs={extendedTabs}
      />
      
      {activeTab === 'review' && <ReviewSection />}
      {activeTab === 'unified' && <UnifiedReviewSection />}
      {activeTab === 'offline' && <OfflineReviewSection />}
      {activeTab === 'flashcards' && <FlashcardMode />}
      {activeTab === 'practice' && <PracticeSection />}
      {activeTab === 'manage' && <ManageSection />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    padding: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
  },
});
