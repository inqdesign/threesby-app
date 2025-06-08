// Web-specific components and utilities
import React from 'react';

// Export common components with web-specific implementations
export const View = 'div';
export const Text = 'span';
export const Image = 'img';
export const ScrollView = 'div';
export const TouchableOpacity = 'button';
export const SafeAreaView = 'div';

// Platform detection
export const Platform = {
  OS: 'web',
  select: (options: any) => options.web || options.default,
};

// Navigation helpers for web
export const useNavigation = () => {
  // This would be replaced with react-router-dom hooks in actual implementation
  return {
    navigate: (route: string, params?: any) => {
      console.log(`Navigate to ${route} with params:`, params);
    },
    goBack: () => {
      window.history.back();
    },
  };
};

export const useRoute = () => {
  // This would be replaced with react-router-dom hooks in actual implementation
  return {
    params: {},
  };
};
