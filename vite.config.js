import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Single-page app. Build output → dist/ (Vercel default for Vite).
export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist', sourcemap: false },
});
