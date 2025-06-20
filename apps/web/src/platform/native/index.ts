// Native-specific components and utilities
import {
  View as RNView,
  Text as RNText,
  Image as RNImage,
  ScrollView as RNScrollView,
  TouchableOpacity as RNTouchableOpacity,
  SafeAreaView as RNSafeAreaView,
  Platform as RNPlatform,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { 
  useNavigation as useRNNavigation, 
  useRoute as useRNRoute 
} from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../types/navigation';

// Export React Native components
export const View = RNView;
export const Text = RNText;
export const Image = RNImage;
export const ScrollView = RNScrollView;
export const TouchableOpacity = RNTouchableOpacity;
export const SafeAreaView = RNSafeAreaView;
export { ActivityIndicator, FlatList };

// Platform detection
export const Platform = RNPlatform;

// Typed navigation helpers for native
export const useNavigation = () => useRNNavigation<StackNavigationProp<RootStackParamList>>();
export const useRoute = useRNRoute;
