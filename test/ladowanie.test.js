/**
 * Testy architektury powłoki + leniwego dociągania `data/*.json` oraz serwera podglądu (ADR 0001).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { zbudujArtefakt } from '../tools/build.mjs';
import { zainicjujDane, zapewnijDaneWidoku } from '../src/lcdb/ladowanie.js';
import { parsujHash } from '../src/lcdb/router.js';
import { wyrenderujWidok } from '../src/lcdb/main.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('tryb domyślny (powłoka) dociąga ciała kart i indeks tekstów na żądanie, a --single osadza całość', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lcdb-build-'));
  try {
    const powloka = zbudujArtefakt({ root: ROOT, outDir: path.join(tmp, 'powloka'), single: false });
    assert.equal(powloka.tryb, 'powloka');
    assert.ok(fs.existsSync(path.join(powloka.dataDir, 'teksty.json')));
    assert.ok(fs.existsSync(path.join(powloka.dataDir, 'co-nowego.json')));
    assert.ok(fs.existsSync(path.join(powloka.dataDir, 'kontrakt-w-ciemnym-lesie.json')));

    const htmlPowloki = fs.readFileSync(powloka.plik, 'utf8');
    const mB64 = htmlPowloki.match(/globalThis\.LCDB_B64="([^"]+)"/);
    assert.ok(mB64, 'powłoka osadza skompresowany indeks LCDB_B64');

    delete globalThis.LCDB_DATA;
    globalThis.LCDB_TRYB = 'powloka';
    globalThis.LCDB_B64 = mB64[1];
    const dane = await zainicjujDane();
    assert.equal(dane.strony['kontrakt-w-ciemnym-lesie'].sekcje, undefined, 'ciało sceny nie siedzi w powłoce');
    // Każda strona indeksu ma swój plik ciała w data/, a żadne ciało ani tekst nie siedzi w powłoce.
    for (const [slug, s] of Object.entries(dane.strony)) {
      assert.ok(fs.existsSync(path.join(powloka.dataDir, `${slug}.json`)), `brak data/${slug}.json`);
      assert.equal(s.sekcje, undefined, `${slug}: sekcje w powłoce`);
      assert.equal(s.boksy, undefined, `${slug}: boksy w powłoce`);
      assert.equal(s.tekst, undefined, `${slug}: tekst wyszukiwarki w powłoce`);
    }

    const pobraneUrl = [];
    const stareFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
      pobraneUrl.push(url);
      const p = path.join(tmp, 'powloka', url);
      if (!fs.existsSync(p)) return new Response('Not found', { status: 404 });
      return new Response(fs.readFileSync(p, 'utf8'), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };

    try {
      const dop = parsujHash('#/scena/kontrakt-w-ciemnym-lesie');
      await zapewnijDaneWidoku(dop);
      assert.deepEqual(pobraneUrl, ['data/kontrakt-w-ciemnym-lesie.json']);
      const htmlSceny = wyrenderujWidok(dop);
      assert.match(htmlSceny, /Pośrodku czarnego lasu/);

      await zapewnijDaneWidoku(parsujHash('#/szukaj?q=gwiazda'));
      assert.ok(pobraneUrl.includes('data/teksty.json'));
    } finally {
      globalThis.fetch = stareFetch;
    }

    const single = zbudujArtefakt({
      root: ROOT,
      outDir: path.join(tmp, 'single'),
      single: true,
      outFile: path.join(tmp, 'single', 'archiwum.html'),
    });
    assert.equal(single.tryb, 'calosc');
    assert.ok(fs.existsSync(single.plik));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('serwer podglądu zwraca 200 dla powłoki i istniejących JSON-ów oraz twarde 404 dla brakującego /data/*.json', async () => {
  zbudujArtefakt({ root: ROOT });
  const port = 34100 + Math.floor(Math.random() * 800);
  const proc = spawn(process.execPath, ['tools/serve.mjs'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout startu serve.mjs')), 5000);
      proc.stdout.on('data', (chunk) => {
        if (String(chunk).includes(String(port))) {
          clearTimeout(timer);
          resolve();
        }
      });
      proc.on('exit', (code) => {
        clearTimeout(timer);
        reject(new Error(`serve.mjs zakończył się przedwcześnie (${code})`));
      });
    });

    const rHome = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(rHome.status, 200);
    assert.match(await rHome.text(), /Limbus Company — kronika opowieści/);

    const rJson = await fetch(`http://127.0.0.1:${port}/data/teksty.json`);
    assert.equal(rJson.status, 200);

    const rBrak = await fetch(`http://127.0.0.1:${port}/data/nie-ma-takiego-pliku.json`);
    assert.equal(rBrak.status, 404);
  } finally {
    proc.kill('SIGTERM');
  }
});
