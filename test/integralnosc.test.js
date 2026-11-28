/**
 * Testy integralności całej kroniki: graf encji, granica fabuły, wierność zapisu,
 * kompletność źródeł kwerend, render wszystkich stron, kotwice wewnętrzne i historia interpretacji.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { zbudujDane } from '../tools/build.mjs';
import { parsujHash } from '../src/lcdb/router.js';
import { wyrenderujWidok } from '../src/lcdb/main.js';
import { hrefDlaSlug, hrefListy } from '../src/lcdb/links.js';
import { TYPY_STRON } from '../src/lcdb/registry.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function przygotujPelneDane() {
  const wynik = zbudujDane({ root: ROOT });
  const dane = structuredClone(wynik.indeks);
  for (const [slug, s] of Object.entries(dane.strony)) {
    Object.assign(s, wynik.cialaStron[slug] ?? {});
    s.tekst = wynik.tekstyStron[slug] ?? '';
  }
  dane.coNowegoPelneHtml = wynik.coNowegoPelneHtml;
  globalThis.LCDB_DATA = dane;
  return { wynik, dane };
}

test('zbudujDane przechodzi bez ani jednego naruszenia niezmienników kroniki', () => {
  const { wynik, dane } = przygotujPelneDane();
  assert.deepEqual(wynik.problemy, []);
  assert.ok(Object.keys(dane.strony).length >= 10, 'kronika ma reprezentację wszystkich 10 typów stron');
  for (const typ of TYPY_STRON) {
    assert.ok(dane.statystyki[typ] >= 1, `każdy dział ma co najmniej jedną kartę (brak dla: ${typ})`);
  }
});

test('wszystkie trasy i wszystkie kotwice wewnętrzne rozwiązują się do istniejących elementów', () => {
  const { dane } = przygotujPelneDane();

  const adresy = new Set([
    '#/', '#/chronologia', '#/rozdzialy', '#/hipotezy', '#/tagi', '#/szukaj', '#/co-nowego', '#/o-bazie',
    ...TYPY_STRON.map((t) => hrefListy(t)),
    ...Object.values(dane.strony).map((s) => hrefDlaSlug(s.slug, s.typ)),
    ...Object.keys(dane.tagi).map((t) => `#/tag/${encodeURIComponent(t)}`),
  ]);

  const cacheHtml = new Map();
  const dajHtml = (trasaBezKotwicy) => {
    if (!cacheHtml.has(trasaBezKotwicy)) {
      const dop = parsujHash(trasaBezKotwicy);
      assert.notEqual(dop.nazwa, '404', `trasa ${trasaBezKotwicy} nie może dawać 404`);
      cacheHtml.set(trasaBezKotwicy, wyrenderujWidok(dop));
    }
    return cacheHtml.get(trasaBezKotwicy);
  };

  for (const adres of adresy) {
    const html = dajHtml(adres);
    assert.ok(html.length > 40, `pusty render dla ${adres}`);
    assert.doesNotMatch(html, /class="martwy-link"/, `martwy wikilink na ${adres}`);
    assert.doesNotMatch(html, /\{\{(?:dostawa|opracowanie|kwerenda|model|zrodlo)\b/, `niewyrenderowany znacznik {{…}} na ${adres}`);
    assert.doesNotMatch(html, /:::zapis/, `niewyrenderowany blok :::zapis na ${adres}`);

    // Sprawdzamy wszystkie linki wewnętrzne #/... wyemitowane w HTML-u
    for (const m of html.matchAll(/href="(#\/[^"]+)"/g)) {
      const pelnyHref = m[1].replaceAll('&amp;', '&');
      const dop = parsujHash(pelnyHref);
      assert.notEqual(dop.nazwa, '404', `link ${pelnyHref} na stronie ${adres} prowadzi do 404`);
      const bazaTrasy = '#' + pelnyHref.slice(1).split('#')[0];
      const docelowyHtml = dajHtml(bazaTrasy);
      if (dop.kotwica) {
        assert.ok(
          docelowyHtml.includes(`id="${dop.kotwica}"`),
          `link ${pelnyHref} na ${adres} wskazuje brakującą kotwicę id="${dop.kotwica}"`,
        );
      }
    }
  }
});

test('wpisy historii interpretacji z polem poprzednio są widoczne na wyrenderowanej karcie', () => {
  const { dane } = przygotujPelneDane();
  const zRewizja = Object.values(dane.strony).filter(
    (s) => Array.isArray(s.interpretacje) && s.interpretacje.some((w) => w.poprzednio),
  );
  // Prawdziwa kronika nie ma rewizji przed drugą sceną, więc nie wymuszamy ich liczby —
  // renderer bloku „Poprzednia wersja” ma osobny test jednostkowy w test/silnik.test.js.
  for (const s of zRewizja) {
    const html = wyrenderujWidok(parsujHash(hrefDlaSlug(s.slug, s.typ)));
    assert.match(html, /class="historia-interpretacji"/, `${s.slug}: brak bloku Poprzednia wersja w HTML`);
  }
});

test('części tytułowe (.naglowek-strony i .hero) wykorzystują pełną szerokość kontenera bez zwężania w ch/px', () => {
  const css = fs.readFileSync(path.join(ROOT, 'src', 'lcdb', 'style.css'), 'utf8');
  for (const selektor of ['\\.wstep', '\\.hero-opis', '\\.hero-szukaj']) {
    const blok = css.match(new RegExp(`${selektor}[^{]*\\{([^}]*)\\}`));
    assert.ok(blok, `brak reguły CSS dla ${selektor}`);
    assert.doesNotMatch(
      blok[1],
      /max-width:\s*\d+(?:ch|px|rem)/,
      `${selektor} nie może mieć sztucznego ograniczenia max-width zwężającego nagłówek do połowy strony`,
    );
  }
});
