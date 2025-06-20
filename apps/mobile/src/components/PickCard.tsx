import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PickCardProps {
  pick?: any;
  onPress?: () => void;
}

const PickCardInternal = memo(({
  pick,
  onPress,
}: PickCardProps) => {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

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
    } else if (pick?.id) {
      console.log('Open pick:', pick.title);
    }
  }, [onPress, pick]);

  // Handle image URLs safely
  const imageUrl = pick?.image_url || '';
  const errorImageUrl = 'https://placehold.co/150x150/E5E5E5/737373/png?text=No+Image';

  if (!pick) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.pickCardContainer}
      onPress={handleCardPress}
      activeOpacity={0.9}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ 
            uri: imageError ? errorImageUrl : (imageUrl || errorImageUrl)
          }}
          style={styles.pickImage}
          onError={() => setImageError(true)}
          resizeMode="cover"
        />
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.infoContent}>
          <View style={styles.textContent}>
            <Text style={styles.pickTitle} numberOfLines={2}>
              {pick.title}
            </Text>
            <Text style={styles.pickDescription} numberOfLines={2}>
              {pick.description || 'No description'}
            </Text>
            {pick.category && (
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryText}>{pick.category}</Text>
              </View>
            )}
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
      </View>
    </TouchableOpacity>
  );
});

const PickCard = memo(PickCardInternal);
export default PickCard;

const styles = StyleSheet.create({
  pickCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  pickImage: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    padding: 16,
  },
  infoContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textContent: {
    flex: 1,
    marginRight: 12,
  },
  pickTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0A0A',
    marginBottom: 4,
  },
  pickDescription: {
    fontSize: 14,
    color: '#737373',
    lineHeight: 20,
    marginBottom: 8,
  },
  categoryContainer: {
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    color: '#171717',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '500',
  },
  saveButton: {
    padding: 4,
  },
}); 