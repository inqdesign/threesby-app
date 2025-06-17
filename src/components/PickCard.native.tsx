import { useState, memo } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity
} from '../platform/native';
import { useNavigation } from '../platform/native';
import { useAuth } from '../context/AuthContext';
import { savePick, unsavePick, isPickSaved } from '../services/favoritesService';
import type { Pick } from '../types';
import tw from '../lib/tailwind';

interface PickCardProps {
  pick?: Pick & {
    profile?: {
      id: string;
      full_name: string | null;
      title: string | null;
      avatar_url?: string | null;
      is_admin?: boolean;
      is_creator?: boolean;
      is_brand?: boolean;
    };
  };
  variant?: 'feed' | 'Pick' | 'myPick' | 'bestPick' | 'archive' | 'addNew' | 'empty';
  rank?: number;
  display?: 'mobile' | 'desktop';
  disableProfileLink?: boolean;
  contentLinkTo?: string;
  showSaveButton?: boolean;
  className?: string;
  style?: any;
  onPress?: () => void;
}

// Internal component that doesn't use hooks
const PickCardInternal = memo(
  ({
    pick,
    variant = 'feed',
    rank,
    display = 'mobile',
    disableProfileLink = false,
    // contentLinkTo not used in native
    showSaveButton = true,
    style,
    onPress,
  }: PickCardProps) => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [isSaved, setIsSaved] = useState(pick ? isPickSaved(pick.id) : false);
    const [isLoading, setIsLoading] = useState(false);

    if (!pick && variant !== 'addNew' && variant !== 'empty') {
      return null;
    }

    const cardVariant = variant === 'Pick' && pick?.rank === 1 ? 'bestPick' : variant;
    const isActive = cardVariant === 'myPick' && pick?.status === 'published';
    const rankLabel = rank || pick?.rank;

    const handleSave = async () => {
      if (!user) {
        // Handle unauthenticated user
        return;
      }

      if (!pick) return;

      setIsLoading(true);
      try {
        if (isSaved) {
          await unsavePick(pick.id);
          setIsSaved(false);
        } else {
          await savePick(pick.id);
          setIsSaved(true);
        }
      } catch (error) {
        console.error('Error toggling save status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleCardPress = () => {
      if (onPress) {
        onPress();
        return;
      }

      if (!pick) return;

      // Navigate to pick detail
      navigation.navigate('PickDetail', { id: pick.id });
    };

    const handleProfilePress = () => {
      if (!pick?.profile?.id) return;
      
      // Navigate to profile
      navigation.navigate('Profile', { id: pick.profile.id });
    };

    const showProfileInfo = variant === 'feed';
    const showPickInfo = variant === 'feed' || variant === 'Pick';
    const showSaveAndFollow = variant === 'feed' || variant === 'Pick';
    const showRankLabel = (variant === 'feed') || (variant === 'Pick' && display === 'desktop');

    // Render empty or add new card
    if (variant === 'empty') {
      return (
        <View style={[tw`bg-gray-100 rounded-lg`, style]}>
          <View style={tw`aspect-[3/4] flex items-center justify-center`}>
            <Text style={tw`text-gray-400`}>Empty</Text>
          </View>
        </View>
      );
    }

    if (variant === 'addNew') {
      return (
        <TouchableOpacity 
          style={[tw`bg-gray-100 rounded-lg`, style]}
          onPress={handleCardPress}
        >
          <View style={tw`aspect-[3/4] flex items-center justify-center`}>
            <Text style={tw`text-gray-600 text-4xl`}>+</Text>
            <Text style={tw`text-gray-600 mt-2`}>Add New</Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (!pick) return null;

    return (
      <TouchableOpacity 
        style={[
          tw`overflow-hidden rounded-lg bg-white`,
          cardVariant === 'archive' && tw`opacity-60`,
          style
        ]}
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
        {/* Rank Label */}
        {showRankLabel && rankLabel && !isActive && (
          <View style={tw`absolute top-2 right-2 z-30 bg-[#a1ff7a] w-6 h-6 rounded-full items-center justify-center`}>
            <Text style={tw`text-black font-bold text-xs`}>{rankLabel}</Text>
          </View>
        )}

        {/* Image */}
        <View style={tw`relative`}>
          <Image
            source={{ uri: pick.image_url || 'https://via.placeholder.com/300x400' }}
            style={tw`aspect-[3/4] w-full`}
            resizeMode="cover"
          />
          
          {/* Save Button */}
          {showSaveAndFollow && showSaveButton && user && (
            <TouchableOpacity
              style={tw`absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-sm`}
              onPress={handleSave}
              disabled={isLoading}
            >
              <View style={tw`w-5 h-5 items-center justify-center`}>
                <Text style={[tw`text-sm`, isSaved ? tw`text-red-500` : tw`text-gray-500`]}>
                  {isSaved ? '❤️' : '♡'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        {showPickInfo && (
          <View style={tw`p-3`}>
            <Text style={tw`font-bold text-[#252525] text-base mb-1`} numberOfLines={1}>
              {pick.title}
            </Text>
            {pick.description && (
              <Text style={tw`text-[#585757] text-sm`} numberOfLines={1}>
                {pick.description.substring(0, 30)}{pick.description.length > 30 ? '...' : ''}
              </Text>
            )}
          </View>
        )}

        {/* Profile Info */}
        {showProfileInfo && pick.profile && (
          <TouchableOpacity 
            style={tw`px-3 pb-3 flex-row items-center`}
            onPress={handleProfilePress}
            disabled={disableProfileLink}
          >
            <Image
              source={{ 
                uri: pick.profile.avatar_url || 'https://via.placeholder.com/40x40' 
              }}
              style={tw`w-6 h-6 rounded-full mr-2`}
            />
            <View>
              <Text style={tw`text-[#252525] text-xs font-medium`}>
                {pick.profile.full_name || pick.profile.id.substring(0, 8)}
              </Text>
              {pick.profile.title && (
                <Text style={tw`text-[#9d9b9b] text-xs`}>
                  {pick.profile.title}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }
);

// Wrapper component that uses hooks
export function PickCard(props: PickCardProps) {
  return <PickCardInternal {...props} />;
}
