import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PickCard from '../components/PickCard';
import CollectionCard from '../components/CollectionCard';
import { PicksService, CollectionsService, Pick, Collection } from '../services/supabase';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    picks: Pick[];
    collections: Collection[];
  }>({ picks: [], collections: [] });
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'picks' | 'collections'>('all');

  const categories = ['All', 'Design', 'Productivity', 'Development', 'Marketing', 'AI'];

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      setSearchResults({ picks: [], collections: [] });
    }
  }, [searchQuery, activeFilter]);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      let picks: Pick[] = [];
      let collections: Collection[] = [];

      if (activeFilter === 'all' || activeFilter === 'picks') {
        // For now, filter mock data - in real app, this would be a proper search API
        const allPicks = await PicksService.getRecentPicks();
        picks = allPicks.filter(pick => 
          pick.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pick.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pick.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (activeFilter === 'all' || activeFilter === 'collections') {
        const allCollections = await CollectionsService.getRecentCollections();
        collections = allCollections.filter(collection => 
          collection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          collection.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setSearchResults({ picks, collections });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults({ picks: [], collections: [] });
  };

  const handleCategoryFilter = async (category: string) => {
    if (category === 'All') {
      // Show recent picks when "All" is selected
      try {
        const picks = await PicksService.getRecentPicks();
        setSearchResults({ picks, collections: [] });
      } catch (error) {
        console.error('Error loading picks:', error);
      }
    } else {
      // Filter by specific category
      try {
        const picks = await PicksService.getPicksByCategory(category);
        setSearchResults({ picks, collections: [] });
      } catch (error) {
        console.error('Error loading category picks:', error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search curators, picks, tools..."
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'picks', 'collections'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                activeFilter === filter && styles.filterTabActive
              ]}
              onPress={() => setActiveFilter(filter as any)}
            >
              <Text style={[
                styles.filterTabText,
                activeFilter === filter && styles.filterTabTextActive
              ]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Category Quick Filters */}
      {!searchQuery && (
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryTitle}>Browse by Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={styles.categoryButton}
                onPress={() => handleCategoryFilter(category)}
              >
                <Text style={styles.categoryButtonText}>{category}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Results */}
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : (
          <>
            {/* No Results State */}
            {searchQuery && searchResults.picks.length === 0 && searchResults.collections.length === 0 && (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search" size={48} color="#ccc" />
                <Text style={styles.noResultsTitle}>No results found</Text>
                <Text style={styles.noResultsText}>
                  Try adjusting your search or browse by category
                </Text>
              </View>
            )}

            {/* Picks Results */}
            {(activeFilter === 'all' || activeFilter === 'picks') && searchResults.picks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Picks {searchQuery && `(${searchResults.picks.length})`}
                </Text>
                {searchResults.picks.map((pick) => (
                  <PickCard 
                    key={pick.id} 
                    pick={pick} 
                    onPress={() => console.log('Open pick:', pick.title)}
                  />
                ))}
              </View>
            )}

            {/* Collections Results */}
            {(activeFilter === 'all' || activeFilter === 'collections') && searchResults.collections.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Collections {searchQuery && `(${searchResults.collections.length})`}
                </Text>
                {searchResults.collections.map((collection) => (
                  <CollectionCard 
                    key={collection.id} 
                    collection={collection} 
                    onPress={() => console.log('Open collection:', collection.title)}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  clearButton: {
    padding: 4,
  },
  filterContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: '#007AFF',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  categoryContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    marginRight: 8,
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  resultsContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#000',
  },
  noResultsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000',
  },
}); 