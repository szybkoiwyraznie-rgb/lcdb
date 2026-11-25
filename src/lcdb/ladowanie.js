/**
 * Ładowanie danych w trybie powłoki i drzewa danych (ADR 0001).
 *
 * Powłoka (`dist/index.html`) zawiera styl, sklejone moduły oraz skompresowany
 * gzip+base64 indeks stron i grafu. Ciała kart leżą w `dist/data/<slug>.json`
 * i są dociągane dopiero przy wejściu w kartę. Indeks pełnotekstowy (`teksty.json`)
 * dociąga się przy pierwszym wyszukiwaniu, a dziennik (`co-nowego.json`) na starcie.
 *
 * W trybie jednoplikowym (`--single`) oraz w testach pełny obiekt `LCDB_DATA`
 * jest już w pamięci i żadne dociąganie po sieci nie jest potrzebne.
 */

const KATALOG_DANYCH = 'data/';
const PLIK_TEKSTOW = 'teksty.json';
const PLIK_DZIENNIKA = 'co-nowego.json';

const wczytaneStrony = new Set();
let tekstyWczytane = false;
let dziennikWczytany = false;

export function czyTrybPlikow() {
  return globalThis.LCDB_TRYB === 'pliki';
}

export function czyStronaWczytana(slug) {
  return !czyTrybPlikow() || wczytaneStrony.has(slug);
}

async function rozpakuj(b64) {
  const binarny = globalThis.atob(b64);
  const bajty = new Uint8Array(binarny.length);
  for (let i = 0; i < binarny.length; i += 1) bajty[i] = binarny.charCodeAt(i);
  const Dekompresja = globalThis.DecompressionStream;
  if (typeof Dekompresja !== 'function') {
    throw new Error('przeglądarka nie obsługuje DecompressionStream — użyj nowszej wersji');
  }
  const strumien = new globalThis.Blob([bajty]).stream().pipeThrough(new Dekompresja('gzip'));
  return new globalThis.Response(strumien).text();
}

function adresDanych(nazwa) {
  const baza = globalThis.location?.href ?? globalThis.document?.baseURI ?? '';
  try {
    return new URL(KATALOG_DANYCH + nazwa, baza).href;
  } catch {
    return KATALOG_DANYCH + nazwa;
  }
}

async function pobierzJson(nazwa) {
  if (typeof globalThis.fetch !== 'function') {
    throw new Error(`brak fetch — plik ${nazwa} wymaga serwera HTTP`);
  }
  const odpowiedz = await globalThis.fetch(adresDanych(nazwa));
  if (!odpowiedz.ok) throw new Error(`nie udało się pobrać ${nazwa} (HTTP ${odpowiedz.status})`);
  return odpowiedz.json();
}

export async function zaladujDane() {
  if (globalThis.LCDB_DATA?.strony) {
    tekstyWczytane = true;
    dziennikWczytany = true;
    for (const slug of Object.keys(globalThis.LCDB_DATA.strony)) wczytaneStrony.add(slug);
    return globalThis.LCDB_DATA;
  }
  const paczka = globalThis.LCDB_B64;
  if (!paczka) throw new Error('powłoka bez danych');
  const dane = JSON.parse(await rozpakuj(paczka));
  globalThis.LCDB_DATA = dane;
  await dociagnijCoNowego();
  return dane;
}

export async function dociagnijStrone(slug) {
  const dane = globalThis.LCDB_DATA;
  const strona = dane?.strony?.[slug] ?? null;
  if (!strona || !czyTrybPlikow() || wczytaneStrony.has(slug)) return strona;
  const cialo = await pobierzJson(`${slug}.json`);
  Object.assign(strona, cialo);
  wczytaneStrony.add(slug);
  return strona;
}

export async function dociagnijTeksty() {
  const dane = globalThis.LCDB_DATA;
  if (!dane?.strony || !czyTrybPlikow() || tekstyWczytane) return dane?.strony ?? {};
  const teksty = await pobierzJson(PLIK_TEKSTOW);
  for (const [slug, tekst] of Object.entries(teksty ?? {})) {
    if (dane.strony[slug]) dane.strony[slug].tekst = tekst;
  }
  tekstyWczytane = true;
  return dane.strony;
}

export async function dociagnijCoNowego() {
  const dane = globalThis.LCDB_DATA;
  if (!dane || !czyTrybPlikow() || dziennikWczytany) return dane?.coNowego ?? [];
  try {
    dane.coNowego = await pobierzJson(PLIK_DZIENNIKA);
  } catch (blad) {
    dane.coNowego = dane.coNowego ?? [];
    globalThis.console?.warn?.(`dziennik niedostępny: ${blad.message}`);
  }
  dziennikWczytany = true;
  return dane.coNowego;
}

export function czyTekstyWczytane() {
  return !czyTrybPlikow() || tekstyWczytane;
}

export function czyDziennikWczytany() {
  return !czyTrybPlikow() || dziennikWczytany;
}
