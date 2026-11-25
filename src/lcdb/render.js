/**
 * Wspólne elementy widoków: rama nawigacji, okruszki, układ 3:1, słowniki etykiet,
 * historia interpretacji oraz legenda kolorów pochodzenia.
 */

import { escapeHtml, badgePewnosci } from './markdown.js';
import { hrefDlaSlug } from './links.js';
import { czasBazy } from './data.js';

/** Główne pozycje nawigacji — kolejność odpowiada strukturze opowieści i świata Miasta (ADR 0004). */
export const MENU = [
  { href: '#/chronologia', etykieta: 'Chronologia', klucz: 'chronologia' },
  { href: '#/rozdzialy', etykieta: 'Rozdziały', klucz: 'rozdzial' },
  { href: '#/watki', etykieta: 'Wątki', klucz: 'watek' },
  { href: '#/postacie', etykieta: 'Postacie', klucz: 'postac' },
  { href: '#/frakcje', etykieta: 'Frakcje', klucz: 'frakcja' },
  { href: '#/dzielnice', etykieta: 'Dzielnice', klucz: 'dzielnica' },
  { href: '#/miejsca', etykieta: 'Miejsca', klucz: 'miejsce' },
  { href: '#/konteksty', etykieta: 'Konteksty', klucz: 'kontekst' },
  { href: '#/pojecia', etykieta: 'Pojęcia', klucz: 'pojecie' },
  { href: '#/hipotezy', etykieta: 'Interpretacje', klucz: 'hipotezy' },
];

export const NAZWY_TYPU = {
  rozdzial: { j: 'Rozdział', m: 'Rozdziały', o: ['rozdział', 'rozdziały', 'rozdziałów'] },
  epizod: { j: 'Epizod', m: 'Epizody', o: ['epizod', 'epizody', 'epizodów'] },
  scena: { j: 'Scena', m: 'Sceny', o: ['scena', 'sceny', 'scen'] },
  watek: { j: 'Wątek', m: 'Wątki', o: ['wątek', 'wątki', 'wątków'] },
  postac: { j: 'Postać', m: 'Postacie', o: ['postać', 'postacie', 'postaci'] },
  frakcja: { j: 'Frakcja', m: 'Frakcje', o: ['frakcja', 'frakcje', 'frakcji'] },
  dzielnica: { j: 'Dzielnica', m: 'Dzielnice', o: ['dzielnica', 'dzielnice', 'dzielnic'] },
  miejsce: { j: 'Miejsce', m: 'Miejsca', o: ['miejsce', 'miejsca', 'miejsc'] },
  kontekst: { j: 'Kontekst', m: 'Konteksty', o: ['kontekst', 'konteksty', 'kontekstów'] },
  pojecie: { j: 'Pojęcie', m: 'Pojęcia', o: ['pojęcie', 'pojęcia', 'pojęć'] },
};

export function nazwaTypu(typ, mnoga = false) {
  const n = NAZWY_TYPU[typ];
  if (!n) return typ;
  return mnoga ? n.m : n.j;
}

export function odmiana(liczba, [jedna, dwieCztery, piec]) {
  const n = Math.abs(Number(liczba));
  if (n === 1) return jedna;
  const r10 = n % 10;
  const r100 = n % 100;
  if (r10 >= 2 && r10 <= 4 && (r100 < 12 || r100 > 14)) return dwieCztery;
  return piec;
}

