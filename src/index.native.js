import { AppRegistry } from 'react-native';
import App from './App.native';

// Register the app
AppRegistry.registerComponent('OnShelf', () => App);

// For web compatibility with React Native Web
AppRegistry.runApplication('OnShelf', {
  rootTag: document.getElementById('root')
});
