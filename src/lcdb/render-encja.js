/**
 * Widok strony encji świata, wątku i kontekstu (`#/postac/:slug`, `#/frakcja/:slug`, …).
 */

import { escapeHtml, badgePewnosci } from './markdown.js';
import { hrefDlaSlug, hrefListy, hrefKotwicy } from './links.js';
import { dajDane, dajStrone, wystapieniaStrony, powiazaniaStrony } from './data.js';
import {
  naglowekStrony, okruszki, stanPusty, ukladDwuKolumn, kolumnaBoczna,
  chipTypu, nazwaTypu, nazwaRodzaju, historiaInterpretacjiHtml,
} from './render.js';
import { generatorIdBoksow, spisBoksowHtml } from './spis-boksow.js';

function metrykaEncji(strona) {
  const dane = dajDane();
  const pola = [];

  if (strona.numer_grzesznika !== undefined) {
    pola.push(['Grzesznik', `nr ${escapeHtml(String(strona.numer_grzesznika))}`]);
  }
  if (strona.rola) pola.push(['Rola', escapeHtml(nazwaRodzaju(strona.rola))]);
  if (strona.przydzial) pola.push(['Przydział', escapeHtml(strona.przydzial)]);
  if (strona.pseudonim) {
    const lista = Array.isArray(strona.pseudonim) ? strona.pseudonim.join(', ') : String(strona.pseudonim);
    pola.push(['Miana i tytuły', escapeHtml(lista)]);
  }
  if (strona.rodzaj) pola.push(['Rodzaj', escapeHtml(nazwaRodzaju(strona.rodzaj))]);
  if (strona.rodzaj_watku) pola.push(['Charakter wątku', escapeHtml(nazwaRodzaju(strona.rodzaj_watku))]);
  if (strona.stan) pola.push(['Stan', escapeHtml(nazwaRodzaju(strona.stan))]);
  if (strona.skrot) pola.push(['Skrót', escapeHtml(strona.skrot)]);
  if (strona.numer_dzielnicy !== undefined) {
    pola.push(['Dzielnica', `Dzielnica ${escapeHtml(String(strona.numer_dzielnicy))}`]);
  }
  if (strona.region) pola.push(['Obszar Miasta', escapeHtml(strona.region)]);
  if (strona.dzielo) pola.push(['Pierwowzór', `<em>${escapeHtml(strona.dzielo)}</em>`]);
  if (strona.autor) pola.push(['Autor', escapeHtml(strona.autor)]);
  if (strona.rok !== undefined) pola.push(['Czas powstania', escapeHtml(String(strona.rok))]);

  if (strona.frakcja && dane.strony[strona.frakcja]) {
    const f = dane.strony[strona.frakcja];
    pola.push(['Przynależność', `<a href="${hrefDlaSlug(f.slug, 'frakcja')}">${escapeHtml(f.tytul)}</a>`]);
  }
  if (strona.dzielnica && dane.strony[strona.dzielnica]) {
    const d = dane.strony[strona.dzielnica];
    pola.push(['Dzielnica', `<a href="${hrefDlaSlug(d.slug, 'dzielnica')}">${escapeHtml(d.tytul)}</a>`]);
  }
  if (strona.siedziba && dane.strony[strona.siedziba]) {
    const m = dane.strony[strona.siedziba];
    pola.push(['Siedziba', `<a href="${hrefDlaSlug(m.slug, 'miejsce')}">${escapeHtml(m.tytul)}</a>`]);
  }
  if (strona.pierwsze_wystapienie && dane.strony[strona.pierwsze_wystapienie]) {
    const sc = dane.strony[strona.pierwsze_wystapienie];
    pola.push(['Pierwsze pojawienie się', `<a href="${hrefDlaSlug(sc.slug, 'scena')}">${escapeHtml(sc.tytul)}</a>`]);
  }

  if (pola.length === 0) return '';
  return `<dl class="metryka">
    ${pola.map(([etykieta, wartosc]) => `<div class="metryka-wiersz"><dt>${etykieta}</dt><dd>${wartosc}</dd></div>`).join('\n    ')}
  </dl>`;
}

