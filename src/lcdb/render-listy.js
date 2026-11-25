/**
 * Widoki list działów (`#/postacie`, `#/frakcje`, …), interpretacji (`#/hipotezy`) i motywów (`#/tagi`).
 */

import { escapeHtml, badgePewnosci, PROGI_PEWNOSCI } from './markdown.js';
import { hrefDlaSlug, hrefListy, hrefKotwicy } from './links.js';
import { dajDane, stronyTypu, wszystkieHipotezy, progiHipotez } from './data.js';
import {
  naglowekStrony, okruszki, stanPusty, nazwaTypu, nazwaRodzaju, odmiana, NAZWY_TYPU, chipTypu,
} from './render.js';

const OPISY_LIST = {
  rozdzial: 'Pieśni, interludia i krótkie opowieści z podróży przez Miasto.',
  epizod: 'Zamknięte etapy i przystanki kolejnych rozdziałów.',
  scena: 'Wszystkie opowiedziane dotąd sceny w porządku wydarzeń.',
  watek: 'Pytania, obietnice i tajemnice biegnące przez opowieść.',
  postac: 'Grzesznicy, przewodnicy, Fixerzy i mieszkańcy Miasta.',
  frakcja: 'Skrzydła Miasta, stowarzyszenia Fixerów, biura, warsztaty i syndykaty.',
  dzielnica: 'Dzielnice Miasta, Gniazda, Zaułki, Obrzeża i Ruiny.',
  miejsce: 'Konkretne miejsca odwiedzone lub wspomniane po drodze.',
  kontekst: 'Literackie, mitologiczne i filozoficzne echa słyszalne w historii.',
  pojecie: 'Zjawiska, anomalie, osobliwości i pojęcia świata przedstawionego.',
};

const POLA_FILTRU = {
  epizod: [{ pole: 'rozdzial', etykieta: 'Rozdział', zEncji: true }, { pole: 'rodzaj', etykieta: 'Rodzaj' }],
  scena: [{ pole: 'epizod', etykieta: 'Epizod', zEncji: true }],
  watek: [{ pole: 'rodzaj_watku', etykieta: 'Charakter' }, { pole: 'stan', etykieta: 'Stan' }],
  postac: [{ pole: 'rola', etykieta: 'Rola' }, { pole: 'frakcja', etykieta: 'Frakcja', zEncji: true }],
  frakcja: [{ pole: 'rodzaj', etykieta: 'Rodzaj' }, { pole: 'dzielnica', etykieta: 'Dzielnica', zEncji: true }],
  dzielnica: [{ pole: 'rodzaj', etykieta: 'Skala' }],
  miejsce: [{ pole: 'dzielnica', etykieta: 'Dzielnica', zEncji: true }, { pole: 'frakcja', etykieta: 'Frakcja', zEncji: true }],
  kontekst: [{ pole: 'rodzaj', etykieta: 'Rodzaj dzieła' }],
  pojecie: [{ pole: 'rodzaj', etykieta: 'Kategoria' }],
};

function sortujListe(typ, elementy) {
  return [...elementy].sort((a, b) => {
    if (typ === 'scena') return (a.kolejnosc ?? 0) - (b.kolejnosc ?? 0);
    if (typ === 'rozdzial') return (a.numer ?? 0) - (b.numer ?? 0);
    if (typ === 'epizod') {
      const rA = dajDane().strony[a.rozdzial]?.numer ?? 0;
      const rB = dajDane().strony[b.rozdzial]?.numer ?? 0;
      return rA - rB || (a.kolejnosc ?? 0) - (b.kolejnosc ?? 0);
    }
    if (typ === 'postac' && (a.numer_grzesznika !== undefined || b.numer_grzesznika !== undefined)) {
      const nA = a.numer_grzesznika ?? 999;
      const nB = b.numer_grzesznika ?? 999;
      if (nA !== nB) return nA - nB;
    }
    if (typ === 'dzielnica' && (a.numer_dzielnicy !== undefined || b.numer_dzielnicy !== undefined)) {
      const nA = a.numer_dzielnicy ?? 999;
      const nB = b.numer_dzielnicy ?? 999;
      if (nA !== nB) return nA - nB;
    }
    return String(a.tytul).localeCompare(String(b.tytul), 'pl');
  });
}

