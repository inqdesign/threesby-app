import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet
} from '../platform/native';
// import { supabase } from '../lib/supabase'; // Temporarily commented out
// import tw from '../lib/tailwind'; // Temporarily commented out
import type { Profile } from '../types';

export function CollectionsScreen() {
  const [loading, setLoading] = useState(false);
  const [collections] = useState([
    { id: '1', title: 'Best Coffee Shops', creator: 'John Doe' },
    { id: '2', title: 'Tech Gadgets 2024', creator: 'Jane Smith' },
    { id: '3', title: 'Workout Essentials', creator: 'Mike Johnson' },
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Collections</Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading collections...</Text>
        </View>
      ) : collections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No collections found.</Text>
        </View>
      ) : (
        <FlatList
          data={collections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.collectionItem}>
              <Text style={styles.collectionTitle}>{item.title}</Text>
              <Text style={styles.collectionCreator}>by {item.creator}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
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
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  collectionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  collectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  collectionCreator: {
    fontSize: 14,
    color: '#6b7280',
  },
});
