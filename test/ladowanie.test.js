import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { zbudujDane, podzielDane, zbuduj } from '../tools/build.mjs';
import { uruchomSerwer } from '../tools/serve.mjs';
import { zaladujDane, dociagnijStrone, dociagnijTeksty } from '../src/lcdb/ladowanie.js';

const ROOT = process.cwd();
const katalogiTymczasowe = [];

after(() => {
  for (const k of katalogiTymczasowe) {
    fs.rmSync(k, { recursive: true, force: true });
  }
});

describe('powłoka, drzewo danych data/*.json, dociąganie po HTTP i tryb --single (ADR 0001)', () => {
  it('podzielDane oddziela ciała kart, teksty wyszukiwarki i dziennik od indeksu powłoki', async () => {
    const pelne = await zbudujDane({ root: ROOT });
    const { indeks, ciala, teksty, coNowego } = podzielDane(pelne);
    const pierwszySlug = Object.keys(pelne.strony)[0];
    assert.ok(pierwszySlug);
    assert.equal(indeks.strony[pierwszySlug].boksy, undefined);
    assert.equal(indeks.strony[pierwszySlug].sekcje, undefined);
    assert.equal(indeks.strony[pierwszySlug].tekst, undefined);
    assert.ok(ciala[pierwszySlug]);
    assert.equal(typeof teksty[pierwszySlug], 'string');
    assert.ok(Array.isArray(coNowego));
  });

  it('serwer statyczny wydaje powłokę, dociąga karty przez LCDB_B64 i zwraca 404 na brakujący plik w /data/*', async () => {
    const tmpDist = fs.mkdtempSync(path.join(os.tmpdir(), 'lcdb-dist-'));
    katalogiTymczasowe.push(tmpDist);
    const sciezkaHtml = path.join(tmpDist, 'index.html');
    await zbuduj({ out: sciezkaHtml, root: ROOT, single: false });

    const html = fs.readFileSync(sciezkaHtml, 'utf8');
    const b64Match = html.match(/globalThis\.LCDB_B64\s*=\s*"([^"]+)"/);
    assert.ok(b64Match, 'powłoka musi osadzać skompresowany indeks LCDB_B64');

    const { serwer, port } = await uruchomSerwer({ dist: tmpDist, host: '127.0.0.1', port: 0 });
    const bazaUrl = `http://127.0.0.1:${port}/`;

    const poprzDane = globalThis.LCDB_DATA;
    const poprzTryb = globalThis.LCDB_TRYB;
    const poprzB64 = globalThis.LCDB_B64;
    const poprzLoc = globalThis.location;

    try {
      const odpGlowna = await fetch(bazaUrl);
      assert.equal(odpGlowna.status, 200);

      const odpBrak = await fetch(`${bazaUrl}data/nie-istnieje-taka-karta.json`);
      assert.equal(odpBrak.status, 404);
      const cialoBrak = await odpBrak.json();
      assert.ok(cialoBrak.blad);

      delete globalThis.LCDB_DATA;
      globalThis.LCDB_TRYB = 'pliki';
      globalThis.LCDB_B64 = b64Match[1];
      globalThis.location = { href: bazaUrl };

      const wczytane = await zaladujDane();
      const dowolnySlug = Object.keys(wczytane.strony)[0];
      assert.ok(dowolnySlug);
      assert.ok(wczytane.coNowego.length > 0);

      const strona = await dociagnijStrone(dowolnySlug);
      assert.ok(Array.isArray(strona.boksy) || Array.isArray(strona.sekcje));

      await dociagnijTeksty();
      assert.equal(typeof wczytane.strony[dowolnySlug].tekst, 'string');
    } finally {
      globalThis.LCDB_DATA = poprzDane;
      globalThis.LCDB_TRYB = poprzTryb;
      globalThis.LCDB_B64 = poprzB64;
      if (poprzLoc === undefined) delete globalThis.location;
      else globalThis.location = poprzLoc;
      await new Promise((resolve) => serwer.close(resolve));
    }
  });

  it('tryb --single buduje samodzielny plik index.html bez katalogu data/', async () => {
    const tmpSingle = fs.mkdtempSync(path.join(os.tmpdir(), 'lcdb-single-'));
    katalogiTymczasowe.push(tmpSingle);
    const sciezkaSingle = path.join(tmpSingle, 'index.html');
    await zbuduj({ out: sciezkaSingle, root: ROOT, single: true });
    assert.equal(fs.existsSync(sciezkaSingle), true);
    assert.equal(fs.existsSync(path.join(tmpSingle, 'data')), false);
  });
});
