/**
 * Rejestr stron i walidacje schematów (ADR 0003, 0004, 0005, 0006, 0007, 0008, 0009, 0010).
 *
 * Czysty moduł (bez DOM/fs): używają go build (walidacja przed emisją artefaktu),
 * testy integralności i przeglądarka (backlinki, tagi, listy).
 */

import { SLUG_RE, hrefDlaSlug, slugify } from './links.js';
import {
  nazwaBlokuOtwarcia, parsujAtrybutyBloku, POCHODZENIA, RODZAJE_TRESCI,
  ZRODLO_RE, czyPewnosc,
} from './markdown.js';
import { czyPoprawnaData, czyPoprawnaDataCzas } from './czas.js';

/**
 * Dziesięć fabułocentrycznych typów stron świata Limbus Company (ADR 0004).
 * Katalog `content/<dział>` musi zgadzać się z typem (ADR 0003).
 */
export const TYPY_STRON = [
  'rozdzial', 'epizod', 'scena', 'watek',
  'postac', 'frakcja', 'dzielnica', 'miejsce',
  'kontekst', 'pojecie',
];

/** Rodzaj rozdziału w strukturze opowieści Limbus Company. */
export const RODZAJE_ROZDZIALU = ['prolog', 'canto', 'intervallo', 'opowiadanie', 'inne'];

/** Rodzaj epizodu — jak prowadzona jest dana część historii. */
export const RODZAJE_EPIZODU = ['glowny', 'poboczny', 'wspomnienie', 'lustro', 'obserwacja', 'spotkanie'];

/** Status rozdziału lub epizodu względem opowiedzianej dotąd historii. */
export const STATUSY = ['rozegrane', 'w-toku', 'nierozpoczete'];

/** Rodzaj wątku fabularnego. */
export const RODZAJE_WATKU = [
  'glowny', 'poboczny', 'osobisty', 'motyw', 'tajemnica', 'polityczny', 'egzystencjalny', 'inne',
];

/** Stan wątku. */
export const STANY_WATKU = ['otwarty', 'w-toku', 'zawieszony', 'zamkniety'];

/** Rola postaci w opowiedzianym materiale. */
export const ROLE_POSTACI = [
  'grzesznik', 'protagonista', 'przewodnik', 'sojusznik', 'antagonista', 'drugoplanowa', 'narrator', 'istota', 'inne',
];

/** Rodzaj frakcji / organizacji w Mieście. */
export const RODZAJE_FRAKCJI = [
  'skrzydlo', 'korporacja', 'stowarzyszenie', 'biuro', 'syndykat', 'wydzial', 'warsztat', 'ugrupowanie', 'rodzina', 'inne',
];

/** Skala geograficzna Miasta i jego pogranicza. */
export const RODZAJE_DZIELNICY = [
  'dzielnica', 'gniazdo', 'zaulki', 'obrzeza', 'ruiny', 'jezioro', 'obszar', 'inne',
];

/** Rodzaj kontekstu literackiego, kulturowego lub filozoficznego (ADR 0011). */
export const RODZAJE_KONTEKSTU = [
  'powiesc', 'opowiadanie', 'poemat', 'dramat', 'ksiega', 'mitologia', 'filozofia', 'religia', 'historia', 'gra', 'termin', 'inne',
];

/** Rodzaj pojęcia / zjawiska świata przedstawionego (ADR 0004, 0013). */
export const RODZAJE_POJECIA = [
  'anomalia', 'ego', 'osobliwosc', 'zjawisko', 'lustro', 'przedmiot', 'bron', 'wydarzenie', 'prawo', 'obyczaj', 'inne',
];

/** Minimalna liczba elementów (kwestii + akapitów narracji) w jednej scenie (ADR 0009). */
export const MIN_ELEMENTOW_SCENY = 4;

/** Pola wspólne dla wszystkich typów stron (`tytul_kr` = zapis koreański / hanja, `tytul_en` = oficjalny angielski). */
const WSPOLNE = ['typ', 'slug', 'tytul', 'tytul_kr', 'tytul_en', 'tagi', 'zrodla', 'utworzono', 'interpretacje'];

