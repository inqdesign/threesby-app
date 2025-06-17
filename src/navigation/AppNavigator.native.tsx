// React Native navigation setup
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text } from '../platform/native';
// Using custom icon components instead of lucide-react-native due to compatibility issues
const HomeIcon = ({ size, stroke }: { size: number, stroke: string }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color: stroke, fontSize: size * 0.7 }}>🏠</Text>
  </View>
);

const GridIcon = ({ size, stroke }: { size: number, stroke: string }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color: stroke, fontSize: size * 0.7 }}>📚</Text>
  </View>
);

const UserIcon = ({ size, stroke }: { size: number, stroke: string }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color: stroke, fontSize: size * 0.7 }}>👤</Text>
  </View>
);

const BookIcon = ({ size, stroke }: { size: number, stroke: string }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color: stroke, fontSize: size * 0.7 }}>📝</Text>
  </View>
);
import { ProfileScreen } from '../screens/ProfileScreen.native';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList, TabParamList } from '../types/navigation';
import tw from '../lib/tailwind';

// Create navigators
const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// Import the actual screen components
import { DiscoverScreen } from '../screens/DiscoverScreen.native';

import { CollectionsScreen } from '../screens/CollectionsScreen.native';

import { MyThreesScreen } from '../screens/MyThreesScreen.native';

// Stack navigators for each tab
const DiscoverStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DiscoverFeed" component={DiscoverScreen} />
    <Stack.Screen name="PickDetail" component={PickDetailScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
  </Stack.Navigator>
);

const CollectionsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CollectionsList" component={CollectionsScreen} />
    <Stack.Screen name="CollectionDetail" component={CollectionDetailScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
  </Stack.Navigator>
);

const ProfileStack = () => {
  const { user } = useAuth();
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="ProfileDetail" 
        component={ProfileScreen} 
        initialParams={{ id: user?.id }}
      />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="PickDetail" component={PickDetailScreen} />
    </Stack.Navigator>
  );
};

const MyThreesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MyThreesList" component={MyThreesScreen} />
    <Stack.Screen name="EditPick" component={EditPickScreen} />
    <Stack.Screen name="PickDetail" component={PickDetailScreen} />
  </Stack.Navigator>
);

// Placeholder screens for stack navigators
const PickDetailScreen = () => (
  <View style={tw`flex-1 justify-center items-center bg-white`}>
    <Text style={tw`text-xl font-semibold`}>Pick Detail</Text>
  </View>
);

const CollectionDetailScreen = () => (
  <View style={tw`flex-1 justify-center items-center bg-white`}>
    <Text style={tw`text-xl font-semibold`}>Collection Detail</Text>
  </View>
);

const EditProfileScreen = () => (
  <View style={tw`flex-1 justify-center items-center bg-white`}>
    <Text style={tw`text-xl font-semibold`}>Edit Profile</Text>
  </View>
);

const EditPickScreen = () => (
  <View style={tw`flex-1 justify-center items-center bg-white`}>
    <Text style={tw`text-xl font-semibold`}>Edit Pick</Text>
  </View>
);

// Main tab navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route: tabRoute }) => ({
        tabBarIcon: ({ color, size }) => {
          if (tabRoute.name === 'Discover') {
            return <HomeIcon size={size} stroke={color} />;
          } else if (tabRoute.name === 'Collections') {
            return <GridIcon size={size} stroke={color} />;
          } else if (tabRoute.name === 'Profile') {
            return <UserIcon size={size} stroke={color} />;
          } else if (tabRoute.name === 'MyThrees') {
            return <BookIcon size={size} stroke={color} />;
          }
          return null;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 3,
        },
      })}
    >
      <Tab.Screen name="Discover" component={DiscoverStack} />
      <Tab.Screen name="Collections" component={CollectionsStack} />
      <Tab.Screen name="MyThrees" component={MyThreesStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};

// Root navigator
export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
};
