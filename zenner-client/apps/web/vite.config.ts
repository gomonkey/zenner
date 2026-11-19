import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      "@zenner/core": path.resolve(__dirname, '../../packages/core/src'),
      "@zenner/ui/web": path.resolve(__dirname, '../../packages/ui/src/web'),
      "@zenner/ui": path.resolve(__dirname, '../../packages/ui/index.web.ts'),
      "@zenner/assets": path.resolve(__dirname, '../../assets')
    }
  },
  server: {
    port: 3000
  }
});
