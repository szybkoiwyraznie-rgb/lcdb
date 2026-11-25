/**
 * Chronologia: opowieść w kolejności zdarzeń (ADR 0008, ADR 0015).
 *
 * Jedna ciągła oś scen od początku podróży aż do granicy wyznaczonej przez
 * ostatnią rozegraną scenę. Rozdziały startują zwinięte, a opis epizodu pada
 * raz nad należącymi do niego scenami.
 */

import { escapeHtml, badgePewnosci } from './markdown.js';
import { hrefDlaSlug } from './links.js';
import {
  dajStrone,
  dajPostep,
  listaRozdzialow,
  epizodyRozdzialu,
  scenyEpizodu,
  listaScenChronologicznie,
  rozdzialSceny,
} from './data.js';
import { naglowekStrony, stanPusty, okruszki, odmiana } from './render.js';

function dzielniceTagi(s) {
  const slugi = Array.isArray(s.dzielnice) ? s.dzielnice : [];
  return slugi
    .map((d) => dajStrone(d))
    .filter(Boolean)
    .map((d) => `<a class="chip chip-mala" href="${hrefDlaSlug(d.slug, 'dzielnica')}">${escapeHtml(d.tytul)}</a>`)
    .join('');
}

function wierszChronologii(s) {
  const hipotezy = Array.isArray(s.hipotezy) ? s.hipotezy : [];
  return `<li class="chrono-scena" id="${escapeHtml(s.slug)}">
    <div class="chrono-znacznik" aria-hidden="true"></div>
    <div class="chrono-tresc">
      <a class="chrono-tytul" href="${hrefDlaSlug(s.slug, 'scena')}">${escapeHtml(s.tytul)}</a>
      <span class="chrono-meta">${s.numer_sceny ? `scena ${escapeHtml(String(s.numer_sceny))}` : ''}</span>
      ${s.streszczenie ? `<p class="chrono-streszczenie">${escapeHtml(s.streszczenie)}</p>` : ''}
      ${hipotezy.length > 0
        ? `<p class="chrono-hipotezy">${hipotezy.map((h) => `<a href="${hrefDlaSlug(s.slug, 'scena')}#${escapeHtml(h.kotwica)}">odczytanie sceny</a> ${badgePewnosci(h.pewnosc)}`).join(' ')}</p>`
        : ''}
      <p class="chrono-tagi">${dzielniceTagi(s)}</p>
    </div>
  </li>`;
}

export function renderChronologia() {
  const sceny = listaScenChronologicznie();
  const rozdzialy = listaRozdzialow();
  const postep = dajPostep();

  const naglowek = naglowekStrony({
    tytul: 'Chronologia',
    opis: 'Cała opowieść w kolejności zdarzeń — od pierwszej sceny do miejsca, w którym podróż się zatrzymała.',
    meta: sceny.length > 0
      ? `${sceny.length} ${odmiana(sceny.length, ['scena', 'sceny', 'scen'])} · ${rozdzialy.length} ${odmiana(rozdzialy.length, ['rozdział', 'rozdziały', 'rozdziałów'])}`
      : '',
    sciezka: okruszki([{ etykieta: 'Chronologia' }]),
  });

  if (sceny.length === 0) {
    return `${naglowek}${stanPusty('Opowieść nie ma jeszcze żadnej sceny.', 'Chronologia zaczyna się od pierwszej przeżytej sceny.')}`;
  }

  const rozdzialyZEpizodami = rozdzialy
    .map((r) => ({
      rozdzial: r,
      epizody: epizodyRozdzialu(r.slug)
        .map((z) => ({ epizod: z, sceny: scenyEpizodu(z.slug) }))
        .filter((g) => g.sceny.length > 0),
    }))
    .filter((g) => g.epizody.length > 0);

  const bezRozdzialu = sceny.filter((s) => !rozdzialSceny(s));

  const bloki = rozdzialyZEpizodami.map(({ rozdzial, epizody }) => {
    const ile = epizody.reduce((n, g) => n + g.sceny.length, 0);
    const epizodyHtml = epizody.map(({ epizod, sceny: lista }) => `<div class="chrono-epizod">
        <h3 class="chrono-epizod-tytul"><a href="${hrefDlaSlug(epizod.slug, 'epizod')}">${escapeHtml(epizod.tytul)}</a></h3>
        ${epizod.streszczenie ? `<p class="chrono-epizod-opis">${escapeHtml(epizod.streszczenie)}</p>` : ''}
        <ol class="chrono-lista">${lista.map((s) => wierszChronologii(s)).join('')}</ol>
      </div>`).join('');

    return `<details class="chrono-rozdzial">
      <summary class="chrono-rozdzial-tytul"><a href="${hrefDlaSlug(rozdzial.slug, 'rozdzial')}">${escapeHtml(rozdzial.tytul)}</a>
        <span class="meta">${ile} ${odmiana(ile, ['scena', 'sceny', 'scen'])}</span></summary>
      ${epizodyHtml}
    </details>`;
  }).join('');

  const ogon = bezRozdzialu.length > 0
    ? `<details class="chrono-rozdzial">
        <summary class="chrono-rozdzial-tytul">Sceny poza rozdziałami</summary>
        <ol class="chrono-lista">${bezRozdzialu.map((s) => wierszChronologii(s)).join('')}</ol>
      </details>`
    : '';

  const granica = postep.ostatnia
    ? `<p class="chrono-granica">Opowieść zatrzymuje się na scenie
       <a href="${hrefDlaSlug(postep.ostatnia.slug, 'scena')}">${escapeHtml(postep.ostatnia.tytul)}</a>.
       Dalej historia nie jest jeszcze opowiedziana.</p>`
    : '';

  return `${naglowek}${granica}<div class="chronologia">${bloki}${ogon}</div>`;
}
