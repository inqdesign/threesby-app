import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator,
  // RefreshControl will be added when React Native dependencies are installed
  SafeAreaView,
  StyleSheet
} from '../platform/native';
// import { PickCard } from '../components/PickCard.native';
// These imports will be used when implementing navigation and auth features
// import { useNavigation } from '../platform/native';
// import { useAuth } from '../context/AuthContext';
// import { supabase } from '../lib/supabase';
import type { Pick } from '../types';
// import tw from '../lib/tailwind'; // Temporarily commented out

export function DiscoverScreen() {
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // These will be used when implementing navigation and auth features
  // const navigation = useNavigation();
  // const { user } = useAuth();

  const fetchPicks = async () => {
    try {
      setLoading(true);
      
      // Mock data for testing
      setTimeout(() => {
        const mockPicks: Pick[] = [
          {
            id: '1',
            profile_id: 'mock-user-id',
            category: 'products',
            title: 'Great Coffee Mug',
            description: 'Perfect for morning coffee',
            image_url: 'https://via.placeholder.com/300x400',
            reference: 'test-ref',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'published',
            visible: true,
            rank: 1,
          },
          {
            id: '2',
            profile_id: 'mock-user-id',
            category: 'books',
            title: 'React Native Guide',
            description: 'Learn mobile development',
            image_url: 'https://via.placeholder.com/300x400',
            reference: 'test-ref-2',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'published',
            visible: true,
            rank: 2,
          },
        ];
        
        setPicks(mockPicks);
        setLoading(false);
        setRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching picks:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPicks();
  };

  useEffect(() => {
    fetchPicks();
  }, []);

  // Render loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading picks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>
      
      <FlatList
        data={picks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.pickItem}>
            <Text style={styles.pickTitle}>{item.title}</Text>
            <Text style={styles.pickDescription}>{item.description}</Text>
            <Text style={styles.pickCategory}>{item.category}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
        onRefresh={onRefresh}
        refreshing={refreshing}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No picks found. Pull down to refresh.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#252525',
  },
  listContainer: {
    padding: 8,
  },
  pickItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
  },
  pickDescription: {
    color: '#6b7280',
    marginBottom: 8,
  },
  pickCategory: {
    fontSize: 14,
    color: '#9ca3af',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
  },
});
