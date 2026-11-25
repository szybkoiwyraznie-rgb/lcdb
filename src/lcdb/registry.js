/**
 * Rejestr stron, słowniki domenowe, walidacja schematów i niezmienniki
 * fabularne kroniki Limbus Company (ADR 0003, ADR 0004, ADR 0007, ADR 0008,
 * ADR 0009, ADR 0010).
 *
 * Czysty moduł bez DOM i fs — działa w Node (budowanie i testy) oraz w przeglądarce.
 */

import { SLUG_RE, hrefDlaSlug, slugify } from './links.js';
import {
  BLOK_OTWARCIA_RE,
  parsujAtrybutyBloku,
  POCHODZENIA,
  RODZAJE_TRESCI,
  ZRODLO_RE,
  czyPewnosc,
} from './markdown.js';
import { czyPoprawnaData, czyPoprawnaDataCzas } from './czas.js';

/**
 * Dziesięć typów stron ułożonych w porządku opowieści, nie interfejsu gry:
 * najpierw struktura historii (rozdział, epizod, scena, wątek), potem osoby
 * i świat Miasta, na końcu konteksty literacko-kulturowe.
 */
export const TYPY_STRON = [
  'rozdzial',
  'epizod',
  'scena',
  'watek',
  'postac',
  'organizacja',
  'dzielnica',
  'miejsce',
  'pojecie',
  'kontekst',
];

