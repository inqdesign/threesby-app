import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CollectionCardProps {
  collection?: any;
  onPress?: () => void;
}

const CollectionCardInternal = memo(({
  collection,
  onPress,
}: CollectionCardProps) => {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = useCallback(async () => {
    setLoading(true);
    try {
      // Mock save functionality
      setSaved(!saved);
    } catch (error) {
      console.error('Error updating save status:', error);
    } finally {
      setLoading(false);
    }
  }, [saved]);

  const handleCardPress = useCallback(() => {
    if (onPress) {
      onPress();
    } else if (collection?.id) {
      console.log('Open collection:', collection.title);
    }
  }, [onPress, collection]);

  if (!collection) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.collectionCardContainer}
      onPress={handleCardPress}
      activeOpacity={0.9}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="library-outline" size={20} color="#171717" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.collectionTitle} numberOfLines={1}>
            {collection.title}
          </Text>
          <Text style={styles.collectionMeta}>
            {collection.pickCount || 0} picks • {collection.curator || 'Unknown'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#737373" />
          ) : (
            <Ionicons
              name={saved ? "heart" : "heart-outline"}
              size={20}
              color={saved ? "#ef4444" : "#737373"}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Description */}
      {collection.description && (
        <Text style={styles.collectionDescription} numberOfLines={2}>
          {collection.description}
        </Text>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.viewCollection}>View Collection →</Text>
      </View>
    </TouchableOpacity>
  );
});

const CollectionCard = memo(CollectionCardInternal);
export default CollectionCard;

const styles = StyleSheet.create({
  collectionCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  collectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0A0A',
    marginBottom: 2,
  },
  collectionMeta: {
    fontSize: 12,
    color: '#737373',
  },
  saveButton: {
    padding: 4,
  },
  collectionDescription: {
    fontSize: 14,
    color: '#737373',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    alignItems: 'flex-end',
  },
  viewCollection: {
    fontSize: 14,
    color: '#171717',
    fontWeight: '500',
  },
}); 