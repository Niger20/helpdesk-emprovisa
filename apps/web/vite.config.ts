import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { localCsp, noncePlaceholder } from './config/local-csp.ts';

export default defineConfig({
  plugins: [react(), tailwindcss(), localCsp()],
  html: { cspNonce: noncePlaceholder },
  server: {
    host: '127.0.0.1',
    proxy: {
      '/api': { target: 'http://127.0.0.1:3000' },
      '/health': { target: 'http://127.0.0.1:3000' },
    },
  },
});
