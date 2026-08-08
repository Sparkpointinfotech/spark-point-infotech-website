import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    cssMinify: true
  },
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none'
  }
});