/** Przyjazne czytelnikowi etykiety wszystkich wartości słownikowych schematu. */
export const NAZWY_RODZAJU = {
  // rodzaj_rozdzialu
  prolog: 'prolog',
  canto: 'pieśń',
  intervallo: 'interludium',
  opowiadanie: 'krótka opowieść',
  // rodzaj epizodu
  glowny: 'wątek główny',
  poboczny: 'opowieść poboczna',
  wspomnienie: 'wspomnienie',
  lustro: 'świat lustrzany',
  obserwacja: 'zapis obserwacji',
  spotkanie: 'spotkanie',
  // rodzaj_watku i stan wątku
  osobisty: 'historia osobista',
  motyw: 'motyw',
  tajemnica: 'coś niedopowiedzianego',
  polityczny: 'polityka Miasta',
  egzystencjalny: 'pytanie o tożsamość',
  otwarty: 'wątek otwarty',
  'w-toku': 'w toku',
  zawieszony: 'wątek zawieszony',
  zamkniety: 'wątek domknięty',
  // status postępu
  rozegrane: 'opowiedziane',
  nierozpoczete: 'przed nami',
  // rola postaci
  grzesznik: 'Grzesznik',
  protagonista: 'główny bohater',
  przewodnik: 'przewodnik',
  sojusznik: 'towarzysz podróży',
  antagonista: 'przeciwnik',
  drugoplanowa: 'postać poboczna',
  narrator: 'narrator',
  istota: 'istota',
  // rodzaj frakcji
  skrzydlo: 'Skrzydło Miasta',
  korporacja: 'korporacja',
  stowarzyszenie: 'stowarzyszenie Fixerów',
  biuro: 'biuro Fixerów',
  syndykat: 'syndykat',
  wydzial: 'wydział',
  warsztat: 'warsztat',
  ugrupowanie: 'ugrupowanie',
  rodzina: 'ród',
  // rodzaj dzielnicy
  dzielnica: 'Dzielnica Miasta',
  gniazdo: 'Gniazdo',
  zaulki: 'Zaułki',
  obrzeza: 'Obrzeża',
  ruiny: 'Ruiny',
  jezioro: 'Wielkie Jezioro',
  obszar: 'obszar',
  // rodzaj kontekstu
  powiesc: 'powieść',
  poemat: 'poemat',
  dramat: 'dramat',
  ksiega: 'księga',
  mitologia: 'mitologia',
  filozofia: 'filozofia',
  religia: 'tradycja religijna',
  historia: 'historia',
  gra: 'wcześniejsze dzieło',
  termin: 'pojęcie literackie',
  // rodzaj pojęcia
  anomalia: 'anomalia',
  ego: 'E.G.O',
  osobliwosc: 'osobliwość',
  zjawisko: 'zjawisko',
  przedmiot: 'przedmiot',
  bron: 'oręż',
  wydarzenie: 'wydarzenie',
  prawo: 'prawo i tabu',
  obyczaj: 'obyczaj',
  inne: 'inne',
};

export function nazwaRodzaju(wartosc) {
  if (wartosc === undefined || wartosc === null || wartosc === '') return '';
  const tekst = String(wartosc);
  return NAZWY_RODZAJU[tekst] ?? tekst.replace(/_/g, ' ');
}

export function okruszki(elementy) {
  if (!elementy || elementy.length === 0) return '';
  const pozycje = [{ etykieta: 'Początek', href: '#/' }, ...elementy];
  return `<nav class="okruszki" aria-label="Ścieżka nawigacji">
  <ol>${pozycje.map((el, i) => {
    const ostatni = i === pozycje.length - 1;
    if (ostatni || !el.href) return `<li aria-current="page">${escapeHtml(el.etykieta)}</li>`;
    return `<li><a href="${el.href}">${escapeHtml(el.etykieta)}</a></li>`;
  }).join('')}</ol>
</nav>`;
}

export function ukladDwuKolumn(glownaHtml, bocznaHtml = '') {
  if (!bocznaHtml) return `<div class="kolumna-glowna">${glownaHtml}</div>`;
  return `<div class="uklad-strony">
  <div class="kolumna-glowna">${glownaHtml}</div>
  ${bocznaHtml}
</div>`;
}

export function kolumnaBoczna(grupy, etykietaAria = 'Powiązania', { spisBoksow = '' } = {}) {
  const wypelnione = (grupy ?? []).filter((g) => g && g.html);
  if (wypelnione.length === 0 && !spisBoksow) return '';
  const blokSpisu = spisBoksow
    ? `<section class="boczny-blok boczny-spis"><h3>Na tej stronie</h3>${spisBoksow}</section>`
    : '';
  return `<aside class="kolumna-boczna" aria-label="${escapeHtml(etykietaAria)}">
  ${blokSpisu}
  ${wypelnione.map((g) => `<section class="boczny-blok">
    <h3>${escapeHtml(g.tytul)}</h3>
    ${g.html}
  </section>`).join('\n  ')}
</aside>`;
}

export function naglowekStrony({ tytul, opis = '', meta = '', sciezka = null }) {
  return `<header class="naglowek-strony">
  <h1>${escapeHtml(tytul)}</h1>
  ${opis ? `<p class="wstep">${opis}</p>` : ''}
  ${meta ? `<p class="meta">${meta}</p>` : ''}
  ${sciezka ?? ''}
</header>`;
}

export function stanPusty(tekst, podpowiedz = '') {
  return `<div class="stan-pusty">
  <p>${escapeHtml(tekst)}</p>
  ${podpowiedz ? `<p class="meta">${podpowiedz}</p>` : ''}
</div>`;
}

export function nieZnalesc(czego) {
  return `<div class="naglowek-strony">
  <h1>Nie ma takiej karty</h1>
  <p class="wstep">W opowiedzianej dotąd historii nie ma miejsca o nazwie <span class="mono">${escapeHtml(czego ?? '')}</span>.</p>
  <p><a href="#/">Wróć na początek</a> · <a href="#/szukaj">Szukaj w kronice</a></p>
</div>`;
}

