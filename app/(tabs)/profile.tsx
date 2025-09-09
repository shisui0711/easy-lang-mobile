import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Card, CardContent, Button, Avatar, Badge } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';

export default function ProfileScreen() {
  const { session, logout } = useAuth();
  const user = session?.user;
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const profileStats = [
    { label: 'Total XP', value: user?.xp || 2450, icon: 'flash' as const },
    { label: 'Level', value: user?.level || 5, icon: 'star' as const },
    { label: 'Streak', value: user?.streak || 7, icon: 'flame' as const },
    { label: 'Words Learned', value: 1247, icon: 'book' as const },
  ];

  const menuItems = [
    {
      icon: 'settings' as const,
      title: 'Settings',
      subtitle: 'Notifications, preferences',
      onPress: () => {},
    },
    {
      icon: 'trophy' as const,
      title: 'Achievements',
      subtitle: 'View all achievements',
      onPress: () => {},
    },
    {
      icon: 'bar-chart' as const,
      title: 'Statistics',
      subtitle: 'Detailed learning stats',
      onPress: () => {},
    },
    {
      icon: 'help-circle' as const,
      title: 'Help & Support',
      subtitle: 'FAQ, contact us',
      onPress: () => {},
    },
    {
      icon: 'information-circle' as const,
      title: 'About',
      subtitle: 'App version, terms',
      onPress: () => {},
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
              router.replace('/auth/sign-in');
            } catch (error) {
              console.error('Logout error:', error);
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    // Navigate to edit profile screen
    Alert.alert('Edit Profile', 'This feature will be implemented soon!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
          <Ionicons name="create" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Profile Header */}
        <View style={styles.section}>
          <Card>
            <CardContent style={styles.profileContent}>
              <View style={styles.profileHeader}>
                <Avatar
                  src={user?.avatar}
                  firstName={user?.firstName}
                  lastName={user?.lastName}
                  size="xlarge"
                  gradientColors={['#3B82F6', '#8B5CF6']}
                />
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>
                    {user?.firstName} {user?.lastName}
                  </Text>
                  <Text style={styles.profileUsername}>@{user?.username}</Text>
                  <Text style={styles.profileEmail}>{user?.email}</Text>
                  <View style={styles.profileBadges}>
                    <Badge variant="info" size="small">
                      <Ionicons name="star" size={12} color="#1E40AF" style={{ marginRight: 4 }} />
                      Level {user?.level || 5}
                    </Badge>
                    <Badge variant="warning" size="small">
                      <Ionicons name="flame" size={12} color="#92400E" style={{ marginRight: 4 }} />
                      {user?.streak || 7} Day Streak
                    </Badge>
                  </View>
                </View>
              </View>

              <Text style={styles.joinDate}>
                Member since {formatDate(user?.createdAt || new Date().toISOString())}
              </Text>
            </CardContent>
          </Card>
        </View>

        {/* Stats Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            {profileStats.map((stat, index) => (
              <Card key={index} style={styles.statCard}>
                <CardContent style={styles.statContent}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name={stat.icon} size={24} color="#3B82F6" />
                  </View>
                  <Text style={styles.statValue}>{stat.value.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </CardContent>
              </Card>
            ))}
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <Card>
            <CardContent style={styles.menuContent}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={item.onPress}
                  style={[
                    styles.menuItem,
                    index < menuItems.length - 1 && styles.menuItemBorder
                  ]}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons name={item.icon} size={20} color="#64748B" />
                    </View>
                    <View style={styles.menuItemInfo}>
                      <Text style={styles.menuItemTitle}>{item.title}</Text>
                      <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </CardContent>
          </Card>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <Button
            title="Sign Out"
            onPress={handleLogout}
            loading={isLoggingOut}
            variant="outline"
            fullWidth
            style={styles.logoutButton}
            textStyle={styles.logoutButtonText}
          />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
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
  profileContent: {
    padding: 24,
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 12,
  },
  profileBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  joinDate: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
  },
  statContent: {
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  menuContent: {
    padding: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  logoutButton: {
    borderColor: '#EF4444',
  },
  logoutButtonText: {
    color: '#EF4444',
  },
  bottomSpacer: {
    height: 100,
  },
});