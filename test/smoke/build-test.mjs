import { build } from 'esbuild';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: [resolve(appDir, 'extensionTest.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: resolve(appDir, 'out', 'extensionTest.js'),
  external: ['vscode'],
  sourcemap: true,
  target: 'node18',
});

console.log('Smoke test bundle built successfully');