function pasekFiltrow(typ, wszystkie, zapytanie) {
  const definicje = POLA_FILTRU[typ] ?? [];
  if (definicje.length === 0 || wszystkie.length < 2) return '';
  const dane = dajDane();
  const grupyHtml = [];

  for (const { pole, etykieta, zEncji } of definicje) {
    const wartosci = [...new Set(wszystkie.map((s) => s[pole]).filter(Boolean))];
    if (wartosci.length < 2) continue;
    const aktywna = zapytanie[pole] ?? '';
    const linkWszystkie = hrefListy(typ);
    const przyciski = [
      `<a class="filtr-przycisk${aktywna === '' ? ' aktywny' : ''}" href="${linkWszystkie}">wszystkie</a>`,
      ...wartosci.map((w) => {
        const podpis = zEncji ? (dane.strony[w]?.tytul ?? w) : nazwaRodzaju(w);
        const href = `${linkWszystkie}?${pole}=${encodeURIComponent(w)}`;
        return `<a class="filtr-przycisk${aktywna === String(w) ? ' aktywny' : ''}" href="${href}">${escapeHtml(podpis)}</a>`;
      }),
    ].join(' ');
    grupyHtml.push(`<div class="filtr-wiersz"><span class="filtr-etykieta">${escapeHtml(etykieta)}:</span> ${przyciski}</div>`);
  }
  return grupyHtml.length > 0 ? `<nav class="filtry" aria-label="Zawężanie listy">${grupyHtml.join('')}</nav>` : '';
}

function podtytulKarty(strona) {
  const dane = dajDane();
  const czesci = [];
  if (strona.numer_grzesznika !== undefined) czesci.push(`Grzesznik nr ${strona.numer_grzesznika}`);
  if (strona.rola) czesci.push(nazwaRodzaju(strona.rola));
  if (strona.rodzaj) czesci.push(nazwaRodzaju(strona.rodzaj));
  if (strona.rodzaj_watku) czesci.push(nazwaRodzaju(strona.rodzaj_watku));
  if (strona.stan) czesci.push(nazwaRodzaju(strona.stan));
  if (strona.skrot) czesci.push(strona.skrot);
  if (strona.numer_dzielnicy !== undefined) czesci.push(`Dzielnica ${strona.numer_dzielnicy}`);
  if (strona.frakcja && dane.strony[strona.frakcja]) czesci.push(dane.strony[strona.frakcja].tytul);
  if (strona.dzielnica && dane.strony[strona.dzielnica]) czesci.push(dane.strony[strona.dzielnica].tytul);
  if (strona.dzielo) czesci.push(strona.dzielo);
  if (strona.autor) czesci.push(strona.autor);
  if (strona.epizod && dane.strony[strona.epizod]) czesci.push(dane.strony[strona.epizod].tytul);
  if (strona.rozdzial && dane.strony[strona.rozdzial]) czesci.push(dane.strony[strona.rozdzial].tytul);
  return czesci.join(' · ');
}

export function renderLista(typ, zapytanie = {}) {
  const wszystkie = sortujListe(typ, stronyTypu(typ));
  const przefiltrowane = wszystkie.filter((s) => {
    for (const [k, v] of Object.entries(zapytanie)) {
      if (!v) continue;
      const wart = s[k];
      if (Array.isArray(wart)) {
        if (!wart.includes(v)) return false;
      } else if (String(wart ?? '') !== String(v)) {
        return false;
      }
    }
    return true;
  });

  const odm = NAZWY_TYPU[typ]?.o ?? ['pozycja', 'pozycje', 'pozycji'];
  const naglowek = naglowekStrony({
    tytul: nazwaTypu(typ, true),
    opis: OPISY_LIST[typ] ?? '',
    meta: `${przefiltrowane.length} ${odmiana(przefiltrowane.length, odm)}`,
    sciezka: okruszki([{ etykieta: nazwaTypu(typ, true) }]),
  });

  if (wszystkie.length === 0) {
    return `${naglowek}${stanPusty('Ten dział jest jeszcze pusty.', 'Wypełni się wraz z kolejnymi wydarzeniami opowieści.')}`;
  }

  const filtry = pasekFiltrow(typ, wszystkie, zapytanie);

  if (przefiltrowane.length === 0) {
    return `${naglowek}${filtry}${stanPusty('Nic nie pasuje do wybranego zawężenia.', `<a href="${hrefListy(typ)}">Pokaż wszystkie</a>`)}`;
  }

  const karty = `<ul class="siatka-kart">
    ${przefiltrowane.map((s) => {
      const meta = podtytulKarty(s);
      const opis = s.streszczenie || '';
      return `<li class="karta-encji boks">
        <div class="karta-naglowek">
          ${s.typ === 'scena' && s.numer_sceny ? `<span class="scena-nr">${escapeHtml(s.numer_sceny)}</span>` : ''}
          <a class="karta-tytul" href="${hrefDlaSlug(s.slug, s.typ)}">${escapeHtml(s.tytul)}</a>
        </div>
        ${meta ? `<p class="meta">${escapeHtml(meta)}</p>` : ''}
        ${opis ? `<p class="karta-opis">${escapeHtml(opis)}</p>` : ''}
      </li>`;
    }).join('\n    ')}
  </ul>`;

  return `${naglowek}${filtry}${karty}`;
}

