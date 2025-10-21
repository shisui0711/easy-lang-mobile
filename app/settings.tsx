import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Card, CardContent, Button } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { AccessibleInput } from '@/components/ui/AccessibleInput';
import { Spacing, Typography } from '@/constants/Tokens';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function SettingsScreen() {
  const { session } = useAuth();
  const user = session?.user;
  const { theme, toggleTheme } = useTheme();
  const [dailyGoal, setDailyGoal] = useState(20); // Default to 20 if no user data
  const [notifications, setNotifications] = useState({
    vocabularyReminders: true,
    streakReminders: true,
    progressReports: false,
    achievementNotifications: true,
  });
  const [learningPreferences, setLearningPreferences] = useState({
    difficulty: 'intermediate',
    autoAdvance: true,
    pronunciation: true,
    exampleSentences: true,
  });

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({}, 'card');

  const difficultyOptions = [
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Advanced', value: 'advanced' },
  ];

  const handleSave = () => {
    // In a real app, this would save to the backend
    alert('Settings saved successfully!');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Account</Text>
          <Card style={[styles.card, { backgroundColor: cardColor }] as any}>
            <CardContent style={styles.cardContent}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: textColor }]}>Daily Goal</Text>
                  <Text style={[styles.settingDescription, { color: textColor }]}>
                    Set your daily vocabulary learning goal
                  </Text>
                </View>
                <View style={styles.dailyGoalInput}>
                  <AccessibleInput
                    label=""
                    value={dailyGoal.toString()}
                    onChangeText={(text) => setDailyGoal(parseInt(text) || 0)}
                    keyboardType="numeric"
                    accessibilityLabel="Daily vocabulary goal"
                    accessibilityHint="Set your daily vocabulary learning goal"
                  />
                </View>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Appearance Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Appearance</Text>
          <Card style={[styles.card, { backgroundColor: cardColor }] as any}>
            <CardContent style={styles.cardContent}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: textColor }]}>Dark Mode</Text>
                  <Text style={[styles.settingDescription, { color: textColor }]}>
                    {theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System'} theme
                  </Text>
                </View>
                <Switch
                  value={theme === 'dark' || (theme === 'system' && false)} // Simplified for demo
                  onValueChange={toggleTheme}
                  trackColor={{ false: '#CBD5E1', true: '#3B82F6' }}
                  thumbColor={theme === 'dark' || (theme === 'system' && false) ? '#FFFFFF' : '#FFFFFF'}
                />
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Notifications</Text>
          <Card style={[styles.card, { backgroundColor: cardColor }] as any}>
            <CardContent style={styles.cardContent}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: textColor }]}>Vocabulary Reminders</Text>
                  <Text style={[styles.settingDescription, { color: textColor }]}>
                    Get reminders to review vocabulary
                  </Text>
                </View>
                <Switch
                  value={notifications.vocabularyReminders}
                  onValueChange={(value) =>
                    setNotifications({ ...notifications, vocabularyReminders: value })
                  }
                  trackColor={{ false: '#CBD5E1', true: '#3B82F6' }}
                  thumbColor={notifications.vocabularyReminders ? '#FFFFFF' : '#FFFFFF'}
                />
              </View>

              <View style={[styles.settingRow, styles.settingRowBorder]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: textColor }]}>Streak Reminders</Text>
                  <Text style={[styles.settingDescription, { color: textColor }]}>
                    Get reminders to maintain your streak
                  </Text>
                </View>
                <Switch
                  value={notifications.streakReminders}
                  onValueChange={(value) =>
                    setNotifications({ ...notifications, streakReminders: value })
                  }
                  trackColor={{ false: '#CBD5E1', true: '#3B82F6' }}
                  thumbColor={notifications.streakReminders ? '#FFFFFF' : '#FFFFFF'}
                />
              </View>

              <View style={[styles.settingRow, styles.settingRowBorder]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: textColor }]}>Progress Reports</Text>
                  <Text style={[styles.settingDescription, { color: textColor }]}>
                    Weekly progress summaries
                  </Text>
                </View>
                <Switch
                  value={notifications.progressReports}
                  onValueChange={(value) =>
                    setNotifications({ ...notifications, progressReports: value })
                  }
                  trackColor={{ false: '#CBD5E1', true: '#3B82F6' }}
                  thumbColor={notifications.progressReports ? '#FFFFFF' : '#FFFFFF'}
                />
              </View>

              <View style={[styles.settingRow, styles.settingRowBorder]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: textColor }]}>Achievement Notifications</Text>
                  <Text style={[styles.settingDescription, { color: textColor }]}>
                    Notify when you unlock achievements
                  </Text>
                </View>
                <Switch
                  value={notifications.achievementNotifications}
                  onValueChange={(value) =>
                    setNotifications({ ...notifications, achievementNotifications: value })
                  }
                  trackColor={{ false: '#CBD5E1', true: '#3B82F6' }}
                  thumbColor={notifications.achievementNotifications ? '#FFFFFF' : '#FFFFFF'}
                />
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Learning Preferences */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Learning Preferences</Text>
          <Card style={[styles.card, { backgroundColor: cardColor }] as any}>
            <CardContent style={styles.cardContent}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: textColor }]}>Difficulty Level</Text>
                  <Text style={[styles.settingDescription, { color: textColor }]}>
                    Adjust content difficulty
                  </Text>
                </View>
                <View style={styles.difficultyOptions}>
                  {difficultyOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.difficultyOption,
                        learningPreferences.difficulty === option.value && styles.selectedDifficulty,
                      ]}
                      onPress={() =>
                        setLearningPreferences({
                          ...learningPreferences,
                          difficulty: option.value,
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.difficultyText,
                          learningPreferences.difficulty === option.value && styles.selectedDifficultyText,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={[styles.settingRow, styles.settingRowBorder]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: textColor }]}>Auto-advance</Text>
                  <Text style={[styles.settingDescription, { color: textColor }]}>
                    Automatically move to next card
                  </Text>
                </View>
                <Switch
                  value={learningPreferences.autoAdvance}
                  onValueChange={(value) =>
                    setLearningPreferences({ ...learningPreferences, autoAdvance: value })
                  }
                  trackColor={{ false: '#CBD5E1', true: '#3B82F6' }}
                  thumbColor={learningPreferences.autoAdvance ? '#FFFFFF' : '#FFFFFF'}
                />
              </View>

              <View style={[styles.settingRow, styles.settingRowBorder]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: textColor }]}>Pronunciation</Text>
                  <Text style={[styles.settingDescription, { color: textColor }]}>
                    Show pronunciation guides
                  </Text>
                </View>
                <Switch
                  value={learningPreferences.pronunciation}
                  onValueChange={(value) =>
                    setLearningPreferences({ ...learningPreferences, pronunciation: value })
                  }
                  trackColor={{ false: '#CBD5E1', true: '#3B82F6' }}
                  thumbColor={learningPreferences.pronunciation ? '#FFFFFF' : '#FFFFFF'}
                />
              </View>

              <View style={[styles.settingRow, styles.settingRowBorder]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: textColor }]}>Example Sentences</Text>
                  <Text style={[styles.settingDescription, { color: textColor }]}>
                    Show example sentences
                  </Text>
                </View>
                <Switch
                  value={learningPreferences.exampleSentences}
                  onValueChange={(value) =>
                    setLearningPreferences({ ...learningPreferences, exampleSentences: value })
                  }
                  trackColor={{ false: '#CBD5E1', true: '#3B82F6' }}
                  thumbColor={learningPreferences.exampleSentences ? '#FFFFFF' : '#FFFFFF'}
                />
              </View>
            </CardContent>
          </Card>
        </View>

        <Button
          title="Save Settings"
          onPress={handleSave}
          style={styles.saveButton}
          fullWidth
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.heading2.fontSize,
    fontWeight: Typography.heading2.fontWeight,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.heading3.fontSize,
    fontWeight: Typography.heading3.fontWeight,
    marginBottom: Spacing.md,
  },
  card: {
    borderRadius: Spacing.md,
  },
  cardContent: {
    padding: 0,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  settingRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  settingDescription: {
    fontSize: Typography.bodySmall.fontSize,
  },
  dailyGoalInput: {
    width: 80,
  },
  difficultyOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  difficultyOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.sm,
    backgroundColor: '#F1F5F9',
  },
  selectedDifficulty: {
    backgroundColor: '#3B82F6',
  },
  difficultyText: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#64748B',
  },
  selectedDifficultyText: {
    color: '#FFFFFF',
  },
  saveButton: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});