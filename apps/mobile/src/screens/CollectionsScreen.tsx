import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import CollectionCard from '../components/CollectionCard';
import { CollectionsService, Collection } from '../services/supabase';

export default function CollectionsScreen() {
  const [featuredCollections, setFeaturedCollections] = useState<Collection[]>([]);
  const [recentCollections, setRecentCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Use service functions that handle both Supabase and mock data
      const featured = await CollectionsService.getFeaturedCollections();
      const recent = await CollectionsService.getRecentCollections();
      
      setFeaturedCollections(featured);
      setRecentCollections(recent);
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading collections...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>📚 Collections</Text>
          <Text style={styles.subtitle}>Curated collections by topic</Text>
        </View>

        {featuredCollections.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✨ Featured Collections</Text>
            {featuredCollections.map((collection) => (
              <CollectionCard 
                key={collection.id} 
                collection={collection} 
                onPress={() => console.log('Open collection:', collection.title)}
              />
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🆕 Recent Collections</Text>
          {recentCollections.map((collection) => (
            <CollectionCard 
              key={collection.id} 
              collection={collection} 
              onPress={() => console.log('Open collection:', collection.title)}
            />
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 20,
    marginBottom: 8,
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  bottomPadding: {
    height: 20,
  },
}); 