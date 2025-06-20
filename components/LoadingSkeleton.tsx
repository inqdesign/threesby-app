import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated, Dimensions } from 'react-native'

interface LoadingSkeletonProps {
  variant?: 'pick' | 'collection' | 'featured'
  count?: number
}

const { width: screenWidth } = Dimensions.get('window')
const cardWidth = (screenWidth - 32 - 16) / 2

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'pick',
  count = 4
}) => {
  const shimmerOpacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerOpacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    )
    shimmerAnimation.start()

    return () => shimmerAnimation.stop()
  }, [shimmerOpacity])

  const ShimmerView = ({ style }: { style: any }) => (
    <Animated.View
      style={[
        style,
        {
          backgroundColor: '#e0e0e0',
          opacity: shimmerOpacity,
        },
      ]}
    />
  )

  const FeaturedPickSkeleton = () => (
    <View style={styles.featuredCard}>
      <ShimmerView style={styles.featuredImage} />
      <View style={styles.featuredContent}>
        <ShimmerView style={styles.featuredTitleSkeleton} />
        <ShimmerView style={styles.featuredDescriptionSkeleton} />
        <View style={styles.profileRowSkeleton}>
          <ShimmerView style={styles.avatarSkeleton} />
          <View style={styles.profileInfoSkeleton}>
            <ShimmerView style={styles.profileNameSkeleton} />
            <ShimmerView style={styles.profileTitleSkeleton} />
          </View>
        </View>
      </View>
    </View>
  )

  const GridPickSkeleton = () => (
    <View style={[styles.gridCard, { width: cardWidth }]}>
      <ShimmerView style={styles.gridImage} />
      <View style={styles.gridContent}>
        <ShimmerView style={styles.gridTitleSkeleton} />
        <ShimmerView style={styles.gridDescriptionSkeleton} />
        <ShimmerView style={styles.gridAuthorSkeleton} />
      </View>
    </View>
  )

  const FeaturedCollectionSkeleton = () => (
    <View style={styles.featuredCard}>
      <ShimmerView style={styles.featuredImage} />
      <View style={styles.featuredContent}>
        <ShimmerView style={styles.categorySkeleton} />
        <ShimmerView style={styles.featuredTitleSkeleton} />
        <ShimmerView style={styles.featuredDescriptionSkeleton} />
        <View style={styles.featuredFooter}>
          <ShimmerView style={styles.pickCountSkeleton} />
          <View style={styles.profileRowSkeleton}>
            <ShimmerView style={styles.smallAvatarSkeleton} />
            <ShimmerView style={styles.curatorNameSkeleton} />
          </View>
        </View>
      </View>
    </View>
  )

  const GridCollectionSkeleton = () => (
    <View style={[styles.gridCard, { width: cardWidth }]}>
      <ShimmerView style={styles.gridCollectionImage} />
      <View style={styles.gridContent}>
        <ShimmerView style={styles.gridCategorySkeleton} />
        <ShimmerView style={styles.gridTitleSkeleton} />
        <ShimmerView style={styles.gridPickCountSkeleton} />
        <ShimmerView style={styles.gridCuratorSkeleton} />
      </View>
    </View>
  )

  const renderSkeleton = () => {
    switch (variant) {
      case 'featured':
        return <FeaturedPickSkeleton />
      case 'collection':
        return <GridCollectionSkeleton />
      default:
        return <GridPickSkeleton />
    }
  }

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={variant === 'featured' ? styles.featuredContainer : styles.gridContainer}>
          {renderSkeleton()}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  featuredContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  gridContainer: {
    width: cardWidth,
    marginBottom: 16,
  },
  
  // Featured card skeleton
  featuredCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featuredImage: {
    width: '100%',
    height: 240,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  featuredContent: {
    padding: 16,
  },
  featuredTitleSkeleton: {
    height: 24,
    borderRadius: 4,
    marginBottom: 8,
  },
  featuredDescriptionSkeleton: {
    height: 20,
    borderRadius: 4,
    marginBottom: 12,
    width: '80%',
  },
  profileRowSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  profileInfoSkeleton: {
    flex: 1,
  },
  profileNameSkeleton: {
    height: 14,
    borderRadius: 4,
    marginBottom: 4,
    width: '60%',
  },
  profileTitleSkeleton: {
    height: 12,
    borderRadius: 4,
    width: '40%',
  },
  categorySkeleton: {
    height: 10,
    borderRadius: 4,
    marginBottom: 8,
    width: '30%',
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickCountSkeleton: {
    height: 12,
    borderRadius: 4,
    width: 50,
  },
  smallAvatarSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  curatorNameSkeleton: {
    height: 12,
    borderRadius: 4,
    width: 60,
  },

  // Grid card skeleton
  gridCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  gridImage: {
    width: '100%',
    height: cardWidth,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  gridCollectionImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  gridContent: {
    padding: 12,
  },
  gridTitleSkeleton: {
    height: 14,
    borderRadius: 4,
    marginBottom: 4,
  },
  gridDescriptionSkeleton: {
    height: 12,
    borderRadius: 4,
    marginBottom: 4,
    width: '80%',
  },
  gridAuthorSkeleton: {
    height: 11,
    borderRadius: 4,
    width: '60%',
  },
  gridCategorySkeleton: {
    height: 9,
    borderRadius: 4,
    marginBottom: 6,
    width: '40%',
  },
  gridPickCountSkeleton: {
    height: 11,
    borderRadius: 4,
    marginBottom: 4,
    width: '50%',
  },
  gridCuratorSkeleton: {
    height: 10,
    borderRadius: 4,
    width: '60%',
  },
}) 