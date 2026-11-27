#!/usr/bin/env node
/**
 * Kontrola dosłowności bloków `:::zapis` i pokrycia archiwum `rozgrywka/zapisy/`.
 *
 * Uruchomienie: `npm run zapis` lub `node tools/sprawdz-zapis.mjs [slug-sceny]`
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { wczytajStrony, wczytajZapisy } from './content-loader.mjs';
import { sprawdzWiernoscSceny, wytnijBlokiZapisu, niepokryteWierszeZapisu } from '../src/lcdb/registry.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const filtr = process.argv[2];
const zapisy = wczytajZapisy({ root: ROOT });

if (zapisy.size === 0) {
  console.log('rozgrywka/zapisy/ jest pusta — nie ma z czym porównywać.');
  process.exit(0);
}

const strony = wczytajStrony({ root: ROOT }).filter((s) => s.typ === 'scena');
const wybrane = filtr ? strony.filter((s) => s.slug === filtr) : strony;
let problemow = 0;

for (const s of wybrane) {
  const sciezka = s.zapis ? `rozgrywka/zapisy/${path.basename(s.zapis)}` : null;
  const tekst = sciezka ? zapisy.get(sciezka) ?? null : null;
  const p = sprawdzWiernoscSceny(s, tekst);
  if (p.length > 0) {
    problemow += p.length;
    for (const x of p) console.log(`✗ ${x}`);
  } else {
    console.log(`✓ ${s.slug} — ${wytnijBlokiZapisu(s.body).length} blok(ów) zapisu, dosłowne`);
  }
}

// Pokrycie archiwum liczone wierszami (czytanki LC mają ciągi kwestii bez pustych linii — ADR 0009).
const blokiWgZapisu = new Map();
for (const s of strony) {
  if (!s.zapis) continue;
  const klucz = `rozgrywka/zapisy/${path.basename(s.zapis)}`;
  if (!blokiWgZapisu.has(klucz)) blokiWgZapisu.set(klucz, []);
  blokiWgZapisu.get(klucz).push(...wytnijBlokiZapisu(s.body));
}

for (const [sciezka, tekst] of zapisy) {
  const pominiete = niepokryteWierszeZapisu(tekst, blokiWgZapisu.get(sciezka) ?? []);
  if (pominiete.length > 0) {
    console.log(`\n${sciezka}: ${pominiete.length} wiersz(y) archiwum poza scenami:`);
    for (const w of pominiete.slice(0, 10)) console.log(`  · ${w.slice(0, 110)}${w.length > 110 ? '…' : ''}`);
    if (pominiete.length > 10) console.log(`  … i ${pominiete.length - 10} więcej`);
  } else {
    console.log(`✓ ${sciezka} — każdy wiersz archiwum należy do którejś sceny`);
  }
}

process.exit(problemow > 0 ? 1 : 0);
