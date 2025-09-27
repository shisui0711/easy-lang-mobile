import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TabBar } from './vocabulary/TabBar';
import { ReviewSection } from './vocabulary/ReviewSection';
import { PracticeSection } from './vocabulary/PracticeSection';
import { ManageSection } from './vocabulary/ManageSection';

export default function VocabularyScreen() {
  const [activeTab, setActiveTab] = useState('review');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Vocabulary Learning</Text>
        <Text style={styles.headerSubtitle}>
          Master new words through spaced repetition and smart organization
        </Text>
      </View>
      
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {activeTab === 'review' && <ReviewSection />}
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
