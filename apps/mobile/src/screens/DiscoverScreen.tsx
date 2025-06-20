import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PickCard from '../components/PickCard';
import CollectionCard from '../components/CollectionCard';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { PicksService, CollectionsService, mockUsers } from '../services/supabase';
import { colors, typography, spacing, borderRadius } from '../styles/designSystem';

export default function DiscoverScreen() {
  // Core data states
  const [feedPicks, setFeedPicks] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [curators, setCurators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      
      // Load featured content
      const picksData = await PicksService.getFeaturedPicks();
      const collectionsData = await CollectionsService.getFeaturedCollections();
      
      setFeedPicks(picksData || []);
      setCollections(collectionsData || []);
      setCurators(mockUsers.slice(0, 4));
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadContent();
    setRefreshing(false);
  };

  const handlePickPress = (pick: any) => {
    console.log('Open pick:', pick.title);
  };

  const handleCuratorPress = (curator: any) => {
    console.log('View curator:', curator.name);
  };

  const handleCollectionPress = (collection: any) => {
    console.log('Open collection:', collection.title);
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <Text style={styles.headerTitle}>Selected With Care</Text>
      <Text style={styles.headerSubtitle}>
        Discover the best tools, products, places, and books, handpicked by our community of curators.
      </Text>
    </View>
  );

  const renderFeaturedSection = () => {
    if (feedPicks.length === 0) return null;
    
    const featuredPicks = feedPicks.slice(0, 6);
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🚀 Featured Picks</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {featuredPicks.map((pick, index) => (
            <View key={pick.id} style={styles.horizontalCard}>
              <PickCard
                pick={pick}
                onPress={() => handlePickPress(pick)}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderCuratorsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>👥 Top Curators</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {curators.map((curator) => (
          <TouchableOpacity
            key={curator.id}
            style={styles.curatorCard}
            onPress={() => handleCuratorPress(curator)}
          >
            <View style={styles.curatorAvatar}>
              <Text style={styles.curatorInitial}>
                {curator.name?.charAt(0) || '?'}
              </Text>
            </View>
            <Text style={styles.curatorName} numberOfLines={1}>
              {curator.name}
            </Text>
            <Text style={styles.curatorPicks}>
              {curator.pickCount || 0} picks
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderCollectionsSection = () => {
    if (collections.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📚 Featured Collections</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {collections.slice(0, 3).map((collection) => (
          <View key={collection.id} style={styles.collectionCard}>
            <CollectionCard
              collection={collection}
              onPress={() => handleCollectionPress(collection)}
            />
          </View>
        ))}
      </View>
    );
  };

  const renderRecentPicks = () => {
    if (feedPicks.length === 0) return null;
    
    const recentPicks = feedPicks.slice(6, 12);
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🕒 Recent Picks</Text>
        </View>
        {recentPicks.map((pick) => (
          <View key={pick.id} style={styles.fullWidthCard}>
            <PickCard
              pick={pick}
              onPress={() => handlePickPress(pick)}
            />
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderHeader()}
        {renderFeaturedSection()}
        {renderCuratorsSection()}
        {renderCollectionsSection()}
        {renderRecentPicks()}
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
  },

  // Header Section
  headerSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: '700' as any,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    fontSize: typography.fontSizes.base,
    color: colors.mutedForeground,
    lineHeight: 24,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: '600' as any,
    color: colors.foreground,
  },
  seeAllText: {
    fontSize: typography.fontSizes.sm,
    color: colors.primary,
    fontWeight: '500',
  },

  // Featured Section
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  horizontalScroll: {
    alignItems: 'center',
  },
  horizontalCard: {
    width: 200,
    marginRight: spacing.md,
  },

  // Curators Section
  curatorCard: {
    width: 200,
    marginRight: spacing.md,
  },
  curatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  curatorInitial: {
    fontSize: typography.fontSizes.xl,
    fontWeight: '700',
    color: colors.foreground,
  },
  curatorName: {
    fontSize: typography.fontSizes.sm,
    color: colors.foreground,
    fontWeight: '500',
  },
  curatorPicks: {
    fontSize: typography.fontSizes.sm,
    color: colors.mutedForeground,
  },

  // Collections Section  
  collectionCard: {
    marginBottom: spacing.sm,
  },

  // Full Width Cards
  fullWidthCard: {
    marginBottom: spacing.sm,
  },

  // Empty State
  emptyState: {
    paddingVertical: spacing.xl * 2,
  },

  // Bottom Spacing
  bottomPadding: {
    height: spacing.xl * 2,
  },
}); 