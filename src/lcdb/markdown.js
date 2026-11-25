/**
 * Renderer markdown → HTML (świadomy podzbiór bez zależności, ADR 0002).
 *
 * Obsługiwane elementy:
 *  - nagłówki `#`..`####`, akapity, `**pogrubienie**`, `*kursywa*`, `` `kod` ``,
 *  - odsyłacze `[tekst](url)` oraz wikilinki `[[slug]]` i `[[slug|etykieta]]`,
 *  - listy `- ` / `* ` oraz `1. `, cytaty `> `, tabele z pionkami, `---`,
 *  - obrazy `![opis](adres)` otwierane w podglądzie pełnoekranowym,
 *  - bloki `:::zapis ... :::` na dosłowny tekst sceny (w tym kwestie zegarowe
 *    Dantego `<…>` oraz zarówno `**Mówca:**`, jak i `[Dialog - Mówca]`),
 *  - bloki pochodzenia informacji (ADR 0005, ADR 0006):
 *      `{{dostawa` ... `}}`
 *      `{{opracowanie` ... `}}`
 *      `{{kwerenda` ... `{{zrodlo tytul="…" adres="https://…" data="RRRR-MM-DD"}}` ... `}}`
 *      `{{model` ... `}}`
 *      `{{model pewnosc=NN pytanie="…"` ... `}}`
 *
 * Cała treść wejściowa jest ucieczkowana (`<`, `>`, `&`, `"`) przed nałożeniem
 * znaczników, więc `<…>` z dialogów nigdy nie znika jako rzekomy znacznik HTML.
 */

import { WIKILINK_RE } from './links.js';
import { czyPoprawnaData } from './czas.js';

export const POCHODZENIA = ['dostawa', 'opracowanie', 'kwerenda', 'model'];

export const OPIS_POCHODZENIA = {
  dostawa: {
    etykieta: 'z opowieści',
    opis: 'słowa, dialogi i obrazy wzięte wprost z rozegranego materiału',
  },
  opracowanie: {
    etykieta: 'opracowanie',
    opis: 'streszczenie i wniosek wynikający bezpośrednio z tego, co padło w opowieści',
  },
  kwerenda: {
    etykieta: 'źródła sprawdzone',
    opis: 'fakt potwierdzony zewnętrznym źródłem, z pełnym adresem i datą odczytu',
  },
  model: {
    etykieta: 'wiedza modelu',
    opis: 'tło literacko-kulturowe bez źródła albo hipoteza z oszacowaną pewnością',
  },
};

export const RODZAJE_TRESCI = [
  'scena', 'streszczenie', 'wnioski', 'watek', 'swiat', 'kontekst', 'interpretacja', 'spis',
];

export const POCHODZENIE_INTERPRETACJI = 'model';

export const ATRYBUTY_BLOKU = ['pewnosc', 'rodzaj', 'pytanie'];

