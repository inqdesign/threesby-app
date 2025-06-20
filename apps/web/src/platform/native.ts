// Export React Native components for use in our native app
// This file provides a centralized place to import React Native components

// Core components
export {
  View,
  Text,
  Image,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  RefreshControl,
  TextInput,
  Pressable,
  Modal,
  Alert,
  StatusBar,
} from 'react-native';

// Navigation
export {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';

// Animation
export { Animated } from 'react-native';

// Dimensions and platform info
export {
  Dimensions,
  Platform,
  useWindowDimensions,
} from 'react-native';
