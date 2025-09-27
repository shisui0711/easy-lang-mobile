import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TabBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const TabBar = ({ activeTab, setActiveTab }: TabBarProps) => {
  return (
    <View style={styles.tabBar}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'review' && styles.activeTab]}
        onPress={() => setActiveTab('review')}
      >
        <Ionicons 
          name="sparkles" 
          size={20} 
          color={activeTab === 'review' ? '#3B82F6' : '#94A3B8'} 
        />
        <Text style={[styles.tabText, activeTab === 'review' && styles.activeTabText]}>Review</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'practice' && styles.activeTab]}
        onPress={() => setActiveTab('practice')}
      >
        <Ionicons 
          name="book" 
          size={20} 
          color={activeTab === 'practice' ? '#3B82F6' : '#94A3B8'} 
        />
        <Text style={[styles.tabText, activeTab === 'practice' && styles.activeTabText]}>Practice</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'manage' && styles.activeTab]}
        onPress={() => setActiveTab('manage')}
      >
        <Ionicons 
          name="settings" 
          size={20} 
          color={activeTab === 'manage' ? '#3B82F6' : '#94A3B8'} 
        />
        <Text style={[styles.tabText, activeTab === 'manage' && styles.activeTabText]}>Manage</Text>
      </TouchableOpacity>
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