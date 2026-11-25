import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { chodz, KATALOGI as KATALOGI_LOADER } from '../tools/content-loader.mjs';
import { TYPY_STRON, KATALOGI as KATALOGI_REJESTR } from '../src/lcdb/registry.js';

const ROOT = process.cwd();

describe('spójność dokumentacji, ADR-ów i słowników schematu', () => {
  it('zawiera komplet wymaganych przewodników, instrukcji i indeksów', () => {
    const wymagane = [
      'README.md',
      'AGENTS.md',
      'ENVIRONMENT.md',
      'content/README.md',
      'rozgrywka/README.md',
      'docs/LESSONS.md',
      'docs/decisions/README.md',
      'docs/audits/README.md',
      'docs/plans/README.md',
      'docs/guides/ENVIRONMENT.md',
      'docs/guides/SCHEMAT_DANYCH.md',
      'docs/guides/PRZEPLYW_SCENY.md',
    ];
    for (const rel of wymagane) {
      assert.equal(fs.existsSync(path.join(ROOT, rel)), true, `brak pliku dokumentacji ${rel}`);
    }
  });

  it('wszystkie względne odsyłacze Markdown w dokumentacji wskazują istniejące pliki', () => {
    const plikiDoc = [
      path.join(ROOT, 'README.md'),
      path.join(ROOT, 'AGENTS.md'),
      path.join(ROOT, 'ENVIRONMENT.md'),
      path.join(ROOT, 'content/README.md'),
      path.join(ROOT, 'rozgrywka/README.md'),
      ...chodz(path.join(ROOT, 'docs')).filter((p) => p.endsWith('.md')),
    ];

    for (const pelna of plikiDoc) {
      const tekst = fs.readFileSync(pelna, 'utf8').replace(/```[\s\S]*?```/g, '');
      const relZrodla = path.relative(ROOT, pelna);
      for (const m of tekst.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
        const surowyCel = m[1].trim();
        if (/^(https?:|mailto:|#)/.test(surowyCel)) continue;
        const bezKotwicy = surowyCel.split('#')[0];
        if (!bezKotwicy) continue;
        const docelowa = path.resolve(path.dirname(pelna), bezKotwicy);
        assert.equal(
          fs.existsSync(docelowa),
          true,
          `${relZrodla}: martwy odsyłacz do "${surowyCel}"`,
        );
      }
    }
  });

  it('indeks ADR-ów wymienia każdy plik 0*.md i każdy ADR posiada Status oraz Datę', () => {
    const katalogAdr = path.join(ROOT, 'docs/decisions');
    const indeks = fs.readFileSync(path.join(katalogAdr, 'README.md'), 'utf8');
    const plikiAdr = fs
      .readdirSync(katalogAdr)
      .filter((f) => /^0\d{3}-.*\.md$/.test(f))
      .sort();

    assert.ok(plikiAdr.length >= 16, 'oczekiwano co najmniej 16 decyzji ADR');
    for (const plik of plikiAdr) {
      assert.ok(indeks.includes(`(${plik})`), `docs/decisions/README.md pomija ${plik}`);
      const tresc = fs.readFileSync(path.join(katalogAdr, plik), 'utf8');
      assert.match(tresc, /^-\s+\*\*Status:\*\*\s+\S+/m, `${plik}: brak pola Status`);
      assert.match(tresc, /^-\s+\*\*Data:\*\*\s+\d{4}-\d{2}-\d{2}/m, `${plik}: brak daty RRRR-MM-DD`);
    }
  });

  it('słownik 10 typów kart zgadza się między registry.js, content-loader.mjs i SCHEMAT_DANYCH.md', () => {
    assert.equal(TYPY_STRON.length, 10);
    assert.deepEqual(
      KATALOGI_LOADER.map((k) => k.typ),
      TYPY_STRON,
    );
    for (const typ of TYPY_STRON) {
      assert.equal(
        KATALOGI_LOADER.find((k) => k.typ === typ)?.katalog,
        `content/${KATALOGI_REJESTR[typ]}`,
      );
    }
    const schemat = fs.readFileSync(path.join(ROOT, 'docs/guides/SCHEMAT_DANYCH.md'), 'utf8');
    for (const typ of TYPY_STRON) {
      assert.ok(schemat.includes(`\`${typ}\` — \`content/${KATALOGI_REJESTR[typ]}/\``), `SCHEMAT_DANYCH.md pomija nagłówek typu ${typ}`);
    }
  });
});
