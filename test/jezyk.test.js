/**
 * Brama języka kroniki (ADR 0012).
 *
 * Widoczna treść kroniki opowiada wyłącznie o świecie przedstawionym i opowieści.
 * Nie wolno jej mówić o sobie samej („baza”, „wpis”, „dostawa”, „agent”, „plik”,
 * „repozytorium”, „markdown”) ani językiem programu komputerowego i mechaniki gacha
 * („gracz”, „gameplay”, „interfejs”, „kliknij”, „baner”, „gacha”, „uptie”, „threadspin”).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { zbudujDane } from '../tools/build.mjs';
import { parsujHash } from '../src/lcdb/router.js';
import { wyrenderujWidok } from '../src/lcdb/main.js';
import { hrefDlaSlug, hrefListy } from '../src/lcdb/links.js';
import { TYPY_STRON } from '../src/lcdb/registry.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Zakazane wyrażenia w widocznej treści czytelniczej (poza dosłownymi cytatami `:::zapis`).
 */
export const ZAKAZANE_WZORCE = [
  // Język meta i warsztatu repozytorium
  { re: /\bbaz(?:a|y|ie|ę|ą|o)\b/i, powod: 'kronika nie nazywa siebie „bazą”' },
  { re: /\bdostaw(?:a|y|ie|ę|ą|om|ami|ach)\b/i, powod: '„dostawa” to pojęcie warsztatowe sesji, nie opowieści' },
  { re: /\bagent(?:a|owi|em|cie|ów|om|ami|ach)?\b/i, powod: 'zakaz wzmianek o agencie AI' },
  { re: /\bwłaściciel(?:a|owi|em|u|e|i)?\b/i, powod: 'zakaz wzmianek o właścicielu projektu' },
  { re: /\brepozytori(?:um|a|ów|om|ami|ach)\b/i, powod: 'zakaz słownictwa Git/repozytorium' },
  { re: /\b(?:frontmatter|markdown|wikilink|build|commit|pull request|branch)\b/i, powod: 'zakaz terminów technicznych silnika' },
  { re: /\bplik(?:u|owi|iem|ach|ami|om|ów)?\b/i, powod: 'zakaz mówienia o plikach' },
  // Język gry jako programu, interfejsu i mechaniki gacha/walki
  { re: /\bgracz(?:a|owi|em|u|e|y|om|ami|ach)?\b/i, powod: 'w świecie opowieści nie ma „gracza”' },
  { re: /\brozgrywk(?:a|i|ę|ą|o)\b/i, powod: 'zamiast „rozgrywki” mówimy o opowieści, wydarzeniach i podróży' },
  { re: /\b(?:gameplay|interfejs|ekran gry|kliknij|samouczek|tutorial|quest)\b/i, powod: 'zakaz słownictwa interfejsu gry' },
  { re: /\b(?:gacha|baner(?:ze|u|y|ów)?|uptie|threadspin|passywk(?:a|i)|lunacy)\b/i, powod: 'zakaz żargonu mechaniki gacha i ulepszeń' },
  { re: /\bskill\s*[123]\b/i, powod: 'zakaz opisywania umiejętności językiem slotów walki' },
];

export function wytnijTekstWidoczny(html) {
  // Dosłowne cytaty z samej gry (<div class="zapis-tekst">…</div>) to materiał źródłowy,
  // a nie odautorski język kroniki — wycinamy je przed kontrolą stylu kroniki.
  const bezZapisu = String(html ?? '').replace(/<div class="zapis-tekst">[\s\S]*?<\/div>/g, ' ');
  return bezZapisu
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function znajdzNaruszeniaJezyka(tekst) {
  const naruszenia = [];
  for (const { re, powod } of ZAKAZANE_WZORCE) {
    const m = tekst.match(re);
    if (m) naruszenia.push(`„${m[0]}” (${powod})`);
  }
  return naruszenia;
}

test('żaden widok kroniki nie używa słownictwa meta, warsztatowego ani growo-mechanicznego', () => {
  const wynik = zbudujDane({ root: ROOT });
  const dane = structuredClone(wynik.indeks);
  for (const [slug, s] of Object.entries(dane.strony)) {
    Object.assign(s, wynik.cialaStron[slug] ?? {});
    s.tekst = wynik.tekstyStron[slug] ?? '';
  }
  dane.coNowegoPelneHtml = wynik.coNowegoPelneHtml;
  globalThis.LCDB_DATA = dane;

  const trasy = [
    '#/', '#/chronologia', '#/rozdzialy', '#/hipotezy', '#/tagi', '#/szukaj', '#/co-nowego', '#/o-bazie',
    ...TYPY_STRON.map((t) => hrefListy(t)),
    ...Object.values(dane.strony).map((s) => hrefDlaSlug(s.slug, s.typ)),
  ];

  const bledy = [];
  for (const trasa of trasy) {
    const html = wyrenderujWidok(parsujHash(trasa));
    const tekst = wytnijTekstWidoczny(html);
    const naruszenia = znajdzNaruszeniaJezyka(tekst);
    if (naruszenia.length > 0) {
      bledy.push(`${trasa}: ${naruszenia.join('; ')}`);
    }
  }

  assert.deepEqual(bledy, []);
});

test('brama języka wykrywa celowo wstrzyknięte słowa meta i mechaniczne', () => {
  for (const probka of [
    'Ta baza gromadzi dane o postaciach.',
    'W najnowszej dostawie właściciel przesłał nowy plik.',
    'Gracz odblokowuje tę postać na banerze gacha po Uptie.',
    'Agent zaktualizował markdown w repozytorium.',
  ]) {
    assert.ok(
      znajdzNaruszeniaJezyka(probka).length > 0,
      `brama powinna odrzucić zdanie: "${probka}"`,
    );
  }
});
