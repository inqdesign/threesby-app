import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
    modulePreload: {
      polyfill: true
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui': ['@headlessui/react', '@radix-ui/react-tabs', 'framer-motion'],
          'supabase': ['@supabase/supabase-js'],
          'editor': ['lexical', 'react-quill'],
          'utils': ['date-fns', 'clsx', 'tailwind-merge', 'dompurify']
        }
      }
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
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
  }
});