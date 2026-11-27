/**
 * Parser markdownu z warstwami pochodzenia i blokami zapisu (ADR 0002, 0005, 0006).
 *
 * Jeden boks = sekcja `##` z tytułem nad warstwami.
 * W środku boksu leżą warstwy oznaczone pochodzeniem informacji:
 *   - {{dostawa}}                  — słowa wzięte wprost z opowieści (w tym :::zapis)
 *   - {{opracowanie}}              — streszczenie i wnioski wynikające wprost ze scen
 *   - {{kwerenda}}                 — twierdzenie potwierdzone źródłem zewnętrznym ({{zrodlo …}})
 *   - {{model}}                    — tło literackie i kulturowe z wiedzy modelu (bez pewności)
 *   - {{model pewnosc=NN pytanie="…"}} — interpretacja / hipoteza (pewność 0–100, kolor fioletowy)
 */

import { WIKILINK_RE } from './links.js';
import { czyPoprawnaData } from './czas.js';

/** Cztery pochodzenia informacji — jedyna oś koloru (ADR 0005). */
export const POCHODZENIA = ['dostawa', 'opracowanie', 'kwerenda', 'model'];

/** Pochodzenie, któremu wyłącznie przysługuje interpretacja i atrybut `pewnosc=`. */
export const POCHODZENIE_INTERPRETACJI = 'model';

/** Opcjonalny rodzaj warstwy wewnątrz boksu. */
export const RODZAJE_TRESCI = [
  'scena', 'streszczenie', 'wnioski', 'watek', 'swiat', 'kontekst', 'interpretacja', 'spis',
];

/** Dozwolone atrybuty otwarcia bloku `{{…}}`. */
export const ATRYBUTY_BLOKU = ['pewnosc', 'rodzaj', 'pytanie'];

/**
 * Dyrektywa źródła wewnątrz bloku kwerendy:
 *   {{zrodlo tytul="…" adres="https://…" data="RRRR-MM-DD"}}
 */