export const ZRODLO_RE = /\{\{zrodlo((?:\s+[A-Za-z][\w-]*=(?:"[^"]*"|[^\s}]+))*)\s*\}\}/g;

export const ATRYBUTY_ZRODLA = ['tytul', 'adres', 'data'];

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
};

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

export const BLOK_OTWARCIA_RE = /^\{\{([A-Za-z]+)((?:\s+[A-Za-z][\w-]*=(?:"[^"]*"|[^\s}]+))*)\s*$/;

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
  resolveLink,
  wymagajPoziomu = false,
  wPoziomie = null,
  wZagniezdzeniu = false,
  atrybutyNaglowka = null,
  zachowajLamania = false,
  kotwicaInterpretacji = null,
} = {}) {
  const linie = String(md).replace(/\r\n/g, '\n').split('\n');
  const out = [];
  const problemy = [];
  let i = 0;

  const dodaj = (html) => {
    if (wymagajPoziomu && wPoziomie === null) {
      problemy.push(`fragment treści bez pochodzenia — otocz blokiem {{${POCHODZENIA.join('|')}}}`);
    }
    out.push(html);
  };

  while (i < linie.length) {
    const linia = linie[i];

    if (linia.trim() === '') {
      i += 1;
      continue;
    }

    const otwarcie = linia.trim().match(BLOK_OTWARCIA_RE);
    if (otwarcie) {
      const pochodzenie = otwarcie[1];
      const atrybuty = parsujAtrybutyBloku(otwarcie[2]);
      const rodzajRaw = atrybuty.get('rodzaj');
      const rodzaj = rodzajRaw ?? (
        pochodzenie === POCHODZENIE_INTERPRETACJI && atrybuty.has('pewnosc')
          ? 'interpretacja'
          : null
      );

      i += 1;
      const buf = [];
      while (i < linie.length && linie[i].trim() !== '}}') {
        buf.push(linie[i]);
        i += 1;
      }
      if (i >= linie.length) {
        problemy.push(`niezamknięty blok {{${pochodzenie}`);
      }
      i += 1;

      const wycofane = POZIOMY_WYCOFANE[pochodzenie];
      if (wycofane) {
        problemy.push(`zapis {{${pochodzenie}}} jest wycofany — użyj {{${wycofane}}}`);
        continue;
      }
      if (!POCHODZENIA.includes(pochodzenie)) {
        problemy.push(`nieznane pochodzenie w bloku {{${pochodzenie}: dozwolone ${POCHODZENIA.join(', ')}`);
        continue;
      }
      if (
        pochodzenie === POCHODZENIE_INTERPRETACJI &&
        !atrybuty.has('pewnosc') &&
        (atrybuty.has('pytanie') || rodzajRaw === 'interpretacja')
      ) {
        problemy.push(
          'tło kulturowe {{model}} bez `pewnosc=` nie jest hipotezą — usuń `pytanie=`/`rodzaj=interpretacja` albo podaj pewność 0–100',
        );
      }
      if (rodzajRaw !== undefined && !RODZAJE_TRESCI.includes(rodzajRaw)) {
        problemy.push(`nieznany rodzaj treści "${rodzajRaw}": dozwolone ${RODZAJE_TRESCI.join(', ')}`);
        continue;
      }
      if (wZagniezdzeniu) {
        problemy.push(`zagnieżdżony blok {{${pochodzenie}}} — warstw pochodzenia nie zagnieżdżamy`);
        continue;
      }
      if (rodzaj === 'interpretacja' && pochodzenie !== POCHODZENIE_INTERPRETACJI) {
        problemy.push(`hipoteza jest zawsze wiedzą modelu — użyj {{model pewnosc=…}}, nie {{${pochodzenie}}}`);
        continue;
      }

      const pewnoscRaw = atrybuty.get('pewnosc');
      for (const klucz of atrybuty.keys()) {
        if (!ATRYBUTY_BLOKU.includes(klucz)) {
          problemy.push(`nieznany atrybut "${klucz}" w bloku {{${pochodzenie}}} — dozwolone: ${ATRYBUTY_BLOKU.join(', ')}`);
        }
      }
      if (atrybuty.has('pewnosc') && pochodzenie !== POCHODZENIE_INTERPRETACJI) {
        problemy.push(`atrybut pewnosc przysługuje wyłącznie blokowi {{model}}`);
      }
      if (atrybuty.has('pewnosc') && !czyPewnosc(pewnoscRaw)) {
        problemy.push(`pewność "${pewnoscRaw}" nie jest liczbą całkowitą z zakresu 0–100`);
      }
      if (rodzaj === 'interpretacja' && !atrybuty.has('pewnosc')) {
        problemy.push('interpretacja wymaga atrybutu pewnosc=0–100 (ADR 0006)');
      }

      let trescBloku = buf.join('\n');
      const zrodla = [];
      if (pochodzenie === 'kwerenda') {
        trescBloku = trescBloku.replace(ZRODLO_RE, (_, atrybutyTekst) => {
          const at = parsujAtrybutyBloku(atrybutyTekst);
          const brak = ATRYBUTY_ZRODLA.filter((k) => !String(at.get(k) ?? '').trim());
          if (brak.length > 0) {
            problemy.push(`źródło bez ${brak.join(', ')} — podaj tytul, adres i datę odczytu`);
            return '';
          }
          if (!/^https?:\/\//.test(at.get('adres'))) {
            problemy.push(`adres źródła „${at.get('adres')}” nie zaczyna się od http(s)://`);
            return '';
          }
          if (!czyPoprawnaData(at.get('data'))) {
            problemy.push(`data odczytu „${at.get('data')}” nie jest poprawną datą kalendarzową RRRR-MM-DD`);
            return '';
          }
          zrodla.push({ tytul: at.get('tytul'), adres: at.get('adres'), data: at.get('data') });
          return '';
        });
      } else if (ZRODLO_RE.test(trescBloku)) {
        problemy.push('dyrektywa {{zrodlo …}} należy wyłącznie do bloku {{kwerenda}}');
        trescBloku = trescBloku.replace(ZRODLO_RE, '');
      }
      ZRODLO_RE.lastIndex = 0;

      const wewn = renderMarkdown(trescBloku, {
        resolveLink,
        wymagajPoziomu,
        wPoziomie: pochodzenie,
        wZagniezdzeniu: true,
        atrybutyNaglowka,
        zachowajLamania,
      });
      problemy.push(...wewn.problemy);

      const pytanie = rodzaj === 'interpretacja' && atrybuty.get('pytanie')
        ? `<p class="pytanie-interpretacji">${inline(atrybuty.get('pytanie'))}</p>\n`
        : '';

      const atrybutyDom = [
        `class="fragment poziom poziom-${pochodzenie}${rodzaj ? ` rodzaj-${rodzaj}` : ''}"`,
        `data-poziom="${pochodzenie}"`,
        rodzaj ? `data-rodzaj="${rodzaj}"` : '',
        pewnoscRaw !== undefined ? `data-pewnosc="${escapeHtml(String(pewnoscRaw))}"` : '',
        kotwicaInterpretacji && rodzaj === 'interpretacja'
          ? `id="${escapeHtml(kotwicaInterpretacji)}"`
          : '',
      ].filter(Boolean).join(' ');

      let htmlBloku = `${pytanie}${wewn.html}`;
      if (pochodzenie === 'kwerenda') {
        if (zrodla.length === 0) {
          problemy.push('blok {{kwerenda}} bez źródła — dodaj {{zrodlo tytul="…" adres="https://…" data="RRRR-MM-DD"}}');
        } else {
          htmlBloku += `\n${zrodlaHtml(zrodla)}`;
        }
      }
      out.push(`<div ${atrybutyDom}>\n${wEtykiecie(htmlBloku, pochodzenie, pewnoscRaw)}\n</div>`);
      continue;
    }

    if (/^:::/.test(linia.trim())) {
      const buf = [];
      i += 1;
      while (i < linie.length && !/^:::/.test(linie[i].trim())) {
        buf.push(linie[i]);
        i += 1;
      }
      i += 1;

      const wiersze = [];
      for (const l of buf) {
        if (/^#{1,6}\s+/.test(l.trim())) {
          if (wiersze.length > 0 && wiersze[wiersze.length - 1] !== '---') {
            wiersze.push('', '---', '');
          }
        } else {
          wiersze.push(l);
        }
      }
      while (wiersze.length > 0 && wiersze[0].trim() === '') wiersze.shift();
      while (wiersze.length > 0 && wiersze[wiersze.length - 1].trim() === '') wiersze.pop();
      while (wiersze[0]?.trim() === '---') {
        wiersze.shift();
        while (wiersze.length > 0 && wiersze[0].trim() === '') wiersze.shift();
      }
      while (wiersze[wiersze.length - 1]?.trim() === '---') {
        wiersze.pop();
        while (wiersze.length > 0 && wiersze[wiersze.length - 1].trim() === '') wiersze.pop();
      }

      const wewn = renderMarkdown(wiersze.join('\n'), {
        resolveLink,
        wymagajPoziomu,
        wPoziomie,
        wZagniezdzeniu: true,
        atrybutyNaglowka,
        zachowajLamania: true,
      });
      problemy.push(...wewn.problemy);
      dodaj(`<div class="zapis-tekst">\n${wewn.html}\n</div>`);
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(linia.trim())) {
      out.push('<hr>');
      i += 1;
      continue;
    }

    const h = linia.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const poz = h[1].length;
      const wewn = inline(h[2]);
      const opis = atrybutyNaglowka?.(poz, h[2].trim(), wewn) ?? null;
      const atrybut = opis?.id ? ` id="${escapeHtml(opis.id)}"` : '';
      out.push(`<h${poz}${atrybut}>${opis?.wewnetrzny ?? wewn}</h${poz}>`);
      i += 1;
      continue;
    }

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

    if (/^\s*[-*]\s+/.test(linia) || /^\s*\d+\.\s+/.test(linia)) {
      const uporzadkowana = /^\s*\d+\.\s/.test(linia);
      const elementy = [];
      while (i < linie.length) {
        if (linie[i].trim() === '' && elementy.length > 0) {
          const dalej = linie.slice(i + 1).find((l) => l.trim() !== '');
          if (dalej !== undefined && /^\s*(?:[-*]|\d+\.)\s+/.test(dalej)) {
            i += 1;
            continue;
          }
          break;
        }
        if (!(/^\s*[-*]\s+/.test(linie[i]) || /^\s*\d+\.\s+/.test(linie[i]) || (elementy.length > 0 && sLinia(linie[i])))) {
          break;
        }
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

    const buf = [linia];
    i += 1;
    while (
      i < linie.length &&
      linie[i].trim() !== '' &&
      !/^(#{1,4}\s|>\s?|\s*[-*]\s|\s*\d+\.\s|-{3,}$|:::)/.test(linie[i]) &&
      !BLOK_OTWARCIA_RE.test(linie[i].trim()) &&
      linie[i].trim() !== '}}' &&
      !bezPip(linie[i].trim()).startsWith('|')
    ) {
      buf.push(linie[i]);
      i += 1;
    }
    const tresc = zachowajLamania
      ? buf.map((l) => formatujLinieZapisu(l, inline)).join('<br>')
      : inline(buf.join(' '));
    dodaj(`<p>${tresc}</p>`);
  }

  return { html: out.join('\n'), problemy };

  function inline(tekst) {
    let t = escapeHtml(tekst);

    t = t.replace(WIKILINK_RE, (_, slugRaw, etykietaRaw) => {
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

    t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) =>
      `<button type="button" class="ilustracja-otworz" data-pelny-ekran>` +
      `<img src="${src}" alt="${alt}" loading="lazy" decoding="async"></button>`);

    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, etykieta, url) => {
      const odkodowany = url.replaceAll('&amp;', '&');
      if (!/^(https?:\/\/|[#/])/.test(odkodowany)) return etykieta;
      const zewnetrzny = odkodowany.startsWith('http');
      const atrybuty = zewnetrzny ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${escapeHtml(odkodowany)}"${atrybuty}>${etykieta}</a>`;
    });

    t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');

    return t;
  }
}

function formatujLinieZapisu(linia, inlineFn) {
  const dialogTagowany = linia.match(/^\[Dialog\s*-\s*([^\]]+)\]\s*(.+)$/);
  if (dialogTagowany) {
    return `<strong>${escapeHtml(dialogTagowany[1].trim())}:</strong> ${inlineFn(dialogTagowany[2])}`;
  }
  const narracjaTagowana = linia.match(/^\[Narracja\]\s*(.+)$/);
  if (narracjaTagowana) {
    return `<em>${inlineFn(narracjaTagowana[1])}</em>`;
  }
  return inlineFn(linia);
}

/**
 * Renderuje zwijaną historię interpretacji (`interpretacje:` z frontmattera)
 * wewnątrz boksu, którego dotyczy zmiana (ADR 0007).
 */
export function renderujHistorieInterpretacji(wpisy, { resolveLink } = {}) {
  if (!Array.isArray(wpisy) || wpisy.length === 0) return '';
  return wpisy.map((wpis) => {
    const zmianaPewnosci = [];
    if (wpis.pewnosc_poprzedniego !== undefined) {
      zmianaPewnosci.push(`wcześniej ${wpis.pewnosc_poprzedniego}%`);
    }
    if (wpis.pewnosc !== undefined) {
      zmianaPewnosci.push(`obecnie ${wpis.pewnosc}%`);
    }
    const dopisek = zmianaPewnosci.length > 0 ? ` · ${zmianaPewnosci.join(' → ')}` : '';
    const zmianaHtml = renderMarkdown(String(wpis.zmiana ?? ''), { resolveLink }).html;
    const poprzednioHtml = wpis.poprzednio
      ? `\n<blockquote class="historia-poprzednio">${renderMarkdown(String(wpis.poprzednio), { resolveLink }).html}</blockquote>`
      : '';
    return [
      '<details class="historia-interpretacji">',
      `<summary>Wcześniejsze odczytanie <span class="historia-meta">${escapeHtml(String(wpis.data ?? ''))}${escapeHtml(dopisek)}</span></summary>`,
      `<div class="historia-wnetrze">\n<div class="historia-zmiana">${zmianaHtml}</div>${poprzednioHtml}\n</div>`,
      '</details>',
    ].join('\n');
  }).join('\n');
}

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
  !BLOK_OTWARCIA_RE.test(String(l).trim()) &&
  String(l).trim() !== '}}' &&
  !bezPip(l.trim()).startsWith('|');

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
    if (!wLinku && ch === '[' && t[j + 1] === '[') {
      wLinku = true;
      biezaca += '[[';
      j += 1;
      continue;
    }
    if (wLinku && ch === ']' && t[j + 1] === ']') {
      wLinku = false;
      biezaca += ']]';
      j += 1;
      continue;
    }
    if (ch === '|' && !wLinku) {
      komorki.push(przywrocPip(biezaca.trim()));
      biezaca = '';
      continue;
    }
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
