import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { gamificationApi } from '@/lib/api';
import eventEmitter from '@/lib/eventEmitter';

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

export const AchievementNotification = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    fetchUserAchievements();
    
    // Subscribe to achievement notifications
    const unsubscribe = eventEmitter.on('achievementUnlocked', (achievement: Achievement) => {
      showAchievementNotification(achievement);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  const fetchUserAchievements = async () => {
    try {
      // In a real implementation, we would pass the actual user ID
      // For now, we'll use a placeholder
      const response = await gamificationApi.getAllAchievements();
      if (response.success && response.data) {
        setAchievements(response.data as Achievement[]);
      }
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    }
  };

  const showAchievementNotification = (achievement: Achievement) => {
    setNewAchievement(achievement);
    
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();

    // Auto hide after 5 seconds
    setTimeout(() => {
      hideAchievementNotification();
    }, 5000);
  };

  const hideAchievementNotification = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => setNewAchievement(null));
  };

  // Function to check for new achievements
  const checkForNewAchievements = async () => {
    try {
      // This would be called after completing vocabulary reviews
      // For demo purposes, we'll simulate finding a new achievement
      const response = await gamificationApi.getAllAchievements();
      if (response.success && response.data) {
        const allAchievements = response.data as Achievement[];
        const unearnedAchievements = allAchievements.filter(a => !a.earned);
        
        // For demo, let's pretend we just earned the first unearned achievement
        if (unearnedAchievements.length > 0) {
          const achievement = unearnedAchievements[0];
          showAchievementNotification(achievement);
        }
      }
    } catch (error) {
      console.error('Failed to check achievements:', error);
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

  if (!newAchievement) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        }
      ]}
    >
      <View style={[styles.content, { borderLeftColor: getRarityColor(newAchievement.rarity) }]}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{newAchievement.icon}</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Achievement Unlocked!</Text>
          <Text style={styles.name}>{newAchievement.name}</Text>
          <Text style={styles.description}>{newAchievement.description}</Text>
          <Text style={styles.reward}>Reward: {newAchievement.reward}</Text>
        </View>
        <TouchableOpacity onPress={hideAchievementNotification} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderLeftWidth: 4,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 32,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  reward: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
});