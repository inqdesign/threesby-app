# OnShelf Mobile App Development

This document outlines the progress and next steps for developing the OnShelf mobile app using React Native.

## Current Progress

We've set up the foundation for a cross-platform OnShelf app with the following components:

1. **Navigation Structure**
   - Created platform-specific navigators (`AppNavigator.native.tsx` and `AppNavigator.web.tsx`)
   - Implemented a bottom tab navigator for mobile with tabs for Discover, Collections, MyThrees, and Profile
   - Set up stack navigators for nested screens within each tab

2. **Platform Abstraction**
   - Created platform-specific entry points (`App.native.tsx` and `index.native.js`)
   - Set up platform-specific component versions (e.g., `PickCard.native.tsx`)
   - Added a platform directory for React Native component exports
   - Implemented platform-specific authentication context (`AuthContext.native.tsx`)
   - Created shared hooks for data fetching that work across platforms

3. **Screen Implementations**
   - Created mobile-friendly versions of all main screens:
     - `DiscoverScreen`: Shows picks in a scrollable list with pull-to-refresh
     - `CollectionsScreen`: Displays curator rows with their collections
     - `MyThreesScreen`: Shows user's picks and collections with add/edit functionality
     - `ProfileScreen`: Displays user profile with picks in a grid layout
   - Implemented native versions of UI components:
     - `PickCard`: Card component for displaying picks with rank indicators
     - Collection cards with proper aspect ratio and styling

## Next Steps

To complete the mobile app development, the following tasks need to be addressed:

1. **Set Up React Native Project**
   - Initialize a React Native project using `npx react-native init OnShelfApp`
   - Configure the project to use the existing codebase with platform-specific files
   - Install required dependencies:
     ```
     npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
     npm install react-native-safe-area-context react-native-screens
     npm install @supabase/supabase-js
     npm install twrnc
     ```

2. **Complete Additional Screens and Features**
   - Implement authentication screens (Login, SignUp, ForgotPassword)
   - Create detail screens (PickDetail, CollectionDetail)
   - Add edit screens (EditProfile, EditPick, EditCollection)
   - Implement search functionality

3. **Authentication and Storage**
   - Set up secure storage for auth tokens using `react-native-secure-storage`
   - Implement session persistence
   - Add biometric authentication options if desired

4. **Testing and Optimization**
   - Test on both iOS and Android simulators
   - Optimize performance for low-end devices
   - Implement offline capabilities
   - Conduct user testing for mobile UX

5. **App Store Preparation**
   - Create app icons and splash screens
   - Configure app permissions
   - Set up code signing and provisioning profiles
   - Prepare App Store and Play Store listings

## Development Guidelines

1. **Cross-Platform Compatibility**
   - Use platform-specific file extensions (`.native.tsx` and `.web.tsx`) for components that need different implementations
   - Share business logic and data fetching code between platforms
   - Use the platform directory for React Native specific imports

2. **Styling**
   - Use `twrnc` (Tailwind for React Native) for consistent styling
   - Ensure all components are responsive and work well on different screen sizes
   - Follow the existing design system for colors, typography, and spacing

3. **Navigation**
   - Use React Navigation for native navigation
   - Maintain consistent navigation patterns between web and native
   - Implement deep linking for sharing content

## Running the App

Once the React Native project is set up, you can run the app using:

```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

## Resources

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [React Navigation Documentation](https://reactnavigation.org/docs/getting-started)
- [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-react-native)
- [Tailwind React Native Classnames](https://github.com/jaredh159/tailwind-react-native-classnames)
