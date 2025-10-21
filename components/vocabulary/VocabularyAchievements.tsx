import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { gamificationApi } from '@/lib/api';

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  condition: any;
  reward: string;
  icon: string;
  rarity: string;
  isActive: boolean;
  earned: boolean;
  earned_at: string | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export const VocabularyAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVocabularyAchievements();
  }, []);

  const fetchVocabularyAchievements = async () => {
    try {
      setLoading(true);
      // In a real implementation, we would pass the actual user ID
      // For now, we'll use a placeholder
      const response = await gamificationApi.getAllAchievements();
      if (response.success && response.data) {
        // Filter for vocabulary-related achievements
        const vocabAchievements = (response.data as Achievement[]).filter(
          achievement => achievement.category === 'vocabulary'
        );
        setAchievements(vocabAchievements);
      }
    } catch (err) {
      setError('Failed to load achievements');
      console.error('Error fetching achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#94A3B8';
      case 'uncommon': return '#10B981';
      case 'rare': return '#3B82F6';
      case 'epic': return '#8B5CF6';
      case 'legendary': return '#F59E0B';
      default: return '#94A3B8';
    }
  };

  const getRarityText = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'Common';
      case 'uncommon': return 'Uncommon';
      case 'rare': return 'Rare';
      case 'epic': return 'Epic';
      case 'legendary': return 'Legendary';
      default: return rarity;
    }
  };

  const renderAchievement = ({ item }: { item: Achievement }) => (
    <View 
      style={[
        styles.achievementCard, 
        { 
          borderLeftColor: getRarityColor(item.rarity),
          opacity: item.earned ? 1 : 0.7
        }
      ]}
    >
      <View style={styles.achievementHeader}>
        <Text style={styles.icon}>{item.icon}</Text>
        <View style={styles.achievementInfo}>
          <View style={styles.achievementTitleRow}>
            <Text style={styles.achievementName}>{item.name}</Text>
            <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(item.rarity) + '20' }]}>
              <Text style={[styles.rarityText, { color: getRarityColor(item.rarity) }]}>
                {getRarityText(item.rarity)}
              </Text>
            </View>
          </View>
          <Text style={styles.achievementDescription}>{item.description}</Text>
        </View>
      </View>
      
      <View style={styles.achievementProgress}>
        <View style={styles.progressContainer}>
          <View 
            style={[
              styles.progressBar, 
              { 
                width: `${Math.min(item.progress * 100, 100)}%`,
                backgroundColor: getRarityColor(item.rarity)
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(item.progress * 100)}% Complete
        </Text>
      </View>
      
      {item.earned ? (
        <View style={styles.earnedContainer}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.earnedText}>Earned</Text>
        </View>
      ) : (
        <Text style={styles.rewardText}>Reward: {item.reward}</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading achievements...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vocabulary Achievements</Text>
        <Text style={styles.subtitle}>Complete challenges to earn rewards</Text>
      </View>
      
      <FlatList
        data={achievements}
        keyExtractor={(item) => item.id}
        renderItem={renderAchievement}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  loadingText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 16,
    padding: 24,
  },
  errorText: {
    textAlign: 'center',
    color: '#EF4444',
    fontSize: 16,
    padding: 24,
  },
  listContainer: {
    paddingBottom: 24,
  },
  achievementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
  },
  achievementHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  achievementName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rarityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  achievementProgress: {
    marginBottom: 12,
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  progressText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
  },
  earnedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earnedText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  rewardText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
  },
});