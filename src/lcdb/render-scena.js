/**
 * Widok pojedynczej sceny (`#/scena/:slug`) — ADR 0004, 0005, 0007, 0009.
 */

import { escapeHtml, badgePewnosci } from './markdown.js';
import { hrefDlaSlug, hrefKotwicy } from './links.js';
import { dajDane, dajStrone, wszystkieSceny } from './data.js';
import {
  naglowekStrony, okruszki, stanPusty, ukladDwuKolumn, kolumnaBoczna,
  chipTypu, historiaInterpretacjiHtml,
} from './render.js';
import { generatorIdBoksow, spisBoksowHtml } from './spis-boksow.js';

export function renderScena(slug) {
  const scena = dajStrone(slug);
  const dane = dajDane();
  if (!scena || scena.typ !== 'scena') {
    return stanPusty('Nie ma takiej sceny.', '<a href="#/chronologia">Chronologia</a>');
  }

  const epizod = scena.epizod ? dane.strony[scena.epizod] : null;
  const rozdzial = epizod?.rozdzial ? dane.strony[epizod.rozdzial] : null;
  const os = wszystkieSceny();
  const idx = os.findIndex((s) => s.slug === scena.slug);
  const poprzednia = idx > 0 ? os[idx - 1] : null;
  const nastepna = idx >= 0 ? os[idx + 1] : null;
  const href = hrefDlaSlug(scena.slug, 'scena');

  const naglowek = naglowekStrony({
    tytul: scena.tytul,
    opis: scena.streszczenie ? escapeHtml(scena.streszczenie) : '',
    meta: [
      scena.numer_sceny ? `Scena ${escapeHtml(scena.numer_sceny)}` : '',
      epizod ? `Epizod: <a href="${hrefDlaSlug(epizod.slug, 'epizod')}">${escapeHtml(epizod.tytul)}</a>` : '',
      scena.tytul_kr ? `<span lang="ko">${escapeHtml(scena.tytul_kr)}</span>` : '',
      scena.tytul_en ? escapeHtml(scena.tytul_en) : '',
    ].filter(Boolean).join(' · '),
    sciezka: okruszki([
      { etykieta: 'Chronologia', href: '#/chronologia' },
      ...(rozdzial ? [{ etykieta: rozdzial.tytul, href: hrefDlaSlug(rozdzial.slug, 'rozdzial') }] : []),
      ...(epizod ? [{ etykieta: epizod.tytul, href: hrefDlaSlug(epizod.slug, 'epizod') }] : []),
      { etykieta: scena.tytul },
    ]),
  });

  const dajId = generatorIdBoksow();
  const spisPozycji = [];
  const sekcjeHtml = (scena.sekcje ?? []).map((s) => {
    const id = dajId(s.tytul);
    spisPozycji.push({ id, tytul: s.tytul });
    const klasa = s.tytul === 'Treść sceny' ? 'boks boks-zapis' : 'boks';
    return `<section class="${klasa}" id="${escapeHtml(id)}">
      <h2>${escapeHtml(s.tytul)}</h2>
      ${s.html}
      ${historiaInterpretacjiHtml(scena, s.tytul)}
    </section>`;
  }).join('\n');

  const nawigacjaDolna = `<nav class="nawigacja-sceny" aria-label=" sąsiednie sceny">
    <div class="naw-poprzednia">
      ${poprzednia
        ? `<span class="meta">← wcześniej</span> <a href="${hrefDlaSlug(poprzednia.slug, 'scena')}">${escapeHtml(poprzednia.tytul)}</a>`
        : '<span class="meta">początek podróży</span>'}
    </div>
    <div class="naw-nastepna">
      ${nastepna
        ? `<span class="meta">dalej →</span> <a href="${hrefDlaSlug(nastepna.slug, 'scena')}">${escapeHtml(nastepna.tytul)}</a>`
        : '<span class="meta">dotąd opowiedziane</span>'}
    </div>
  </nav>`;

  const spis = spisBoksowHtml(spisPozycji, href);
  const boczna = kolumnaBocznaSceny(scena, epizod, spis);

  return `${naglowek}${ukladDwuKolumn(`${sekcjeHtml}\n${nawigacjaDolna}`, boczna)}`;
}

function kolumnaBocznaSceny(scena, epizod, spisBoksow) {
  const dane = dajDane();
  const grupy = [];

  if ((scena.hipotezy ?? []).length > 0) {
    grupy.push({
      tytul: 'Interpretacje w scenie',
      html: `<ul class="lista-boczna-hipotez">${scena.hipotezy.map((h) => `<li>
        <a href="${hrefKotwicy(scena.slug, 'scena', h.kotwica)}" data-cel="${escapeHtml(h.kotwica)}">${escapeHtml(h.pytanie || h.sekcja)}</a>
        ${badgePewnosci(h.pewnosc)}
      </li>`).join('')}</ul>`,
    });
  }

  if (epizod) {
    grupy.push({
      tytul: 'Epizod',
      html: `<ul class="chipy"><li>${chipTypu(epizod.slug, 'epizod', epizod.tytul, '')}</li></ul>`,
    });
  }

  const dodaj = (tytul, pole) => {
    const strony = (scena[pole] ?? []).map((s) => dane.strony[s]).filter(Boolean);
    if (strony.length === 0) return;
    grupy.push({
      tytul,
      html: `<ul class="chipy">${strony.map((s) => `<li>${chipTypu(s.slug, s.typ, s.tytul, '')}</li>`).join('')}</ul>`,
    });
  };

  dodaj('Postacie w scenie', 'postacie');
  dodaj('Miejsca', 'miejsca');
  dodaj('Dzielnice', 'dzielnice');
  dodaj('Frakcje', 'frakcje');
  dodaj('Wątki', 'watki');
  dodaj('Konteksty', 'konteksty');
  dodaj('Pojęcia', 'pojecia');

  if ((scena.tagi ?? []).length > 0) {
    grupy.push({
      tytul: 'Motywy',
      html: `<ul class="chipy">${scena.tagi.map((t) => `<li><a class="chip chip-tag" href="#/tag/${encodeURIComponent(t)}">#${escapeHtml(t)}</a></li>`).join('')}</ul>`,
    });
  }

  return kolumnaBoczna(grupy, 'Kontekst sceny', { spisBoksow });
}
