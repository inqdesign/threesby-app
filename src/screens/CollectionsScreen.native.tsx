import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ScrollView
} from '../platform/native';
import { supabase } from '../lib/supabase';
import tw from '../lib/tailwind';
import type { Profile } from '../types';

// Collection card component for native
const CollectionCard = ({ 
  collection, 
  onPress 
}: { 
  collection: any, 
  onPress: () => void 
}) => {
  const fontColor = collection.font_color === 'light' ? 'text-white' : 'text-[#252525]';
  
  return (
    <TouchableOpacity
      style={tw`w-[125px] h-[175px] mr-4 rounded-lg overflow-hidden`}
      onPress={onPress}
    >
      <View style={tw`relative w-full h-full`}>
        {collection.cover_image ? (
          <Image
            source={{ uri: collection.cover_image }}
            style={tw`w-full h-full absolute`}
            resizeMode="cover"
          />
        ) : (
          <View style={tw`w-full h-full bg-gray-200`} />
        )}
        
        <View style={tw`absolute bottom-0 left-0 right-0 p-2`}>
          <Text style={tw`text-xs ${fontColor} font-mono`}>
            Issue #{collection.id.substring(0, 4)}
          </Text>
          <Text style={tw`text-sm font-bold ${fontColor}`} numberOfLines={2}>
            {collection.title}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Curator row component
const CuratorRow = ({ 
  curator 
}: { 
  curator: Profile & { collections: any[], username?: string } 
}) => {
  return (
    <View style={tw`py-6 border-t border-gray-200`}>
      <View style={tw`flex-row items-start mb-4`}>
        {curator.avatar_url && (
          <Image
            source={{ uri: curator.avatar_url }}
            style={tw`w-10 h-10 rounded-full mr-3`}
            resizeMode="cover"
          />
        )}
        <View>
          <Text style={tw`text-xl font-bold text-[#252525]`}>
            {curator.full_name || curator.username || 'Curator'}
          </Text>
          {curator.title && (
            <Text style={tw`text-sm font-mono text-[#585757]`}>
              {curator.title}
            </Text>
          )}
        </View>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={tw`flex-row`}
        contentContainerStyle={tw`py-2`}
      >
        {curator.collections.map((collection) => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            onPress={() => {
              // Navigate to collection detail
              // This will be implemented when we set up the navigation properly
              console.log('Navigate to collection:', collection.id);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export function CollectionsScreen() {
  const [curators, setCurators] = useState<(Profile & { collections: any[] })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCurators() {
      try {
        setLoading(true);
        
        // First get all profiles that are curators
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .eq('is_creator', true)
          .eq('status', 'approved');
          
        if (profilesError) {
          throw profilesError;
        }
        
        if (!profiles || profiles.length === 0) {
          setCurators([]);
          return;
        }
        
        // For each curator, get their collections
        const curatorsWithCollections = await Promise.all(
          profiles.map(async (profile) => {
            const { data: collections, error: collectionsError } = await supabase
              .from('collections')
              .select('*')
              .eq('profile_id', profile.id)
              .order('created_at', { ascending: false });
              
            if (collectionsError) {
              console.error('Error fetching collections:', collectionsError);
              return { ...profile, collections: [] };
            }
            
            return { ...profile, collections: collections || [] };
          })
        );
        
        // Filter out curators with no collections
        const filteredCurators = curatorsWithCollections.filter(
          (curator) => curator.collections.length > 0
        );
        
        setCurators(filteredCurators);
      } catch (error) {
        console.error('Error fetching curators:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCurators();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={tw`flex-1 bg-white`}>
        <View style={tw`flex-1 justify-center items-center p-4`}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={tw`mt-4 text-gray-500`}>Loading collections...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <View style={tw`px-4 py-2 border-b border-gray-200`}>
        <Text style={tw`text-2xl font-bold text-[#252525]`}>Collections</Text>
      </View>
      
      {curators.length === 0 ? (
        <View style={tw`flex-1 justify-center items-center p-8`}>
          <Text style={tw`text-gray-500 text-center`}>
            No collections found.
          </Text>
        </View>
      ) : (
        <FlatList
          data={curators}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CuratorRow curator={item} />}
          contentContainerStyle={tw`px-4 pb-8`}
        />
      )}
    </SafeAreaView>
  );
}
