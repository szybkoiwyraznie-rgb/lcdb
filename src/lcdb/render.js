/**
 * Wspólne elementy interfejsu kroniki: rama nawigacyjna, okruszki, nagłówki
 * kart, słowniki nazw typów i rodzajów oraz odmiana liczebników.
 */

import { escapeHtml } from './markdown.js';
import { hrefDlaSlug } from './links.js';
import { NAZWA_BAZY, dajStrone } from './data.js';

export const MENU = [
  { id: 'rozdzialy', href: '#/rozdzialy', etykieta: 'Rozdziały' },
  { id: 'chronologia', href: '#/chronologia', etykieta: 'Chronologia' },
  { id: 'postacie', href: '#/postacie', etykieta: 'Postacie' },
  { id: 'watki', href: '#/watki', etykieta: 'Wątki' },
  { id: 'organizacje', href: '#/organizacje', etykieta: 'Organizacje' },
  { id: 'dzielnice', href: '#/dzielnice', etykieta: 'Dzielnice' },
  { id: 'miejsca', href: '#/miejsca', etykieta: 'Miejsca' },
  { id: 'pojecia', href: '#/pojecia', etykieta: 'Hasła' },
  { id: 'konteksty', href: '#/konteksty', etykieta: 'Konteksty' },
];

const NAZWY_TYPOW = {
  rozdzial: ['Rozdział', 'Rozdziały', ['rozdział', 'rozdziały', 'rozdziałów']],
  epizod: ['Epizod', 'Epizody', ['epizod', 'epizody', 'epizodów']],
  scena: ['Scena', 'Sceny', ['scena', 'sceny', 'scen']],
  watek: ['Wątek', 'Wątki', ['wątek', 'wątki', 'wątków']],
  postac: ['Postać', 'Postacie', ['postać', 'postacie', 'postaci']],
  organizacja: ['Organizacja', 'Organizacje', ['organizacja', 'organizacje', 'organizacji']],
  dzielnica: ['Dzielnica', 'Dzielnice', ['dzielnica', 'dzielnice', 'dzielnic']],
  miejsce: ['Miejsce', 'Miejsca', ['miejsce', 'miejsca', 'miejsc']],
  pojecie: ['Hasło', 'Hasła', ['hasło', 'hasła', 'haseł']],
  kontekst: ['Kontekst', 'Konteksty', ['kontekst', 'konteksty', 'kontekstów']],
};

const NAZWY_RODZAJOW = {
  // Rozdziały
  prolog: 'Prolog',
  canto: 'Pieśń (Canto)',
  intervallo: 'Intervallo',
  opowiesc: 'Opowieść',
  // Epizody i wątki
  glowny: 'Główny',
  poboczny: 'Poboczny',
  spotkanie: 'Spotkanie',
  zwiad: 'Zwiad',
  wspomnienie: 'Wspomnienie',
  motyw: 'Motyw',
  tajemnica: 'Tajemnica',
  przeszlosc: 'Przeszłość',
  polityczny: 'Polityczny',
  egzystencjalny: 'Egzystencjalny',
  // Postacie
  protagonista: 'Protagonista',
  grzesznik: 'Grzesznik',
  przewodnik: 'Przewodnik',
  sojusznik: 'Sojusznik',
  antagonista: 'Antagonista',
  drugoplanowa: 'Postać drugoplanowa',
  narrator: 'Narrator',
  // Organizacje Miasta
  korporacja: 'Skrzydło / Korporacja',
  zrzeszenie: 'Zrzeszenie',
  syndykat: 'Syndykat',
  biuro: 'Biuro',
  oddzial: 'Oddział',
  ugrupowanie: 'Ugrupowanie',
  // Dzielnice Miasta
  dzielnica: 'Dzielnica',
  gniazdo: 'Gniazdo',
  zaulki: 'Zaułki',
  obszar: 'Obszar',
  rubiez: 'Rubież',
  // Hasła świata
  istota: 'Istota / Abominacja',
  zjawisko: 'Zjawisko',
  technologia: 'Technologia / Osobliwość',
  przedmiot: 'Przedmiot',
  obyczaj: 'Obyczaj',
  wydarzenie: 'Wydarzenie',
  lustro: 'Świat Lustrzany',
  // Konteksty
  powiesc: 'Powieść',
  opowiadanie: 'Opowiadanie',
  poemat: 'Poemat',
  dramat: 'Dramat',
  mit: 'Mit',
  filozofia: 'Filozofia',
  historia: 'Historia',
  dzielo: 'Dzieło',
  termin: 'Pojęcie',
  inne: 'Inne',
  // Statusy
  rozegrane: 'Rozegrane',
  'w-toku': 'W toku',
  nierozpoczete: 'Nierozpoczęte',
};

export function odmiana(liczba, [jeden, dwaCztery, wiele]) {
  const n = Math.abs(Number(liczba) || 0);
  if (n === 1) return jeden;
  const dziesiatki = n % 100;
  const jednosci = n % 10;
  if (jednosci >= 2 && jednosci <= 4 && (dziesiatki < 12 || dziesiatki > 14)) return dwaCztery;
  return wiele;
}

export function nazwaTypu(typ, wariant = 'jeden') {
  const wpis = NAZWY_TYPOW[typ];
  if (!wpis) return typ ?? '';
  return wariant === 'wiele' ? wpis[1] : wpis[0];
}

export function nazwaTypuWMnogiej(liczba, typ) {
  const wpis = NAZWY_TYPOW[typ];
  if (!wpis) return `${liczba}`;
  return `${liczba} ${odmiana(liczba, wpis[2])}`;
}

