/**
 * Router po hashu (ADR 0001): działa identycznie na GitHub Pages, lokalnym
 * serwerze oraz z pliku `file://` w trybie `--single`.
 *
 * Postać trasy: `#/<nazwa>[/<param>][?zapytanie]`.
 * Goła kotwica `#kotwica` jest skokiem w obrębie bieżącej strony i nigdy nie
 * uruchamia ponownego renderowania ani błędu „nie znaleziono” (ADR 0015).
 */

export const TRASY_ZNANE = [
  'glowna',
  'chronologia',
  'rozdzialy', 'rozdzial',
  'epizody', 'epizod',
  'sceny', 'scena',
  'watki', 'watek',
  'postacie', 'postac',
  'organizacje', 'organizacja',
  'dzielnice', 'dzielnica',
  'miejsca', 'miejsce',
  'pojecia', 'pojecie',
  'konteksty', 'kontekst',
  'hipotezy',
  'tagi', 'tag',
  'szukaj',
  'co-nowego',
  'o-bazie',
];

export function czyKotwicaWewnetrzna(hash) {
  const surowy = String(hash ?? '').replace(/^#/, '');
  return surowy !== '' && !surowy.startsWith('/') && !surowy.startsWith('!');
}

export function parsujHash(hash) {
  if (czyKotwicaWewnetrzna(hash)) {
    const cel = decodeURIComponent(String(hash).replace(/^#/, ''));
    return { nazwa: 'kotwica', param: cel, query: {} };
  }

  const surowyPelny = String(hash ?? '').replace(/^#/, '');
  const indeksKotwicy = surowyPelny.indexOf('#');
  const surowy = indeksKotwicy === -1 ? surowyPelny : surowyPelny.slice(0, indeksKotwicy);
  const kotwica = indeksKotwicy === -1 ? null : decodeURIComponent(surowyPelny.slice(indeksKotwicy + 1));
  const [sciezka, zapytanie] = surowy.split('?');
  const segmenty = sciezka
    .split('/')
    .filter((s) => s !== '')
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    });

  const query = {};
  if (zapytanie) {
    for (const [k, v] of new URLSearchParams(zapytanie).entries()) query[k] = v;
  }

  if (segmenty.length === 0) return { nazwa: 'glowna', param: null, query, kotwica };
  const [nazwa, ...reszta] = segmenty;
  const param = reszta.length > 0 ? reszta.join('/') : null;
  if (!TRASY_ZNANE.includes(nazwa)) return { nazwa: 'nieznana', param, query, kotwica };
  return { nazwa, param, query, kotwica };
}

export function aktualnaTrasa() {
  const hash = globalThis.location?.hash ?? '';
  return parsujHash(hash);
}

export function uruchomRouter(obejrz) {
  const zmiana = () => {
    if (czyKotwicaWewnetrzna(globalThis.location?.hash)) {
      const cel = globalThis.document?.getElementById(
        decodeURIComponent(String(globalThis.location.hash).slice(1)),
      );
      cel?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      return;
    }
    try {
      const wynik = obejrz(aktualnaTrasa());
      if (wynik && typeof wynik.catch === 'function') {
        wynik.catch((blad) => globalThis.console?.error?.('render:', blad));
      }
    } catch (blad) {
      globalThis.console?.error?.('render:', blad);
    }
  };
  globalThis.addEventListener?.('hashchange', zmiana);
  zmiana();
  return () => globalThis.removeEventListener?.('hashchange', zmiana);
}

export function idz(hash) {
  if (!globalThis.location) return;
  if (czyKotwicaWewnetrzna(hash)) {
    const czysty = String(hash).replace(/^#/, '');
    const cel = globalThis.document?.getElementById(decodeURIComponent(czysty));
    cel?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    return;
  }
  globalThis.location.hash = hash;
}
