import React, { useState } from 'react';
import { StyleSheet, Text, View, Button, ActivityIndicator } from 'react-native';

export default function App() {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeSign = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://192.168.1.16:3000/analyze-sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError('Failed to analyze sign. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Analyze Sign" onPress={analyzeSign} />
      
      {isLoading && <ActivityIndicator size="large" color="#0000ff" />}
      {error && <Text style={styles.errorText}>{error}</Text>}
      {analysis && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{analysis}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  resultContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  resultText: {
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginTop: 10,
  },
});