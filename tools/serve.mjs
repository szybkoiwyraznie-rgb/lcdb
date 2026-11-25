#!/usr/bin/env node
/**
 * Serwer podglądu (dev): serwuje `dist/` na `0.0.0.0:3000` (ADR 0001, 0015).
 *
 * Wiązanie do `0.0.0.0` pozwala otwierać podgląd z Live Preview w przeglądarce
 * oraz z drugiego urządzenia w sieci lokalnej. Brakujący plik w `/data/` zwraca
 * twarde 404 (a nie powłokę HTML), żeby błędy dociągania były widoczne od razu.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT ?? 3000);
const HOST = '0.0.0.0';

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.log('[serve] brak dist/index.html — uruchamiam build...');
  execFileSync('node', ['tools/build.mjs'], { stdio: 'inherit', cwd: ROOT });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.zip': 'application/zip', '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  const reqPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let filePath = path.join(DIST, reqPath === '/' ? '/index.html' : reqPath);

  if (!filePath.startsWith(DIST)) { res.statusCode = 403; res.end('Forbidden'); return; }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');

  if (!fs.existsSync(filePath)) {
    if (reqPath.startsWith('/data/')) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Brak pliku ${reqPath} — uruchom npm run build`);
      return;
    }
    filePath = path.join(DIST, 'index.html');
  }

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream',
      'Content-Length': Buffer.byteLength(data),
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  } catch (err) {
    res.statusCode = 500;
    res.end('Internal Server Error: ' + err.message);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`LCDB — kronika Limbus Company — podgląd na http://${HOST}:${PORT} (dist/index.html + data/)`);
});
