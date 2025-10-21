import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Tab {
  id: string;
  label: string;
  icon?: string;
}

interface TabBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs?: Tab[];
}

export const TabBar = ({ activeTab, setActiveTab, tabs }: TabBarProps) => {
  // Default tabs if none provided
  const defaultTabs = [
    { id: 'review', label: 'Review', icon: 'sparkles' },
    { id: 'practice', label: 'Practice', icon: 'book' },
    { id: 'manage', label: 'Manage', icon: 'settings' },
  ];
  
  const tabList = tabs || defaultTabs;
  
  // Icon mapping
  const iconMap: Record<string, string> = {
    'review': 'sparkles',
    'practice': 'book',
    'manage': 'settings',
    'unified': 'layers',
    'offline': 'cloud-offline',
    'flashcards': 'albums',
  };
  
  return (
    <View style={styles.tabBar}>
      {tabList.map((tab) => (
        <TouchableOpacity 
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && styles.activeTab]}
          onPress={() => setActiveTab(tab.id)}
        >
          <Ionicons 
            name={(tab.icon || iconMap[tab.id] || 'help-circle') as any} 
            size={20} 
            color={activeTab === tab.id ? '#3B82F6' : '#94A3B8'} 
          />
          <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    flexDirection: 'row',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    color: '#94A3B8',
    marginLeft: 8,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '700',
  },
});