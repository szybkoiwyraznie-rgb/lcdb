/**
 * Lekki serwer podglądu dla `dist/` (bez zewnętrznych zależności).
 *
 * Słucha na `0.0.0.0:3000` (lub `PORT`), przyjmuje dowolny nagłówek `Host`
 * (wymóg proxy podglądu na żywo w Arenie) i dla brakujących plików w `/data/`
 * zwraca jawne HTTP 404 zamiast powłoki HTML.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zbuduj } from './build.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT ?? 3000);

const TYPY_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

export function uruchomSerwer({ dist = DIST, host = HOST, port = PORT } = {}) {
  const serwer = http.createServer((req, res) => {
    const surowaSciezka = decodeURIComponent(String(req.url ?? '/').split('?')[0]);
    const wzgledna = surowaSciezka === '/' ? 'index.html' : surowaSciezka.replace(/^\/+/, '');
    const pelna = path.resolve(dist, wzgledna);

    if (!pelna.startsWith(dist + path.sep) && pelna !== path.join(dist, 'index.html')) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Zabronione');
      return;
    }

    if (fs.existsSync(pelna) && fs.statSync(pelna).isFile()) {
      const ext = path.extname(pelna).toLowerCase();
      res.writeHead(200, {
        'Content-Type': TYPY_MIME[ext] ?? 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      fs.createReadStream(pelna).pipe(res);
      return;
    }

    if (wzgledna.startsWith('data/')) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ blad: `Brak pliku danych: ${wzgledna}` }));
      return;
    }

    const powloka = path.join(dist, 'index.html');
    if (fs.existsSync(powloka)) {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      });
      fs.createReadStream(powloka).pipe(res);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Brak zbudowanego artefaktu dist/index.html — uruchom npm run build.');
  });

  return new Promise((resolve, reject) => {
    serwer.once('error', reject);
    serwer.listen(port, host, () => {
      const adres = serwer.address();
      const rzeczywistyPort = typeof adres === 'object' && adres ? adres.port : port;
      resolve({ serwer, host, port: rzeczywistyPort });
    });
  });
}

const jestMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (jestMain) {
  if (!fs.existsSync(path.join(DIST, 'index.html')) || !fs.existsSync(path.join(DIST, 'data'))) {
    await zbuduj({ root: ROOT });
  }
  const { host, port } = await uruchomSerwer();
  console.log(`Podgląd kroniki działa na http://${host}:${port}/`);
}