export function renderEncja(typ, slug) {
  const strona = dajStrone(slug);
  if (!strona || strona.typ !== typ) {
    return stanPusty(`Nie ma takiej karty (${nazwaTypu(typ).toLowerCase()}).`, `<a href="${hrefListy(typ)}">${escapeHtml(nazwaTypu(typ, true))}</a>`);
  }

  const href = hrefDlaSlug(strona.slug, strona.typ);
  const metaCzesci = [
    nazwaTypu(strona.typ),
    strona.tytul_kr ? `<span lang="ko">${escapeHtml(strona.tytul_kr)}</span>` : '',
    strona.tytul_en ? escapeHtml(strona.tytul_en) : '',
  ].filter(Boolean).join(' · ');

  const naglowek = naglowekStrony({
    tytul: strona.tytul,
    opis: strona.streszczenie ? escapeHtml(strona.streszczenie) : '',
    meta: metaCzesci,
    sciezka: okruszki([
      { etykieta: nazwaTypu(strona.typ, true), href: hrefListy(strona.typ) },
      { etykieta: strona.tytul },
    ]),
  });

  const dajId = generatorIdBoksow();
  const spisPozycji = [];

  const boksyHtml = (strona.boksy ?? []).map((b) => {
    const id = b.tytul ? dajId(b.tytul) : null;
    if (id && b.tytul) spisPozycji.push({ id, tytul: b.tytul });
    return `<section class="boks"${id ? ` id="${escapeHtml(id)}"` : ''}>
      ${b.tytul ? `<h2>${escapeHtml(b.tytul)}</h2>` : ''}
      ${b.html}
      ${b.tytul ? historiaInterpretacjiHtml(strona, b.tytul) : ''}
    </section>`;
  }).join('\n');

  const wystapienia = wystapieniaStrony(strona.slug);
  let wystapieniaHtml = '';
  if (wystapienia.length > 0) {
    const idWyst = dajId('W opowieści');
    spisPozycji.push({ id: idWyst, tytul: 'W opowieści' });
    wystapieniaHtml = `<section class="boks" id="${escapeHtml(idWyst)}">
      <h2>W opowieści</h2>
      <ol class="lista-scen-zrodlowa">
        ${wystapienia.map((sc) => `<li>
          <span class="scena-nr">${escapeHtml(sc.numer_sceny ?? String(sc.kolejnosc))}</span>
          <div>
            <a href="${hrefDlaSlug(sc.slug, 'scena')}"><strong>${escapeHtml(sc.tytul)}</strong></a>
            ${sc.streszczenie ? `<p class="meta">${escapeHtml(sc.streszczenie)}</p>` : ''}
          </div>
        </li>`).join('\n        ')}
      </ol>
    </section>`;
  }

  const spis = spisBoksowHtml(spisPozycji, href);
  const boczna = kolumnaBocznaEncji(strona, spis);
  const glowna = [metrykaEncji(strona), boksyHtml, wystapieniaHtml].filter(Boolean).join('\n');

  return `${naglowek}${ukladDwuKolumn(glowna, boczna)}`;
}

function kolumnaBocznaEncji(strona, spisBoksow) {
  const powiazania = powiazaniaStrony(strona.slug);
  const grupy = [];

  if ((strona.hipotezy ?? []).length > 0) {
    grupy.push({
      tytul: 'Interpretacje na karcie',
      html: `<ul class="lista-boczna-hipotez">${strona.hipotezy.map((h) => `<li>
        <a href="${hrefKotwicy(strona.slug, strona.typ, h.kotwica)}" data-cel="${escapeHtml(h.kotwica)}">${escapeHtml(h.pytanie || h.sekcja)}</a>
        ${badgePewnosci(h.pewnosc)}
      </li>`).join('')}</ul>`,
    });
  }

  const kolejnoscPowiazan = [
    'postac', 'frakcja', 'dzielnica', 'miejsce', 'watek', 'kontekst', 'pojecie', 'rozdzial', 'epizod',
  ];
  for (const typ of kolejnoscPowiazan) {
    const lista = powiazania[typ] ?? [];
    if (lista.length === 0) continue;
    grupy.push({
      tytul: nazwaTypu(typ, true),
      html: `<ul class="chipy">${lista.map((cel) => `<li>${chipTypu(cel.slug, cel.typ, cel.tytul, '')}</li>`).join('')}</ul>`,
    });
  }

  if ((strona.tagi ?? []).length > 0) {
    grupy.push({
      tytul: 'Motywy',
      html: `<ul class="chipy">${strona.tagi.map((t) => `<li><a class="chip chip-tag" href="#/tag/${encodeURIComponent(t)}">#${escapeHtml(t)}</a></li>`).join('')}</ul>`,
    });
  }

  return kolumnaBoczna(grupy, 'Powiązania w opowieści', { spisBoksow });
}
