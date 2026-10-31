import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath, URL} from 'node:url';
export default defineConfig({
  plugins: [react()],
  resolve: {alias: {'@core': fileURLToPath(new URL('../../core', import.meta.url))}},
  server: {fs: {allow: [fileURLToPath(new URL('../..', import.meta.url))]}},
  build: {rollupOptions: {input: {
    handbook: fileURLToPath(new URL('./index.html', import.meta.url)),
    starter: fileURLToPath(new URL('./starter.html', import.meta.url)),
  }}},
});
