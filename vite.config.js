import { defineConfig } from 'vite';
import htmlIncludes from './vite-plugin-html-includes.js';

export default defineConfig({
  plugins: [htmlIncludes()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    cssMinify: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin.html'
      }
    }
  },
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none'
  }
});
