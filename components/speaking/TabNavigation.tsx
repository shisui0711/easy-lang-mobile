import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface TabNavigationProps {
  activeTab: 'practice' | 'progress';
  setActiveTab: (tab: 'practice' | 'progress') => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'practice' && styles.activeTab]}
        onPress={() => setActiveTab('practice')}
      >
        <Text style={[styles.tabText, activeTab === 'practice' && styles.activeTabText]}>Practice</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'progress' && styles.activeTab]}
        onPress={() => setActiveTab('progress')}
      >
        <Text style={[styles.tabText, activeTab === 'progress' && styles.activeTabText]}>Progress</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});

export default TabNavigation;