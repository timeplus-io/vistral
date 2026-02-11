import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile()
  ],
  root: 'examples',
  resolve: {
    alias: {
      '@timeplus/vistral': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: '../docs/',
    assetsInlineLimit: 100000000, // Inline all assets
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});