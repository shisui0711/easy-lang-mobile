import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient, testApi } from '@/lib/api';
import { apiTestUtils } from '@/lib/api-test-utils';

export default function TestApiScreen() {
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runAllTests = async () => {
    setLoading(true);
    setTestResults({});
    
    try {
      const results = await apiTestUtils.runAllTests();
      setTestResults(results);
    } catch (error) {
      console.error('Test execution failed:', error);
      Alert.alert('Error', 'Failed to run tests: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatResult = (result: any) => {
    if (!result) return 'Not run yet';
    if (result.success) {
      return `✅ Success\n${JSON.stringify(result.data || result.user, null, 2)}`;
    } else {
      return `❌ Error: ${result.message || result.error}`;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>API Connection Test</Text>
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={runAllTests}
          disabled={loading}
        >
          {loading ? (
            <>
              <ActivityIndicator color="white" />
              <Text style={styles.buttonText}>Testing...</Text>
            </>
          ) : (
            <Text style={styles.buttonText}>Run All Tests</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.resultSection}>
          <Text style={styles.sectionTitle}>Connectivity Test</Text>
          <Text style={styles.resultText}>{formatResult(testResults.connectivity)}</Text>
        </View>
        
        <View style={styles.resultSection}>
          <Text style={styles.sectionTitle}>Web Authentication Test</Text>
          <Text style={styles.resultText}>{formatResult(testResults.authentication)}</Text>
        </View>
        
        <View style={styles.resultSection}>
          <Text style={styles.sectionTitle}>Mobile Authentication Test</Text>
          <Text style={styles.resultText}>{formatResult(testResults.mobileAuth)}</Text>
        </View>
        
        <View style={styles.resultSection}>
          <Text style={styles.sectionTitle}>Writing Exercises Test</Text>
          <Text style={styles.resultText}>{formatResult(testResults.writingExercises)}</Text>
        </View>
        
        <View style={styles.resultSection}>
          <Text style={styles.sectionTitle}>Writing Submissions Test</Text>
          <Text style={styles.resultText}>{formatResult(testResults.writingSubmissions)}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#1E293B',
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultSection: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#1E293B',
  },
  resultText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'monospace',
  },
});