export function tytulStrony(tytul) {
  const d = globalThis.document;
  if (d) d.title = `${tytul} · Limbus Company — kronika opowieści`;
}

export function chip(slug, typ, etykieta) {
  return `<a class="chip" href="${hrefDlaSlug(slug, typ)}">${escapeHtml(etykieta)}</a>`;
}

export function chipTypu(slug, typ, etykieta, typEtykieta = nazwaTypu(typ)) {
  const prefiks = typEtykieta ? `<span class="chip-typ">${escapeHtml(typEtykieta)}</span>` : '';
  return `<a class="chip chip-${typ}" href="${hrefDlaSlug(slug, typ)}">${prefiks}${escapeHtml(etykieta)}</a>`;
}

/**
 * Zwraca zwijany blok „Poprzednia wersja” dla sekcji `## tytulSekcji`, jeśli strona
 * posiada wpisy w `interpretacje:` wskazujące ten `fragment` (ADR 0007).
 */
export function historiaInterpretacjiHtml(strona, tytulSekcji) {
  const wpisy = (strona?.interpretacje ?? []).filter(
    (w) => w && w.fragment === tytulSekcji && typeof w.poprzednio === 'string' && w.poprzednio.trim() !== '',
  );
  if (wpisy.length === 0) return '';

  const pozycje = wpisy.map((w) => {
    const pewnoscStara = w.pewnosc_poprzedniego !== undefined ? badgePewnosci(w.pewnosc_poprzedniego) : '';
    const akapity = w.poprzednio
      .split(/\n{2,}/)
      .map((a) => `<p>${escapeHtml(a.trim())}</p>`)
      .join('\n');
    return `<div class="rewizja-wpis">
      <p class="rewizja-meta"><span class="rewizja-data">${escapeHtml(w.data)}</span> · ${escapeHtml(w.zmiana)} ${pewnoscStara}</p>
      <blockquote class="rewizja-cytat">${akapity}</blockquote>
    </div>`;
  }).join('\n');

  const naglowek = wpisy.length === 1
    ? `Poprzednia wersja (${escapeHtml(wpisy[0].data)})`
    : `Wcześniejsze wersje (${wpisy.length})`;

  return `<details class="historia-interpretacji">
  <summary>${naglowek}</summary>
  <div class="historia-interpretacji-cialo">${pozycje}</div>
</details>`;
}

/** Legenda czterech kolorów pochodzenia i koloru interpretacji. */
export function legendaPoziomow() {
  return `<section class="boks legenda-poziomow" aria-label="Skąd pochodzą informacje">
  <h2>Skąd wiemy to, co czytamy</h2>
  <ul class="legenda-lista">
    <li class="poziom-dostawa"><span class="pochodzenie-etykieta pochodzenie-dostawa">z opowieści</span> Dosłowne słowa rozmów, narracji i zapisków obecnych w samej historii.</li>
    <li class="poziom-opracowanie"><span class="pochodzenie-etykieta pochodzenie-opracowanie">opracowanie</span> Zwięzłe podsumowanie i wnioski wynikające wprost z wydarzeń.</li>
    <li class="poziom-kwerenda"><span class="pochodzenie-etykieta pochodzenie-kwerenda">źródła sprawdzone</span> Kontekst literacki lub kulturowy potwierdzony wskazanym źródłem.</li>
    <li class="poziom-model"><span class="pochodzenie-etykieta pochodzenie-model">wiedza modelu</span> Ogólne tło literackie i filozoficzne bez zewnętrznego odsyłacza.</li>
    <li class="poziom-model rodzaj-interpretacja"><span class="pochodzenie-etykieta pochodzenie-model">wiedza modelu</span> <span class="pewnosc pewnosc-srednia">pewność %</span> Przypuszczenie i próba odczytania tego, czego historia jeszcze nie dopowiedziała.</li>
  </ul>
</section>`;
}

/** Stopka strony z dyskretnym znacznikiem ostatniej aktualizacji i linkami pomocniczymi. */
export function stopkaHtml() {
  const czas = czasBazy();
  return `<footer class="stopka-witryny">
  <div class="stopka-wewn">
    <span>Limbus Company — kronika opowieści · tylko to, co już wybrzmiało</span>
    <nav aria-label="Informacje o kronice">
      <a href="#/co-nowego">Ostatnio opowiedziane</a>
      <a href="#/tagi">Motywy</a>
      <a href="#/o-bazie">Jak czytać kronikę</a>
      ${czas ? `<span class="meta">aktualizacja ${escapeHtml(czas)}</span>` : ''}
    </nav>
  </div>
</footer>`;
}
