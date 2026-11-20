// Compila o tema escuro do NG-ZORRO para public/theme-dark.css (baixado só quando o tema escuro é usado).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const less = require('less');
const esbuild = require('esbuild');

const entry = resolve('src/styles/theme-dark.less');
const { css } = await less.render(readFileSync(entry, 'utf8'), {
  filename: entry,
  javascriptEnabled: true,
  paths: [resolve('node_modules')],
});
const minified = await esbuild.transform(css, { loader: 'css', minify: true });
mkdirSync('public', { recursive: true });
writeFileSync('public/theme-dark.css', minified.code);
console.log(`public/theme-dark.css: ${(minified.code.length / 1024).toFixed(0)} kB`);
