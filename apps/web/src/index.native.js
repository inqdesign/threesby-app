// Ultra-minimal React Native app to isolate the JavaScript errors
import { registerRootComponent } from 'expo';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

console.log('Starting ultra-minimal app...');

function UltraMinimalApp() {
  console.log('Rendering ultra-minimal app...');
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ultra Minimal Test</Text>
      <Text style={styles.text}>No polyfills, no navigation, no custom imports</Text>
      <Text style={styles.text}>If errors persist, the issue is in Expo/React Native setup</Text>
      <Text style={styles.success}>✅ App is rendering</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000000',
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333333',
    textAlign: 'center',
  },
  success: {
    fontSize: 18,
    marginTop: 20,
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'center',
  },
});

console.log('Registering ultra-minimal app...');
registerRootComponent(UltraMinimalApp);
