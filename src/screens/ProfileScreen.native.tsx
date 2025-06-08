import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Image,
  TouchableOpacity
} from '../platform/native';
import { useRoute } from '../platform/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import tw from '../lib/tailwind';
import type { Pick, Profile } from '../types';

// Pick card component for profile view
const ProfilePickCard = ({ 
  pick, 
  rank 
}: { 
  pick: Pick, 
  rank: number 
}) => {
  return (
    <View style={tw`w-full mb-4 bg-white rounded-lg overflow-hidden shadow-sm`}>
      <Image
        source={{ uri: pick.image_url || 'https://via.placeholder.com/300' }}
        style={tw`w-full aspect-[3/4]`}
        resizeMode="cover"
      />
      
      <View style={tw`absolute top-2 right-2 bg-[#ADFF8B] w-6 h-6 rounded-full items-center justify-center`}>
        <Text style={tw`text-xs font-bold text-black`}>{rank}</Text>
      </View>
      
      <View style={tw`p-3`}>
        <Text style={tw`font-bold text-[#252525] mb-1`} numberOfLines={1}>
          {pick.title}
        </Text>
        <Text style={tw`text-xs text-[#585757]`} numberOfLines={2}>
          {pick.description}
        </Text>
      </View>
    </View>
  );
};

export function ProfileScreen() {
  const [profile, setProfile] = useState<(Profile & { username?: string }) | null>(null);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const route = useRoute<any>();
  const { user } = useAuth();
  
  // Get profile ID from route params or use current user ID
  const profileId = route.params?.id || user?.id;
  
  useEffect(() => {
    async function fetchProfileData() {
      if (!profileId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single();
          
        if (profileError) {
          throw profileError;
        }
        
        if (profileData) {
          setProfile(profileData);
        }
        
        // Fetch profile picks
        const { data: picksData, error: picksError } = await supabase
          .from('picks')
          .select('*')
          .eq('profile_id', profileId)
          .eq('status', 'published')
          .order('rank', { ascending: true });
          
        if (picksError) {
          throw picksError;
        }
        
        if (picksData) {
          setPicks(picksData);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProfileData();
  }, [profileId, user]);

  const isOwnProfile = user && profile && user.id === profile.id;
  
  if (loading) {
    return (
      <SafeAreaView style={tw`flex-1 bg-white`}>
        <View style={tw`flex-1 justify-center items-center p-4`}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={tw`mt-4 text-gray-500`}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!profile) {
    return (
      <SafeAreaView style={tw`flex-1 bg-white`}>
        <View style={tw`flex-1 justify-center items-center p-8`}>
          <Text style={tw`text-xl font-bold text-center mb-4`}>
            Profile Not Found
          </Text>
          <Text style={tw`text-gray-500 text-center`}>
            The profile you're looking for doesn't exist or has been removed.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <ScrollView>
        {/* Profile Header */}
        <View style={tw`p-4 border-b border-gray-200`}>
          <View style={tw`flex-row items-center mb-4`}>
            {profile.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={tw`w-20 h-20 rounded-full mr-4`}
                resizeMode="cover"
              />
            ) : (
              <View style={tw`w-20 h-20 rounded-full bg-gray-200 mr-4`} />
            )}
            
            <View style={tw`flex-1`}>
              <Text style={tw`text-xl font-bold text-[#252525]`}>
                {profile.full_name || profile.username || 'User'}
              </Text>
              
              {profile.title && (
                <Text style={tw`text-sm font-mono text-[#585757] mb-1`}>
                  {profile.title}
                </Text>
              )}
              
              <View style={tw`flex-row`}>
                <Text style={tw`text-xs text-[#9d9b9b] mr-4`}>
                  {profile.followers_count || 0} Followers
                </Text>
                <Text style={tw`text-xs text-[#9d9b9b]`}>
                  {profile.following_count || 0} Following
                </Text>
              </View>
            </View>
          </View>
          
          {profile.bio && (
            <Text style={tw`text-sm text-[#252525] mb-4`}>
              {profile.bio}
            </Text>
          )}
          
          {isOwnProfile && (
            <TouchableOpacity
              style={tw`bg-gray-100 py-2 rounded-lg items-center`}
              onPress={() => {
                // Navigate to edit profile screen
                // This will be implemented when we set up the navigation properly
                console.log('Navigate to edit profile screen');
              }}
            >
              <Text style={tw`text-sm font-medium text-[#252525]`}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Picks Grid */}
        <View style={tw`p-4`}>
          <Text style={tw`text-xl font-bold mb-4`}>Picks</Text>
          
          {picks.length === 0 ? (
            <View style={tw`py-8 items-center`}>
              <Text style={tw`text-gray-500 text-center`}>
                No picks to display
              </Text>
            </View>
          ) : (
            <View style={tw`flex-row flex-wrap justify-between`}>
              {picks.map((pick) => (
                <View key={pick.id} style={tw`w-[48%] mb-4`}>
                  <ProfilePickCard pick={pick} rank={pick.rank || 1} />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
