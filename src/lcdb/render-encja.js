/**
 * Widok karty encji świata i historii: postać, organizacja, dzielnica,
 * miejsce, hasło, kontekst oraz wątek (ADR 0004, ADR 0010, ADR 0015).
 *
 * W lewej kolumnie leżą boksy treści z warstwami pochodzenia i ewentualną
 * historią interpretacji; w prawej — spis boksów, zwięzła metryka, powiązania
 * dwukierunkowe (bez strzałek kierunkowych) oraz motywy.
 */

import { escapeHtml } from './markdown.js';
import { hrefDlaSlug, hrefListy } from './links.js';
import { TYPY_STRON } from './registry.js';
import { dajDane, dajStrone } from './data.js';
import {
  naglowekStrony,
  nieZnalesc,
  okruszki,
  nazwaTypu,
  nazwaRodzaju,
  formatujRok,
  tytulOryginalu,
  grupaTagow,
} from './render.js';
import { spisBoksow } from './spis-boksow.js';

function wierszeMetryki(s) {
  const w = [];
  const dodaj = (etykieta, html) => {
    if (html) w.push([etykieta, html]);
  };
  const linkStrony = (slug, domyslnyTyp) => {
    if (!slug) return '';
    const cel = dajStrone(slug);
    if (!cel) return '';
    return `<a href="${hrefDlaSlug(cel.slug, cel.typ ?? domyslnyTyp)}">${escapeHtml(cel.tytul)}</a>`;
  };

  if (s.typ === 'postac') {
    if (s.rola) dodaj('Rola', escapeHtml(nazwaRodzaju(s.rola)));
    if (Number.isInteger(s.numer_grzesznika)) dodaj('Numer wśród Grzeszników', escapeHtml(String(s.numer_grzesznika)));
    if (s.pseudonim) dodaj('Miano', escapeHtml(s.pseudonim));
    if (s.przydzial) dodaj('Zajęcie', escapeHtml(s.przydzial));
    dodaj('Przynależność', linkStrony(s.organizacja, 'organizacja'));
    dodaj('Dzielnica', linkStrony(s.dzielnica, 'dzielnica'));
    dodaj('Pierwsze wystąpienie', linkStrony(s.pierwsze_wystapienie, 'scena'));
  } else if (s.typ === 'organizacja') {
    if (s.rodzaj) dodaj('Rodzaj', escapeHtml(nazwaRodzaju(s.rodzaj)));
    dodaj('Dzielnica', linkStrony(s.dzielnica, 'dzielnica'));
    dodaj('Siedziba', linkStrony(s.siedziba, 'miejsce'));
  } else if (s.typ === 'dzielnica') {
    if (s.rodzaj) dodaj('Rodzaj', escapeHtml(nazwaRodzaju(s.rodzaj)));
    if (Number.isInteger(s.numer_dzielnicy)) dodaj('Numer dzielnicy', escapeHtml(String(s.numer_dzielnicy)));
    if (s.region) dodaj('Obszar Miasta', escapeHtml(s.region));
  } else if (s.typ === 'miejsce') {
    if (s.rodzaj) dodaj('Rodzaj', escapeHtml(nazwaRodzaju(s.rodzaj)));
    dodaj('Dzielnica', linkStrony(s.dzielnica, 'dzielnica'));
    dodaj('Organizacja', linkStrony(s.organizacja, 'organizacja'));
  } else if (s.typ === 'pojecie') {
    if (s.rodzaj) dodaj('Rodzaj', escapeHtml(nazwaRodzaju(s.rodzaj)));
  } else if (s.typ === 'watek') {
    if (s.rodzaj_watku) dodaj('Rodzaj', escapeHtml(nazwaRodzaju(s.rodzaj_watku)));
    if (s.stan) dodaj('Stan', escapeHtml(s.stan));
  } else if (s.typ === 'kontekst') {
    if (s.rodzaj) dodaj('Rodzaj', escapeHtml(nazwaRodzaju(s.rodzaj)));
    if (s.dzielo) dodaj('Dzieło', escapeHtml(s.dzielo));
    if (s.autor) dodaj('Autor', escapeHtml(s.autor));
    if (Number.isInteger(s.rok)) dodaj('Rok', escapeHtml(formatujRok(s.rok)));
  }

  if (w.length === 0) return '';
  return `<div class="grupa-boczna">
    <h3>W skrócie</h3>
    <dl class="metryka">
      ${w.map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${v}</dd>`).join('')}
    </dl>
  </div>`;
}

/**
 * Zbiera wszystkie powiązane strony (zarówno wychodzące `s.linki`, jak i
 * przychodzące `backlinki[slug]`), grupuje po typie i wypisuje same tytuły
 * bez technicznych strzałek kierunku (ADR 0010, ADR 0015).
 */
function powiazaniaHtml(s) {
  const dane = dajDane();
  const zbior = new Set();
  for (const cel of s.linki ?? []) zbior.add(cel);
  for (const wej of dane.backlinki?.[s.slug] ?? []) zbior.add(wej.slug);
  zbior.delete(s.slug);

  const poTypie = new Map();
  for (const slug of zbior) {
    const cel = dajStrone(slug);
    if (!cel) continue;
    const lista = poTypie.get(cel.typ) ?? [];
    lista.push(cel);
    poTypie.set(cel.typ, lista);
  }

  const grupy = [];
  for (const typ of TYPY_STRON) {
    const lista = poTypie.get(typ);
    if (!lista || lista.length === 0) continue;
    lista.sort((a, b) => {
      if (typ === 'scena') return (a.kolejnosc ?? 0) - (b.kolejnosc ?? 0);
      if (typ === 'rozdzial') return (a.numer ?? 0) - (b.numer ?? 0);
      if (typ === 'epizod') return (a.kolejnosc ?? 0) - (b.kolejnosc ?? 0);
      return String(a.tytul).localeCompare(String(b.tytul), 'pl');
    });
    grupy.push(`<div class="podgrupa-powiazan">
      <h4>${escapeHtml(nazwaTypu(typ, 'wiele'))}</h4>
      <ul class="lista-zwarta">
        ${lista.map((cel) => `<li><a href="${hrefDlaSlug(cel.slug, cel.typ)}">${escapeHtml(cel.tytul)}</a></li>`).join('')}
      </ul>
    </div>`);
  }

  if (grupy.length === 0) return '';
  return `<div class="grupa-boczna">
    <h3>Powiązania</h3>
    ${grupy.join('')}
  </div>`;
}

export function renderEncja(slug) {
  const s = dajStrone(slug);
  if (!s) return nieZnalesc(slug);

  const dzialEtykieta = nazwaTypu(s.typ, 'wiele');
  const metaCzesci = [nazwaTypu(s.typ)];
  const oryg = tytulOryginalu(s);
  if (oryg) metaCzesci.push(oryg);

  const naglowek = naglowekStrony({
    tytul: s.tytul,
    opis: s.streszczenie ?? '',
    meta: metaCzesci.join(' · '),
    sciezka: okruszki([
      { etykieta: dzialEtykieta, href: hrefListy(s.typ) },
      { etykieta: s.tytul },
    ]),
  });

  const wszystkieBoksy = Array.isArray(s.boksy) ? s.boksy : [];
  const widoczneBoksy = s.streszczenie
    ? wszystkieBoksy.filter((b) => b.tytul !== 'Streszczenie' || b.maHistorie)
    : wszystkieBoksy;

  const lewaKolumna = widoczneBoksy.length > 0
    ? widoczneBoksy.map((b) => b.html).join('\n')
    : (s.html ?? '');

  const boczna = [
    spisBoksow(widoczneBoksy),
    wierszeMetryki(s),
    powiazaniaHtml(s),
    grupaTagow(s.tagi),
  ].filter(Boolean).join('');

  return `${naglowek}
  <div class="uklad-karty">
    <div class="kolumna-glowna">${lewaKolumna}</div>
    <aside class="kolumna-boczna">${boczna}</aside>
  </div>`;
}
