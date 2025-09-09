import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Card, CardContent, Progress } from '@/components/ui';


export default function LearnScreen() {
  const learningModules = [
    {
      id: 'vocabulary',
      title: 'Vocabulary',
      description: 'Learn and review new words',
      icon: 'book' as const,
      gradient: ['#3B82F6', '#6366F1'],
      progress: 75,
      cardsReady: 17,
      totalCards: 50,
      estimated: '15 min',
    },
    {
      id: 'writing',
      title: 'Writing',
      description: 'Practice writing skills',
      icon: 'create' as const,
      gradient: ['#10B981', '#059669'],
      progress: 45,
      exercisesLeft: 3,
      totalExercises: 8,
      estimated: '20 min',
    },
    {
      id: 'speaking',
      title: 'Speaking',
      description: 'Improve pronunciation',
      icon: 'mic' as const,
      gradient: ['#8B5CF6', '#7C3AED'],
      progress: 60,
      exercisesLeft: 5,
      totalExercises: 12,
      estimated: '25 min',
    },
    {
      id: 'reading',
      title: 'Reading',
      description: 'Comprehension practice',
      icon: 'eye' as const,
      gradient: ['#F59E0B', '#D97706'],
      progress: 30,
      articlesLeft: 4,
      totalArticles: 10,
      estimated: '30 min',
    },
    {
      id: 'listening',
      title: 'Listening',
      description: 'Audio comprehension',
      icon: 'headset' as const,
      gradient: ['#EF4444', '#DC2626'],
      progress: 55,
      audiosLeft: 6,
      totalAudios: 15,
      estimated: '18 min',
    },
    {
      id: 'grammar',
      title: 'Grammar',
      description: 'Language structure',
      icon: 'library' as const,
      gradient: ['#06B6D4', '#0891B2'],
      progress: 40,
      lessonsLeft: 8,
      totalLessons: 20,
      estimated: '22 min',
    },
  ];

  const dailyGoals = [
    { label: 'Vocabulary Reviews', current: 17, target: 20 },
    { label: 'Writing Practice', current: 2, target: 3 },
    { label: 'Speaking Exercises', current: 1, target: 2 },
  ];

  const handleModulePress = (moduleId: string) => {
    // Navigate to specific learning module
    router.push(`/learn/${moduleId}`);
  };

  const renderLearningModule = (module: any, index: number) => (
    <TouchableOpacity
      key={module.id}
      onPress={() => handleModulePress(module.id)}
      style={styles.moduleCard}
    >
      <LinearGradient
        colors={module.gradient}
        style={styles.moduleGradient}
      >
        <View style={styles.moduleHeader}>
          <View style={styles.moduleIconContainer}>
            <Ionicons name={module.icon} size={28} color="#FFFFFF" />
          </View>
          <View style={styles.moduleInfo}>
            <Text style={styles.moduleTitle}>{module.title}</Text>
            <Text style={styles.moduleDescription}>{module.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.8)" />
        </View>

        <View style={styles.moduleStats}>
          <View style={styles.moduleStatItem}>
            <Text style={styles.moduleStatLabel}>Progress</Text>
            <Text style={styles.moduleStatValue}>{module.progress}%</Text>
          </View>
          <View style={styles.moduleStatItem}>
            <Text style={styles.moduleStatLabel}>Time</Text>
            <Text style={styles.moduleStatValue}>{module.estimated}</Text>
          </View>
        </View>

        <View style={styles.moduleProgress}>
          <Progress
            value={module.progress}
            height={6}
            backgroundColor="rgba(255, 255, 255, 0.3)"
            progressColor="#FFFFFF"
          />
        </View>

        <View style={styles.moduleDetails}>
          {module.cardsReady && (
            <Text style={styles.moduleDetailText}>
              {module.cardsReady} cards ready for review
            </Text>
          )}
          {module.exercisesLeft && (
            <Text style={styles.moduleDetailText}>
              {module.exercisesLeft} exercises remaining
            </Text>
          )}
          {module.articlesLeft && (
            <Text style={styles.moduleDetailText}>
              {module.articlesLeft} articles to read
            </Text>
          )}
          {module.audiosLeft && (
            <Text style={styles.moduleDetailText}>
              {module.audiosLeft} audio lessons
            </Text>
          )}
          {module.lessonsLeft && (
            <Text style={styles.moduleDetailText}>
              {module.lessonsLeft} grammar lessons
            </Text>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Learn</Text>
        <Text style={styles.headerSubtitle}>Choose your learning path</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Daily Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today&apos;s Goals</Text>
          <Card>
            <CardContent style={styles.goalsContent}>
              {dailyGoals.map((goal, index) => (
                <View key={index} style={styles.goalItem}>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalLabel}>{goal.label}</Text>
                    <Text style={styles.goalValue}>
                      {goal.current}/{goal.target}
                    </Text>
                  </View>
                  <Progress
                    value={(goal.current / goal.target) * 100}
                    gradientColors={['#10B981', '#059669']}
                    style={styles.goalProgress}
                  />
                </View>
              ))}
            </CardContent>
          </Card>
        </View>

        {/* Learning Modules */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Modules</Text>
          <View style={styles.modulesGrid}>
            {learningModules.map((module, index) => renderLearningModule(module, index))}
          </View>
        </View>

        {/* Study Tips */}
        <View style={styles.section}>
          <Card gradient gradientColors={['#F8FAFC', '#E2E8F0']}>
            <CardContent style={styles.tipsContent}>
              <View style={styles.tipsHeader}>
                <Ionicons name="bulb" size={24} color="#F59E0B" />
                <Text style={styles.tipsTitle}>Study Tip of the Day</Text>
              </View>
              <Text style={styles.tipsText}>
                Try to practice for at least 15 minutes daily. Consistency is more important than intensity when learning a new language.
              </Text>
            </CardContent>
          </Card>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  goalsContent: {
    paddingVertical: 16,
  },
  goalItem: {
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  goalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  goalProgress: {
    marginBottom: 4,
  },
  modulesGrid: {
    gap: 16,
  },
  moduleCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  moduleGradient: {
    padding: 20,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  moduleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  moduleDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  moduleStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  moduleStatItem: {
    alignItems: 'center',
  },
  moduleStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  moduleStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  moduleProgress: {
    marginBottom: 12,
  },
  moduleDetails: {
    alignItems: 'center',
  },
  moduleDetailText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  tipsContent: {
    padding: 20,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 100,
  },
});