/**
 * Pełnotekstowa wyszukiwarka po stronie przeglądarki (`#/szukaj?q=…`).
 */

import { escapeHtml } from './markdown.js';
import { hrefDlaSlug } from './links.js';
import { dajDane } from './data.js';
import { naglowekStrony, okruszki, stanPusty, nazwaTypu, odmiana } from './render.js';

export function szukaj(fraza) {
  const q = String(fraza ?? '').trim().toLowerCase();
  if (q.length < 2) return [];
  const tokeny = q.split(/\s+/).filter(Boolean);
  const wyniki = [];

  for (const s of Object.values(dajDane().strony)) {
    const tytul = String(s.tytul ?? '').toLowerCase();
    const oboczne = [s.tytul_kr, s.tytul_en, s.oznaczenie, s.skrot, ...(Array.isArray(s.pseudonim) ? s.pseudonim : [s.pseudonim])]
      .filter(Boolean).join(' ').toLowerCase();
    const streszczenie = String(s.streszczenie ?? '').toLowerCase();
    const tekst = String(s.tekst ?? '').toLowerCase();
    const tagi = (s.tagi ?? []).join(' ').toLowerCase();

    const wszystko = `${tytul} ${oboczne} ${streszczenie} ${tagi} ${tekst}`;
    if (!tokeny.every((t) => wszystko.includes(t))) continue;

    let waga = 0;
    for (const t of tokeny) {
      if (tytul.includes(t)) waga += 10;
      if (oboczne.includes(t)) waga += 6;
      if (tagi.includes(t)) waga += 4;
      if (streszczenie.includes(t)) waga += 3;
      if (tekst.includes(t)) waga += 1;
    }

    let wycinek = s.streszczenie ?? '';
    if (!wycinek && s.tekst) {
      const idx = tekst.indexOf(tokeny[0]);
      const start = Math.max(0, idx - 60);
      wycinek = (start > 0 ? '…' : '') + s.tekst.slice(start, start + 180).trim() + '…';
    }

    wyniki.push({ strona: s, waga, wycinek });
  }

  return wyniki.sort((a, b) => b.waga - a.waga || String(a.strona.tytul).localeCompare(String(b.strona.tytul), 'pl'));
}

export function renderSzukaj(zapytanie = {}) {
  const q = String(zapytanie.q ?? '').trim();
  const wyniki = q ? szukaj(q) : [];

  const naglowek = naglowekStrony({
    tytul: 'Szukaj w kronice',
    opis: 'Przeszukaj imiona, przydomki, nazwy koreańskie i angielskie, rozmowy oraz konteksty literackie.',
    meta: q ? `${wyniki.length} ${odmiana(wyniki.length, ['wynik', 'wyniki', 'wyników'])} dla „${escapeHtml(q)}”` : '',
    sciezka: okruszki([{ etykieta: 'Szukaj' }]),
  });

  const formularz = `<form class="boks szukaj-formularz" data-szukaj-form action="#/szukaj">
    <label class="ukryty-etykieta" for="szukaj-q">Szukana fraza</label>
    <input id="szukaj-q" name="q" type="search" value="${escapeHtml(q)}" placeholder="Wpisz co najmniej 2 znaki…" autocomplete="off">
    <button type="submit">Szukaj</button>
  </form>`;

  if (!q) {
    return `${naglowek}${formularz}`;
  }
  if (q.length < 2) {
    return `${naglowek}${formularz}${stanPusty('Wpisz co najmniej dwa znaki.')}`;
  }
  if (wyniki.length === 0) {
    return `${naglowek}${formularz}${stanPusty(`Nic nie znaleziono dla „${q}”.`)}`;
  }

  const lista = `<ol class="lista-wynikow">
    ${wyniki.map(({ strona, wycinek }) => `<li class="boks wynik-wiersz">
      <div class="karta-naglowek">
        <span class="chip-typ">${escapeHtml(nazwaTypu(strona.typ))}</span>
        <a class="karta-tytul" href="${hrefDlaSlug(strona.slug, strona.typ)}">${escapeHtml(strona.tytul)}</a>
      </div>
      ${wycinek ? `<p class="meta">${escapeHtml(wycinek)}</p>` : ''}
    </li>`).join('\n    ')}
  </ol>`;

  return `${naglowek}${formularz}${lista}`;
}
