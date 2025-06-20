import React from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Pick } from '../lib/supabase'

interface PickCardProps {
  pick: Pick
  onPress?: () => void
  onSave?: () => void
  isSaved?: boolean
  variant?: 'featured' | 'grid' | 'list'
  index?: number
}

const { width: screenWidth } = Dimensions.get('window')
const cardWidth = (screenWidth - 32 - 16) / 2 // Account for padding and gap

export const PickCard: React.FC<PickCardProps> = ({
  pick,
  onPress,
  onSave,
  isSaved = false,
  variant = 'grid',
  index
}) => {
  const showRank = variant === 'featured' && typeof index === 'number'
  const rankLabel = showRank ? `#${String(index + 1).padStart(2, '0')}` : null

  if (variant === 'featured') {
    return (
      <TouchableOpacity style={styles.featuredCard} onPress={onPress}>
        <View style={styles.featuredImageContainer}>
          <Image source={{ uri: pick.image_url }} style={styles.featuredImage} />
          {rankLabel && (
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{rankLabel}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.saveButton} onPress={onSave}>
            <Ionicons 
              name={isSaved ? "heart" : "heart-outline"} 
              size={20} 
              color={isSaved ? "#FF6B6B" : "#666"} 
            />
          </TouchableOpacity>
        </View>
        <View style={styles.featuredContent}>
          <Text style={styles.featuredTitle} numberOfLines={2}>{pick.title}</Text>
          <Text style={styles.featuredDescription} numberOfLines={2}>{pick.description}</Text>
          {pick.profile && (
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                {pick.profile.avatar_url ? (
                  <Image source={{ uri: pick.profile.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {pick.profile.full_name?.[0] || pick.profile.email[0]}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{pick.profile.full_name || 'Anonymous'}</Text>
                <Text style={styles.profileTitle}>{pick.profile.title}</Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  if (variant === 'list') {
    return (
      <TouchableOpacity style={styles.listCard} onPress={onPress}>
        <Image source={{ uri: pick.image_url }} style={styles.listImage} />
        <View style={styles.listContent}>
          <Text style={styles.listTitle} numberOfLines={2}>{pick.title}</Text>
          <Text style={styles.listDescription} numberOfLines={2}>{pick.description}</Text>
          {pick.profile && (
            <Text style={styles.listAuthor} numberOfLines={1}>
              by {pick.profile.full_name || 'Anonymous'}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.listSaveButton} onPress={onSave}>
          <Ionicons 
            name={isSaved ? "heart" : "heart-outline"} 
            size={18} 
            color={isSaved ? "#FF6B6B" : "#666"} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }

  // Default grid variant
  return (
    <TouchableOpacity style={[styles.gridCard, { width: cardWidth }]} onPress={onPress}>
      <View style={styles.gridImageContainer}>
        <Image source={{ uri: pick.image_url }} style={styles.gridImage} />
        <TouchableOpacity style={styles.gridSaveButton} onPress={onSave}>
          <Ionicons 
            name={isSaved ? "heart" : "heart-outline"} 
            size={16} 
            color={isSaved ? "#FF6B6B" : "#666"} 
          />
        </TouchableOpacity>
      </View>
      <View style={styles.gridContent}>
        <Text style={styles.gridTitle} numberOfLines={2}>{pick.title}</Text>
        <Text style={styles.gridDescription} numberOfLines={1}>{pick.description}</Text>
        {pick.profile && (
          <Text style={styles.gridAuthor} numberOfLines={1}>
            {pick.profile.full_name || 'Anonymous'}
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
    height: 240,
    backgroundColor: '#f5f5f5',
  },
  rankBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  saveButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#fff',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  featuredContent: {
    padding: 16,
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
    marginBottom: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e5e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  profileTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  // List card styles
  listCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  listImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginRight: 16,
  },
  listContent: {
    flex: 1,
    marginRight: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  listDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  listAuthor: {
    fontSize: 12,
    color: '#999',
  },
  listSaveButton: {
    padding: 8,
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
    height: cardWidth,
    backgroundColor: '#f5f5f5',
  },
  gridSaveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  gridContent: {
    padding: 12,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
    lineHeight: 18,
  },
  gridDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  gridAuthor: {
    fontSize: 11,
    color: '#999',
  },
}) 