export const ZRODLO_RE = /\{\{zrodlo((?:\s+[A-Za-z][\w-]*=(?:"[^"]*"|[^\s}]+))*)\s*\}\}/g;

export const ATRYBUTY_ZRODLA = ['tytul', 'adres', 'data'];

/** Wycofane nazwy z wcześniejszych projektów — podpowiadają zamiennik zamiast ślepego błędu. */
export const POZIOMY_WYCOFANE = {
  skrypt: 'dostawa',
  menu: 'dostawa',
  streszczenie: 'opracowanie',
  zrodlo: 'kwerenda',
  wiedza: 'model',
  hipoteza: 'model',
  struktura: 'opracowanie',
  notatka: 'opracowanie',
  tekst: 'dostawa',
  zrodla: 'kwerenda',
  teoria: 'model',
  'dostawa/scena': 'dostawa',
  'dostawa/swiat': 'dostawa',
  'opracowanie/streszczenie': 'opracowanie',
  'opracowanie/spis': 'opracowanie',
  'kwerenda/kontekst': 'kwerenda',
  'model/kontekst': 'model',
  'opracowanie/interpretacja': 'model',
  'model/interpretacja': 'model',
};

export const RODZAJ_STAREJ_NAZWY = {
  skrypt: 'scena', menu: 'swiat', streszczenie: 'streszczenie', zrodlo: 'kontekst',
  wiedza: 'kontekst', hipoteza: 'interpretacja', struktura: 'spis', notatka: 'streszczenie',
  tekst: 'scena', zrodla: 'kontekst', teoria: 'interpretacja',
};

/** Progi etykiet pewności (ADR 0006). */
export const PROGI_PEWNOSCI = [
  { od: 80, id: 'wysoka', etykieta: 'wysoka' },
  { od: 50, id: 'srednia', etykieta: 'średnia' },
  { od: 0, id: 'niska', etykieta: 'niska' },
];

export function poziomPewnosci(wartosc) {
  const n = Number(wartosc);
  return PROGI_PEWNOSCI.find((p) => n >= p.od) ?? PROGI_PEWNOSCI.at(-1);
}

export function czyPewnosc(wartosc) {
  const n = Number(wartosc);
  return Number.isInteger(n) && n >= 0 && n <= 100;
}

export function badgePewnosci(wartosc) {
  if (wartosc === null || wartosc === undefined || wartosc === '') return '';
  if (!czyPewnosc(wartosc)) return '';
  const n = Number(wartosc);
  if (n === 0) return '';
  const prog = poziomPewnosci(n);
  return `<span class="pewnosc pewnosc-${prog.id}" data-pewnosc="${n}" title="Szacowana pewność: ${n}% (${prog.etykieta})">pewność ${n}%</span>`;
}

/** Otwarcie bloku poziomu: `{{pochodzenie` lub `{{pochodzenie pewnosc=… pytanie="…"`. */
export const BLOK_OTWARCIA_RE = /^\{\{([A-Za-z/]+)((?:\s+[A-Za-z][\w-]*=(?:"[^"]*"|[^\s}]+))*)\s*\}{0,2}\s*$/;

/** Czyści ewentualne domknięcie `}}` na końcu linii otwarcia typu `{{dostawa}}`? Uwaga: blok otwiera się linią bez treści i zamyka osobną linią `}}`. */
export function nazwaBlokuOtwarcia(linia) {
  const t = String(linia ?? '').trim();
  if (t === '}}') return null;
  // Dyrektywa inline {{zrodlo ...}} nie jest otwarciem bloku pochodzenia.
  if (/^\{\{zrodlo\b/.test(t)) return null;
  const m = t.match(/^\{\{([A-Za-z/]+)((?:\s+[A-Za-z][\w-]*=(?:"[^"]*"|[^\s}]+))*)\s*$/);
  return m;
}

export function parsujAtrybutyBloku(tekst) {
  const atrybuty = new Map();
  for (const m of String(tekst ?? '').matchAll(/([A-Za-z][\w-]*)=(?:"([^"]*)"|([^\s}]+))/g)) {
    atrybuty.set(m[1], m[2] ?? m[3]);
  }
  return atrybuty;
}

export function sekcjeBloku(tresc) {
  return [...String(tresc ?? '').matchAll(/^##\s+(.+?)\s*$/gm)].map((m) => m[1]);
}

export function renderMarkdown(md, {
  resolveLink, wymagajPoziomu = false, wPoziomie = null, wZagniezdzeniu = false,
  atrybutyNaglowka = null, zachowajLamania = false, kotwicaInterpretacji = null,
} = {}) {
  const linie = String(md).replace(/\r\n/g, '\n').split('\n');
  const out = [];
  const problemy = [];
  let i = 0;

  const dodaj = (html) => {
    if (wymagajPoziomu && wPoziomie === null) {
      problemy.push(`fragment treści bez pochodzenia — zaznacz blokiem {{${POCHODZENIA.join('|')}}}`);
    }
    out.push(html);
  };

  while (i < linie.length) {
    const linia = linie[i];

    if (linia.trim() === '') { i += 1; continue; }

    // Jednoliniowe błędne otwarcie z `}}` na tej samej linii zgłaszamy czytelnie, o ile to nie {{zrodlo}}.
    if (/^\{\{[A-Za-z]/.test(linia.trim()) && !/^\{\{zrodlo\b/.test(linia.trim()) && /\}\}\s*$/.test(linia.trim())) {
      problemy.push(`linia otwarcia "${linia.trim()}" nie może kończyć się "}}" — zamknij blok osobną linią "}}"`);
      i += 1;
      continue;
    }

    const otwarcie = nazwaBlokuOtwarcia(linia);
    if (otwarcie) {
      const pochodzenie = otwarcie[1];
      const atrybuty = parsujAtrybutyBloku(otwarcie[2]);
      const rodzajRaw = atrybuty.get('rodzaj');
      const rodzaj = rodzajRaw ?? (pochodzenie === POCHODZENIE_INTERPRETACJI && atrybuty.has('pewnosc')
        ? 'interpretacja' : null);
      i += 1;
      const buf = [];
      while (i < linie.length && linie[i].trim() !== '}}') { buf.push(linie[i]); i += 1; }
      if (i >= linie.length) problemy.push(`niezamknięty blok {{${pochodzenie}`);
      i += 1;

      const staryZapis = POZIOMY_WYCOFANE[pochodzenie];
      if (staryZapis) {
        const podpowiedzRodzaju = RODZAJ_STAREJ_NAZWY[pochodzenie];
        problemy.push(`zapis {{${pochodzenie}}} jest wycofany — użyj {{${staryZapis}}}`
          + (podpowiedzRodzaju ? ` (rodzaj dawnej nazwy: ${podpowiedzRodzaju})` : ''));
        continue;
      }
      if (!POCHODZENIA.includes(pochodzenie)) {
        problemy.push(`nieznane pochodzenie w bloku {{${pochodzenie}}: dozwolone ${POCHODZENIA.join(', ')}`);
        continue;
      }
      if (pochodzenie === POCHODZENIE_INTERPRETACJI && !atrybuty.has('pewnosc')
        && (atrybuty.has('pytanie') || rodzajRaw === 'interpretacja')) {
        problemy.push('tło kulturowe {{model}} nie jest przypuszczeniem — bez `pewnosc=` usuń '
          + `\`pytanie=\`${rodzajRaw ? '/`rodzaj=interpretacja`' : ''} albo podaj pewność`);
      }
      if (rodzajRaw !== undefined && !RODZAJE_TRESCI.includes(rodzajRaw)) {
        problemy.push(`nieznany rodzaj treści "${rodzajRaw}": dozwolone ${RODZAJE_TRESCI.join(', ')}`);
        continue;
      }
      if (wZagniezdzeniu) {
        problemy.push(`zagnieżdżony blok {{${pochodzenie}}} — kolorów nie zagnieżdżamy`);
        continue;
      }
      if (rodzaj === 'interpretacja' && pochodzenie !== POCHODZENIE_INTERPRETACJI) {
        problemy.push(`interpretacja jest wiedzą modelu — pisz {{model pewnosc=…}}, nie {{${pochodzenie}}}`);
        continue;
      }

      const pewnoscRaw = atrybuty.get('pewnosc');
      for (const klucz of atrybuty.keys()) {
        if (!ATRYBUTY_BLOKU.includes(klucz)) {
          problemy.push(`nieznany atrybut "${klucz}" w bloku {{${pochodzenie}}} — dozwolone: ${ATRYBUTY_BLOKU.join(', ')}`);
        }
      }
      if (atrybuty.has('pewnosc') && pochodzenie !== POCHODZENIE_INTERPRETACJI) {
        problemy.push(`atrybut pewnosc przysługuje tylko wiedzy modelu — {{${pochodzenie}}} jest pewne z definicji`);
      }
      if (atrybuty.has('pewnosc') && !czyPewnosc(pewnoscRaw)) {
        problemy.push(`pewność "${pewnoscRaw}" nie jest liczbą całkowitą 0–100`);
      }
      if (rodzaj === 'interpretacja' && !atrybuty.has('pewnosc')) {
        problemy.push('interpretacja wymaga atrybutu pewnosc=0–100 (ADR 0006)');
      }

      let trescBloku = buf.join('\n');

      const zrodla = [];
      if (pochodzenie === 'kwerenda') {
        trescBloku = trescBloku.replace(ZRODLO_RE, (_calosc, atrybutyTekst) => {
          const at = parsujAtrybutyBloku(atrybutyTekst);
          const brak = ATRYBUTY_ZRODLA.filter((k) => !String(at.get(k) ?? '').trim());
          if (brak.length) {
            problemy.push(`źródło bez ${brak.join(', ')} — źródło cytuje tytuł, adres i datę odczytu`);
            return '';
          }
          if (!/^https?:\/\//.test(at.get('adres'))) {
            problemy.push(`adres źródła „${at.get('adres')}” nie jest adresem http(s)`);
            return '';
          }
          if (!czyPoprawnaData(at.get('data'))) {
            problemy.push(`data odczytu „${at.get('data')}” nie jest poprawną datą RRRR-MM-DD`);
            return '';
          }
          zrodla.push({ tytul: at.get('tytul'), adres: at.get('adres'), data: at.get('data') });
          return '';
        });
      } else if (ZRODLO_RE.test(trescBloku)) {
        problemy.push('dyrektywa {{zrodlo …}} należy tylko do bloku {{kwerenda}}');
        trescBloku = trescBloku.replace(ZRODLO_RE, '');
      }
      ZRODLO_RE.lastIndex = 0;

      const wewn = renderMarkdown(trescBloku, {
        resolveLink, wymagajPoziomu, wPoziomie: pochodzenie, wZagniezdzeniu: true,
        atrybutyNaglowka, zachowajLamania,
      });
      problemy.push(...wewn.problemy);

      const atrybutyDom = [
        `class="fragment poziom poziom-${pochodzenie}${rodzaj ? ` rodzaj-${rodzaj}` : ''}"`,
        `data-poziom="${pochodzenie}"`,
        rodzaj ? `data-rodzaj="${rodzaj}"` : '',
        atrybuty.has('pewnosc') && czyPewnosc(pewnoscRaw) && Number(pewnoscRaw) > 0
          ? `data-pewnosc="${Number(pewnoscRaw)}"` : '',
        kotwicaInterpretacji && rodzaj === 'interpretacja'
          ? `id="${escapeHtml(kotwicaInterpretacji)}"` : '',
      ].filter(Boolean).join(' ');

      let htmlBloku = wewn.html;
      if (pochodzenie === 'kwerenda') {
        if (zrodla.length === 0) {
          problemy.push('blok {{kwerenda}} bez źródła — dodaj {{zrodlo tytul="…" adres="…" data="…"}}');
        } else {
          htmlBloku += `\n${zrodlaHtml(zrodla)}`;
        }
      }
      out.push(`<div ${atrybutyDom}>\n${wEtykiecie(htmlBloku, pochodzenie, pewnoscRaw)}\n</div>`);
      continue;
    }

    // Blok surowy :::zapis ... ::: (dosłowny tekst z archiwum rozgrywki)
    if (/^:::/.test(linia.trim())) {
      const buf = [];
      i += 1;
      while (i < linie.length && !/^:::/.test(linie[i].trim())) { buf.push(linie[i]); i += 1; }
      i += 1;
      // Wewnątrz cytatu techniczne komentarze HTML (np. `<!-- S001B -->` z czytanek) są pomijane,
      // a nagłówki techniczne z ekranu (`## Etap 0-1`) stają się subtelnym separatorem `---` (ADR 0009).
      const wiersze = buf
        .filter((l) => !/^\s*<!--[\s\S]*?-->\s*$/.test(l))
        .map((l) => (/^#{1,6}\s+/.test(l) ? '---' : l));
      while (wiersze.length && wiersze[0].trim() === '') wiersze.shift();
      while (wiersze.length && wiersze[wiersze.length - 1].trim() === '') wiersze.pop();
      if (wiersze[0]?.trim() === '---') wiersze.shift();
      if (wiersze[wiersze.length - 1]?.trim() === '---') wiersze.pop();
      const surowy = wiersze.join('\n');
      const wewn = renderMarkdown(surowy, {
        resolveLink, wymagajPoziomu, wPoziomie, wZagniezdzeniu: true, atrybutyNaglowka,
        zachowajLamania: true,
      });
      problemy.push(...wewn.problemy);
      dodaj(`<div class="zapis-tekst">\n${wewn.html}\n</div>`);
      continue;
    }

    // Pozioma linia
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(linia.trim())) { out.push('<hr>'); i += 1; continue; }

    // Nagłówek
    const h = linia.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const poz = h[1].length;
      const wewn = inline(h[2]);
      const opis = atrybutyNaglowka?.(poz, h[2].trim(), wewn) ?? null;
      const atrybut = opis?.id ? ` id="${escapeHtml(opis.id)}"` : '';
      out.push(`<h${poz}${atrybut}>${opis?.wewnetrzny ?? wewn}</h${poz}>`);
      i += 1; continue;
    }

    // Cytat blokowy
    if (/^>\s?/.test(linia)) {
      const buf = [];
      while (i < linie.length && /^>\s?/.test(linie[i])) {
        buf.push(linie[i].replace(/^>\s?/, ''));
        i += 1;
      }
      const tresc = zachowajLamania
        ? buf.map((l) => inline(l)).join('<br>')
        : inline(buf.join(' '));
      dodaj(`<blockquote><p>${tresc}</p></blockquote>`);
      continue;
    }

    // Tabela pipe
    if (bezPip(linia.trim()).startsWith('|') && bezPip(linie[i + 1] ?? '').match(/^\s*\|[\s:|-]+\|\s*$/)) {
      const naglowki = podzielKomorki(linia);
      i += 2;
      const wiersze = [];
      while (i < linie.length && bezPip(linie[i].trim()).startsWith('|')) {
        wiersze.push(podzielKomorki(linie[i]));
        i += 1;
      }
      dodaj(
        '<div class="tabela-owijka"><table><thead><tr>' +
        naglowki.map((c) => `<th>${inline(c)}</th>`).join('') +
        '</tr></thead><tbody>' +
        wiersze.map((w) => '<tr>' + w.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') +
        '</tbody></table></div>',
      );
      continue;
    }

    // Listy
    if (/^\s*[-*]\s+/.test(linia) || /^\s*\d+\.\s+/.test(linia)) {
      const uporzadkowana = /^\s*\d+\.\s/.test(linia);
      const elementy = [];
      while (i < linie.length) {
        if (linie[i].trim() === '' && elementy.length > 0) {
          const dalej = linie.slice(i + 1).find((l) => l.trim() !== '');
          if (dalej !== undefined && /^\s*(?:[-*]|\d+\.)\s+/.test(dalej)) { i += 1; continue; }
          break;
        }
        if (!(/^\s*[-*]\s+/.test(linie[i]) || /^\s*\d+\.\s+/.test(linie[i]) || (elementy.length > 0 && sLinia(linie[i])))) break;
        if (elementy.length > 0 && !/^\s*(?:[-*]|\d+\.)\s+/.test(linie[i])) {
          elementy[elementy.length - 1] += ' ' + linie[i].trim();
        } else {
          elementy.push(linie[i].replace(/^\s*(?:[-*]|\d+\.)\s+/, ''));
        }
        i += 1;
      }
      const tag = uporzadkowana ? 'ol' : 'ul';
      dodaj(`<${tag}>${elementy.map((e) => `<li>${inline(e)}</li>`).join('')}</${tag}>`);
      continue;
    }

    // Akapit
    const buf = [linia];
    i += 1;
    while (
      i < linie.length && linie[i].trim() !== '' &&
      !/^(#{1,4}\s|>\s?|\s*[-*]\s|\s*\d+\.\s|-{3,}$|:::)/.test(linie[i]) &&
      !bezPip(linie[i].trim()).startsWith('|') &&
      !nazwaBlokuOtwarcia(linie[i]) &&
      linie[i].trim() !== '}}'
    ) {
      buf.push(linie[i]);
      i += 1;
    }
    const tresc = zachowajLamania
      ? buf.map((l) => inline(l)).join('<br>')
      : inline(buf.join(' '));
    dodaj(`<p>${tresc}</p>`);
  }

  return { html: out.join('\n'), problemy };

  function inline(tekst) {
    // Mowa zegara Dantego w czytankach zapisywana jest jako `\<…>`: zdejmujemy backslash przed `<` i `>`,
    // zanim `escapeHtml` bezpiecznie zamieni nawiasy ostrokątne na encje HTML.
    const odblokowany = String(tekst).replace(/\\([<>])/g, '$1');
    // Słowa zatarte w zapisie (`***` stojące samodzielnie, np. „gdy ryję ***…”, „(***)”) chronimy
    // przed regułami pogrubienia i kursywy — inaczej dwa takie miejsca w jednej linii sklejają się
    // w fałszywe `<strong>`/`<em>` (ADR 0009, LESSONS 2.1).
    let t = escapeHtml(odblokowany).replace(ZATARTE_RE, ZATARTE_ZNACZNIK);

    t = t.replace(WIKILINK_RE, (_caly, slugRaw, etykietaRaw) => {
      const slug = slugRaw.trim();
      if (!resolveLink) return escapeHtml(etykietaRaw ? etykietaRaw.trim() : slug);
      const cel = resolveLink(slug);
      if (!cel) {
        problemy.push(`martwy wikilink: [[${slug}]]`);
        return `<span class="martwy-link" data-slug="${escapeHtml(slug)}">${escapeHtml(etykietaRaw ?? slug)}</span>`;
      }
      const etykieta = etykietaRaw ? etykietaRaw.trim() : cel.tytul;
      return `<a href="${cel.href}" title="${escapeHtml(cel.tytul)}">${escapeHtml(etykieta)}</a>`;
    });

    t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_caly, alt, src) =>
      `<button type="button" class="ilustracja-otworz" data-pelny-ekran>` +
      `<img src="${src}" alt="${alt}" loading="lazy" decoding="async"></button>`);

    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_caly, etykieta, url) => {
      if (!/^(https?:\/\/|[#/])/.test(url)) return etykieta;
      const zewnetrzny = url.startsWith('http');
      const atrybuty = zewnetrzny ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${url}"${atrybuty}>${etykieta}</a>`;
    });

    t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    t = t.replaceAll(ZATARTE_ZNACZNIK, ZATARTE_HTML);

    return t;
  }
}

/**
 * Zatarte słowo w zapisie opowieści: trzy gwiazdki niesąsiadujące z literą, cyfrą ani kolejną gwiazdką.
 * `***słowo***` (pogrubiona kursywa) nie jest zatarciem, bo gwiazdki przylegają do liter.
 */
export const ZATARTE_RE = /(?<![\p{L}\p{N}*])\*{3}(?![\p{L}\p{N}*])/gu;
const ZATARTE_ZNACZNIK = '\u0002';
const ZATARTE_HTML = '<span class="zatarte" title="słowo zatarte">***</span>';

const ETYKIETY_POCHODZENIA = {
  dostawa: 'z opowieści',
  opracowanie: 'opracowanie',
  kwerenda: 'źródła sprawdzone',
  model: 'wiedza modelu',
};

function zrodlaHtml(zrodla) {
  const pozycje = zrodla
    .map((z) => `<li><a href="${escapeHtml(z.adres)}" target="_blank" rel="noopener">${escapeHtml(z.tytul)}</a><span class="zrodlo-data">odczyt ${escapeHtml(z.data)}</span></li>`)
    .join('');
  return `<ul class="zrodla">${pozycje}</ul>`;
}

function wEtykiecie(html, pochodzenie, pewnosc) {
  const plakietka = `<span class="pochodzenie-etykieta pochodzenie-${escapeHtml(pochodzenie)}">${escapeHtml(ETYKIETY_POCHODZENIA[pochodzenie] ?? pochodzenie)}</span>`
    + badgePewnosci(pewnosc);
  const naglowek = html.match(/^<h([2-4])(?:\s[^>]*)?>[\s\S]*?<\/h\1>/);
  if (!naglowek) return `<p class="poziom-nad-trescia">${plakietka}</p>\n${html}`;
  const reszta = html.slice(naglowek[0].length).replace(/^\n/, '');
  return `<div class="naglowek-fragmentu">${naglowek[0]}<span class="poziom-plakietki">${plakietka}</span></div>${reszta ? `\n${reszta}` : ''}`;
}

const sLinia = (l) =>
  String(l).trim() !== '' &&
  !/^(#{1,4}\s|>\s?|:::|-{3,}$|\*{3,}$|_{3,}$)/.test(l.trim()) &&
  !bezPip(l.trim()).startsWith('|') &&
  !nazwaBlokuOtwarcia(l) &&
  l.trim() !== '}}';

const PIPE_PLACEHOLDER = '\u0001';
const bezPip = (s) => String(s).replace(/\\\|/g, PIPE_PLACEHOLDER);
const przywrocPip = (s) => String(s).replaceAll(PIPE_PLACEHOLDER, '|');

function podzielKomorki(wiersz) {
  const t = bezPip(String(wiersz).trim()).replace(/^\|/, '').replace(/\|$/, '');
  const komorki = [];
  let biezaca = '';
  let wLinku = false;
  for (let j = 0; j < t.length; j += 1) {
    const ch = t[j];
    if (!wLinku && ch === '[' && t[j + 1] === '[') { wLinku = true; biezaca += '[['; j += 1; continue; }
    if (wLinku && ch === ']' && t[j + 1] === ']') { wLinku = false; biezaca += ']]'; j += 1; continue; }
    if (ch === '|' && !wLinku) { komorki.push(przywrocPip(biezaca.trim())); biezaca = ''; continue; }
    biezaca += ch;
  }
  komorki.push(przywrocPip(biezaca.trim()));
  return komorki;
}

export function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
