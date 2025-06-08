import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Image,
  TouchableOpacity,
  // FlatList will be used in future implementations
} from '../platform/native';
// Will be used when implementing navigation features
// import { useNavigation } from '../platform/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import tw from '../lib/tailwind';
import type { Pick } from '../types';

// Define Collection type until we update the types file
type Collection = {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  categories: string[];
  picks: string[];
  cover_image?: string;
  font_color?: 'dark' | 'light';
  created_at: string;
  updated_at: string;
};

// Collection card component for native
const CollectionCard = ({ 
  collection, 
  onPress 
}: { 
  collection: Collection, 
  onPress: () => void 
}) => {
  const fontColor = collection.font_color === 'light' ? 'text-white' : 'text-[#252525]';
  
  return (
    <TouchableOpacity
      style={tw`w-[125px] h-[175px] mr-4 rounded-lg overflow-hidden`}
      onPress={onPress}
      activeOpacity={0.7}
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

// Add new collection card
const AddCollectionCard = ({ onPress }: { onPress: () => void }) => {
  return (
    <TouchableOpacity
      style={tw`w-[125px] h-[175px] mr-4 rounded-lg bg-gray-100 items-center justify-center`}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={tw`text-3xl text-gray-400`}>+</Text>
      <Text style={tw`mt-2 text-sm text-gray-500`}>Add Collection</Text>
    </TouchableOpacity>
  );
};

// Pick card component for native
const PickCard = ({ 
  pick, 
  rank,
  onPress 
}: { 
  pick: Pick, 
  rank: number,
  onPress: () => void 
}) => {
  return (
    <TouchableOpacity
      style={tw`flex-row items-center p-4 bg-white rounded-lg shadow-sm mb-3`}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={tw`relative w-16 h-16 mr-4 rounded overflow-hidden`}>
        <Image
          source={{ uri: pick.image_url || 'https://via.placeholder.com/64' }}
          style={tw`w-full h-full`}
          resizeMode="cover"
        />
        <View style={tw`absolute top-0 right-0 bg-[#ADFF8B] w-5 h-5 rounded-bl items-center justify-center`}>
          <Text style={tw`text-xs font-bold text-black`}>{rank}</Text>
        </View>
      </View>
      
      <View style={tw`flex-1`}>
        <Text style={tw`font-bold text-[#252525] mb-1`} numberOfLines={1}>
          {pick.title}
        </Text>
        <Text style={tw`text-xs text-[#585757]`} numberOfLines={2}>
          {pick.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Add new pick card
const AddPickCard = ({ onPress }: { onPress: () => void }) => {
  return (
    <TouchableOpacity
      style={tw`flex-row items-center p-4 bg-gray-100 rounded-lg mb-3`}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={tw`w-16 h-16 mr-4 rounded bg-gray-200 items-center justify-center`}>
        <Text style={tw`text-2xl text-gray-400`}>+</Text>
      </View>
      
      <View style={tw`flex-1`}>
        <Text style={tw`font-bold text-[#252525] mb-1`}>
          Add New Pick
        </Text>
        <Text style={tw`text-xs text-[#585757]`}>
          Create a new pick to share with your followers
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export function MyThreesScreen() {
  const [picks, setPicks] = useState<Pick[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  // Will be used when implementing navigation features
  // const navigation = useNavigation();
  const { user } = useAuth();
  
  useEffect(() => {
    async function fetchUserContent() {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch user's picks
        const { data: picksData, error: picksError } = await supabase
          .from('picks')
          .select('*')
          .eq('profile_id', user.id)
          .order('rank', { ascending: true });
          
        if (picksError) {
          throw picksError;
        }
        
        if (picksData) {
          setPicks(picksData);
        }
        
        // Fetch user's collections if they are a creator
        const { data: profileData } = await supabase
          .from('profiles')
          .select('is_creator, status')
          .eq('id', user.id)
          .single();
          
        if (profileData?.is_creator && profileData?.status === 'approved') {
          const { data: collectionsData, error: collectionsError } = await supabase
            .from('collections')
            .select('*')
            .eq('profile_id', user.id)
            .order('created_at', { ascending: false });
            
          if (collectionsError) {
            throw collectionsError;
          }
          
          if (collectionsData) {
            setCollections(collectionsData);
          }
        }
      } catch (error) {
        console.error('Error fetching user content:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserContent();
  }, [user]);

  const handleAddPick = () => {
    // Navigate to add pick screen
    // This will be implemented when we set up the navigation properly
    console.log('Navigate to add pick screen');
  };
  
  const handleEditPick = (pick: Pick) => {
    // Navigate to edit pick screen
    // This will be implemented when we set up the navigation properly
    console.log('Navigate to edit pick screen', pick.id);
  };
  
  const handleAddCollection = () => {
    // Navigate to add collection screen
    // This will be implemented when we set up the navigation properly
    console.log('Navigate to add collection screen');
  };
  
  const handleEditCollection = (collection: Collection) => {
    // Navigate to edit collection screen
    // This will be implemented when we set up the navigation properly
    console.log('Navigate to edit collection screen', collection.id);
  };

  if (loading) {
    return (
      <SafeAreaView style={tw`flex-1 bg-white`}>
        <View style={tw`flex-1 justify-center items-center p-4`}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={tw`mt-4 text-gray-500`}>Loading your content...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!user) {
    return (
      <SafeAreaView style={tw`flex-1 bg-white`}>
        <View style={tw`flex-1 justify-center items-center p-8`}>
          <Text style={tw`text-xl font-bold text-center mb-4`}>
            Sign in to view your picks
          </Text>
          <Text style={tw`text-gray-500 text-center mb-6`}>
            Create an account or sign in to manage your picks and collections
          </Text>
          <TouchableOpacity
            style={tw`bg-[#252525] py-3 px-6 rounded-lg`}
            onPress={() => {
              // Navigate to sign in screen
              // This will be implemented when we set up the navigation properly
              console.log('Navigate to sign in screen');
            }}
          >
            <Text style={tw`text-white font-bold`}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <ScrollView>
        <View style={tw`px-4 py-3 border-b border-gray-200`}>
          <Text style={tw`text-2xl font-bold text-[#252525]`}>My Threes</Text>
        </View>
        
        {/* My Picks Section */}
        <View style={tw`p-4`}>
          <Text style={tw`text-xl font-bold mb-4`}>My Picks</Text>
          
          <AddPickCard onPress={handleAddPick} />
          
          {picks.map((pick) => (
            <PickCard
              key={pick.id}
              pick={pick}
              rank={pick.rank || 1}
              onPress={() => handleEditPick(pick)}
            />
          ))}
          
          {picks.length === 0 && (
            <View style={tw`py-6 items-center`}>
              <Text style={tw`text-gray-500 text-center`}>
                You haven't created any picks yet
              </Text>
            </View>
          )}
        </View>
        
        {/* Collections Section - Only shown for approved creators */}
        {collections.length > 0 && (
          <View style={tw`px-4 pt-2 pb-8`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`text-xl font-bold`}>My Collections</Text>
            </View>
            
            <View style={tw`flex-row`}>
              <View style={tw`w-1/3 pr-4`}>
                <Text style={tw`text-sm text-[#585757] mb-2`}>
                  Create and curate collections of your favorite picks
                </Text>
              </View>
              
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={tw`w-2/3`}
                contentContainerStyle={tw`py-2`}
              >
                <AddCollectionCard onPress={handleAddCollection} />
                
                {collections.map((collection) => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    onPress={() => handleEditCollection(collection)}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
