import React from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Collection } from '../lib/supabase'

interface CollectionCardProps {
  collection: Collection
  onPress?: () => void
  variant?: 'featured' | 'grid'
}

const { width: screenWidth } = Dimensions.get('window')
const cardWidth = (screenWidth - 32 - 16) / 2 // Account for padding and gap

export const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  onPress,
  variant = 'grid'
}) => {
  const pickCount = collection.picks?.length || 0
  const categoryText = collection.categories?.length > 0 ? collection.categories[0] : 'Collection'

  if (variant === 'featured') {
    return (
      <TouchableOpacity style={styles.featuredCard} onPress={onPress}>
        <View style={styles.featuredImageContainer}>
          {collection.cover_image ? (
            <Image source={{ uri: collection.cover_image }} style={styles.featuredImage} />
          ) : (
            <View style={[styles.featuredImagePlaceholder, { backgroundColor: '#f0f0f0' }]}>
              <Ionicons name="library-outline" size={40} color="#ccc" />
            </View>
          )}
          {collection.issue_number && (
            <View style={styles.issueBadge}>
              <Text style={styles.issueText}>#{collection.issue_number}</Text>
            </View>
          )}
        </View>
        <View style={styles.featuredContent}>
          <Text style={styles.featuredCategory}>{categoryText.toUpperCase()}</Text>
          <Text style={styles.featuredTitle} numberOfLines={2}>{collection.title}</Text>
          <Text style={styles.featuredDescription} numberOfLines={2}>{collection.description}</Text>
          <View style={styles.featuredFooter}>
            <Text style={styles.pickCount}>{pickCount} picks</Text>
            {collection.profiles && (
              <View style={styles.profileRow}>
                <View style={styles.avatar}>
                  {collection.profiles.avatar_url ? (
                    <Image source={{ uri: collection.profiles.avatar_url }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {collection.profiles.full_name?.[0] || collection.profiles.email[0]}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.curatorName}>{collection.profiles.full_name || 'Anonymous'}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  // Default grid variant
  return (
    <TouchableOpacity style={[styles.gridCard, { width: cardWidth }]} onPress={onPress}>
      <View style={styles.gridImageContainer}>
        {collection.cover_image ? (
          <Image source={{ uri: collection.cover_image }} style={styles.gridImage} />
        ) : (
          <View style={[styles.gridImagePlaceholder, { backgroundColor: '#f0f0f0' }]}>
            <Ionicons name="library-outline" size={24} color="#ccc" />
          </View>
        )}
        {collection.issue_number && (
          <View style={styles.gridIssueBadge}>
            <Text style={styles.gridIssueText}>#{collection.issue_number}</Text>
          </View>
        )}
      </View>
      <View style={styles.gridContent}>
        <Text style={styles.gridCategory}>{categoryText.toUpperCase()}</Text>
        <Text style={styles.gridTitle} numberOfLines={2}>{collection.title}</Text>
        <Text style={styles.gridPickCount}>{pickCount} picks</Text>
        {collection.profiles && (
          <Text style={styles.gridCurator} numberOfLines={1}>
            by {collection.profiles.full_name || 'Anonymous'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  // Featured card styles
  featuredCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featuredImageContainer: {
    position: 'relative',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
  },
  featuredImagePlaceholder: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  issueBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  issueText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  featuredContent: {
    padding: 16,
  },
  featuredCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 1,
    marginBottom: 8,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 24,
  },
  featuredDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 8,
  },
  avatarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e5e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  curatorName: {
    fontSize: 12,
    color: '#666',
  },

  // Grid card styles
  gridCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  gridImageContainer: {
    position: 'relative',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f5f5f5',
  },
  gridImagePlaceholder: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridIssueBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#000',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  gridIssueText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  gridContent: {
    padding: 12,
  },
  gridCategory: {
    fontSize: 9,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
    lineHeight: 18,
  },
  gridPickCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4,
  },
  gridCurator: {
    fontSize: 10,
    color: '#999',
  },
}) 