/**
 * Warstwa ładowania danych (ADR 0001).
 *
 * Domyślny build (`powloka`) osadza w `dist/index.html` skompresowany indeks
 * metadanych, a wyrenderowane ciała stron dociąga leniwie z `data/<slug>.json`,
 * indeks wyszukiwarki z `data/teksty.json`, pełny dziennik z `data/co-nowego.json`.
 * Tryb archiwalny (`calosc`, flaga `--single`) trzyma wszystko w jednym pliku HTML.
 */

const wTokach = new Map();

export async function rozpakujB64(b64) {
  if (typeof DecompressionStream === 'function' && typeof atob === 'function') {
    const bin = atob(b64);
    const bajty = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bajty[i] = bin.charCodeAt(i);
    const strumien = new Response(bajty).body.pipeThrough(new DecompressionStream('deflate-raw'));
    return JSON.parse(await new Response(strumien).text());
  }
  const { inflateRawSync } = await import('node:zlib');
  const { Buffer } = await import('node:buffer');
  return JSON.parse(inflateRawSync(Buffer.from(b64, 'base64')).toString('utf8'));
}

export async function zainicjujDane() {
  if (globalThis.LCDB_DATA) return globalThis.LCDB_DATA;
  if (!globalThis.LCDB_B64) return null;
  globalThis.LCDB_DATA = await rozpakujB64(globalThis.LCDB_B64);
  delete globalThis.LCDB_B64;
  return globalThis.LCDB_DATA;
}

function czyTrybPowloki() {
  return globalThis.LCDB_TRYB === 'powloka';
}

function pobierzRaz(klucz, url, zastosuj) {
  if (wTokach.has(klucz)) return wTokach.get(klucz);
  const obietnica = (async () => {
    const odp = await globalThis.fetch(url);
    if (!odp.ok) throw new Error(`Nie udało się pobrać ${url} (${odp.status})`);
    const dane = await odp.json();
    zastosuj(dane);
  })().finally(() => wTokach.delete(klucz));
  wTokach.set(klucz, obietnica);
  return obietnica;
}

function czyCialoObecne(strona) {
  if (!strona) return true;
  if (strona.typ === 'scena') return Array.isArray(strona.sekcje);
  return Array.isArray(strona.boksy);
}

export async function zapewnijCialo(slug) {
  const strona = globalThis.LCDB_DATA?.strony?.[slug];
  if (!strona || czyCialoObecne(strona) || !czyTrybPowloki()) return;
  await pobierzRaz(`strona:${slug}`, `data/${encodeURIComponent(slug)}.json`, (cialo) => {
    Object.assign(strona, cialo);
  });
}

export async function zapewnijTeksty() {
  const strony = globalThis.LCDB_DATA?.strony;
  if (!strony || !czyTrybPowloki()) return;
  const przyklad = Object.values(strony)[0];
  if (!przyklad || typeof przyklad.tekst === 'string') return;
  await pobierzRaz('teksty', 'data/teksty.json', (mapa) => {
    for (const [slug, tekst] of Object.entries(mapa)) {
      if (strony[slug]) strony[slug].tekst = tekst;
    }
  });
}

export async function zapewnijCoNowego() {
  const dane = globalThis.LCDB_DATA;
  if (!dane || typeof dane.coNowegoPelneHtml === 'string' || !czyTrybPowloki()) return;
  await pobierzRaz('co-nowego', 'data/co-nowego.json', (pelne) => {
    dane.coNowegoPelneHtml = pelne.html ?? '';
  });
}

export async function zapewnijDaneWidoku( Dopasowanie ) {
  const { nazwa, parametry } = Dopasowanie;
  if (['scena', 'epizod', 'rozdzial', 'encja'].includes(nazwa) && parametry?.slug) {
    await zapewnijCialo(parametry.slug);
    return;
  }
  if (nazwa === 'szukaj') {
    await zapewnijTeksty();
    return;
  }
  if (nazwa === 'co-nowego') {
    await zapewnijCoNowego();
  }
}
