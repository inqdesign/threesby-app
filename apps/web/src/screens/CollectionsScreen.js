import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView
} from 'react-native';

export function CollectionsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Collections</Text>
          <Text style={styles.subtitle}>Curated collections by topic</Text>
        </View>

        {/* Placeholder content */}
        <View style={styles.content}>
          <View style={styles.collectionCard}>
            <Text style={styles.collectionTitle}>Design Tools</Text>
            <Text style={styles.collectionDescription}>Essential tools for designers</Text>
            <Text style={styles.collectionMeta}>12 picks • Updated 2 days ago</Text>
          </View>
          
          <View style={styles.collectionCard}>
            <Text style={styles.collectionTitle}>Coffee Shops NYC</Text>
            <Text style={styles.collectionDescription}>Best coffee spots in New York</Text>
            <Text style={styles.collectionMeta}>8 picks • Updated 1 week ago</Text>
          </View>
          
          <View style={styles.collectionCard}>
            <Text style={styles.collectionTitle}>Architecture Books</Text>
            <Text style={styles.collectionDescription}>Must-read books for architects</Text>
            <Text style={styles.collectionMeta}>15 picks • Updated 3 days ago</Text>
          </View>
          
          <View style={styles.collectionCard}>
            <Text style={styles.collectionTitle}>Productivity Apps</Text>
            <Text style={styles.collectionDescription}>Apps to boost your productivity</Text>
            <Text style={styles.collectionMeta}>10 picks • Updated 5 days ago</Text>
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
  collectionCard: {
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  collectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#252525',
    marginBottom: 6,
  },
  collectionDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 8,
  },
  collectionMeta: {
    fontSize: 12,
    color: '#999999',
  },
}); 