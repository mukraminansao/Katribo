import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/catalogue': { target: 'http://127.0.0.1:10000' },
      '/api/place-order': { target: 'http://127.0.0.1:10000' },
      '/media/': { target: 'http://127.0.0.1:10000' },
    },
  },
  build: { target: 'es2022', cssMinify: true, sourcemap: false },
});