export const POLA_DOZWOLONE = {
  rozdzial: [
    ...WSPOLNE, 'numer', 'oznaczenie', 'rodzaj_rozdzialu', 'tytul_oboczny', 'czas_akcji',
    'epizody', 'watki', 'dzielnice', 'frakcje', 'postacie', 'status', 'nastepny',
  ],
  epizod: [
    ...WSPOLNE, 'rozdzial', 'kolejnosc', 'rodzaj', 'status', 'sceny',
    'postacie', 'dzielnice', 'frakcje', 'miejsca', 'watki', 'konteksty', 'pojecia',
  ],
  scena: [
    ...WSPOLNE, 'epizod', 'numer_sceny', 'kolejnosc', 'streszczenie', 'zapis',
    'postacie', 'dzielnice', 'miejsca', 'frakcje', 'watki', 'konteksty', 'pojecia', 'sekcje_analizy',
  ],
  watek: [
    ...WSPOLNE, 'rodzaj_watku', 'stan', 'postacie', 'sceny', 'rozdzialy', 'epizody',
    'frakcje', 'konteksty', 'pojecia',
  ],
  postac: [
    ...WSPOLNE, 'rola', 'numer_grzesznika', 'przydzial', 'pseudonim', 'pierwsze_wystapienie',
    'frakcja', 'dzielnica', 'frakcje', 'dzielnice', 'miejsca', 'watki', 'konteksty', 'pojecia',
  ],
  frakcja: [
    ...WSPOLNE, 'rodzaj', 'skrot', 'siedziba', 'dzielnica', 'dzielnice',
    'postacie', 'watki', 'konteksty', 'epizody', 'pojecia',
  ],
  dzielnica: [
    ...WSPOLNE, 'rodzaj', 'numer_dzielnicy', 'region', 'frakcja', 'rozdzial',
    'frakcje', 'postacie', 'miejsca', 'watki',
  ],
  miejsce: [
    ...WSPOLNE, 'rodzaj', 'dzielnica', 'frakcja', 'postacie', 'watki', 'konteksty', 'pojecia',
  ],
  kontekst: [
    ...WSPOLNE, 'rodzaj', 'dzielo', 'rok', 'autor', 'postacie', 'frakcje', 'miejsca', 'pojecia', 'watki',
  ],
  pojecie: [
    ...WSPOLNE, 'rodzaj', 'postacie', 'dzielnice', 'frakcje', 'miejsca', 'watki', 'konteksty',
  ],
};

/** Pola-relacje: nazwa → typ celu i kształt wartości (ADR 0010). */
export const POLA_RELACJI = {
  rozdzial: { typ: 'rozdzial', wiele: false },
  nastepny: { typ: 'rozdzial', wiele: false },
  epizod: { typ: 'epizod', wiele: false },
  dzielnica: { typ: 'dzielnica', wiele: false },
  frakcja: { typ: 'frakcja', wiele: false },
  siedziba: { typ: 'miejsce', wiele: false },
  pierwsze_wystapienie: { typ: 'scena', wiele: false },
  rozdzialy: { typ: 'rozdzial', wiele: true },
  epizody: { typ: 'epizod', wiele: true },
  sceny: { typ: 'scena', wiele: true },
  dzielnice: { typ: 'dzielnica', wiele: true },
  frakcje: { typ: 'frakcja', wiele: true },
  miejsca: { typ: 'miejsce', wiele: true },
  postacie: { typ: 'postac', wiele: true },
  watki: { typ: 'watek', wiele: true },
  konteksty: { typ: 'kontekst', wiele: true },
  pojecia: { typ: 'pojecie', wiele: true },
};

/** Sekcje wymagane w treści strony, zależnie od typu. */
export const SEKCJE_WYMAGANE = {
  rozdzial: ['Streszczenie'],
  epizod: ['Streszczenie'],
  scena: ['Treść sceny', 'Analiza'],
  watek: ['Opis'],
  postac: ['Opis'],
  frakcja: ['Opis'],
  dzielnica: ['Opis'],
  miejsce: ['Opis'],
  kontekst: ['Opis'],
  pojecie: ['Opis'],
};

/** Pola wpisu historii interpretacji (ADR 0007). */
export const POLA_INTERPRETACJI = [
  'data', 'zmiana', 'autor', 'dotyczy', 'fragment', 'poprzednio', 'pewnosc', 'pewnosc_poprzedniego',
];

