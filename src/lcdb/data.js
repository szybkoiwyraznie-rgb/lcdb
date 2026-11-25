/**
 * Dostęp do danych osadzonych w powłoce i dociąganych leniwie z `data/`.
 *
 * W przeglądarce `globalThis.LCDB_DATA` inicjalizowane jest przez `ladowanie.js`,
 * a w testach i narzędziach ustawiane bezpośrednio.
 */

import { sortujSceny, TYPY_STRON } from './registry.js';

const PUSTE = {
  strony: {},
  backlinki: {},
  tagi: {},
  statystyki: {
    rozdzial: 0, epizod: 0, scena: 0, watek: 0, postac: 0, frakcja: 0,
    dzielnica: 0, miejsce: 0, kontekst: 0, pojecie: 0, powiazania: 0,
  },
  postep: null,
  coNowegoHtml: '',
  coNowegoPelneHtml: '',
  coNowegoWiecej: false,
  coNowegoCzas: null,
  czasBazy: null,
};

export function dajDane() {
  return globalThis.LCDB_DATA ?? PUSTE;
}

export function dajStrone(slug) {
  return dajDane().strony[slug] ?? null;
}

export function stronyTypu(typ) {
  return Object.values(dajDane().strony).filter((s) => s.typ === typ);
}

export function listaRozdzialow() {
  return stronyTypu('rozdzial').sort((a, b) => (a.numer ?? 0) - (b.numer ?? 0));
}

export function epizodyRozdzialu(slugRozdzialu) {
  return stronyTypu('epizod')
    .filter((z) => z.rozdzial === slugRozdzialu)
    .sort((a, b) => (a.kolejnosc ?? 0) - (b.kolejnosc ?? 0));
}

export function scenyEpizodu(slugEpizodu) {
  return sortujSceny(stronyTypu('scena').filter((s) => s.epizod === slugEpizodu));
}

export function wszystkieSceny() {
  return stronyTypu('scena').sort((a, b) => (a.kolejnosc ?? 0) - (b.kolejnosc ?? 0));
}

export function ostatniaScena() {
  const dane = dajDane();
  const slug = dane.postep?.ostatnia_scena;
  if (slug && dane.strony[slug]) return dane.strony[slug];
  return wszystkieSceny().at(-1) ?? null;
}

/** Wszystkie sceny, w których pojawia się dana encja (przez relacje lub wikilink), chronologicznie. */
export function wystapieniaStrony(slug) {
  const dane = dajDane();
  const sceny = wszystkieSceny();
  const polaSceny = ['postacie', 'dzielnice', 'miejsca', 'frakcje', 'watki', 'konteksty', 'pojecia'];
  return sceny.filter((scena) => {
    for (const p of polaSceny) {
      if (Array.isArray(scena[p]) && scena[p].includes(slug)) return true;
    }
    if (Array.isArray(scena.linki) && scena.linki.includes(slug)) return true;
    const strona = dane.strony[slug];
    if (strona && Array.isArray(strona.sceny) && strona.sceny.includes(scena.slug)) return true;
    return false;
  });
}

/** Dwukierunkowe powiązania encji pogrupowane według typu (ADR 0010). */
export function powiazaniaStrony(slug) {
  const dane = dajDane();
  const strona = dane.strony[slug];
  if (!strona) return {};

  const zbior = new Set();
  for (const k of Object.keys(strona)) {
    const w = strona[k];
    if (typeof w === 'string' && dane.strony[w]) zbior.add(w);
    if (Array.isArray(w)) {
      for (const el of w) if (typeof el === 'string' && dane.strony[el]) zbior.add(el);
    }
  }
  for (const el of strona.linki ?? []) {
    if (dane.strony[el]) zbior.add(el);
  }
  for (const bl of dane.backlinki[slug] ?? []) {
    if (dane.strony[bl.slug]) zbior.add(bl.slug);
  }
  for (const inna of Object.values(dane.strony)) {
    if (inna.slug === slug) continue;
    for (const k of Object.keys(inna)) {
      const w = inna[k];
      if (w === slug || (Array.isArray(w) && w.includes(slug))) zbior.add(inna.slug);
    }
  }
  zbior.delete(slug);

  const grupy = {};
  for (const t of TYPY_STRON) grupy[t] = [];
  for (const celSlug of zbior) {
    const cel = dane.strony[celSlug];
    if (cel && grupy[cel.typ]) grupy[cel.typ].push(cel);
  }
  for (const t of TYPY_STRON) {
    grupy[t].sort((a, b) => {
      if (t === 'scena') return (a.kolejnosc ?? 0) - (b.kolejnosc ?? 0);
      if (t === 'rozdzial') return (a.numer ?? 0) - (b.numer ?? 0);
      if (t === 'epizod') return (a.kolejnosc ?? 0) - (b.kolejnosc ?? 0);
      return String(a.tytul).localeCompare(String(b.tytul), 'pl');
    });
  }
  return grupy;
}

/** Spłaszczona lista wszystkich interpretacji `{{model pewnosc=…}}` z całej kroniki. */
export function wszystkieHipotezy() {
  const wynik = [];
  for (const s of Object.values(dajDane().strony)) {
    for (const h of s.hipotezy ?? []) {
      wynik.push({ ...h, slug: s.slug, typ: s.typ, tytulStrony: s.tytul });
    }
  }
  return wynik.sort((a, b) => b.pewnosc - a.pewnosc || String(a.tytulStrony).localeCompare(String(b.tytulStrony), 'pl'));
}

export function progiHipotez() {
  const progi = { wysoka: 0, srednia: 0, niska: 0 };
  for (const s of Object.values(dajDane().strony)) {
    for (const h of s.hipotezy ?? []) {
      const n = Number(h.pewnosc ?? 0);
      if (n >= 80) progi.wysoka += 1;
      else if (n >= 50) progi.srednia += 1;
      else progi.niska += 1;
    }
  }
  return progi;
}

export function czasStrony(slug) {
  return dajStrone(slug)?.czas ?? null;
}

export function coNowegoCzas() {
  return dajDane().coNowegoCzas ?? null;
}

export function czasBazy() {
  return dajDane().czasBazy ?? null;
}
