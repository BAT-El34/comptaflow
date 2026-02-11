
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Permet d'utiliser process.env.API_KEY si vous lancez en local avec une variable d'env
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  },
  server: {
    port: 3000,
    open: true
  },
  preview: {
    port: 10000,
    host: true,
    allowedHosts: true
  }
});
