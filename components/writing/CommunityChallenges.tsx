import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

interface CommunityChallengesProps {
  onStartChallenge: (challengeType: string) => void;
}

export const CommunityChallenges: React.FC<CommunityChallengesProps> = ({
  onStartChallenge
}) => {
  return (
    <View style={styles.challengesSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Community Challenges</Text>
        <TouchableOpacity onPress={() => console.log('View all challenges')}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.challengesList}>
        <TouchableOpacity 
          style={styles.challengeItem}
          onPress={() => onStartChallenge('weekly')}
        >
          <LinearGradient
            colors={['#8B5CF6', '#6366F1']}
            style={styles.challengeCard}
          >
            <View style={styles.challengeHeader}>
              <MaterialIcons name="emoji-events" size={24} color="white" />
              <View style={styles.challengeInfo}>
                <Text style={styles.challengeTitle}>Weekly Writing Challenge</Text>
                <Text style={styles.challengeSubtitle}>Creative Fiction</Text>
              </View>
            </View>
            <Text style={styles.challengeDescription}>
              Write a short story (200-500 words) based on this week's theme: "Unexpected Encounters"
            </Text>
            <View style={styles.challengeMeta}>
              <View style={styles.challengeMetaItem}>
                <Ionicons name="time-outline" size={16} color="rgba(255, 255, 255, 0.9)" />
                <Text style={styles.challengeMetaText}>7 days left</Text>
              </View>
              <View style={styles.challengeMetaItem}>
                <Ionicons name="people-outline" size={16} color="rgba(255, 255, 255, 0.9)" />
                <Text style={styles.challengeMetaText}>142 participants</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.challengeItem}
          onPress={() => onStartChallenge('vocabulary')}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.challengeCard}
          >
            <View style={styles.challengeHeader}>
              <MaterialIcons name="school" size={24} color="white" />
              <View style={styles.challengeInfo}>
                <Text style={styles.challengeTitle}>Vocabulary Challenge</Text>
                <Text style={styles.challengeSubtitle}>Advanced Words</Text>
              </View>
            </View>
            <Text style={styles.challengeDescription}>
              Use all 5 vocabulary words in a coherent paragraph: serendipity, ephemeral, ubiquitous, quintessential, mellifluous
            </Text>
            <View style={styles.challengeMeta}>
              <View style={styles.challengeMetaItem}>
                <Ionicons name="time-outline" size={16} color="rgba(255, 255, 255, 0.9)" />
                <Text style={styles.challengeMetaText}>3 days left</Text>
              </View>
              <View style={styles.challengeMetaItem}>
                <Ionicons name="people-outline" size={16} color="rgba(255, 255, 255, 0.9)" />
                <Text style={styles.challengeMetaText}>87 participants</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  challengesSection: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  challengesList: {
    gap: 16,
  },
  challengeItem: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  challengeCard: {
    padding: 20,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeInfo: {
    marginLeft: 12,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  challengeSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  challengeDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
    lineHeight: 20,
  },
  challengeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  challengeMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  challengeMetaText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});