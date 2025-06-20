// Navigation type definitions for OnShelf app
import { StackScreenProps } from '@react-navigation/stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Define the tab navigation params
export type TabParamList = {
  Discover: undefined;
  Collections: undefined;
  MyThrees: undefined;
  Profile: undefined;
};

// Define stack params for each tab
export type DiscoverStackParamList = {
  DiscoverFeed: undefined;
  PickDetail: { id: string };
  Profile: { id: string };
};

export type CollectionsStackParamList = {
  CollectionsList: undefined;
  CollectionDetail: { id: string };
  Profile: { id: string };
};

export type ProfileStackParamList = {
  ProfileDetail: { id: string };
  EditProfile: undefined;
  PickDetail: { id: string };
};

export type MyThreesStackParamList = {
  MyThreesList: undefined;
  EditPick: { id?: string };
  PickDetail: { id: string };
};

// Combined root stack param list
export type RootStackParamList = 
  DiscoverStackParamList & 
  CollectionsStackParamList & 
  ProfileStackParamList & 
  MyThreesStackParamList & {
    // Add any global routes that can be accessed from anywhere
    SearchResults: { query: string };
  };

// Export types for stack navigation
export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  StackScreenProps<RootStackParamList, T>;

// Export types for tab navigation
export type TabScreenProps<T extends keyof TabParamList> = 
  BottomTabScreenProps<TabParamList, T>;

// Type for useNavigation hook
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
