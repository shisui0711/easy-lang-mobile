import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet
} from 'react-native';

interface ProgressTrackerProps {
  current: number;
  total: number;
  label?: string;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  current,
  total,
  label = "Progress"
}) => {
  const progress = total > 0 ? (current / total) * 100 : 0;
  
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressText}>{label}</Text>
        <Text style={styles.progressText}>
          {current}/{total} completed
        </Text>
      </View>
      <View style={styles.progressBarBackground}>
        <View 
          style={[
            styles.progressBarFill, 
            { width: `${progress}%` }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  progressContainer: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#64748B',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
});