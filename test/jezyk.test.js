/**
 * Bramy języka widocznej treści kroniki (ADR 0012).
 *
 * Kronika opowiada o świecie Miasta i podróży bohaterów, a nie o procesie
 * redagowania, interfejsie gry czy budowie samej witryny. Dosłowne cytaty
 * scen (<div class="zapis-tekst">) są wyłączone ze sprawdzenia, bo archiwum
 * rozgrywki jest nietykalne.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { zbudujDane } from '../tools/build.mjs';
import { wczytajStrony, wczytajCoNowego } from '../tools/content-loader.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const META = new RegExp([
  '\\bbaz[aeyi]\\b', '\\bbazie\\b', '\\bdostaw[a-ząćęłńóśźż]*\\b',
  '\\barchiwum\\b', '\\bmateria[łl][a-ząćęłńóśźż]*\\b', '\\bmodel[a-ząćęłńóśźż]*\\b', '\\bagent[a-ząćęłńóśźż]*\\b',
  '\\bprompt\\b', '\\bADR\\b', '\\bcommit\\b', '\\brepozytori[um]\\b', '\\bbuild\\b', '\\brender[a-ząćęłńóśźż]*\\b',
  '\\btranskryp[a-ząćęłńóśźż]*\\b', '\\bniniejsz[a-ząćęłńóśźż]*\\b',
  '\\bwpis[a-ząćęłńóśźż]*\\b', '\\bwpisy\\b', '\\bsekcj[a-ząćęłńóśźż]*\\b', '\\bodsyłacz[a-ząćęłńóśźż]*\\b',
  '\\bkotwic[a-ząćęłńóśźż]*\\b', '\\btag(?:i|ów|iem|u|ach|ami)?\\b', '\\bpodstron[a-ząćęłńóśźż]*\\b',
  '\\binterfejs[a-ząćęłńóśźż]*\\b', '\\bkafelk[a-ząćęłńóśźż]*\\b', '\\bfiltr[a-ząćęłńóśźż]*\\b',
  '\\bw grze\\b', '\\bw tej grze\\b', '\\bmechanik[a-ząćęłńóśźż]*\\b', '\\bgracz[a-ząćęłńóśźż]*\\b',
  '\\brekord[a-ząćęłńóśźż]*\\b', '\\bnumera?cj[a-ząćęłńóśźż]*\\b', '\\bnumer sceny\\b',
  '\\bgacha\\b', '\\bbaner[a-ząćęłńóśźż]*\\b', '\\bekran[a-ząćęłńóśźż]*\\s+wyboru\\b',
].join('|'), 'giu');

const UKRYTE_ZRODLO = new RegExp([
  '\\bw (?:tym |samym )?opisie\\b', '\\bwedług (?:tego )?opisu\\b', '\\bz opisu\\b',
  '\\bjej opis\\b', '\\bjego opis\\b', '\\bten opis\\b', '\\bta? opis\\b',
  '\\bopis (?:przedmiotu|umiejętności|ataku|monety|tożsamości)\\b',
  '\\bw ekwipunku\\b', '\\bw inwentarzu\\b', '\\bw aktach gry\\b', '\\bw menu\\b',
].join('|'), 'giu');

const WLASCICIEL_PROJEKTU = new RegExp(
  '\\bwłaściciel[a-ząćęłńóśźż]*\\s+(?:tej\\s+)?(?:baz|kronik|repozytori|projekt|stron|witryn)',
  'giu',
);

function tekstWidoczny(html) {
  return String(html)
    .replace(/wiedza modelu/gi, ' ')
    .replace(/modelu wiedzy/gi, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<div class="zapis-tekst">[\s\S]*?<\/div>/g, ' ')
    .replace(/<div class="historia-poprzednio">[\s\S]*?<\/div>/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ');
}

let dane;
test.before(async () => {
  dane = await zbudujDane({ root: ROOT });
});

test('widoczne karty nie mówią o bazie, procesie redakcyjnym ani interfejsie', () => {
  const problemy = [];
  for (const [slug, strona] of Object.entries(dane.strony)) {
    const naglowki = [...(strona.boksy ?? []), ...(strona.sekcje ?? [])]
      .map((b) => b.tytul ?? '')
      .join(' ');
    const html = [
      strona.html ?? '',
      naglowki,
      ...(strona.boksy ?? []).map((b) => b.html),
      ...(strona.sekcje ?? []).map((s) => s.html),
    ].join(' ');
    const tekst = tekstWidoczny(html);
    const trafienia = [
      ...new Set([
        ...tekst.matchAll(META),
        ...tekst.matchAll(WLASCICIEL_PROJEKTU),
        ...tekst.matchAll(UKRYTE_ZRODLO),
      ].map((m) => m[0])),
    ];
    if (trafienia.length > 0) problemy.push(`${slug}: ${trafienia.join(', ')}`);
  }
  assert.deepEqual(problemy, []);
});

test('wzorce rozróżniają właściciela przedmiotu w świecie od właściciela kroniki', () => {
  for (const zdanie of ['właściciel warsztatu', 'właściciel zegarka', 'właściciela biletu']) {
    assert.deepEqual([...zdanie.matchAll(META)].map((m) => m[0]), []);
    assert.deepEqual([...zdanie.matchAll(WLASCICIEL_PROJEKTU)].map((m) => m[0]), []);
  }
  for (const zdanie of ['właściciel bazy', 'właściciela kroniki', 'właściciel tej witryny']) {
    assert.ok([...zdanie.matchAll(WLASCICIEL_PROJEKTU)].length > 0);
  }
  for (const zdanie of ['w dostarczonym transkrypcie', 'w niniejszej sekcji', 'gracz widzi na ekranie wyboru']) {
    assert.ok([...zdanie.matchAll(META)].length > 0);
  }
});

test('streszczenia na listach i wpisy dziennika Co nowego używają języka świata', () => {
  const problemy = [];
  for (const [slug, strona] of Object.entries(dane.strony)) {
    const tekst = String(strona.streszczenie ?? '');
    const trafienia = [...new Set([...tekst.matchAll(META)].map((m) => m[0]))];
    if (trafienia.length > 0) problemy.push(`${slug}: ${trafienia.join(', ')}`);
  }
  const wpisy = wczytajCoNowego({ root: ROOT });
  assert.ok(wpisy.length > 0, 'dziennik Co nowego musi mieć co najmniej jeden wpis');
  for (const w of wpisy) {
    assert.match(w.data, /^\d{4}-\d{2}-\d{2}$/);
    const trafienia = [...new Set([...String(w.tekst ?? '').matchAll(META)].map((m) => m[0]))];
    if (trafienia.length > 0) problemy.push(`co-nowego (${w.data}): ${trafienia.join(', ')}`);
  }
  assert.deepEqual(problemy, []);
});

test('sekcje ## Opis encji mówią o świecie Miasta, a wikilinki pokazują tytuły zamiast slugów', () => {
  const strony = wczytajStrony({ root: ROOT }).filter((s) =>
    ['postac', 'organizacja', 'dzielnica', 'miejsce', 'pojecie', 'kontekst', 'watek'].includes(s.typ));
  const ZAKAZANE = /\bw grze\b|\bw tej grze\b|\bgracz[a-ząćęłńóśźż]*\b|\brekord[a-ząćęłńóśźż]*\b|\bmechanik[a-ząćęłńóśźż]*\b/giu;
  for (const s of strony) {
    const m = String(s.body).match(/##\s+Opis[ \t]*\n+([\s\S]*?)(?:\n##\s|\n\}\}|$)/);
    if (!m) continue;
    const trafienia = [...new Set([...m[1].matchAll(ZAKAZANE)].map((x) => x[0]))];
    assert.deepEqual(trafienia, [], `${s.slug}: opis używa języka programu`);
  }

  const suroweSlugi = [];
  for (const [slug, strona] of Object.entries(dane.strony)) {
    const html = [
      strona.html ?? '',
      ...(strona.boksy ?? []).map((b) => b.html),
      ...(strona.sekcje ?? []).map((s) => s.html),
    ].join(' ');
    for (const m of html.matchAll(/<a [^>]*>([a-z0-9]+(?:-[a-z0-9]+)+)<\/a>/g)) {
      suroweSlugi.push(`${slug}: odsyłacz pokazuje surowy slug „${m[1]}”`);
    }
  }
  assert.deepEqual(suroweSlugi, []);
});
