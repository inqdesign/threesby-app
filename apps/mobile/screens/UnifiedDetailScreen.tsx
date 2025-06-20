import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PicksService, CollectionsService, Pick, Collection } from '../src/services/supabase';

const { width, height } = Dimensions.get('window');

interface UnifiedDetailScreenProps {
  route: {
    params: {
      id: string;
      type: 'pick' | 'collection';
      navigationIds?: string[];
      currentIndex?: number;
    };
  };
  navigation: any;
}

export default function UnifiedDetailScreen({ route, navigation }: UnifiedDetailScreenProps) {
  const { id, type, navigationIds = [], currentIndex = 0 } = route.params;
  
  const [pickData, setPickData] = useState<Pick | null>(null);
  const [collectionData, setCollectionData] = useState<Collection | null>(null);
  const [collectionPicks, setCollectionPicks] = useState<Pick[]>([]);
  const [curatorData, setCuratorData] = useState<{
    id: string;
    name: string;
    title: string;
    shelfImage?: string;
  } | null>(null);
  const [curatorCollections, setCuratorCollections] = useState<Collection[]>([]);
  const [curatorPicks, setCuratorPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch pick data
  const fetchPickData = useCallback(async (pickId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock fetch for now - replace with actual Supabase call when available
      const picksData = await PicksService.getFeaturedPicks();
      const pick = picksData.find(p => p.id === pickId);
      
      if (!pick) {
        setError('Pick not found');
        return;
      }

      setPickData(pick);

      // Set mock curator data
      if (pick.author) {
        setCuratorData({
          id: pick.author_id,
          name: pick.author.name || 'Unknown',
          title: pick.author.username || '',
          shelfImage: undefined
        });

        // Mock other picks by same curator
        const otherPicks = picksData.filter(p => p.author_id === pick.author_id && p.id !== pick.id);
        setCuratorPicks(otherPicks.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching pick:', error);
      setError('Failed to load pick details');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch collection data
  const fetchCollectionData = useCallback(async (collectionId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock fetch for now - replace with actual Supabase call when available
      const collectionsData = await CollectionsService.getFeaturedCollections();
      const collection = collectionsData.find(c => c.id === collectionId);
      
      if (!collection) {
        setError('Collection not found');
        return;
      }

      setCollectionData(collection);

      // Set mock curator data
      if (collection.author) {
        setCuratorData({
          id: collection.author_id,
          name: collection.author.name || 'Unknown',
          title: collection.author.username || '',
          shelfImage: undefined
        });
      }

      // Mock collection picks - for now, just get some featured picks
      const picksData = await PicksService.getFeaturedPicks();
      setCollectionPicks(picksData.slice(0, 4)); // Show first 4 picks as mock collection content
    } catch (error) {
      console.error('Error fetching collection:', error);
      setError('Failed to load collection details');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data when component mounts
  useEffect(() => {
    if (!id) {
      setError('No ID provided');
      return;
    }

    if (type === 'pick') {
      fetchPickData(id);
    } else {
      fetchCollectionData(id);
    }
  }, [id, type, fetchPickData, fetchCollectionData]);

  // Handle back navigation
  const handleBack = () => {
    navigation.goBack();
  };

  // Handle navigation between items
  const handleNavigateNext = () => {
    if (currentIndex < navigationIds.length - 1) {
      const nextId = navigationIds[currentIndex + 1];
      navigation.replace('UnifiedDetail', {
        id: nextId,
        type,
        navigationIds,
        currentIndex: currentIndex + 1
      });
    }
  };

  const handleNavigatePrev = () => {
    if (currentIndex > 0) {
      const prevId = navigationIds[currentIndex - 1];
      navigation.replace('UnifiedDetail', {
        id: prevId,
        type,
        navigationIds,
        currentIndex: currentIndex - 1
      });
    }
  };

  // Handle opening URL for picks
  const handleOpenUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.log("Don't know how to open URI: " + url);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
      
      {navigationIds.length > 1 && (
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            onPress={handleNavigatePrev}
            disabled={currentIndex === 0}
            style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
          >
            <Ionicons name="chevron-back" size={20} color={currentIndex === 0 ? "#ccc" : "#000"} />
          </TouchableOpacity>
          
          <Text style={styles.navigationText}>
            {currentIndex + 1} of {navigationIds.length}
          </Text>
          
          <TouchableOpacity
            onPress={handleNavigateNext}
            disabled={currentIndex === navigationIds.length - 1}
            style={[styles.navButton, currentIndex === navigationIds.length - 1 && styles.navButtonDisabled]}
          >
            <Ionicons name="chevron-forward" size={20} color={currentIndex === navigationIds.length - 1 ? "#ccc" : "#000"} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderPickContent = () => {
    if (!pickData) return null;

    return (
      <View style={styles.contentContainer}>
        {/* Pick Image */}
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageText}>{pickData.title.charAt(0)}</Text>
          </View>
        </View>

        {/* Pick Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{pickData.title}</Text>
          <Text style={styles.description}>{pickData.description}</Text>
          
          {/* Category Badge */}
          <View style={styles.categoryContainer}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{pickData.category}</Text>
            </View>
          </View>

          {/* Open URL Button */}
          {pickData.url && (
            <TouchableOpacity
              style={styles.openButton}
              onPress={() => handleOpenUrl(pickData.url)}
            >
              <Text style={styles.openButtonText}>Open Link</Text>
              <Ionicons name="open-outline" size={16} color="#000" />
            </TouchableOpacity>
          )}
        </View>

        {/* Curator Info */}
        {curatorData && (
          <View style={styles.curatorContainer}>
            <Text style={styles.curatorTitle}>Curated by</Text>
            <View style={styles.curatorInfo}>
              <View style={styles.curatorAvatar}>
                <Text style={styles.curatorAvatarText}>{curatorData.name.charAt(0)}</Text>
              </View>
              <View style={styles.curatorDetails}>
                <Text style={styles.curatorName}>{curatorData.name}</Text>
                <Text style={styles.curatorRole}>{curatorData.title}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Other Picks by Curator */}
        {curatorPicks.length > 0 && (
          <View style={styles.relatedContainer}>
            <Text style={styles.relatedTitle}>More from {curatorData?.name}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.relatedList}>
                {curatorPicks.slice(0, 5).map((pick) => (
                  <TouchableOpacity
                    key={pick.id}
                    style={styles.relatedItem}
                    onPress={() => navigation.push('UnifiedDetail', { id: pick.id, type: 'pick' })}
                  >
                    <View style={styles.relatedImagePlaceholder}>
                      <Text style={styles.relatedImageText}>{pick.title.charAt(0)}</Text>
                    </View>
                    <Text style={styles.relatedItemTitle} numberOfLines={2}>{pick.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const renderCollectionContent = () => {
    if (!collectionData) return null;

    return (
      <View style={styles.contentContainer}>
        {/* Collection Header */}
        <View style={styles.collectionHeader}>
          <Text style={styles.title}>{collectionData.title}</Text>
          <Text style={styles.description}>{collectionData.description}</Text>
          
          {/* Categories - Collections don't have categories in the current data model */}
        </View>

        {/* Curator Info */}
        {curatorData && (
          <View style={styles.curatorContainer}>
            <Text style={styles.curatorTitle}>Curated by</Text>
            <View style={styles.curatorInfo}>
              <View style={styles.curatorAvatar}>
                <Text style={styles.curatorAvatarText}>{curatorData.name.charAt(0)}</Text>
              </View>
              <View style={styles.curatorDetails}>
                <Text style={styles.curatorName}>{curatorData.name}</Text>
                <Text style={styles.curatorRole}>{curatorData.title}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Collection Picks */}
        {collectionPicks.length > 0 && (
          <View style={styles.picksContainer}>
            <Text style={styles.picksTitle}>Picks in this collection</Text>
            <View style={styles.picksGrid}>
              {collectionPicks.map((pick) => (
                <TouchableOpacity
                  key={pick.id}
                  style={styles.pickItem}
                  onPress={() => navigation.push('UnifiedDetail', { id: pick.id, type: 'pick' })}
                >
                  <View style={styles.pickImagePlaceholder}>
                    <Text style={styles.pickImageText}>{pick.title.charAt(0)}</Text>
                  </View>
                  <Text style={styles.pickItemTitle} numberOfLines={2}>{pick.title}</Text>
                  <Text style={styles.pickItemDescription} numberOfLines={1}>{pick.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>{error}</Text>
          <TouchableOpacity onPress={handleBack} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {type === 'pick' ? renderPickContent() : renderCollectionContent()}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  navButtonDisabled: {
    backgroundColor: '#f9f9f9',
  },
  navigationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageText: {
    fontSize: 48,
    fontWeight: '600',
    color: '#666',
  },
  infoContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    lineHeight: 32,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    textTransform: 'uppercase',
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ADFF8B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  openButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  curatorContainer: {
    marginBottom: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  curatorTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  curatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  curatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  curatorAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  curatorDetails: {
    flex: 1,
  },
  curatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  curatorRole: {
    fontSize: 14,
    color: '#666',
  },
  relatedContainer: {
    marginBottom: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  relatedList: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
  },
  relatedItem: {
    width: 120,
  },
  relatedImagePlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  relatedImageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  relatedItemTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
    lineHeight: 16,
  },
  collectionHeader: {
    marginBottom: 24,
  },
  picksContainer: {
    marginBottom: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  picksTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  picksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  pickItem: {
    width: (width - 44) / 2,
  },
  pickImagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  pickImageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  pickItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
    lineHeight: 18,
  },
  pickItemDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ff3333',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
}); 