export const KATALOGI = {
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

export const RODZAJE_ROZDZIALU = ['prolog', 'canto', 'intervallo', 'opowiesc'];

export const RODZAJE_EPIZODU = ['glowny', 'poboczny', 'spotkanie', 'zwiad', 'wspomnienie'];

export const STATUSY = ['rozegrane', 'w-toku', 'nierozpoczete'];

export const ROLE_POSTACI = [
  'protagonista',
  'grzesznik',
  'przewodnik',
  'sojusznik',
  'antagonista',
  'drugoplanowa',
  'narrator',
  'inne',
];

export const RODZAJE_ORGANIZACJI = [
  'korporacja',
  'zrzeszenie',
  'syndykat',
  'biuro',
  'oddzial',
  'ugrupowanie',
  'inne',
];

export const RODZAJE_DZIELNICY = [
  'dzielnica',
  'gniazdo',
  'zaulki',
  'obszar',
  'rubiez',
  'inne',
];

export const RODZAJE_POJECIA = [
  'istota',
  'zjawisko',
  'technologia',
  'przedmiot',
  'obyczaj',
  'wydarzenie',
  'lustro',
  'inne',
];

export const RODZAJE_WATKU = [
  'glowny',
  'poboczny',
  'motyw',
  'tajemnica',
  'przeszlosc',
  'polityczny',
  'egzystencjalny',
  'inne',
];

export const RODZAJE_KONTEKSTU = [
  'powiesc',
  'opowiadanie',
  'poemat',
  'dramat',
  'mit',
  'filozofia',
  'historia',
  'dzielo',
  'termin',
  'inne',
];

const WSPOLNE = [
  'typ',
  'slug',
  'tytul',
  'tytul_kr',
  'tytul_en',
  'streszczenie',
  'tagi',
  'zrodla',
  'utworzono',
  'interpretacje',
];

export const POLA_DOZWOLONE = {
  rozdzial: [
    ...WSPOLNE,
    'numer',
    'rodzaj_rozdzialu',
    'oznaczony',
    'tytul_oboczny',
    'grzesznik',
    'epizody',
    'watki',
    'dzielnice',
    'organizacje',
    'postacie',
    'status',
    'nastepny',
  ],
  epizod: [
    ...WSPOLNE,
    'rozdzial',
    'kolejnosc',
    'rodzaj',
    'status',
    'sceny',
    'postacie',
    'dzielnice',
    'organizacje',
    'miejsca',
    'watki',
    'konteksty',
  ],
  scena: [
    ...WSPOLNE,
    'epizod',
    'numer_sceny',
    'kolejnosc',
    'streszczenie',
    'zapis',
    'postacie',
    'dzielnice',
    'miejsca',
    'organizacje',
    'pojecia',
    'watki',
    'konteksty',
    'sekcje_analizy',
  ],
  watek: [
    ...WSPOLNE,
    'rodzaj_watku',
    'stan',
    'postacie',
    'sceny',
    'rozdzialy',
    'epizody',
    'organizacje',
    'pojecia',
    'konteksty',
  ],
  postac: [
    ...WSPOLNE,
    'rola',
    'numer_grzesznika',
    'pseudonim',
    'przydzial',
    'pierwsze_wystapienie',
    'organizacja',
    'dzielnica',
    'organizacje',
    'dzielnice',
    'miejsca',
    'watki',
    'konteksty',
    'pojecia',
  ],
  organizacja: [
    ...WSPOLNE,
    'rodzaj',
    'siedziba',
    'dzielnica',
    'dzielnice',
    'postacie',
    'watki',
    'pojecia',
    'konteksty',
    'epizody',
  ],
  dzielnica: [
    ...WSPOLNE,
    'rodzaj',
    'numer_dzielnicy',
    'region',
    'rozdzial',
    'organizacje',
    'postacie',
    'miejsca',
    'watki',
    'pojecia',
  ],
  miejsce: [
    ...WSPOLNE,
    'rodzaj',
    'dzielnica',
    'organizacja',
    'postacie',
    'pojecia',
    'konteksty',
    'watki',
  ],
  pojecie: [
    ...WSPOLNE,
    'rodzaj',
    'postacie',
    'dzielnice',
    'organizacje',
    'miejsca',
    'watki',
    'konteksty',
  ],
  kontekst: [
    ...WSPOLNE,
    'rodzaj',
    'dzielo',
    'rok',
    'autor',
    'postacie',
    'pojecia',
    'watki',
  ],
};

export const POLA_RELACJI = {
  rozdzial: { typ: 'rozdzial', wiele: false },
  rozdzialy: { typ: 'rozdzial', wiele: true },
  epizod: { typ: 'epizod', wiele: false },
  epizody: { typ: 'epizod', wiele: true },
  sceny: { typ: 'scena', wiele: true },
  dzielnice: { typ: 'dzielnica', wiele: true },
  organizacje: { typ: 'organizacja', wiele: true },
  miejsca: { typ: 'miejsce', wiele: true },
  postacie: { typ: 'postac', wiele: true },
  watki: { typ: 'watek', wiele: true },
  konteksty: { typ: 'kontekst', wiele: true },
  pojecia: { typ: 'pojecie', wiele: true },
  nastepny: { typ: 'rozdzial', wiele: false },
  pierwsze_wystapienie: { typ: 'scena', wiele: false },
  grzesznik: { typ: 'postac', wiele: false },
  organizacja: { typ: 'organizacja', wiele: false },
  dzielnica: { typ: 'dzielnica', wiele: false },
  siedziba: { typ: 'miejsce', wiele: false },
};

export const SEKCJE_WYMAGANE = {
  rozdzial: ['Streszczenie'],
  epizod: ['Streszczenie'],
  scena: ['Treść sceny', 'Analiza'],
  postac: ['Opis'],
  organizacja: ['Opis'],
  dzielnica: ['Opis'],
  miejsce: ['Opis'],
  pojecie: ['Opis'],
  kontekst: ['Opis'],
  watek: ['Opis'],
};

export const POLA_INTERPRETACJI = [
  'data',
  'zmiana',
  'autor',
  'dotyczy',
  'fragment',
  'poprzednio',
  'pewnosc',
  'pewnosc_poprzedniego',
];

export function wytnijSekcje(body) {
  const tytuly = [];
  let wZapisie = false;
  for (const linia of String(body ?? '').split('\n')) {
    const t = linia.trim();
    if (/^:::/.test(t)) {
      wZapisie = !wZapisie;
      continue;
    }
    if (wZapisie) continue;
    const m = linia.match(/^##\s+(.+?)\s*$/);
    if (m) tytuly.push(m[1]);
  }
  return tytuly;
}

export function wytnijBloki(body) {
  const bloki = [];
  let wZapisie = false;
  for (const linia of String(body ?? '').split('\n')) {
    const t = linia.trim();
    if (/^:::/.test(t)) {
      wZapisie = !wZapisie;
      continue;
    }
    if (wZapisie) continue;
    const m = t.match(BLOK_OTWARCIA_RE);
    if (m) {
      const atrybuty = parsujAtrybutyBloku(m[2]);
      const pochodzenie = m[1];
      const rodzaj = atrybuty.get('rodzaj')
        ?? (pochodzenie === 'model' && atrybuty.has('pewnosc') ? 'interpretacja' : null);
      bloki.push({ pochodzenie, rodzaj, atrybuty });
    }
  }
  return bloki;
}

export function maBlokZrodla(body) {
  const tekst = String(body ?? '');
  ZRODLO_RE.lastIndex = 0;
  if (ZRODLO_RE.test(tekst)) {
    ZRODLO_RE.lastIndex = 0;
    return true;
  }
  const sekcja = tekst.match(/^##\s+Źródła[ \t]*$([\s\S]*?)(?=^##\s|$(?![\s\S]))/m);
  return Boolean(sekcja && /https?:\/\//.test(sekcja[1]));
}

export function wytnijBlokiZapisu(body) {
  const wynik = [];
  const linie = String(body ?? '').split('\n');
  let bufor = null;
  for (const linia of linie) {
    const t = linia.trim();
    if (bufor === null && /^:::/.test(t)) {
      bufor = [];
      continue;
    }
    if (bufor !== null) {
      if (/^:::\s*$/.test(t)) {
        wynik.push(bufor.join('\n'));
        bufor = null;
        continue;
      }
      bufor.push(linia);
    }
  }
  return wynik;
}

export const normalizujTekst = (t) => String(t ?? '').replace(/\s+/g, ' ').trim();

/**
 * Kwestia dialogowa zapisu: `**Postać:** kwestia`, `[Dialog - Postać] kwestia`,
 * zegarowe wypowiedzi Dantego `<…>` albo wiersz kończący się `?`, `!` bądź `…`.
 */
const KWESTIA_RE = /^\*\*[^*]+\*\*\s*:|^\*\*[^*]+:\*\*|^\[Dialog\s*-|^<[^>]+>$|^[^\s#].*[?!…]$/;

export function policzElementySceny(body) {
  let kwestie = 0;
  let narracja = 0;
  for (const blok of wytnijBlokiZapisu(body)) {
    let wAkapicie = false;
    for (const linia of blok.split('\n')) {
      const t = linia.trim();
      if (t === '' || /^#{1,6}\s+/.test(t)) {
        wAkapicie = false;
        continue;
      }
      if (KWESTIA_RE.test(t)) {
        kwestie += 1;
        wAkapicie = false;
        continue;
      }
      if (!wAkapicie) {
        narracja += 1;
        wAkapicie = true;
      }
    }
  }
  return { kwestie, narracja, razem: kwestie + narracja };
}

export function walidujStrone(strona, ctx) {
  const p = [];
  const gdzie = strona?.slug ?? strona?.plik ?? '(bez sluga)';
  if (!strona || typeof strona !== 'object') return [`strona: brak obiektu (${gdzie})`];

  if (!TYPY_STRON.includes(strona.typ)) p.push(`${gdzie}: nieznany typ "${strona.typ}"`);
  if (!SLUG_RE.test(strona.slug ?? '')) p.push(`${gdzie}: slug "${strona.slug}" nie spełnia wzorca ${SLUG_RE}`);
  if (typeof strona.tytul !== 'string' || strona.tytul.trim() === '') p.push(`${gdzie}: brak tytułu`);

  const dozwolone = POLA_DOZWOLONE[strona.typ];
  if (dozwolone) {
    for (const pole of Object.keys(strona)) {
      if (['plik', 'body', 'problem', 'surowy', 'linki'].includes(pole)) continue;
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
    p.push(`${gdzie}: tagi muszą być slugami (małe litery ASCII, cyfry, myślniki)`);
  }

  for (const z of strona.zrodla ?? []) {
    if (typeof z !== 'string' || !/^https?:\/\//.test(z)) {
      p.push(`${gdzie}: źródło "${z}" w polu zrodla nie jest adresem http(s)`);
    }
  }

  for (const [pole, { typ, wiele }] of Object.entries(POLA_RELACJI)) {
    if (pole === strona.typ) continue;
    const wartosc = strona[pole];
    if (wartosc === undefined || wartosc === null) continue;
    if (wiele && !Array.isArray(wartosc)) {
      p.push(`${gdzie}: "${pole}" musi być tablicą slugów`);
      continue;
    }
    if (!wiele && typeof wartosc !== 'string') {
      p.push(`${gdzie}: "${pole}" musi być pojedynczym slugiem`);
      continue;
    }
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
      p.push(`${gdzie}: atrybut pewnosc przysługuje wyłącznie blokowi {{model}}`);
    }
    if (
      blok.pochodzenie === 'kwerenda' &&
      !(Array.isArray(strona.zrodla) && strona.zrodla.length > 0) &&
      !maBlokZrodla(strona.body)
    ) {
      p.push(`${gdzie}: blok kwerendy bez dowodu — dodaj dyrektywę {{zrodlo …}} wewnątrz bloku`);
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
        p.push(`${gdzie}: rozdział wymaga liczbowego "numer" >= 1`);
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
      if (!Number.isInteger(strona.kolejnosc) || strona.kolejnosc < 1) {
        p.push(`${gdzie}: epizod wymaga liczbowego "kolejnosc" >= 1`);
      }
      if (strona.status !== undefined && !STATUSY.includes(strona.status)) {
        p.push(`${gdzie}: status "${strona.status}" poza ${STATUSY.join('/')}`);
      }
      break;
    }
    case 'scena': {
      if (typeof strona.epizod !== 'string' || strona.epizod === '') {
        p.push(`${gdzie}: scena wymaga pola "epizod"`);
      }
      if (typeof strona.numer_sceny !== 'string' || strona.numer_sceny.trim() === '') {
        p.push(`${gdzie}: "numer_sceny" musi być niepustym napisem (np. "1-1")`);
      }
      if (typeof strona.streszczenie !== 'string' || strona.streszczenie.trim() === '') {
        p.push(`${gdzie}: scena wymaga niepustego pola "streszczenie"`);
      }
      if (typeof strona.zapis !== 'string' || strona.zapis.trim() === '') {
        p.push(`${gdzie}: scena wymaga pola "zapis" wskazującego plik w rozgrywka/zapisy/`);
      }
      if (!Number.isInteger(strona.kolejnosc) || strona.kolejnosc < 1) {
        p.push(`${gdzie}: scena wymaga liczbowego "kolejnosc" >= 1 (ADR 0008)`);
      }
      const elementy = policzElementySceny(strona.body ?? '');
      if (elementy.razem < 2) {
        p.push(`${gdzie}: scena ma ${elementy.razem} element(ów) — minimum to 2 kwestie lub narracje (ADR 0009)`);
      }
      if (wytnijBlokiZapisu(strona.body ?? '').length === 0) {
        p.push(`${gdzie}: scena bez bloku :::zapis — brakuje dosłownego tekstu rozgrywki`);
      }
      break;
    }
    case 'postac': {
      if (!strona.rola || !ROLE_POSTACI.includes(strona.rola)) {
        p.push(`${gdzie}: rola "${strona.rola ?? ''}" poza ${ROLE_POSTACI.join('/')}`);
      }
      if (strona.pseudonim !== undefined && strona.pseudonim === strona.tytul) {
        p.push(`${gdzie}: "pseudonim" powtarza tytuł — tytułem ma być imię lub miano postaci`);
      }
      if (strona.numer_grzesznika !== undefined && (!Number.isInteger(strona.numer_grzesznika) || strona.numer_grzesznika < 1)) {
        p.push(`${gdzie}: "numer_grzesznika" musi być liczbą całkowitą >= 1`);
      }
      break;
    }
    case 'organizacja': {
      if (!strona.rodzaj || !RODZAJE_ORGANIZACJI.includes(strona.rodzaj)) {
        p.push(`${gdzie}: rodzaj "${strona.rodzaj ?? ''}" poza ${RODZAJE_ORGANIZACJI.join('/')}`);
      }
      break;
    }
    case 'dzielnica': {
      if (!strona.rodzaj || !RODZAJE_DZIELNICY.includes(strona.rodzaj)) {
        p.push(`${gdzie}: rodzaj "${strona.rodzaj ?? ''}" poza ${RODZAJE_DZIELNICY.join('/')}`);
      }
      if (
        strona.numer_dzielnicy !== undefined &&
        (!Number.isInteger(strona.numer_dzielnicy) || strona.numer_dzielnicy < 1 || strona.numer_dzielnicy > 26)
      ) {
        p.push(`${gdzie}: "numer_dzielnicy" musi być liczbą całkowitą z zakresu 1–26`);
      }
      break;
    }
    case 'miejsce': {
      if (strona.rozdzial !== undefined) {
        p.push(`${gdzie}: miejsce leży w dzielnicy, nie w rozdziale — użyj pola "dzielnica"`);
      }
      break;
    }
    case 'pojecie': {
      if (!strona.rodzaj || !RODZAJE_POJECIA.includes(strona.rodzaj)) {
        p.push(`${gdzie}: rodzaj "${strona.rodzaj ?? ''}" poza ${RODZAJE_POJECIA.join('/')}`);
      }
      break;
    }
    case 'watek': {
      if (!strona.rodzaj_watku || !RODZAJE_WATKU.includes(strona.rodzaj_watku)) {
        p.push(`${gdzie}: rodzaj_watku "${strona.rodzaj_watku ?? ''}" poza ${RODZAJE_WATKU.join('/')}`);
      }
      break;
    }
    case 'kontekst': {
      if (!strona.rodzaj || !RODZAJE_KONTEKSTU.includes(strona.rodzaj)) {
        p.push(`${gdzie}: rodzaj "${strona.rodzaj ?? ''}" poza ${RODZAJE_KONTEKSTU.join('/')}`);
      }
      if (strona.rok !== undefined && !Number.isInteger(strona.rok)) {
        p.push(`${gdzie}: "rok" w kontekście musi być liczbą całkowitą`);
      }
      break;
    }
    default:
      break;
  }

  return p;
}

export function walidujInterpretacje(strona, sekcje = wytnijSekcje(strona?.body ?? '')) {
  const gdzie = strona?.slug ?? '(bez sluga)';
  const wpisy = strona?.interpretacje;
  if (wpisy === undefined) return [];
  if (!Array.isArray(wpisy)) return [`${gdzie}: "interpretacje" musi być listą wpisów`];

  const problemy = [];
  const zbiorSekcji = new Set(sekcje);

  wpisy.forEach((wpis, indeks) => {
    const nr = indeks + 1;
    if (!wpis || typeof wpis !== 'object' || Array.isArray(wpis)) {
      problemy.push(`${gdzie}: wpis ${nr} historii interpretacji nie jest obiektem`);
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
        problemy.push(`${gdzie}: wpis ${nr} historii z "poprzednio" wymaga pola "fragment" (tytuł sekcji ## …, w której się pokaże)`);
      } else if (!zbiorSekcji.has(wpis.fragment)) {
        problemy.push(`${gdzie}: wpis ${nr} historii wskazuje nieistniejącą sekcję "## ${wpis.fragment}"`);
      }
    } else if (wpis.fragment !== undefined && !zbiorSekcji.has(wpis.fragment)) {
      problemy.push(`${gdzie}: wpis ${nr} historii wskazuje nieistniejącą sekcję "## ${wpis.fragment}"`);
    }
    for (const pole of ['pewnosc', 'pewnosc_poprzedniego']) {
      if (wpis[pole] !== undefined && !czyPewnosc(wpis[pole])) {
        problemy.push(`${gdzie}: wpis ${nr} historii ma "${pole}" poza zakresem 0–100`);
      }
    }
  });

  return problemy;
}

export function sprawdzWiernoscSceny(strona, tekstZapisu) {
  if (strona.typ !== 'scena') return [];
  const gdzie = strona.slug;
  if (tekstZapisu == null) {
    return [`${gdzie}: brak archiwum zapisu, nie da się sprawdzić dosłowności sceny`];
  }
  const bloki = wytnijBlokiZapisu(strona.body);
  if (bloki.length === 0) return [`${gdzie}: brak bloku :::zapis z treścią sceny`];
  const archiwum = normalizujTekst(tekstZapisu);
  const problemy = [];
  for (const [indeks, blok] of bloki.entries()) {
    const tresc = normalizujTekst(blok);
    if (tresc === '') {
      problemy.push(`${gdzie}: blok :::zapis ${indeks + 1} jest pusty`);
      continue;
    }
    if (!archiwum.includes(tresc)) {
      problemy.push(`${gdzie}: blok :::zapis ${indeks + 1} nie jest dosłownym fragmentem zapisu rozgrywki (przeredagowano lub pomylono wiersze)`);
    }
  }
  return problemy;
}

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
  if (!granica) {
    return [`rozgrywka/postep.json: "ostatnia_scena" → "${ostatnia}" nie jest sceną w bazie`];
  }

  for (const s of sceny) {
    if (typeof s.kolejnosc !== 'number') continue;
    if (s.kolejnosc > granica.kolejnosc) {
      problemy.push(`${s.slug}: scena leży za granicą rozegranej fabuły (kolejnosc ${s.kolejnosc} > ${granica.kolejnosc} przy "${ostatnia}") — to spoiler (ADR 0008)`);
    }
  }

  const kolejnosc = sceny.map((s) => s.kolejnosc).filter((n) => typeof n === 'number').sort((a, b) => a - b);
  const duplikaty = kolejnosc.filter((n, i) => i > 0 && n === kolejnosc[i - 1]);
  for (const d of new Set(duplikaty)) {
    problemy.push(`kolejnosc ${d}: więcej niż jedna scena rości sobie to miejsce w fabule`);
  }
  const maks = kolejnosc.at(-1) ?? 0;
  for (let n = 1; n <= maks; n += 1) {
    if (!kolejnosc.includes(n)) {
      problemy.push(`kolejnosc ${n}: brak sceny — porządek rozegrania musi być ciągły od 1`);
    }
  }

  return problemy;
}

export function sprawdzPorzadekEpizodow(epizody, rozdzialy) {
  const problemy = [];
  const poRozdziale = new Map();
  for (const z of epizody) {
    if (!poRozdziale.has(z.rozdzial)) poRozdziale.set(z.rozdzial, []);
    poRozdziale.get(z.rozdzial).push(z);
  }
  for (const [slugRozdzialu, lista] of poRozdziale) {
    const numery = lista.map((z) => z.kolejnosc).sort((a, b) => a - b);
    for (let n = 1; n <= (numery.at(-1) ?? 0); n += 1) {
      if (!numery.includes(n)) {
        problemy.push(`${slugRozdzialu}: brak epizodu o kolejnosc ${n} — numeracja w rozdziale musi być ciągła`);
      }
    }
  }
  const numeryRozdzialow = rozdzialy.map((r) => r.numer).sort((a, b) => a - b);
  for (let n = 1; n <= (numeryRozdzialow.at(-1) ?? 0); n += 1) {
    if (!numeryRozdzialow.includes(n)) {
      problemy.push(`brak rozdziału o numerze ${n} — numeracja rozdziałów musi być ciągła`);
    }
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
    if (pole === strona.typ) continue;
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
    rozdzial: 0,
    epizod: 0,
    scena: 0,
    watek: 0,
    postac: 0,
    organizacja: 0,
    dzielnica: 0,
    miejsce: 0,
    pojecie: 0,
    kontekst: 0,
    powiazania: 0,
  };
  for (const p of strony) {
    if (Object.prototype.hasOwnProperty.call(s, p.typ)) s[p.typ] += 1;
    s.powiazania += odsylaczeStrony(p).length;
  }
  return s;
}

export { slugify };