export function renderHipotezy(zapytanie = {}) {
  const wszystkie = wszystkieHipotezy();
  const progi = progiHipotez();
  const progFiltr = zapytanie.prog ?? '';

  const przefiltrowane = wszystkie.filter((h) => {
    if (!progFiltr) return true;
    const prog = PROGI_PEWNOSCI.find((p) => h.pewnosc >= p.od);
    return prog?.id === progFiltr;
  });

  const naglowek = naglowekStrony({
    tytul: 'Interpretacje i przypuszczenia',
    opis: 'Próby odczytania niedopowiedzianych wątków, motywacji i symboli — oparte wyłącznie na tym, co już wybrzmiało, wraz z jawnym szacunkiem pewności.',
    meta: `${przefiltrowane.length} ${odmiana(przefiltrowane.length, ['interpretacja', 'interpretacje', 'interpretacji'])}`,
    sciezka: okruszki([{ etykieta: 'Interpretacje' }]),
  });

  const filtry = `<nav class="filtry" aria-label="Pewność interpretacji">
    <div class="filtr-wiersz">
      <span class="filtr-etykieta">Pewność:</span>
      <a class="filtr-przycisk${progFiltr === '' ? ' aktywny' : ''}" href="#/hipotezy">wszystkie (${wszystkie.length})</a>
      <a class="filtr-przycisk${progFiltr === 'wysoka' ? ' aktywny' : ''}" href="#/hipotezy?prog=wysoka">wysoka 80–100% (${progi.wysoka})</a>
      <a class="filtr-przycisk${progFiltr === 'srednia' ? ' aktywny' : ''}" href="#/hipotezy?prog=srednia">średnia 50–79% (${progi.srednia})</a>
      <a class="filtr-przycisk${progFiltr === 'niska' ? ' aktywny' : ''}" href="#/hipotezy?prog=niska">niska 1–49% (${progi.niska})</a>
    </div>
  </nav>`;

  if (przefiltrowane.length === 0) {
    return `${naglowek}${filtry}${stanPusty('Brak interpretacji w wybranym przedziale pewności.', '<a href="#/hipotezy">Pokaż wszystkie</a>')}`;
  }

  const lista = `<ul class="lista-hipotez">
    ${przefiltrowane.map((h) => `<li class="boks karta-hipotezy">
      <div class="hipoteza-wiersz">
        <a class="karta-tytul" href="${hrefKotwicy(h.slug, h.typ, h.kotwica)}">${escapeHtml(h.pytanie || h.sekcja)}</a>
        ${badgePewnosci(h.pewnosc)}
      </div>
      <p class="meta">${escapeHtml(nazwaTypu(h.typ))}: <a href="${hrefDlaSlug(h.slug, h.typ)}">${escapeHtml(h.tytulStrony)}</a> · sekcja „${escapeHtml(h.sekcja)}”</p>
    </li>`).join('\n    ')}
  </ul>`;

  return `${naglowek}${filtry}${lista}`;
}

export function renderTagi() {
  const tagi = dajDane().tagi ?? {};
  const klucze = Object.keys(tagi).sort((a, b) => (tagi[b].length - tagi[a].length) || a.localeCompare(b, 'pl'));
  const naglowek = naglowekStrony({
    tytul: 'Motywy przewodnie',
    opis: 'Powracające obrazy, tematy i tropy łączące sceny, postacie oraz literackie echa.',
    meta: `${klucze.length} ${odmiana(klucze.length, ['motyw', 'motywy', 'motywów'])}`,
    sciezka: okruszki([{ etykieta: 'Motywy' }]),
  });

  if (klucze.length === 0) {
    return `${naglowek}${stanPusty('Brak oznaczonych motywów.')}`;
  }

  return `${naglowek}<section class="boks"><ul class="chipy chipy-duze">
    ${klucze.map((t) => `<li><a class="chip chip-tag" href="#/tag/${encodeURIComponent(t)}">#${escapeHtml(t)} <span class="meta">(${tagi[t].length})</span></a></li>`).join('\n    ')}
  </ul></section>`;
}

export function renderTag(tag) {
  const dane = dajDane();
  const slugi = dane.tagi?.[tag] ?? [];
  const strony = slugi.map((s) => dane.strony[s]).filter(Boolean);
  const naglowek = naglowekStrony({
    tytul: `Motyw: #${tag}`,
    meta: `${strony.length} ${odmiana(strony.length, ['karta', 'karty', 'kart'])}`,
    sciezka: okruszki([{ etykieta: 'Motywy', href: '#/tagi' }, { etykieta: `#${tag}` }]),
  });

  if (strony.length === 0) {
    return `${naglowek}${stanPusty('Żadna karta nie nosi tego motywu.', '<a href="#/tagi">Wszystkie motywy</a>')}`;
  }

  return `${naglowek}<section class="boks"><ul class="chipy">
    ${strony.map((s) => `<li>${chipTypu(s.slug, s.typ, s.tytul)}</li>`).join('\n    ')}
  </ul></section>`;
}
