import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PickCard from '../components/PickCard';
import CollectionCard from '../components/CollectionCard';
import { PicksService, CollectionsService, Pick, Collection } from '../services/supabase';

interface MyThreesScreenProps {
  navigation: any;
}

export default function MyThreesScreen({ navigation }: MyThreesScreenProps) {
  const [userPicks, setUserPicks] = useState<Pick[]>([]);
  const [userCollections, setUserCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // In real app, these would be user-specific calls
      // For now, get a sample of picks as "user's picks"
      const picks = await PicksService.getRecentPicks();
      const collections = await CollectionsService.getFeaturedCollections();
      
      // Simulate user's saved picks (first 3)
      setUserPicks(picks.slice(0, 3));
      // Simulate user's collections (first 2)
      setUserCollections(collections.slice(0, 2));
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading your favorites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Favorites</Text>
          <Text style={styles.subtitle}>Your curated picks and collections</Text>
        </View>
        
        {/* User Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userPicks.length}</Text>
            <Text style={styles.statLabel}>Picks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userCollections.length}</Text>
            <Text style={styles.statLabel}>Collections</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {userPicks.reduce((total, pick) => total + 1, 0) * 23}
            </Text>
            <Text style={styles.statLabel}>Views</Text>
          </View>
        </View>

        {/* User's Picks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Picks</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {userPicks.length > 0 ? (
            userPicks.map((pick) => (
              <PickCard 
                key={pick.id} 
                pick={pick}
                onPress={() => console.log('Open pick:', pick.title)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No picks yet</Text>
              <Text style={styles.emptyStateSubtext}>Save picks to see them here</Text>
            </View>
          )}
        </View>

        {/* User's Collections */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Collections</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {userCollections.length > 0 ? (
            userCollections.map((collection) => (
              <CollectionCard 
                key={collection.id} 
                collection={collection}
                onPress={() => {
                  console.log('Open collection:', collection.title);
                }}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="library-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No collections yet</Text>
              <Text style={styles.emptyStateSubtext}>Create your first collection</Text>
            </View>
          )}
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
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    margin: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
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