// Export the appropriate navigator based on platform
// This will automatically resolve to either AppNavigator.web.tsx or AppNavigator.native.tsx
// based on the platform the code is running on
export { AppNavigator } from './AppNavigator.web';

// When building for native, the bundler will use the .native version instead
