import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {readFileSync} from 'node:fs';
import {fileURLToPath, URL} from 'node:url';

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
const version = read('../../core/VERSION').trim();
if (JSON.parse(read('./package.json')).version !== version) throw new Error(`package.json version must equal core/VERSION (${version})`);

export default defineConfig({
  plugins: [react(), {name: 'ui-template-version', transformIndexHtml: () => [{tag: 'meta', attrs: {name: 'ui-template-version', content: version}, injectTo: 'head'}]}],
  resolve: {alias: {'@core': fileURLToPath(new URL('../../core', import.meta.url))}},
  server: {fs: {allow: [fileURLToPath(new URL('../..', import.meta.url))]}},
  build: {rollupOptions: {input: {
    handbook: fileURLToPath(new URL('./index.html', import.meta.url)),
    starter: fileURLToPath(new URL('./starter.html', import.meta.url)),
  }}},
});
