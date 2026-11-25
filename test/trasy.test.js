/**
 * Testy pokrycia tras routera, menu głównego, kafli strony głównej, filtrów i wyszukiwarki.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { zbudujDane } from '../tools/build.mjs';
import { parsujHash } from '../src/lcdb/router.js';
import { wyrenderujWidok } from '../src/lcdb/main.js';
import { MENU } from '../src/lcdb/render.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function zaladuj() {
  const wynik = zbudujDane({ root: ROOT });
  const dane = structuredClone(wynik.indeks);
  for (const [slug, s] of Object.entries(dane.strony)) {
    Object.assign(s, wynik.cialaStron[slug] ?? {});
    s.tekst = wynik.tekstyStron[slug] ?? '';
  }
  dane.coNowegoPelneHtml = wynik.coNowegoPelneHtml;
  globalThis.LCDB_DATA = dane;
}

test('każda pozycja MENU oraz każdy kafel strony głównej prowadzi do żywego widoku', () => {
  zaladuj();
  for (const poz of MENU) {
    const dop = parsujHash(poz.href);
    assert.notEqual(dop.nazwa, '404', `pozycja menu ${poz.href} daje 404`);
    const html = wyrenderujWidok(dop);
    assert.match(html, /<h1/, `widok ${poz.href} ma główny nagłówek h1`);
  }

  const homeHtml = wyrenderujWidok(parsujHash('#/'));
  const kafle = [...homeHtml.matchAll(/class="kafel[^"]*"\s+href="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(kafle.length, 11, '10 działów opowieści + kafel Interpretacje');
  for (const href of kafle) {
    const dop = parsujHash(href);
    assert.notEqual(dop.nazwa, '404');
    assert.ok(wyrenderujWidok(dop).length > 50);
  }
});

test('filtry list, wyszukiwarka oraz nieznana ścieżka 404 działają przewidywalnie', () => {
  zaladuj();
  const postacieHtml = wyrenderujWidok(parsujHash('#/postacie?rola=protagonista'));
  assert.match(postacieHtml, /Wędrowiec z Zegarem/);
  assert.doesNotMatch(postacieHtml, /Strażniczka Toru/);

  const szukajHtml = wyrenderujWidok(parsujHash('#/szukaj?q=mosi%C4%99%C5%BCny'));
  assert.match(szukajHtml, /wynik/);

  const brak = parsujHash('#/nie-istnieje/wcale');
  assert.equal(brak.nazwa, '404');
  assert.match(wyrenderujWidok(brak), /Nie ma takiej karty/);
});
