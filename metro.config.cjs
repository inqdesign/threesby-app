const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration to block problematic modules
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Block modules that cause issues in React Native
config.resolver.blockList = [
  /node_modules\/.*\/lib\/.*\.web\.js$/,
  /node_modules\/.*\/dist\/.*\.web\.js$/,
];

// Add platform extensions for better resolution
config.resolver.sourceExts = [...config.resolver.sourceExts, 'native.js', 'native.ts', 'native.tsx'];

// Transformer configuration
config.transformer.minifierConfig = {
  mangle: {
    keep_classnames: true,
    keep_fnames: true,
  },
};

module.exports = config; 