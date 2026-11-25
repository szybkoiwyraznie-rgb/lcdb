/**
 * Protokół wikilinków i adresowanie stron (ADR 0002, ADR 0003).
 *
 * Składnia: `[[slug]]` albo `[[slug|etykieta]]`.
 * Link wskazuje slug strony (nigdy tytuł). Moduł jest czysty (bez DOM i fs),
 * więc działa identycznie podczas budowania, w testach i w przeglądarce.
 */

export const WIKILINK_RE = /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;

/** Zwraca wszystkie wikilinki z tekstu jako `[{ slug, etykieta, indeks }]`. */
export function parseWikilinks(text) {
  return [...String(text).matchAll(WIKILINK_RE)].map((m) => ({
    slug: m[1].trim(),
    etykieta: m[2] ? m[2].trim() : null,
    indeks: m.index,
  }));
}

/** Slug: małe litery ASCII, cyfry, myślniki (transliteracja polskich znaków). */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const TRANSLIT = {
  ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z',
  Ą: 'a', Ć: 'c', Ę: 'e', Ł: 'l', Ń: 'n', Ó: 'o', Ś: 's', Ź: 'z', Ż: 'z',
};

export function slugify(tytul) {
  return String(tytul)
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (ch) => TRANSLIT[ch] ?? ch)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Segmenty tras kart szczegółowych (typ → trasa). */
export const TRASY = {
  rozdzial: 'rozdzial',
  epizod: 'epizod',
  scena: 'scena',
  watek: 'watek',
  postac: 'postac',
  organizacja: 'organizacja',
  dzielnica: 'dzielnica',
  miejsce: 'miejsce',
  pojecie: 'pojecie',
  kontekst: 'kontekst',
};

/** Segmenty tras list dla każdego typu strony. */
export const LISTY = {
  rozdzial: 'rozdzialy',
  epizod: 'epizody',
  scena: 'sceny',
  watek: 'watki',
  postac: 'postacie',
  organizacja: 'organizacje',
  dzielnica: 'dzielnice',
  miejsce: 'miejsca',
  pojecie: 'pojecia',
  kontekst: 'konteksty',
};

/** Adres karty szczegółowej encji lub sceny. */
export function hrefDlaSlug(slug, typ) {
  const trasa = TRASY[typ];
  return trasa ? `#/${trasa}/${slug}` : `#/${slug}`;
}

/** Adres widoku listy dla typu strony. */
export function hrefListy(typ) {
  const lista = LISTY[typ];
  return lista ? `#/${lista}` : '#/';
}

/** Adres widoku listy przefiltrowanej po polu i wartości. */
export function hrefFiltru(typ, pole, wartosc) {
  return `${hrefListy(typ)}?${pole}=${encodeURIComponent(wartosc)}`;
}

/** Adres konkretnego boksu lub hipotezy na karcie. */
export function hrefKotwicy(slug, typ, kotwica) {
  return `${hrefDlaSlug(slug, typ)}#${kotwica}`;
}
