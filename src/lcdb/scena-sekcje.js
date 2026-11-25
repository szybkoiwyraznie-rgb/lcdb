/**
 * Podział strony sceny oraz stron encji na boksy i warstwy pochodzenia (ADR 0005, 0009).
 *
 * Scena i encje mają ten sam model warstw: nagłówek `##` otwiera boks o jednym tytule,
 * a wewnątrz niego może stać wiele warstw o różnych pochodzeniach (`{{dostawa`, `{{opracowanie`,
 * `{{kwerenda`, `{{model`). Na scenie dodatkowo podsekcje `###` analizy wiążą się z miejscami
 * w treści sceny przez pole `sekcje_analizy`.
 */

import { nazwaBlokuOtwarcia } from './markdown.js';
import { slugify } from './links.js';

/** Tytuły głównych sekcji sceny w domyślnej kolejności czytania. */
export const SEKCJE_SCENY = ['Treść sceny', 'Analiza', 'Nawiązania literackie i kulturowe', 'Wątki w scenie'];

/**
 * Dzieli ciało strony na boksy `##`, a w każdym boksie zbiera listę warstw `bloki: [{ otwarcie, tresc }]`.
 * Nagłówki wewnątrz `:::zapis` są dosłownym cytatem i nie zaczynają nowego boksu.
 */
export function podzielNaBoksy(body) {
  const boksy = [];
  let boks = null;
  let blok = null;
  let otwarcie = null;
  let wZapisie = false;

  const zamknijBlok = () => {
    if (!blok) return;
    blok.tresc = blok.linie.join('\n').replace(/^\n+|\n+$/g, '');
    delete blok.linie;
    if (boks && blok.tresc !== '') boks.bloki.push(blok);
    blok = null;
  };

  const zamknijBoks = () => {
    zamknijBlok();
    if (!boks) return;
    if (boks.bloki.length > 0) {
      boks.warstwy = boks.bloki.length;
      boksy.push(boks);
    }
    boks = null;
  };

  for (const linia of String(body ?? '').replace(/\r\n/g, '\n').split('\n')) {
    const t = linia.trim();

    if (/^:::/.test(t)) {
      wZapisie = !wZapisie;
      if (blok) blok.linie.push(linia);
      continue;
    }
    if (wZapisie) {
      if (blok) blok.linie.push(linia);
      continue;
    }

    const h = linia.match(/^##\s+(.+?)\s*$/);
    if (h) {
      const otwarcieBiezace = otwarcie;
      zamknijBoks();
      otwarcie = otwarcieBiezace;
      boks = { tytul: h[1], bloki: [] };
      continue;
    }

    if (nazwaBlokuOtwarcia(t)) {
      if (!boks) boks = { tytul: null, bloki: [] };
      if (blok) zamknijBlok();
      otwarcie = t;
      blok = { otwarcie, linie: [] };
      continue;
    }
    if (t === '}}') {
      if (blok) zamknijBlok();
      otwarcie = null;
      continue;
    }

    if (blok) blok.linie.push(linia);
    else if (t !== '') {
      if (!boks) boks = { tytul: null, bloki: [] };
      blok = { otwarcie, linie: [linia] };
    }
  }
  zamknijBoks();
  return boksy;
}

/**
 * Dla sceny zwraca boksy w tej samej postaci wielowarstwowej (`bloki: [{ otwarcie, tresc }]`)
 * oraz łączną surową `tresc` warstw sekcji potrzebną do wyliczenia kotwic `###` (analiza ↔ treść).
 */
export function podzielScene(body) {
  return podzielNaBoksy(body)
    .filter((b) => b.tytul !== null)
    .map((b) => ({
      tytul: b.tytul,
      bloki: b.bloki,
      warstwy: b.bloki.length,
      tresc: b.bloki.map((bl) => bl.tresc).join('\n\n'),
    }));
}

function naglowkiSekcji(tresc) {
  const wynik = [];
  let wZapisie = false;
  for (const linia of String(tresc ?? '').split('\n')) {
    const t = linia.trim();
    if (/^:::/.test(t)) { wZapisie = !wZapisie; continue; }
    if (wZapisie) continue;
    const m = linia.match(/^(#{2,4})\s+(.+?)\s*$/);
    if (m) wynik.push({ poziom: m[1].length, tytul: m[2] });
  }
  return wynik;
}

/**
 * Plan kotwic podsekcji sceny i powiązań analiza ↔ treść (`sekcje_analizy`).
 */
export function zaplanujScene(sekcje, pary = []) {
  const problemy = [];
  const kotwice = new Map();
  const licznik = new Map();

  const kotwica = (tytul) => {
    const baza = slugify(tytul) || 'sekcja';
    const ile = (licznik.get(baza) ?? 0) + 1;
    licznik.set(baza, ile);
    return ile === 1 ? `sc-${baza}` : `sc-${baza}-${ile}`;
  };

  const analiza = sekcje.find((s) => s.tytul === 'Analiza');
  const tresc = sekcje.find((s) => s.tytul === 'Treść sceny');

  const podsekcjeAnalizy = analiza ? naglowkiSekcji(analiza.tresc).filter((n) => n.poziom === 3).map((n) => n.tytul) : [];
  const podsekcjeTresci = tresc ? naglowkiSekcji(tresc.tresc).filter((n) => n.poziom === 3).map((n) => n.tytul) : [];

  for (const tytul of podsekcjeTresci) kotwice.set(`tresc:${tytul}`, kotwica(tytul));

  const mapa = new Map();
  for (const para of pary ?? []) {
    const czesci = String(para).split('→').map((x) => x.trim());
    if (czesci.length !== 2 || !czesci[0] || !czesci[1]) {
      problemy.push(`sekcje_analizy: "${para}" nie jest parą "podsekcja analizy → podsekcja treści"`);
      continue;
    }
    const [z, na] = czesci;
    if (!podsekcjeAnalizy.includes(z)) problemy.push(`sekcje_analizy: "${z}" nie jest podsekcją analizy`);
    if (!podsekcjeTresci.includes(na)) problemy.push(`sekcje_analizy: "${na}" nie jest podsekcją treści`);
    mapa.set(z, na);
  }

  if (podsekcjeAnalizy.length > 0) {
    for (const z of podsekcjeAnalizy) {
      if (!mapa.has(z)) problemy.push(`sekcje_analizy: podsekcja analizy "${z}" nie ma pary → brak odsyłacza do treści`);
    }
  }

  return { problemy, kotwice, mapa, podsekcjeAnalizy, podsekcjeTresci };
}

export function kotwiceSekcji(tytulSekcji, plan, { hrefStrony, stan = {} } = {}) {
  return (poziom, tytul) => {
    if (poziom !== 3) return null;
    if (tytulSekcji === 'Treść sceny') {
      const id = plan.kotwice.get(`tresc:${tytul}`);
      if (!id || stan[id]) return null;
      stan[id] = true;
      return { id };
    }
    if (tytulSekcji === 'Analiza') {
      const cel = plan.mapa.get(tytul);
      if (!cel) return null;
      const id = plan.kotwice.get(`tresc:${cel}`);
      if (!id) return null;
      const strzalka = '<span class="skok-do-tresci-znak" aria-hidden="true">↦</span>';
      const href = `${hrefStrony}#${id}`;
      return {
        wewnetrzny: `<a class="skok-do-tresci" data-cel="${escapeAttr(id)}" href="${escapeAttr(href)}">${escapeAttr(tytul)}${strzalka}</a>`,
      };
    }
    return null;
  };
}

function escapeAttr(s) {
  return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}
