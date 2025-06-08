// React is automatically imported by the JSX transform
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { AuthProvider } from './context/AuthContext.native';
import { AppNavigator } from './navigation';

/**
 * Native entry point for the OnShelf app
 * This uses the React Navigation structure defined in src/navigation
 */
// Using React.FC to explicitly use the React namespace
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
