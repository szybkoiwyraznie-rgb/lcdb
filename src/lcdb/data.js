/**
 * Dostęp do danych kroniki (`globalThis.LCDB_DATA` — ADR 0001, ADR 0003).
 *
 * Moduł celowo prosty: zwraca bezpieczne puste struktury, gdy danych brak,
 * a walidacje wykonuje etap budowania i testy przez `registry.js`.
 */

const porownajNumeryScen = new Intl.Collator('pl', { numeric: true, sensitivity: 'base' }).compare;

export const NAZWA_BAZY = 'Limbus Company — kronika opowieści';

export function dajDane() {
  return globalThis.LCDB_DATA ?? {
    zbudowano: '',
    postep: null,
    strony: {},
    backlinki: {},
    tagi: {},
    hipotezy: {},
    statystyki: {},
    coNowego: [],
    czasBazy: null,
  };
}

export function dajStrone(slug) {
  return dajDane().strony[slug] ?? null;
}

export function listaStron(typ) {
  return Object.values(dajDane().strony).filter((s) => s.typ === typ);
}

export function porownajAktualizacje(a, b) {
  return String(b.czas?.zaktualizowano ?? '').localeCompare(String(a.czas?.zaktualizowano ?? ''))
    || String(b.czas?.utworzono ?? '').localeCompare(String(a.czas?.utworzono ?? ''))
    || String(a.tytul ?? '').localeCompare(String(b.tytul ?? ''), 'pl');
}

export function listaWedlugAktualizacji(typ) {
  return listaStron(typ).sort(porownajAktualizacje);
}

export function listaPosortowana(typ) {
  return listaStron(typ).sort((a, b) => String(a.tytul ?? '').localeCompare(String(b.tytul ?? ''), 'pl'));
}

export function listaRozdzialow() {
  return listaStron('rozdzial').sort((a, b) => (a.numer ?? 0) - (b.numer ?? 0));
}

export function epizodyRozdzialu(slugRozdzialu) {
  return listaStron('epizod')
    .filter((z) => z.rozdzial === slugRozdzialu)
    .sort((a, b) => (a.kolejnosc ?? 0) - (b.kolejnosc ?? 0));
}

export function scenyEpizodu(slugEpizodu) {
  return listaStron('scena')
    .filter((s) => s.epizod === slugEpizodu)
    .sort((a, b) => porownajNumeryScen(String(a.numer_sceny ?? ''), String(b.numer_sceny ?? '')));
}

export function epizodSceny(scena) {
  return scena?.epizod ? dajStrone(scena.epizod) : null;
}

export function dzielniceSceny(scena) {
  const slugi = Array.isArray(scena?.dzielnice) ? scena.dzielnice : [];
  return slugi.map((slug) => dajStrone(slug)).filter(Boolean);
}

export function listaScenChronologicznie() {
  return listaStron('scena').sort((a, b) => (a.kolejnosc ?? 0) - (b.kolejnosc ?? 0));
}

export function ostatniaScena() {
  const scena = dajDane().postep?.ostatnia_scena;
  return scena ? dajStrone(scena) : listaScenChronologicznie().at(-1) ?? null;
}

export function rozdzialSceny(scena) {
  const epizod = epizodSceny(scena);
  return epizod?.rozdzial ? dajStrone(epizod.rozdzial) : null;
}

export function dajPostep() {
  const dane = dajDane();
  const sceny = listaScenChronologicznie();
  const ostatnia = ostatniaScena();
  const rozdzial = ostatnia ? rozdzialSceny(ostatnia) : null;
  return {
    scen: sceny.length,
    ostatnia,
    rozdzial,
    postepPliku: dane.postep ?? null,
  };
}

export function listaStronZHipotezami() {
  return Object.values(dajDane().strony)
    .filter((s) => Array.isArray(s.hipotezy) && s.hipotezy.length > 0)
    .sort(porownajAktualizacje);
}

export function liczbaHipotez() {
  return listaStronZHipotezami().reduce((n, s) => n + (s.hipotezy?.length ?? 0), 0);
}

export function rozkladPewnosciHipotez() {
  const progi = { wysoka: 0, srednia: 0, niska: 0 };
  for (const s of listaStronZHipotezami()) {
    for (const h of s.hipotezy ?? []) {
      const n = Number(h.pewnosc);
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
