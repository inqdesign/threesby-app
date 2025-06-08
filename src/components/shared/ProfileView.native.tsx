import { useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView
} from '../../platform/native';
import { useRoute, useNavigation } from '../../platform/native';
import { useAuth } from "../../hooks/useAuth";
import { useProfileData } from '../../hooks/useProfileData';
import type { Pick } from '../../types';
import tw from '../../lib/tailwind';

export function ProfileView() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { id } = route.params as { id: string };
  
  const { profile, picks, loading, error } = useProfileData(
    id, 
    user?.id, 
    user?.app_metadata?.role
  );

  const [activeTab, setActiveTab] = useState('All');

  if (error) {
    return (
      <SafeAreaView style={tw`flex-1 bg-[#F4F4F4]`}>
        <View style={tw`m-5 p-5 bg-white rounded-lg`}>
          <Text style={tw`text-xl font-semibold text-red-600 mb-2`}>Error</Text>
          <Text style={tw`text-gray-700 mb-4`}>{error}</Text>
          <TouchableOpacity 
            style={tw`px-4 py-2 bg-blue-600 rounded`}
            onPress={() => navigation.goBack()}
          >
            <Text style={tw`text-white font-bold`}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  if (loading || !profile) {
    return (
      <SafeAreaView style={tw`flex-1 bg-[#F4F4F4] justify-center items-center`}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={tw`mt-4 text-gray-600`}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  // Filter picks based on active tab
  const filteredPicks = activeTab === 'All' 
    ? picks 
    : picks.filter(pick => pick.category.toLowerCase() === activeTab.toLowerCase());

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F4F4F4]`}>
      <ScrollView>
        <View style={tw`p-4`}>
          <TouchableOpacity 
            style={tw`mb-4`}
            onPress={() => navigation.goBack()}
          >
            <Text style={tw`text-gray-600`}>← Back</Text>
          </TouchableOpacity>
          
          <View style={tw`bg-white rounded-lg shadow p-6 mb-6`}>
            <View style={tw`items-center`}>
              <Image 
                source={{ uri: profile.avatar_url || 'https://via.placeholder.com/150' }} 
                style={tw`w-24 h-24 rounded-full mb-4`} 
              />
              <Text style={tw`text-xl font-semibold mb-1`}>{profile.full_name}</Text>
              <Text style={tw`text-gray-500 mb-4`}>@{profile.id.substring(0, 8)}</Text>
              
              <View style={tw`flex-row justify-between w-full mb-6`}>
                <View style={tw`items-center`}>
                  <Text style={tw`font-semibold`}>{profile.followers_count || 0}</Text>
                  <Text style={tw`text-xs text-gray-500`}>Followers</Text>
                </View>
                <View style={tw`items-center`}>
                  <Text style={tw`font-semibold`}>{profile.following_count || 0}</Text>
                  <Text style={tw`text-xs text-gray-500`}>Following</Text>
                </View>
                <View style={tw`items-center`}>
                  <Text style={tw`font-semibold`}>{picks.length}</Text>
                  <Text style={tw`text-xs text-gray-500`}>Picks</Text>
                </View>
              </View>
              
              {profile.bio && (
                <View style={tw`mb-6`}>
                  <Text style={tw`text-sm text-gray-700 text-center`}>{profile.bio}</Text>
                </View>
              )}
              
              {user?.id !== profile.id ? (
                <TouchableOpacity style={tw`bg-blue-600 py-2 px-6 rounded-full`}>
                  <Text style={tw`text-white font-medium`}>Follow</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={tw`bg-gray-200 py-2 px-6 rounded-full`}
                  onPress={() => navigation.navigate('EditProfile')}
                >
                  <Text style={tw`text-gray-800 font-medium`}>Edit Profile</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* Tabs */}
          <View style={tw`flex-row border-b border-gray-200 mb-6`}>
            {['All', 'Books', 'Places', 'Products'].map(tab => (
              <TouchableOpacity 
                key={tab}
                style={tw`flex-1 py-3 ${activeTab === tab ? 'border-b-2 border-blue-500' : ''}`}
                onPress={() => setActiveTab(tab)}
              >
                <Text 
                  style={tw`text-center text-xs font-medium ${
                    activeTab === tab ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Picks */}
          <View style={tw`pb-20`}>
            {filteredPicks.length > 0 ? (
              filteredPicks.map((item: Pick) => (
                <TouchableOpacity 
                  key={item.id}
                  style={tw`flex-row items-center p-3 border-b border-gray-200`}
                  onPress={() => navigation.navigate('PickDetail', { id: item.id })}
                >
                  <Image 
                    source={{ uri: item.image_url || 'https://via.placeholder.com/150' }} 
                    style={tw`w-16 h-16 rounded-lg`} 
                  />
                  <View style={tw`ml-4`}>
                    <Text style={tw`font-medium text-sm`}>{item.title}</Text>
                    <Text style={tw`text-xs text-gray-500 capitalize`}>{item.category}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={tw`py-8 items-center`}>
                <Text style={tw`text-gray-500 text-sm`}>No picks found in this category.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
