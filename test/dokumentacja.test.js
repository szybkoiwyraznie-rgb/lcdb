/**
 * Brama spójności dokumentacji z kodem i drzewem plików (`test/dokumentacja.test.js`).
 *
 * Pilnuje, aby instrukcje dla kolejnych sesji (`AGENTS.md`, `ENVIRONMENT.md`, `README.md`,
 * przewodniki i rejestr decyzji ADR) nigdy nie rozjechały się z rzeczywistym schematem silnika,
 * skryptami `package.json` i ścieżkami plików w repozytorium.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { TYPY_STRON, POLA_DOZWOLONE } from '../src/lcdb/registry.js';
import { POCHODZENIA } from '../src/lcdb/markdown.js';
import { KATALOGI } from '../tools/content-loader.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const OBOWIAZKOWE_DOKUMENTY = [
  'README.md',
  'AGENTS.md',
  'ENVIRONMENT.md',
  'rozgrywka/README.md',
  'content/README.md',
  'docs/LESSONS.md',
  'docs/audits/README.md',
  'docs/plans/README.md',
  'docs/decisions/README.md',
  'docs/guides/ENVIRONMENT.md',
  'docs/guides/SCHEMAT_DANYCH.md',
  'docs/guides/PRZEPLYW_SCENY.md',
];

test('wszystkie obowiązkowe dokumenty startowe i przewodniki istnieją oraz są niepuste', () => {
  for (const rel of OBOWIAZKOWE_DOKUMENTY) {
    const abs = path.join(ROOT, rel);
    assert.ok(fs.existsSync(abs), `brak obowiązkowego dokumentu: ${rel}`);
    const tresc = fs.readFileSync(abs, 'utf8').trim();
    assert.ok(tresc.length > 100, `zbyt krótki dokument: ${rel}`);
  }
});

test('package.json ma zero zależności zewnętrznych i komplet udokumentowanych skryptów', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.dependencies, undefined, 'package.json nie może mieć dependencies (ADR 0002)');
  assert.equal(pkg.devDependencies, undefined, 'package.json nie może mieć devDependencies (ADR 0002)');
  assert.equal(pkg.type, 'module');

  const envMd = fs.readFileSync(path.join(ROOT, 'ENVIRONMENT.md'), 'utf8');
  for (const skrypt of ['test', 'zapis', 'build', 'build:single', 'serve']) {
    assert.ok(pkg.scripts?.[skrypt], `brak skryptu npm run ${skrypt}`);
    assert.ok(envMd.includes(`npm run ${skrypt}`) || (skrypt === 'test' && envMd.includes('npm test')),
      `skrypt ${skrypt} musi być opisany w ENVIRONMENT.md`);
  }
});

test('rejestr decyzji ADR (docs/decisions/README.md) jest w 100% zgodny z plikami 00NN-*.md', () => {
  const dir = path.join(ROOT, 'docs', 'decisions');
  const pliki = fs.readdirSync(dir)
    .filter((f) => /^\d{4}-.*\.md$/.test(f))
    .sort();
  assert.ok(pliki.length >= 15, 'oczekiwano kompletu startowych decyzji ADR');

  const indeks = fs.readFileSync(path.join(dir, 'README.md'), 'utf8');

  pliki.forEach((plik, idx) => {
    const oczekiwanyNr = String(idx + 1).padStart(4, '0');
    assert.ok(plik.startsWith(`${oczekiwanyNr}-`), `nieciągła numeracja ADR: oczekiwano ${oczekiwanyNr}, jest ${plik}`);
    assert.ok(indeks.includes(`(${plik})`), `plik ADR ${plik} nie jest podlinkowany w docs/decisions/README.md`);

    const tresc = fs.readFileSync(path.join(dir, plik), 'utf8');
    assert.match(tresc, /^#\s+\d{4}\.\s+/m, `${plik}: brak nagłówka "# 00NN. Tytuł"`);
    assert.match(tresc, /^Status:\s+(?:przyjęta|zastąpiona przez)/m, `${plik}: brak poprawnej linii Status:`);
    assert.match(tresc, /^##\s+Kontekst$/m, `${plik}: brak sekcji ## Kontekst`);
    assert.match(tresc, /^##\s+Decyzja$/m, `${plik}: brak sekcji ## Decyzja`);
    assert.match(tresc, /^##\s+Konsekwencje$/m, `${plik}: brak sekcji ## Konsekwencje`);
  });
});

test('SCHEMAT_DANYCH.md dokumentuje wszystkie typy stron, katalogi, pola i warstwy pochodzenia z kodu', () => {
  const schemat = fs.readFileSync(path.join(ROOT, 'docs', 'guides', 'SCHEMAT_DANYCH.md'), 'utf8');

  for (const typ of TYPY_STRON) {
    assert.ok(schemat.includes(`\`${typ}\``), `typ "${typ}" z TYPY_STRON nie jest opisany w SCHEMAT_DANYCH.md`);
    for (const pole of POLA_DOZWOLONE[typ] ?? []) {
      assert.ok(schemat.includes(`\`${pole}\``), `pole "${pole}" typu "${typ}" nie jest opisane w SCHEMAT_DANYCH.md`);
    }
  }

  for (const [katalog] of KATALOGI) {
    assert.ok(schemat.includes(`content/${katalog}/`), `katalog content/${katalog}/ nie jest wymieniony w SCHEMAT_DANYCH.md`);
  }

  for (const pochodzenie of POCHODZENIA) {
    assert.ok(schemat.includes(`{{${pochodzenie}`), `pochodzenie {{${pochodzenie} nie jest opisane w SCHEMAT_DANYCH.md`);
  }
});

test('żaden względny link plikowy w dokumentacji nie prowadzi donikąd', () => {
  const plikiMd = [
    ...OBOWIAZKOWE_DOKUMENTY,
    ...fs.readdirSync(path.join(ROOT, 'docs', 'decisions'))
      .filter((f) => f.endsWith('.md'))
      .map((f) => `docs/decisions/${f}`),
  ];

  const wytnijBlokiKodu = (md) => md.replace(/```[\s\S]*?```/g, '');

  for (const rel of new Set(plikiMd)) {
    const abs = path.join(ROOT, rel);
    const tresc = wytnijBlokiKodu(fs.readFileSync(abs, 'utf8'));
    for (const m of tresc.matchAll(/\[[^\]]+\]\(([^)#\s]+)(?:#[^)]*)?\)/g)) {
      const cel = m[1];
      if (/^(?:https?:|mailto:)/.test(cel)) continue;
      const docelowyAbs = path.resolve(path.dirname(abs), cel);
      assert.ok(
        fs.existsSync(docelowyAbs),
        `martwy odsyłacz plikowy "${cel}" w dokumencie ${rel}`,
      );
    }
  }
});
