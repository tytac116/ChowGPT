import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
// Force fresh deployment - Build #2 (more explicit config)
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      { find: '@/lib', replacement: path.resolve(__dirname, 'src/lib') },
      { find: '@/components', replacement: path.resolve(__dirname, 'src/components') },
      { find: '@/utils', replacement: path.resolve(__dirname, 'src/lib/utils') },
    ],
  },
  build: {
    // Ensure proper module resolution in production
    rollupOptions: {
      external: [],
    },
    // Add source maps for debugging
    sourcemap: false,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
