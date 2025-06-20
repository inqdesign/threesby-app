import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity
} from 'react-native';

export function MyThreesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Threes</Text>
          <Text style={styles.subtitle}>Your curated picks and collections</Text>
        </View>

        {/* Add Pick Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add New Pick</Text>
          </TouchableOpacity>
        </View>

        {/* My Picks Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Picks</Text>
          
          <View style={styles.pickCard}>
            <Text style={styles.pickTitle}>Notion</Text>
            <Text style={styles.pickCategory}>Products</Text>
            <Text style={styles.pickDescription}>All-in-one workspace for notes, tasks, and collaboration</Text>
          </View>
          
          <View style={styles.pickCard}>
            <Text style={styles.pickTitle}>The Book Thief</Text>
            <Text style={styles.pickCategory}>Books</Text>
            <Text style={styles.pickDescription}>A touching story set in Nazi Germany</Text>
          </View>
          
          <View style={styles.pickCard}>
            <Text style={styles.pickTitle}>Central Park</Text>
            <Text style={styles.pickCategory}>Places</Text>
            <Text style={styles.pickDescription}>Iconic park in the heart of Manhattan</Text>
          </View>
        </View>

        {/* My Collections Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Collections</Text>
          
          <View style={styles.collectionCard}>
            <Text style={styles.collectionTitle}>Design Tools</Text>
            <Text style={styles.collectionMeta}>5 picks</Text>
          </View>
          
          <View style={styles.collectionCard}>
            <Text style={styles.collectionTitle}>NYC Coffee Spots</Text>
            <Text style={styles.collectionMeta}>8 picks</Text>
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
  actionSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#252525',
    marginBottom: 12,
  },
  pickCard: {
    backgroundColor: '#ffffff',
    padding: 16,
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
  pickTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#252525',
    marginBottom: 4,
  },
  pickCategory: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  pickDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  collectionCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  collectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#252525',
    marginBottom: 4,
  },
  collectionMeta: {
    fontSize: 12,
    color: '#666666',
  },
}); 