export function nazwaRodzaju(kod) {
  if (!kod) return '';
  return NAZWY_RODZAJOW[kod] ?? kod;
}

export function formatujRok(rok) {
  if (!Number.isInteger(rok)) return '';
  return rok < 0 ? `${Math.abs(rok)} p.n.e.` : String(rok);
}

/** Zwraca obcojęzyczne miana (koreańskie / angielskie), jeśli podano je w karcie. */
export function tytulOryginalu(strona) {
  const czesci = [];
  if (strona?.tytul_kr) czesci.push(strona.tytul_kr);
  if (strona?.tytul_en && strona.tytul_en !== strona.tytul) czesci.push(strona.tytul_en);
  return czesci.join(' · ');
}

export function grupaLinkow(tytul, slugi, domyslnyTyp) {
  const obiekty = (Array.isArray(slugi) ? slugi : [])
    .map((s) => dajStrone(s))
    .filter(Boolean);
  if (obiekty.length === 0) return '';
  return `<div class="grupa-boczna">
    <h3>${escapeHtml(tytul)}</h3>
    <ul class="lista-zwarta">
      ${obiekty.map((o) => `<li><a href="${hrefDlaSlug(o.slug, o.typ ?? domyslnyTyp)}">${escapeHtml(o.tytul)}</a></li>`).join('')}
    </ul>
  </div>`;
}

export function grupaTagow(tagi) {
  if (!Array.isArray(tagi) || tagi.length === 0) return '';
  return `<div class="grupa-boczna">
    <h3>Motywy</h3>
    <div class="chmura-mala">
      ${tagi.map((t) => `<a class="chip chip-mala" href="#/tag/${encodeURIComponent(t)}">${escapeHtml(t)}</a>`).join('')}
    </div>
  </div>`;
}

export function okruszki(elementy) {
  const start = `<a href="#/">Kronika</a>`;
  const reszta = (elementy ?? []).map((el) => (
    el.href
      ? `<a href="${escapeHtml(el.href)}">${escapeHtml(el.etykieta)}</a>`
      : `<span aria-current="page">${escapeHtml(el.etykieta)}</span>`
  ));
  return `<nav class="okruszki" aria-label="Ścieżka nawigacji">${[start, ...reszta].join('<span class="sep" aria-hidden="true">/</span>')}</nav>`;
}

export function naglowekStrony({ tytul, podtytul = '', opis = '', meta = '', sciezka = '' }) {
  return `<header class="naglowek-strony">
    ${sciezka}
    <h1>${escapeHtml(tytul)}</h1>
    ${podtytul ? `<p class="podtytul">${escapeHtml(podtytul)}</p>` : ''}
    ${meta ? `<p class="meta">${escapeHtml(meta)}</p>` : ''}
    ${opis ? `<p class="wstep">${escapeHtml(opis)}</p>` : ''}
  </header>`;
}

export function stanPusty(tytul, dopisek = '') {
  return `<div class="stan-pusty">
    <p class="stan-pusty-tytul">${escapeHtml(tytul)}</p>
    ${dopisek ? `<p class="stan-pusty-opis">${dopisek}</p>` : ''}
  </div>`;
}

export function nieZnalesc(co = 'strona') {
  return `<div class="stan-pusty">
    <h1>Nie znaleziono</h1>
    <p>W kronice nie ma miejsca odpowiadającego adresowi <code>${escapeHtml(co)}</code>.</p>
    <p><a href="#/">Wróć na początek</a> albo przejdź do <a href="#/chronologia">chronologii zdarzeń</a>.</p>
  </div>`;
}

export function tytulStrony(czesc) {
  if (!globalThis.document) return;
  globalThis.document.title = czesc && czesc !== 'Kronika'
    ? `${czesc} — ${NAZWA_BAZY}`
    : NAZWA_BAZY;
}

export function rama(aktywna, _tytul, zawartosc, { szukaj = '', stopka = '' } = {}) {
  const linkiMenu = MENU.map((el) => {
    const czyAktywna = el.id === aktywna;
    return `<a href="${el.href}" class="menu-link${czyAktywna ? ' aktywny' : ''}"${czyAktywna ? ' aria-current="page"' : ''}>${escapeHtml(el.etykieta)}</a>`;
  }).join('');

  return `<header class="pasek-gorny">
    <div class="pasek-wnetrze">
      <a class="marka" href="#/">
        <span class="marka-znak" aria-hidden="true">XII</span>
        <span class="marka-tekst">Limbus Company</span>
      </a>
      <nav class="menu-glowne" aria-label="Działy kroniki">${linkiMenu}</nav>
      <form class="wyszukiwarka-pasek" role="search" onsubmit="return szukajZeStrony(this)">
        <input type="search" name="q" value="${escapeHtml(szukaj)}" placeholder="Szukaj w opowieści…" aria-label="Szukaj w opowieści">
      </form>
    </div>
  </header>
  <main class="tresc" id="tresc-glowna">${zawartosc}</main>
  <footer class="stopka">
    <div class="stopka-wnetrze">
      <div class="stopka-linki">
        <a href="#/co-nowego">Co nowego</a>
        <span aria-hidden="true">·</span>
        <a href="#/hipotezy">Interpretacje</a>
        <span aria-hidden="true">·</span>
        <a href="#/tagi">Motywy</a>
        <span aria-hidden="true">·</span>
        <a href="#/o-bazie">Jak czytać kronikę</a>
      </div>
      ${stopka}
    </div>
  </footer>`;
}
