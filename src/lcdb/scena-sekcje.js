/**
 * Podział ciała karty na boksy `##` oraz kotwice między analizą a treścią sceny
 * (ADR 0005, ADR 0009, ADR 0015).
 *
 * Każdy boks dostaje stabilny identyfikator `boks-<slug>`, dzięki czemu spis
 * boksów w prawej kolumnie i kotwice w obrębie strony działają identycznie
 * podczas testów w Node oraz w przeglądarce.
 */

import { BLOK_OTWARCIA_RE } from './markdown.js';
import { slugify } from './links.js';

export const SEKCJE_SCENY = ['Treść sceny', 'Analiza', 'Nawiązania kulturowe', 'Wątki w scenie'];

/**
 * Dzieli ciało karty sceny na sekcje `##` wraz z otaczającym blokiem pochodzenia.
 * Nagłówki wewnątrz `:::zapis` są dosłownym zapisem rozgrywki i nie tworzą sekcji.
 */
export function podzielScene(body) {
  const sekcje = [];
  let otwarcie = null;
  let wZapisie = false;
  let biezaca = null;

  const zamknij = () => {
    if (!biezaca) return;
    biezaca.tresc = biezaca.linie.join('\n').replace(/^\n+|\n+$/g, '');
    delete biezaca.linie;
    sekcje.push(biezaca);
    biezaca = null;
  };

  for (const linia of String(body ?? '').split('\n')) {
    const t = linia.trim();

    if (/^:::/.test(t)) {
      wZapisie = !wZapisie;
      if (biezaca) biezaca.linie.push(linia);
      continue;
    }
    if (wZapisie) {
      if (biezaca) biezaca.linie.push(linia);
      continue;
    }

    if (BLOK_OTWARCIA_RE.test(t)) {
      otwarcie = t;
      if (biezaca) biezaca.warstwy += 1;
      continue;
    }
    if (t === '}}') {
      otwarcie = null;
      continue;
    }

    const h = linia.match(/^##\s+(.+?)\s*$/);
    if (h) {
      zamknij();
      biezaca = { tytul: h[1], otwarcie, warstwy: 0, linie: [] };
      continue;
    }
    if (biezaca) biezaca.linie.push(linia);
  }
  zamknij();
  return sekcje;
}

function naglowki(tresc) {
  const wynik = [];
  let wZapisie = false;
  for (const linia of String(tresc ?? '').split('\n')) {
    const t = linia.trim();
    if (/^:::/.test(t)) {
      wZapisie = !wZapisie;
      continue;
    }
    if (wZapisie) continue;
    const m = linia.match(/^(#{2,4})\s+(.+?)\s*$/);
    if (m) wynik.push({ poziom: m[1].length, tytul: m[2] });
  }
  return wynik;
}

/**
 * Dzieli ciało karty na boksy `##`, zachowując kolejne warstwy pochodzenia
 * wewnątrz każdego boksu oraz nadając boksowi unikalny identyfikator `boks-…`.
 */
export function podzielNaBoksy(body) {
  const boksy = [];
  const licznikId = new Map();
  let boks = null;
  let blok = null;
  let otwarcie = null;
  let wZapisie = false;

  const nadajIdBoksu = (tytul) => {
    const baza = `boks-${slugify(tytul || 'czesc') || 'czesc'}`;
    const ile = (licznikId.get(baza) ?? 0) + 1;
    licznikId.set(baza, ile);
    return ile === 1 ? baza : `${baza}-${ile}`;
  };

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

  for (const linia of String(body ?? '').split('\n')) {
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
      boks = { id: nadajIdBoksu(h[1]), tytul: h[1], bloki: [] };
      continue;
    }

    if (BLOK_OTWARCIA_RE.test(t)) {
      if (!boks) boks = { id: nadajIdBoksu(null), tytul: null, bloki: [] };
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

    if (blok) {
      blok.linie.push(linia);
    } else if (t !== '') {
      if (!boks) boks = { id: nadajIdBoksu(null), tytul: null, bloki: [] };
      blok = { otwarcie, linie: [linia] };
    }
  }
  zamknijBoks();
  return boksy;
}

/**
 * Planuje kotwice podsekcji sceny i sprawdza kompletność mapowania
 * `sekcje_analizy: ["Podsekcja analizy → Podsekcja treści"]`.
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

  const podsekcjeAnalizy = analiza ? naglowki(analiza.tresc).filter((n) => n.poziom === 3).map((n) => n.tytul) : [];
  const podsekcjeTresci = tresc ? naglowki(tresc.tresc).filter((n) => n.poziom === 3).map((n) => n.tytul) : [];

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
      const strzalka = '<span class="skok-do-tresci" aria-hidden="true">↦</span>';
      const href = `${hrefStrony}#${id}`;
      return {
        wewnetrzny: `<a class="skok-do-tresci" data-cel="${escapeText(id)}" href="${escapeText(href)}">${escapeText(tytul)}${strzalka}</a>`,
      };
    }
    return null;
  };
}

function escapeText(s) {
  return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
