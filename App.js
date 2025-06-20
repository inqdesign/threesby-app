import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Simple inline screens that will definitely work
function DiscoverScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>🚀 TEST UPDATE - Discover</Text>
      <ScrollView>
        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardTitle}>#1 Figma</Text>
          <Text style={styles.cardDesc}>Design tool that actually works</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardTitle}>#2 Linear</Text>
          <Text style={styles.cardDesc}>Issue tracking you'll love</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function CollectionsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>📚 Collections</Text>
      <TouchableOpacity style={styles.card}>
        <Text style={styles.cardTitle}>Design Tools 2024</Text>
        <Text style={styles.cardDesc}>12 essential design tools</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function MyThreesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>❤️ My Threes</Text>
      <Text style={styles.subtext}>Your curated picks will appear here</Text>
    </SafeAreaView>
  );
}

function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>👤 Profile</Text>
      <Text style={styles.subtext}>Account settings and preferences</Text>
    </SafeAreaView>
  );
}

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Discover') {
              iconName = focused ? 'compass' : 'compass-outline';
            } else if (route.name === 'Collections') {
              iconName = focused ? 'library' : 'library-outline';
            } else if (route.name === 'My Threes') {
              iconName = focused ? 'heart' : 'heart-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#e0e0e0',
            paddingBottom: 8,
            paddingTop: 8,
            height: 88,
          }
        })}
      >
        <Tab.Screen name="Discover" component={DiscoverScreen} />
        <Tab.Screen name="Collections" component={CollectionsScreen} />
        <Tab.Screen name="My Threes" component={MyThreesScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },
  card: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: '#666',
  },
  subtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
}); 