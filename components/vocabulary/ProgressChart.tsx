import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { apiClient } from '@/lib/api';

interface ProgressDataPoint {
  date: string;
  retentionRate: number;
  cardsReviewed: number;
}

export const ProgressChart = () => {
  const [progressData, setProgressData] = useState<ProgressDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      // For now, we'll generate mock data since the API doesn't seem to have a specific endpoint
      // In a real implementation, this would call an actual API endpoint
      const mockData: ProgressDataPoint[] = [
        { date: '2023-06-01', retentionRate: 75, cardsReviewed: 20 },
        { date: '2023-06-02', retentionRate: 78, cardsReviewed: 25 },
        { date: '2023-06-03', retentionRate: 82, cardsReviewed: 30 },
        { date: '2023-06-04', retentionRate: 79, cardsReviewed: 22 },
        { date: '2023-06-05', retentionRate: 85, cardsReviewed: 35 },
        { date: '2023-06-06', retentionRate: 88, cardsReviewed: 40 },
        { date: '2023-06-07', retentionRate: 86, cardsReviewed: 38 },
      ];
      setProgressData(mockData);
    } catch (err) {
      setError('Failed to load progress data');
      console.error('Error fetching progress data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading progress data...</Text>
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

  // Prepare data for charts
  const labels = progressData.map(item => item.date.slice(5)); // Get MM-DD format
  const retentionRates = progressData.map(item => item.retentionRate);
  const cardsReviewed = progressData.map(item => item.cardsReviewed);

  // Chart configuration
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#3B82F6',
    },
  };

  const screenWidth = Dimensions.get('window').width - 48; // Account for padding

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Retention Rate Over Time</Text>
      <LineChart
        data={{
          labels,
          datasets: [
            {
              data: retentionRates,
              strokeWidth: 2,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            },
          ],
        }}
        width={screenWidth}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        yAxisLabel=""
        yAxisSuffix="%"
        fromZero
      />

      <Text style={styles.title}>Cards Reviewed Per Day</Text>
      <BarChart
        data={{
          labels,
          datasets: [
            {
              data: cardsReviewed,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            },
          ],
        }}
        width={screenWidth}
        height={220}
        chartConfig={{
          ...chartConfig,
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        }}
        style={styles.chart}
        yAxisLabel=""
        yAxisSuffix=""
        fromZero
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
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
});