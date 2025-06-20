import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView
} from 'react-native';

export function DiscoverScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>Curated picks from creative people</Text>
        </View>

        {/* Placeholder content */}
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Featured Pick</Text>
            <Text style={styles.cardDescription}>This is where featured content will appear</Text>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Collections</Text>
            <Text style={styles.cardDescription}>Latest collections from curators</Text>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Trending Picks</Text>
            <Text style={styles.cardDescription}>Popular picks from the community</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#252525',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  card: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#252525',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
}); 