/** Wyciąga tytuły sekcji h2 z ciała markdown (poza blokami surowymi). */
export function wytnijSekcje(body) {
  const tytuly = [];
  let wZapisie = false;
  for (const linia of String(body ?? '').split('\n')) {
    const t = linia.trim();
    if (/^:::/.test(t)) { wZapisie = !wZapisie; continue; }
    if (wZapisie) continue;
    const m = linia.match(/^##\s+(.+?)\s*$/);
    if (m) tytuly.push(m[1]);
  }
  return tytuly;
}

/** Bloki pochodzenia w ciele strony: `[{ pochodzenie, rodzaj, atrybuty, tresc }]`, pomijając bloki surowe. */
export function wytnijBloki(body) {
  const bloki = [];
  const linie = String(body ?? '').split(/\r\n?|\n/);
  let i = 0;
  let wZapisie = false;
  while (i < linie.length) {
    const t = linie[i].trim();
    if (!wZapisie && /^:::/.test(t)) { wZapisie = true; i += 1; continue; }
    if (wZapisie) {
      if (/^:::\s*$/.test(t)) wZapisie = false;
      i += 1;
      continue;
    }
    const m = nazwaBlokuOtwarcia(t);
    if (!m) { i += 1; continue; }
    const atrybuty = parsujAtrybutyBloku(m[2]);
    const pochodzenie = m[1];
    const rodzaj = atrybuty.get('rodzaj')
      ?? (pochodzenie === 'model' && atrybuty.has('pewnosc') ? 'interpretacja' : null);
    i += 1;
    const buf = [];
    while (i < linie.length && linie[i].trim() !== '}}') {
      buf.push(linie[i]);
      i += 1;
    }
    i += 1;
    bloki.push({ pochodzenie, rodzaj, atrybuty, tresc: buf.join('\n') });
  }
  return bloki;
}

/** Czy dany blok lub strona wskazuje udokumentowane źródło http(s) dla kwerendy. */
export function maBlokZrodla(tekst) {
  const s = String(tekst ?? '');
  for (const m of s.matchAll(ZRODLO_RE)) {
    const at = parsujAtrybutyBloku(m[1]);
    if (/^https?:\/\//.test(String(at.get('adres') ?? ''))) return true;
  }
  const sekcja = s.match(/^##\s+Źródła[ \t]*$([\s\S]*?)(?=^##\s|$(?![\s\S]))/m);
  return Boolean(sekcja && /https?:\/\//.test(sekcja[1]));
}

/** Wycina treść bloków `:::zapis … :::` (wszystkie bloki, w kolejności). */
export function wytnijBlokiZapisu(body) {
  const wynik = [];
  const linie = String(body ?? '').split('\n');
  let bufor = null;
  for (const linia of linie) {
    const t = linia.trim();
    if (bufor === null && /^:::/.test(t)) { bufor = []; continue; }
    if (bufor !== null) {
      if (/^:::\s*$/.test(t)) { wynik.push(bufor.join('\n')); bufor = null; continue; }
      bufor.push(linia);
    }
  }
  return wynik;
}

/** Normalizacja białych znaków do porównania wierności cytatu. */
export const normalizujTekst = (t) => String(t ?? '').replace(/\s+/g, ' ').trim();

/**
 * Kwestia dialogowa zapisu Limbus Company:
 * - `**Imię:** kwestia` lub `**Imię** (*Tytuł*): kwestia`
 * - mowa zegara Dantego `\<…>` lub `<…>` (z wyłączeniem komentarzy HTML `<!-- … -->`)
 * - nieoznaczona wypowiedź kończąca się znakiem `?`, `!` lub `…`.
 */
const KWESTIA_RE = /^\*\*[^*]+\*\*(?:\s*\([^)]*\))?\s*:|^\*\*[^*]+:\*\*|^\\?<(?!\!--)[^>]+>|^(?![#*\\<-])[^\s].*[?!…]["”']?$/;

/** Wiersze techniczne lub separatory wewnątrz `:::zapis`, których nie liczymy jako akapitów narracji. */
const POMIN_W_LICZNIKU_RE = /^(?:<!--[\s\S]*?-->|#{1,6}\s+|-{3,}$|\*{3,}$|_{3,}$|\*—\s.*\s—\*$)/;

/**
 * Elementy sceny: kwestie i akapity narracji.
 * Brama minimalnego rozmiaru sceny chroni przed jednozdaniowymi mikroscenami.
 */
export function policzElementySceny(body) {
  let kwestie = 0;
  let narracja = 0;
  for (const blok of wytnijBlokiZapisu(body)) {
    let wAkapicie = false;
    for (const linia of blok.split('\n')) {
      const t = linia.trim();
      if (t === '' || POMIN_W_LICZNIKU_RE.test(t)) { wAkapicie = false; continue; }
      if (KWESTIA_RE.test(t)) { kwestie += 1; wAkapicie = false; continue; }
      if (!wAkapicie) { narracja += 1; wAkapicie = true; }
    }
  }
  return { kwestie, narracja, razem: kwestie + narracja };
}

/** Waliduje jedną stronę; zwraca listę problemów (pusta = OK). */
export function walidujStrone(strona, ctx) {
  const p = [];
  const gdzie = strona?.slug ?? strona?.plik ?? '(bez sluga)';
  if (!strona || typeof strona !== 'object') return [`strona: brak obiektu (${gdzie})`];

  if (!TYPY_STRON.includes(strona.typ)) p.push(`${gdzie}: nieznany typ "${strona.typ}"`);
  if (!SLUG_RE.test(strona.slug ?? '')) p.push(`${gdzie}: slug "${strona.slug}" nie przechodzi wzorca ${SLUG_RE}`);
  if (typeof strona.tytul !== 'string' || strona.tytul.trim() === '') p.push(`${gdzie}: brak tytułu`);

  const dozwolone = POLA_DOZWOLONE[strona.typ];
  if (dozwolone) {
    for (const pole of Object.keys(strona)) {
      if (['plik', 'body', 'problem', 'surowy'].includes(pole)) continue;
      if (!dozwolone.includes(pole)) {
        p.push(`${gdzie}: pole "${pole}" nie należy do schematu typu "${strona.typ}" (dozwolone: ${dozwolone.join(', ')})`);
      }
    }
  }

  if (strona.utworzono !== undefined && !czyPoprawnaData(String(strona.utworzono))) {
    p.push(`${gdzie}: utworzono "${strona.utworzono}" nie jest poprawną datą RRRR-MM-DD`);
  }
  if (!Array.isArray(strona.tagi)) {
    if (strona.tagi !== undefined) p.push(`${gdzie}: tagi muszą być tablicą`);
  } else if (strona.tagi.some((t) => typeof t !== 'string' || !SLUG_RE.test(t))) {
    p.push(`${gdzie}: tagi muszą być slugami ASCII (małe litery, cyfry, myślniki)`);
  }

  for (const z of strona.zrodla ?? []) {
    if (typeof z !== 'string' || !/^https?:\/\//.test(z)) {
      p.push(`${gdzie}: źródło "${z}" nie jest adresem http(s)`);
    }
  }

  for (const [pole, { typ, wiele }] of Object.entries(POLA_RELACJI)) {
    const wartosc = strona[pole];
    if (wartosc === undefined || wartosc === null) continue;
    if (wiele && !Array.isArray(wartosc)) { p.push(`${gdzie}: "${pole}" musi być tablicą slugów`); continue; }
    if (!wiele && typeof wartosc !== 'string') { p.push(`${gdzie}: "${pole}" musi być pojedynczym slugiem`); continue; }
    for (const cel of wiele ? wartosc : [wartosc]) {
      const stronaCelu = ctx.bySlug.get(cel);
      if (!stronaCelu) p.push(`${gdzie}: "${pole}" → "${cel}" nie istnieje w kronice`);
      else if (stronaCelu.typ !== typ) p.push(`${gdzie}: "${pole}" → "${cel}" ma typ "${stronaCelu.typ}", oczekiwano "${typ}"`);
    }
    if (wiele && new Set(wartosc).size !== wartosc.length) {
      p.push(`${gdzie}: "${pole}" zawiera powtórzony slug`);
    }
  }

  for (const blok of wytnijBloki(strona.body ?? '')) {
    if (!POCHODZENIA.includes(blok.pochodzenie)) continue;
    if (blok.rodzaj && !RODZAJE_TRESCI.includes(blok.rodzaj)) continue;
    const pewnosc = blok.atrybuty.get('pewnosc');
    if (blok.rodzaj === 'interpretacja' && pewnosc === undefined) {
      p.push(`${gdzie}: interpretacja bez pewnosc= (ADR 0006)`);
    }
    if (pewnosc !== undefined && !czyPewnosc(pewnosc)) {
      p.push(`${gdzie}: pewność "${pewnosc}" poza zakresem 0–100`);
    }
    if (pewnosc !== undefined && blok.pochodzenie !== 'model') {
      p.push(`${gdzie}: atrybut pewnosc przysługuje tylko wiedzy modelu — {{${blok.pochodzenie}}} jest pewne z definicji`);
    }
    if (blok.pochodzenie === 'kwerenda' && !maBlokZrodla(blok.tresc)) {
      p.push(`${gdzie}: blok {{kwerenda}} bez dyrektywy {{zrodlo tytul="…" adres="https://…" data="RRRR-MM-DD"}}`);
    }
  }

  const sekcje = wytnijSekcje(strona.body ?? '');
  for (const s of SEKCJE_WYMAGANE[strona.typ] ?? []) {
    if (!sekcje.includes(s)) p.push(`${gdzie}: brak obowiązkowej sekcji "## ${s}"`);
  }

  p.push(...walidujInterpretacje(strona, sekcje));

  switch (strona.typ) {
    case 'rozdzial': {
      if (!Number.isInteger(strona.numer) || strona.numer < 1) {
        p.push(`${gdzie}: rozdział wymaga całkowitego "numer" ≥ 1`);
      }
      if (strona.rodzaj_rozdzialu !== undefined && !RODZAJE_ROZDZIALU.includes(strona.rodzaj_rozdzialu)) {
        p.push(`${gdzie}: rodzaj_rozdzialu "${strona.rodzaj_rozdzialu}" poza ${RODZAJE_ROZDZIALU.join('/')}`);
      }
      if (strona.status !== undefined && !STATUSY.includes(strona.status)) {
        p.push(`${gdzie}: status "${strona.status}" poza ${STATUSY.join('/')}`);
      }
      break;
    }
    case 'epizod': {
      if (typeof strona.rozdzial !== 'string' || strona.rozdzial === '') {
        p.push(`${gdzie}: epizod wymaga pola "rozdzial"`);
      }
      if (strona.rodzaj !== undefined && !RODZAJE_EPIZODU.includes(strona.rodzaj)) {
        p.push(`${gdzie}: rodzaj "${strona.rodzaj}" poza ${RODZAJE_EPIZODU.join('/')}`);
      }
      if (strona.status !== undefined && !STATUSY.includes(strona.status)) {
        p.push(`${gdzie}: status "${strona.status}" poza ${STATUSY.join('/')}`);
      }
      if (!Number.isInteger(strona.kolejnosc) || strona.kolejnosc < 1) {
        p.push(`${gdzie}: epizod wymaga całkowitego "kolejnosc" ≥ 1 (kolejność w rozdziale)`);
      }
      break;
    }
    case 'scena': {
      if (typeof strona.epizod !== 'string' || strona.epizod === '') {
        p.push(`${gdzie}: scena wymaga pola "epizod"`);
      }
      if (typeof strona.numer_sceny !== 'string' || strona.numer_sceny.trim() === '') {
        p.push(`${gdzie}: "numer_sceny" musi być niepustym tekstem`);
      }
      if (typeof strona.streszczenie !== 'string' || strona.streszczenie.trim() === '') {
        p.push(`${gdzie}: scena wymaga krótkiego "streszczenie"`);
      }
      if (!Number.isInteger(strona.kolejnosc) || strona.kolejnosc < 1) {
        p.push(`${gdzie}: scena wymaga całkowitego "kolejnosc" ≥ 1 (globalny porządek rozegrania — ADR 0008)`);
      }
      if (typeof strona.zapis !== 'string' || strona.zapis.trim() === '') {
        p.push(`${gdzie}: scena wymaga pola "zapis" ze ścieżką do pliku w rozgrywka/zapisy/ (ADR 0009)`);
      }
      if (strona.sekcje_analizy !== undefined && !Array.isArray(strona.sekcje_analizy)) {
        p.push(`${gdzie}: "sekcje_analizy" musi być tablicą par "podsekcja analizy → podsekcja treści"`);
      }
      const elem = policzElementySceny(strona.body ?? '');
      if (elem.razem > 0 && elem.razem < MIN_ELEMENTOW_SCENY) {
        p.push(`${gdzie}: scena ma tylko ${elem.razem} element(y) zapisu (minimum ${MIN_ELEMENTOW_SCENY} — połącz drobne urywki w jedno wydarzenie, ADR 0009)`);
      }
      break;
    }
    case 'watek': {
      if (strona.rodzaj_watku !== undefined && !RODZAJE_WATKU.includes(strona.rodzaj_watku)) {
        p.push(`${gdzie}: rodzaj_watku "${strona.rodzaj_watku}" poza ${RODZAJE_WATKU.join('/')}`);
      }
      if (strona.stan !== undefined && !STANY_WATKU.includes(strona.stan)) {
        p.push(`${gdzie}: stan "${strona.stan}" poza ${STANY_WATKU.join('/')}`);
      }
      break;
    }
    case 'postac': {
      if (strona.rola !== undefined && !ROLE_POSTACI.includes(strona.rola)) {
        p.push(`${gdzie}: rola "${strona.rola}" poza ${ROLE_POSTACI.join('/')}`);
      }
      if (strona.numer_grzesznika !== undefined
        && (!Number.isInteger(strona.numer_grzesznika) || strona.numer_grzesznika < 1 || strona.numer_grzesznika > 13)) {
        p.push(`${gdzie}: numer_grzesznika "${strona.numer_grzesznika}" musi być liczbą całkowitą 1–13`);
      }
      break;
    }
    case 'frakcja': {
      if (strona.rodzaj !== undefined && !RODZAJE_FRAKCJI.includes(strona.rodzaj)) {
        p.push(`${gdzie}: rodzaj "${strona.rodzaj}" poza ${RODZAJE_FRAKCJI.join('/')}`);
      }
      break;
    }
    case 'dzielnica': {
      if (strona.rodzaj !== undefined && !RODZAJE_DZIELNICY.includes(strona.rodzaj)) {
        p.push(`${gdzie}: rodzaj "${strona.rodzaj}" poza ${RODZAJE_DZIELNICY.join('/')}`);
      }
      if (strona.numer_dzielnicy !== undefined
        && (!Number.isInteger(strona.numer_dzielnicy) || strona.numer_dzielnicy < 1 || strona.numer_dzielnicy > 26)) {
        p.push(`${gdzie}: numer_dzielnicy "${strona.numer_dzielnicy}" musi być liczbą całkowitą 1–26`);
      }
      break;
    }
    case 'miejsce': {
      if (strona.rodzaj !== undefined && (typeof strona.rodzaj !== 'string' || strona.rodzaj.trim() === '')) {
        p.push(`${gdzie}: rodzaj miejsca musi być niepustym tekstem`);
      }
      break;
    }
    case 'kontekst': {
      if (strona.rodzaj !== undefined && !RODZAJE_KONTEKSTU.includes(strona.rodzaj)) {
        p.push(`${gdzie}: rodzaj "${strona.rodzaj}" poza ${RODZAJE_KONTEKSTU.join('/')}`);
      }
      break;
    }
    case 'pojecie': {
      if (strona.rodzaj !== undefined && !RODZAJE_POJECIA.includes(strona.rodzaj)) {
        p.push(`${gdzie}: rodzaj "${strona.rodzaj}" poza ${RODZAJE_POJECIA.join('/')}`);
      }
      break;
    }
    default:
      break;
  }

  return p;
}

/** Walidacja pola `interpretacje` (ADR 0007). */
export function walidujInterpretacje(strona, sekcje = null) {
  const wpisane = strona?.interpretacje;
  if (wpisane === undefined) return [];
  const gdzie = strona?.slug ?? strona?.plik ?? '(bez sluga)';
  if (!Array.isArray(wpisane)) return [`${gdzie}: "interpretacje" musi być listą obiektów (ADR 0007)`];

  const zbiorSekcji = new Set(sekcje ?? wytnijSekcje(strona.body ?? ''));
  const problemy = [];

  wpisane.forEach((wpis, idx) => {
    const nr = idx + 1;
    if (!wpis || typeof wpis !== 'object' || Array.isArray(wpis)) {
      problemy.push(`${gdzie}: wpis ${nr} w "interpretacje" musi być obiektem`);
      return;
    }
    for (const pole of Object.keys(wpis)) {
      if (!POLA_INTERPRETACJI.includes(pole)) {
        problemy.push(`${gdzie}: wpis ${nr} historii ma pole "${pole}" spoza schematu (${POLA_INTERPRETACJI.join(', ')})`);
      }
    }
    if (!czyPoprawnaDataCzas(String(wpis.data ?? ''))) {
      problemy.push(`${gdzie}: wpis ${nr} historii wymaga daty i godziny "data: RRRR-MM-DD GG:MM" (ADR 0007)`);
    }
    if (typeof wpis.zmiana !== 'string' || wpis.zmiana.trim() === '') {
      problemy.push(`${gdzie}: wpis ${nr} historii wymaga niepustego pola "zmiana"`);
    }
    if (wpis.poprzednio !== undefined) {
      if (typeof wpis.poprzednio !== 'string' || wpis.poprzednio.trim() === '') {
        problemy.push(`${gdzie}: wpis ${nr} historii ma puste "poprzednio" — usuń pole, jeśli nie było poprzedniej wersji`);
      }
      if (typeof wpis.fragment !== 'string' || wpis.fragment.trim() === '') {
        problemy.push(`${gdzie}: wpis ${nr} historii z "poprzednio" wymaga pola "fragment" (tytuł sekcji ##, w której się pokaże)`);
      } else if (!zbiorSekcji.has(wpis.fragment)) {
        problemy.push(`${gdzie}: wpis ${nr} historii wskazuje nieistniejącą sekcję "## ${wpis.fragment}"`);
      }
    }
    for (const pole of ['pewnosc', 'pewnosc_poprzedniego']) {
      if (wpis[pole] !== undefined && !czyPewnosc(wpis[pole])) {
        problemy.push(`${gdzie}: wpis ${nr} historii ma "${pole}" poza zakresem 0–100`);
      }
    }
  });

  return problemy;
}

/** Wierność zapisu sceny (ADR 0009): każdy blok `:::zapis` musi być dosłownym fragmentem archiwum rozgrywki. */
export function sprawdzWiernoscSceny(strona, tekstZapisu) {
  if (strona.typ !== 'scena') return [];
  const gdzie = strona.slug;
  if (tekstZapisu == null) return [`${gdzie}: brak archiwum zapisu, nie da się sprawdzić dosłowności sceny`];
  const bloki = wytnijBlokiZapisu(strona.body);
  if (bloki.length === 0) return [`${gdzie}: brak bloku :::zapis z treścią sceny`];
  const archiwum = normalizujTekst(tekstZapisu);
  const problemy = [];
  for (const [indeks, blok] of bloki.entries()) {
    const tresc = normalizujTekst(blok);
    if (tresc === '') { problemy.push(`${gdzie}: blok :::zapis ${indeks + 1} jest pusty`); continue; }
    if (!archiwum.includes(tresc)) {
      problemy.push(`${gdzie}: blok :::zapis ${indeks + 1} nie jest dosłownym fragmentem zapisu rozgrywki (przeredagowano lub pomylono wiersze)`);
    }
  }
  return problemy;
}

/**
 * Pokrycie archiwum zapisu przez bloki `:::zapis` scen (ADR 0009), liczone **wierszami**.
 *
 * Czytanki Limbus Company zapisują całe ciągi kwestii bez pustych linii między nimi, więc jeden
 * „akapit” archiwum potrafi obejmować kilka scen lub podsekcji. Dlatego sprawdzamy każdy niepusty
 * wiersz osobno: wiersz jest pokryty, jeśli (po normalizacji białych znaków) zawiera go któryś blok.
 * Pomijamy komentarze węzłów `<!-- … -->` i nagłówki `#`, które renderer i tak ukrywa lub zastępuje.
 * Zwraca listę niepokrytych wierszy w kolejności archiwum (pusta = komplet).
 */
export function niepokryteWierszeZapisu(tekstZapisu, bloki = []) {
  const uzyte = bloki.map(normalizujTekst).filter((b) => b !== '');
  return String(tekstZapisu ?? '')
    .split(/\r?\n/)
    .map(normalizujTekst)
    .filter((w) => w !== '' && !/^<!--[\s\S]*-->$/.test(w) && !/^#{1,6}\s/.test(w))
    .filter((w) => !uzyte.some((u) => u.includes(w)));
}

/** Brama twardej granicy fabuły (ADR 0008). */
export function sprawdzGraniceFabuly(sceny, postep) {
  const problemy = [];
  if (!postep || typeof postep !== 'object') {
    return ['rozgrywka/postep.json: brak pliku postępu — bez niego nie da się pilnować granicy fabuły'];
  }
  const ostatnia = postep.ostatnia_scena;
  if (typeof ostatnia !== 'string' || ostatnia === '') {
    return ['rozgrywka/postep.json: brak pola "ostatnia_scena"'];
  }
  const granica = sceny.find((s) => s.slug === ostatnia);
  if (!granica) return [`rozgrywka/postep.json: "ostatnia_scena" → "${ostatnia}" nie jest sceną w kronice`];

  for (const s of sceny) {
    if (typeof s.kolejnosc !== 'number') continue;
    if (s.kolejnosc > granica.kolejnosc) {
      problemy.push(`${s.slug}: scena leży za granicą rozegranej fabuły (kolejnosc ${s.kolejnosc} > ${granica.kolejnosc} przy "${ostatnia}") — to spoiler (ADR 0008)`);
    }
  }

  const kolejnosc = sceny.map((s) => s.kolejnosc).filter((n) => typeof n === 'number').sort((a, b) => a - b);
  const duplikaty = kolejnosc.filter((n, i) => i > 0 && n === kolejnosc[i - 1]);
  for (const d of new Set(duplikaty)) problemy.push(`kolejnosc ${d}: więcej niż jedna scena rości sobie to miejsce w fabule`);
  const maks = kolejnosc.at(-1) ?? 0;
  for (let n = 1; n <= maks; n += 1) {
    if (!kolejnosc.includes(n)) problemy.push(`kolejnosc ${n}: brak sceny — porządek rozegrania musi być ciągły od 1`);
  }

  return problemy;
}

/** Ciągłość numeracji epizodów w rozdziałach oraz samych rozdziałów. */
export function sprawdzPorzadekEpizodow(epizody, rozdzialy) {
  const problemy = [];
  const poRozdziale = new Map();
  for (const z of epizody) {
    if (!poRozdziale.has(z.rozdzial)) poRozdziale.set(z.rozdzial, []);
    poRozdziale.get(z.rozdzial).push(z);
  }
  for (const [slugRozdzialu, lista] of poRozdziale) {
    const numery = lista.map((z) => z.kolejnosc).sort((a, b) => a - b);
    const duplikaty = numery.filter((n, i) => i > 0 && n === numery[i - 1]);
    for (const d of new Set(duplikaty)) {
      problemy.push(`${slugRozdzialu}: powtórzony epizod o kolejnosc ${d}`);
    }
    for (let n = 1; n <= (numery.at(-1) ?? 0); n += 1) {
      if (!numery.includes(n)) problemy.push(`${slugRozdzialu}: brak epizodu o kolejnosc ${n} — numeracja w rozdziale musi być ciągła`);
    }
  }
  const numeryRozdzialow = rozdzialy.map((r) => r.numer).sort((a, b) => a - b);
  const duplikatyR = numeryRozdzialow.filter((n, i) => i > 0 && n === numeryRozdzialow[i - 1]);
  for (const d of new Set(duplikatyR)) {
    problemy.push(`rozdzial: powtórzony numer ${d}`);
  }
  for (let n = 1; n <= (numeryRozdzialow.at(-1) ?? 0); n += 1) {
    if (!numeryRozdzialow.includes(n)) problemy.push(`brak rozdziału o numerze ${n} — numeracja rozdziałów musi być ciągła`);
  }
  return problemy;
}

const porownajNumery = new Intl.Collator('pl', { numeric: true, sensitivity: 'base' }).compare;

export function sortujSceny(sceny) {
  return [...sceny].sort((a, b) => porownajNumery(String(a.numer_sceny ?? ''), String(b.numer_sceny ?? '')));
}

export function zbudujRejestr(strony) {
  const bySlug = new Map();
  const duplikaty = [];
  for (const s of strony) {
    if (bySlug.has(s.slug)) duplikaty.push(`${s.slug} (${bySlug.get(s.slug).plik} oraz ${s.plik})`);
    else bySlug.set(s.slug, s);
  }
  return { bySlug, duplikaty };
}

export function resolverLinkow(bySlug) {
  return (slug) => {
    const strona = bySlug.get(slug);
    if (!strona) return null;
    return { href: hrefDlaSlug(strona.slug, strona.typ), tytul: strona.tytul, typ: strona.typ };
  };
}

export function policzBacklinki(strony) {
  const backlinki = {};
  for (const s of strony) {
    for (const cel of s.linki ?? []) {
      if (!backlinki[cel]) backlinki[cel] = [];
      if (!backlinki[cel].some((x) => x.slug === s.slug)) backlinki[cel].push({ slug: s.slug, typ: s.typ });
    }
  }
  for (const k of Object.keys(backlinki)) backlinki[k].sort((a, b) => a.slug.localeCompare(b.slug, 'pl'));
  return backlinki;
}

export function policzTagi(strony) {
  const tagi = {};
  for (const s of strony) {
    for (const t of s.tagi ?? []) {
      if (!tagi[t]) tagi[t] = [];
      tagi[t].push(s.slug);
    }
  }
  for (const k of Object.keys(tagi)) tagi[k].sort();
  return tagi;
}

export function odsylaczeStrony(strona) {
  const zbior = new Set();
  for (const [pole, { wiele }] of Object.entries(POLA_RELACJI)) {
    const wartosc = strona[pole];
    if (wiele && Array.isArray(wartosc)) for (const cel of wartosc) zbior.add(cel);
    if (!wiele && typeof wartosc === 'string' && wartosc !== '') zbior.add(wartosc);
  }
  for (const cel of strona.linki ?? []) zbior.add(cel);
  zbior.delete(strona.slug);
  return [...zbior];
}

export function policzStatystyki(strony) {
  const s = {
    rozdzial: 0, epizod: 0, scena: 0, watek: 0, postac: 0, frakcja: 0,
    dzielnica: 0, miejsce: 0, kontekst: 0, pojecie: 0, powiazania: 0,
  };
  for (const p of strony) {
    if (Object.prototype.hasOwnProperty.call(s, p.typ)) s[p.typ] += 1;
    s.powiazania += odsylaczeStrony(p).length;
  }
  return s;
}

export { slugify };
