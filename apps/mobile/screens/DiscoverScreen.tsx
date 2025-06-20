import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PicksService, CollectionsService } from '../src/services/supabase';

const { width } = Dimensions.get('window');

// Types matching the web version
type Category = 'places' | 'products' | 'books';

type Collection = {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  categories: string[];
  picks: string[];
  cover_image?: string;
  font_color?: 'dark' | 'light';
  issue_number?: number;
  created_at: string;
  updated_at: string;
  profiles?: any;
};

type FeedItem = {
  type: 'pick' | 'collection';
  data: any;
  updated_at: string;
};

export default function DiscoverScreen({ navigation }: { navigation: any }) {
  const [feedPicks, setFeedPicks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [showAll, setShowAll] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  
  // Collections and mixed content state
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [mixedContent, setMixedContent] = useState<FeedItem[]>([]);
  
  const [isSticky, setIsSticky] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const [picksData, collectionsData] = await Promise.all([
        PicksService.getFeaturedPicks(),
        fetchCollections()
      ]);
      setFeedPicks(picksData);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      setCollectionsLoading(true);
      // Mock collections data for now
      const mockCollections: Collection[] = [
        {
          id: '1',
          profile_id: '1',
          title: 'Design Tools',
          description: 'Essential tools for designers',
          categories: ['products'],
          picks: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
      setCollections(mockCollections);
      return mockCollections;
    } catch (error) {
      console.error('Error fetching collections:', error);
      return [];
    } finally {
      setCollectionsLoading(false);
    }
  };

  // Create mixed content from picks and collections
  const createMixedContent = () => {
    const mixedItems: FeedItem[] = [];
    
    // Add picks
    feedPicks.forEach(pick => {
      mixedItems.push({
        type: 'pick',
        data: pick,
        updated_at: pick.updated_at || pick.created_at
      });
    });
    
    // Add collections
    collections.forEach(collection => {
      mixedItems.push({
        type: 'collection',
        data: collection,
        updated_at: collection.updated_at || collection.created_at
      });
    });
    
    // Sort by latest update time
    mixedItems.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    
    setMixedContent(mixedItems);
  };

  useEffect(() => {
    createMixedContent();
  }, [feedPicks, collections]);

  // Filter content matching web version logic
  const filteredContent = mixedContent.filter((item) => {
    if (item.type === 'pick') {
      const pick = item.data;
      const profile = pick.profile;
      
      const matchesSearch =
        profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pick.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pick.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = showAll || selectedCategories.includes(pick.category as Category);
      const isValidRank = pick.rank !== 0;

      return matchesSearch && matchesCategory && isValidRank;
    } else if (item.type === 'collection') {
      const collection = item.data;
      const profile = collection.profiles;
      
      const matchesSearch =
        profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collection.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collection.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = showAll || 
        (collection.categories && collection.categories.some((cat: string) => 
          selectedCategories.includes(cat as Category)
        ));

      return matchesSearch && matchesCategory;
    }
    return false;
  });

  const onRefresh = () => {
    setRefreshing(true);
    loadContent().finally(() => setRefreshing(false));
  };

  const handleCategoryChange = (categories: Category[]) => {
    setSelectedCategories(categories);
    setShowAll(categories.length === 0);
  };

  const renderCategoryFilter = () => (
    <View style={styles.filterContainer}>
      {/* Search Input */}
      {showSearchInput && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search picks..."
            placeholderTextColor="#666"
            autoFocus
          />
          <Ionicons name="search" size={16} color="#666" style={styles.searchIcon} />
        </View>
      )}
      
      {/* Header Text */}
      <Text style={styles.headerText}>Selected With Care</Text>
      
      {/* Category Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        <View style={styles.categoriesContainer}>
          <TouchableOpacity
            style={[styles.categoryPill, showAll && styles.categoryPillActive]}
            onPress={() => handleCategoryChange([])}
          >
            <Text style={[styles.categoryText, showAll && styles.categoryTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          
          {['books', 'places', 'products'].map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryPill,
                selectedCategories.includes(category as Category) && styles.categoryPillActive
              ]}
              onPress={() => {
                const isSelected = selectedCategories.includes(category as Category);
                if (isSelected) {
                  const newCategories = selectedCategories.filter(c => c !== category);
                  handleCategoryChange(newCategories);
                } else {
                  handleCategoryChange([...selectedCategories, category as Category]);
                }
              }}
            >
              <Text style={[
                styles.categoryText,
                selectedCategories.includes(category as Category) && styles.categoryTextActive
              ]}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
          
          {/* Search Button */}
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setShowSearchInput(!showSearchInput)}
          >
            <Ionicons name="search" size={16} color="#000" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  const renderFeaturedContent = () => (
    <View style={styles.featuredContainer}>
      {/* Featured content row for mobile - 2 columns */}
      <View style={styles.featuredRow}>
        {/* OUR THREES */}
        <View style={styles.featuredCard}>
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>OUR THREES</Text>
          </View>
          <View style={styles.featuredContent}>
            <Text style={styles.featuredTitle}>Featured Picks</Text>
            <Text style={styles.featuredSubtitle}>Curated selections</Text>
          </View>
        </View>
        
        {/* CURATORS */}
        <View style={styles.featuredCard}>
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>CURATORS</Text>
          </View>
          <View style={styles.featuredContent}>
            <Text style={styles.featuredTitle}>Three Curators</Text>
            <Text style={styles.featuredSubtitle}>Expert recommendations</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderPickCard = (pick: any) => (
    <TouchableOpacity 
      key={`pick-${pick.id}`} 
      style={styles.pickCard}
      onPress={() => navigation.navigate('UnifiedDetail', { 
        id: pick.id, 
        type: 'pick',
        navigationIds: filteredContent.filter(item => item.type === 'pick').map(item => item.data.id),
        currentIndex: filteredContent.filter(item => item.type === 'pick').findIndex(item => item.data.id === pick.id)
      })}
    >
      <View style={styles.pickImageContainer}>
        <View style={styles.pickImagePlaceholder}>
          <Text style={styles.pickImageText}>{pick.title.charAt(0)}</Text>
        </View>
      </View>
      <View style={styles.pickInfo}>
        <Text style={styles.pickTitle} numberOfLines={2}>{pick.title}</Text>
        <Text style={styles.pickDescription} numberOfLines={1}>{pick.description}</Text>
        <Text style={styles.pickCategory}>{pick.category}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderCollectionCard = (collection: Collection) => (
    <TouchableOpacity 
      key={`collection-${collection.id}`} 
      style={styles.pickCard}
      onPress={() => navigation.navigate('UnifiedDetail', { 
        id: collection.id, 
        type: 'collection',
        navigationIds: filteredContent.filter(item => item.type === 'collection').map(item => item.data.id),
        currentIndex: filteredContent.filter(item => item.type === 'collection').findIndex(item => item.data.id === collection.id)
      })}
    >
      <View style={styles.pickImageContainer}>
        <View style={styles.pickImagePlaceholder}>
          <Text style={styles.pickImageText}>{collection.title.charAt(0)}</Text>
        </View>
      </View>
      <View style={styles.pickInfo}>
        <Text style={styles.pickTitle} numberOfLines={2}>{collection.title}</Text>
        <Text style={styles.pickDescription} numberOfLines={1}>{collection.description}</Text>
        <Text style={styles.pickCategory}>Collection</Text>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <View style={styles.gridContainer}>
            {[...Array(6)].map((_, i) => (
              <View key={i} style={styles.skeletonCard}>
                <View style={styles.skeletonImage} />
                <View style={styles.skeletonText} />
                <View style={styles.skeletonTextSmall} />
              </View>
            ))}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        {/* Featured Content */}
        {renderFeaturedContent()}
        
        {/* Main Grid - 2 columns */}
        <View style={styles.gridContainer}>
          {filteredContent.map((item) => (
            item.type === 'pick' 
              ? renderPickCard(item.data)
              : renderCollectionCard(item.data)
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Filter Header */}
      <View style={styles.stickyHeader}>
        {renderCategoryFilter()}
      </View>
      
      {/* Main Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  stickyHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  scrollView: {
    flex: 1,
  },
  filterContainer: {
    marginBottom: 8,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 40,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
  },
  headerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  categoriesScroll: {
    marginHorizontal: -4,
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    gap: 8,
  },
  categoryPill: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryPillActive: {
    backgroundColor: '#000',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
  searchButton: {
    backgroundColor: '#ADFF8B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  featuredContainer: {
    marginBottom: 24,
  },
  featuredRow: {
    flexDirection: 'row',
    gap: 8,
  },
  featuredCard: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    aspectRatio: 1,
    position: 'relative',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ADFF8B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#262626',
    fontFamily: 'monospace',
  },
  featuredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 4,
  },
  featuredSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  pickCard: {
    width: (width - 44) / 2, // 2 columns with padding and gap
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
  },
  pickImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  pickImagePlaceholder: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickImageText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#666',
  },
  pickInfo: {
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  pickTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
    lineHeight: 18,
  },
  pickDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    lineHeight: 16,
  },
  pickCategory: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  loadingContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  skeletonCard: {
    width: (width - 44) / 2,
    marginBottom: 12,
  },
  skeletonImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    marginBottom: 8,
  },
  skeletonText: {
    height: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 4,
    width: '80%',
  },
  skeletonTextSmall: {
    height: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    width: '60%',
  },
});
