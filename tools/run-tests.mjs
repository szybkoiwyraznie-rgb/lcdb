/**
 * Uruchamiacz testów oparty o wbudowany `node:test` (zero zależności npm).
 * Wyszukuje wszystkie pliki `test/*.test.js` i przekazuje je do `node --test`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const katalogTestow = path.join(ROOT, 'test');

if (!fs.existsSync(katalogTestow)) {
  console.error('Brak katalogu test/ — testy są obowiązkowe.');
  process.exit(1);
}

const pliki = fs
  .readdirSync(katalogTestow)
  .filter((f) => f.endsWith('.test.js'))
  .sort()
  .map((f) => path.join('test', f));

if (pliki.length === 0) {
  console.error('Brak plików *.test.js w katalogu test/.');
  process.exit(1);
}

const wynik = spawnSync(process.execPath, ['--test', ...pliki], {
  cwd: ROOT,
  stdio: 'inherit',
});

process.exit(wynik.status ?? 1);
