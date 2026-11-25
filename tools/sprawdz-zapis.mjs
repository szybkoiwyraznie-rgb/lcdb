#!/usr/bin/env node
/**
 * Kontrola spójności archiwów rozgrywki (`rozgrywka/zapisy/`) z kartami scen.
 *
 * 1. Sprawdza integralność plików archiwum (brak uszkodzeń UTF-8 i znaczników konfliktu).
 * 2. Weryfikuje dosłowność każdego bloku `:::zapis` względem archiwum.
 * 3. Wypisuje akapity archiwum, które nie trafiły jeszcze do żadnego bloku `:::zapis`
 *    (np. wpisy akt, opisy światów lustrzanych lub pominięte kwestie do sprawdzenia).
 *
 * Uruchomienie: node tools/sprawdz-zapis.mjs [slug-sceny]
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { wczytajStrony, wczytajZapisy } from './content-loader.mjs';
import { sprawdzWiernoscSceny, wytnijBlokiZapisu, normalizujTekst } from '../src/lcdb/registry.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const filtr = process.argv[2];
const zapisy = wczytajZapisy({ root: ROOT });

if (zapisy.size === 0) {
  console.log('rozgrywka/zapisy/ jest puste — nie ma jeszcze z czym porównywać.');
  process.exit(0);
}

let problemow = 0;

for (const [sciezka, tekst] of zapisy) {
  if (tekst.includes('\uFFFD')) {
    console.log(`✗ ${sciezka}: zawiera znak zastępczy UTF-8 (U+FFFD) — uszkodzone kodowanie`);
    problemow += 1;
  }
  if (/^(?:<{7}|={7}|>{7})/m.test(tekst)) {
    console.log(`✗ ${sciezka}: zawiera nierozwiązane znaczniki konfliktu Gita`);
    problemow += 1;
  }
}

const strony = wczytajStrony({ root: ROOT }).filter((s) => s.typ === 'scena');
const wybrane = filtr ? strony.filter((s) => s.slug === filtr) : strony;

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

const uzyte = new Set();
for (const s of strony) {
  for (const b of wytnijBlokiZapisu(s.body)) uzyte.add(normalizujTekst(b));
}

if (!filtr) {
  for (const [sciezka, tekst] of zapisy) {
    const akapity = String(tekst)
      .split(/\n{2,}/)
      .map(normalizujTekst)
      .filter((a) => a.length > 40 && !a.startsWith('#') && !a.startsWith('> **To nie jest materiał z gry'));
    const pominiete = akapity.filter((a) => ![...uzyte].some((u) => u.includes(a)));
    if (pominiete.length > 0) {
      console.log(`\n${sciezka}: ${pominiete.length} akapit(ów) archiwum poza blokami :::zapis (np. akta/zapiski lub nieopracowane kwestie):`);
      for (const a of pominiete.slice(0, 10)) console.log(`  · ${a.slice(0, 110)}…`);
      if (pominiete.length > 10) console.log(`  … i ${pominiete.length - 10} więcej`);
    }
  }
}

process.exit(problemow > 0 ? 1 : 0);
