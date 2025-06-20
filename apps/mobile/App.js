import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Import properly converted screens
import DiscoverScreen from './screens/DiscoverScreen';
import UnifiedDetailScreen from './screens/UnifiedDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Placeholder components for other screens
const SearchScreen = () => (
  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff'}}>
    <Text style={{fontSize: 18, color: '#666'}}>Search - Coming Soon</Text>
  </View>
);

const CollectionsScreen = () => (
  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff'}}>
    <Text style={{fontSize: 18, color: '#666'}}>Collections - Coming Soon</Text>
  </View>
);

const MyThreesScreen = () => (
  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff'}}>
    <Text style={{fontSize: 18, color: '#666'}}>My Threes - Coming Soon</Text>
  </View>
);

const ProfileScreen = () => (
  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff'}}>
    <Text style={{fontSize: 18, color: '#666'}}>Profile - Coming Soon</Text>
  </View>
);

// Discover Stack Navigator
function DiscoverStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DiscoverMain" component={DiscoverScreen} />
      <Stack.Screen name="UnifiedDetail" component={UnifiedDetailScreen} />
    </Stack.Navigator>
  );
}

// Main App with Bottom Tab Navigation (matching web app exactly)
export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Discover') {
              iconName = focused ? 'compass' : 'compass-outline';
            } else if (route.name === 'Search') {
              iconName = focused ? 'search' : 'search-outline';
            } else if (route.name === 'Collections') {
              iconName = focused ? 'library' : 'library-outline';
            } else if (route.name === 'My Threes') {
              iconName = focused ? 'heart' : 'heart-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#000',
          tabBarInactiveTintColor: '#666',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopColor: '#f0f0f0',
            paddingTop: 8,
            paddingBottom: 8,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: 4,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Discover" component={DiscoverStack} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Collections" component={CollectionsScreen} />
        <Tab.Screen name="My Threes" component={MyThreesScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
} 