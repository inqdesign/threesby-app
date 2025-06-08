import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
    modulePreload: {
      polyfill: true
    }
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      // Add platform-specific aliases
      './src/platform': resolve(__dirname, './src/platform/web'),
    },
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.jsx', '.web.js', '.jsx', '.js'],
  },
  optimizeDeps: {
    include: ['react-window', 'zustand'],
  },
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    hmr: {
      host: 'localhost',
      protocol: 'ws'
    }
  },
  define: {
    __FUTURE_FLAGS__: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
});