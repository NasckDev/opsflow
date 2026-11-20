// Servidor estático mínimo para os testes E2E: serve dist-portable em /projetos/opsflow/
// (um subcaminho, como o portfólio faz) e prova que o build portátil funciona fora da raiz.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve('dist-portable');
const PREFIX = '/projetos/opsflow/';
const PORT = Number(process.env.E2E_PORT ?? 4317);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain',
};

createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  if (!url.pathname.startsWith(PREFIX)) {
    response.writeHead(404).end('not found');
    return;
  }
  const relative = url.pathname.slice(PREFIX.length) || 'index.html';
  const file = normalize(join(ROOT, relative.endsWith('/') ? `${relative}index.html` : relative));
  if (!file.startsWith(ROOT)) {
    response.writeHead(403).end('forbidden');
    return;
  }
  try {
    const body = await readFile(file);
    response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404).end('not found');
  }
}).listen(PORT, () => console.log(`E2E em http://localhost:${PORT}${PREFIX}`));
