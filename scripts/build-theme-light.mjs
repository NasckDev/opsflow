// Compila o tema claro do NG-ZORRO para public/theme-light.css. O OpsFlow é escuro por padrão:
// a folha clara só é baixada quando alguém escolhe o tema claro.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const less = require('less');
const esbuild = require('esbuild');

const entry = resolve('src/styles/theme-light.less');
const { css } = await less.render(readFileSync(entry, 'utf8'), {
  filename: entry,
  javascriptEnabled: true,
  paths: [resolve('node_modules')],
});
const minified = await esbuild.transform(css, { loader: 'css', minify: true });
mkdirSync('public', { recursive: true });
writeFileSync('public/theme-light.css', minified.code);
console.log(`public/theme-light.css: ${(minified.code.length / 1024).toFixed(0)} kB`);
