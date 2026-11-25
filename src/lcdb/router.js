/**
 * Router hashowy SPA (`#/rozdzial/:slug`, `#/scena/:slug#kotwica`, `#/sceny?epizod=…`).
 *
 * Drugi `#` w adresie (np. `#/scena/las-mroku#sc-przebudzenie` lub `#/postac/dante#hip-zegar`)
 * jest kotwicą wewnątrz strony, nie częścią sluga trasy.
 */

import { TRASY, LISTY } from './links.js';

const ODWROTNE_TRASY = Object.fromEntries(Object.entries(TRASY).map(([typ, seg]) => [seg, typ]));
const ODWROTNE_LISTY = Object.fromEntries(Object.entries(LISTY).map(([typ, seg]) => [seg, typ]));

export function parsujHash(hash = '') {
  const surowy = String(hash ?? '').replace(/^#/, '');
  if (surowy === '' || surowy === '/') {
    return { nazwa: 'home', parametry: {}, zapytanie: {}, kotwica: null };
  }

  let reszta = surowy;
  let kotwica = null;
  const idxHash = reszta.indexOf('#');
  if (idxHash >= 0) {
    kotwica = decodeURIComponent(reszta.slice(idxHash + 1)) || null;
    reszta = reszta.slice(0, idxHash);
  }

  let sciezka = reszta;
  const zapytanie = {};
  const idxPyt = reszta.indexOf('?');
  if (idxPyt >= 0) {
    sciezka = reszta.slice(0, idxPyt);
    const qs = new URLSearchParams(reszta.slice(idxPyt + 1));
    for (const [k, v] of qs.entries()) zapytanie[k] = v;
  }

  const segmenty = sciezka.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean).map((s) => {
    try { return decodeURIComponent(s); } catch { return s; }
  });

  if (segmenty.length === 0) {
    return { nazwa: 'home', parametry: {}, zapytanie, kotwica };
  }

  const [pierwszy, drugi] = segmenty;

  if (segmenty.length === 1) {
    if (pierwszy === 'chronologia') return { nazwa: 'chronologia', parametry: {}, zapytanie, kotwica };
    if (pierwszy === 'rozdzialy') return { nazwa: 'rozdzialy', parametry: {}, zapytanie, kotwica };
    if (pierwszy === 'hipotezy') return { nazwa: 'hipotezy', parametry: {}, zapytanie, kotwica };
    if (pierwszy === 'tagi') return { nazwa: 'tagi', parametry: {}, zapytanie, kotwica };
    if (pierwszy === 'szukaj') return { nazwa: 'szukaj', parametry: {}, zapytanie, kotwica };
    if (pierwszy === 'co-nowego') return { nazwa: 'co-nowego', parametry: {}, zapytanie, kotwica };
    if (pierwszy === 'o-bazie') return { nazwa: 'o-bazie', parametry: {}, zapytanie, kotwica };
    if (ODWROTNE_LISTY[pierwszy]) {
      return { nazwa: 'lista', parametry: { typ: ODWROTNE_LISTY[pierwszy] }, zapytanie, kotwica };
    }
    return { nazwa: '404', parametry: { sciezka }, zapytanie, kotwica };
  }

  if (segmenty.length === 2) {
    if (pierwszy === 'tag') {
      return { nazwa: 'tag', parametry: { tag: drugi }, zapytanie, kotwica };
    }
    const typ = ODWROTNE_TRASY[pierwszy];
    if (typ === 'scena') return { nazwa: 'scena', parametry: { slug: drugi }, zapytanie, kotwica };
    if (typ === 'epizod') return { nazwa: 'epizod', parametry: { slug: drugi }, zapytanie, kotwica };
    if (typ === 'rozdzial') return { nazwa: 'rozdzial', parametry: { slug: drugi }, zapytanie, kotwica };
    if (typ) return { nazwa: 'encja', parametry: { typ, slug: drugi }, zapytanie, kotwica };
  }

  return { nazwa: '404', parametry: { sciezka }, zapytanie, kotwica };
}
