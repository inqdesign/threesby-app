import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator,
  // RefreshControl will be added when React Native dependencies are installed
  SafeAreaView
} from '../platform/native';
import { PickCard } from '../components/PickCard.native';
// These imports will be used when implementing navigation and auth features
// import { useNavigation } from '../platform/native';
// import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Pick } from '../types';
import tw from '../lib/tailwind';

export function DiscoverScreen() {
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // These will be used when implementing navigation and auth features
  // const navigation = useNavigation();
  // const { user } = useAuth();

  const fetchPicks = async () => {
    try {
      setLoading(true);
      
      // Fetch published picks
      const { data, error } = await supabase
        .from('picks')
        .select(`
          *,
          profile:profiles(id, full_name, title, avatar_url, is_admin, is_creator, is_brand)
        `)
        .eq('status', 'active')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setPicks(data);
      }
    } catch (error) {
      console.error('Error fetching picks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPicks();
  };

  useEffect(() => {
    fetchPicks();
  }, []);

  // Render loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={tw`flex-1 bg-white`}>
        <View style={tw`flex-1 justify-center items-center p-4`}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={tw`mt-4 text-gray-500`}>Loading picks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <View style={tw`px-4 py-2 border-b border-gray-200`}>
        <Text style={tw`text-2xl font-bold text-[#252525]`}>Discover</Text>
      </View>
      
      <FlatList
        data={picks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={tw`p-2`}>
            <PickCard pick={item} variant="feed" display="mobile" />
          </View>
        )}
        numColumns={2}
        columnWrapperStyle={tw`justify-between`}
        contentContainerStyle={tw`p-2`}
        // RefreshControl will be added when React Native dependencies are installed
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={tw`flex-1 justify-center items-center p-8`}>
            <Text style={tw`text-gray-500 text-center`}>
              No picks found. Pull down to refresh.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
