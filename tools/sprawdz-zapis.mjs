#!/usr/bin/env node
/**
 * Kontrola dosłowności bloków `:::zapis` i pokrycia archiwum `rozgrywka/zapisy/`.
 *
 * Uruchomienie: `npm run zapis` lub `node tools/sprawdz-zapis.mjs [slug-sceny]`
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { wczytajStrony, wczytajZapisy } from './content-loader.mjs';
import {
  sprawdzWiernoscSceny, sprawdzWiernoscCytatow, wytnijBlokiZapisu, niepokryteWierszeZapisu, rodzajArchiwum,
} from '../src/lcdb/registry.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const filtr = process.argv[2];
const zapisy = wczytajZapisy({ root: ROOT });

if (zapisy.size === 0) {
  console.log('rozgrywka/zapisy/ jest pusta — nie ma z czym porównywać.');
  process.exit(0);
}

const wszystkie = wczytajStrony({ root: ROOT });
const strony = wszystkie.filter((s) => s.typ === 'scena');
const karty = wszystkie.filter((s) => s.typ !== 'scena' && !s.problem);
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

// Cytaty :::zapis na kartach encji muszą być dosłowne względem któregoś archiwum (ADR 0017).
if (!filtr) {
  let cytatow = 0;
  for (const k of karty) {
    const p = sprawdzWiernoscCytatow(k, zapisy.values());
    cytatow += wytnijBlokiZapisu(k.body).length;
    if (p.length > 0) {
      problemow += p.length;
      for (const x of p) console.log(`✗ ${x}`);
    }
  }
  console.log(`✓ karty encji — ${cytatow} cytat(ów) :::zapis sprawdzonych względem archiwów`);
}

const blokiKart = karty.flatMap((k) => wytnijBlokiZapisu(k.body));

// Pokrycie archiwum liczone wierszami (czytanki LC mają ciągi kwestii bez pustych linii — ADR 0009).
const blokiWgZapisu = new Map();
for (const s of strony) {
  if (!s.zapis) continue;
  const klucz = `rozgrywka/zapisy/${path.basename(s.zapis)}`;
  if (!blokiWgZapisu.has(klucz)) blokiWgZapisu.set(klucz, []);
  blokiWgZapisu.get(klucz).push(...wytnijBlokiZapisu(s.body));
}

for (const [sciezka, tekst] of zapisy) {
  const rodzaj = rodzajArchiwum(sciezka);
  if (rodzaj === 'wskazowki') {
    console.log(`✓ ${sciezka} — archiwum wskazówek, poza pokryciem scen (ADR 0016)`);
    continue;
  }
  if (rodzaj === 'akta') {
    const brak = niepokryteWierszeZapisu(tekst, blokiKart);
    if (brak.length > 0) {
      problemow += brak.length;
      console.log(`\n✗ ${sciezka}: ${brak.length} wiersz(y) akt bez dosłownego cytatu na żadnej karcie (ADR 0017):`);
      for (const w of brak.slice(0, 10)) console.log(`  · ${w.slice(0, 110)}${w.length > 110 ? '…' : ''}`);
    } else {
      console.log(`✓ ${sciezka} — każdy wiersz akt jest zacytowany na którejś karcie (ADR 0017)`);
    }
    continue;
  }
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
