import { build } from 'esbuild';
import { copyFileSync, cpSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(appDir, 'dist');

mkdirSync(outDir, { recursive: true });

await build({
  entryPoints: [resolve(appDir, 'src/extension.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: resolve(outDir, 'extension.js'),
  external: ['vscode'],
  sourcemap: true,
  target: 'node18',
});

copyFileSync(resolve(appDir, 'package.json'), resolve(outDir, 'package.json'));
copyFileSync(resolve(appDir, '.vscodeignore'), resolve(outDir, '.vscodeignore'));
copyFileSync(resolve(appDir, 'LICENSE.md'), resolve(outDir, 'LICENSE.md'));
copyFileSync(resolve(appDir, 'README.md'), resolve(outDir, 'README.md'));
copyFileSync(resolve(appDir, 'icon.png'), resolve(outDir, 'icon.png'));
cpSync(resolve(appDir, 'media'), resolve(outDir, 'media'), { recursive: true });
