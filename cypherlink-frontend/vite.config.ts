import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      manifest: {
        name: 'CypherLink',
        short_name: 'CypherLink',
        theme_color: '#111315',
        background_color: '#111315',
        display: 'standalone',
        icons: [],
      },
    }),
  ],
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: true,
  },
  build: {
    // Three.js is a known large vendor (~760 KB min). It is lazy-loaded and
    // only fetched on the Landing page for desktop users with WebGL enabled.
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // WebGL / shader — lazy-loaded only on Landing hero
          'vendor-three': ['three', '@react-three/fiber', 'shadergradient'],
          // React core — changes rarely, long-lived cache
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Data layer — TanStack Query + Axios + Socket.io
          'vendor-network': ['@tanstack/react-query', 'axios', 'socket.io-client'],
          // UI motion + state
          'vendor-ui': ['framer-motion', 'zustand'],
        },
      },
    },
  },
});
