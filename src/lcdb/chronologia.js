/**
 * Widok chronologii opowieści (`#/chronologia`).
 *
 * Rozdziały (Prolog, Pieśni, Interludia, Krótkie opowieści) rozwijają epizody,
 * a epizody — sceny w porządku, w jakim wybrzmiały.
 */

import { escapeHtml } from './markdown.js';
import { hrefDlaSlug } from './links.js';
import {
  listaRozdzialow, epizodyRozdzialu, scenyEpizodu, wszystkieSceny, ostatniaScena, dajDane,
} from './data.js';
import { naglowekStrony, okruszki, stanPusty, odmiana, nazwaRodzaju } from './render.js';

export function renderChronologia() {
  const rozdzialy = listaRozdzialow();
  const sceny = wszystkieSceny();
  const ostatnia = ostatniaScena();
  const dane = dajDane();

  const metaCzesci = [
    `${rozdzialy.length} ${odmiana(rozdzialy.length, ['rozdział', 'rozdziały', 'rozdziałów'])}`,
    `${sceny.length} ${odmiana(sceny.length, ['scena', 'sceny', 'scen'])}`,
    ostatnia ? `ostatnie wydarzenie: <a href="${hrefDlaSlug(ostatnia.slug, 'scena')}">${escapeHtml(ostatnia.tytul)}</a>` : '',
  ].filter(Boolean).join(' · ');

  const naglowek = naglowekStrony({
    tytul: 'Chronologia podróży',
    opis: 'Droga przez Miasto ułożona dokładnie tak, jak odsłaniały się kolejne wydarzenia.',
    meta: metaCzesci,
    sciezka: okruszki([{ etykieta: 'Chronologia' }]),
  });

  if (rozdzialy.length === 0) {
    return `${naglowek}${stanPusty('Podróż jeszcze się nie zaczęła.', 'Pierwsze wydarzenia pojawią się wraz z otwarciem opowieści.')}`;
  }

  const drzewo = rozdzialy.map((r, idxR) => {
    const epizody = epizodyRozdzialu(r.slug);
    const ileScen = epizody.reduce((s, e) => s + scenyEpizodu(e.slug).length, 0);
    const otwartyR = idxR === rozdzialy.length - 1 ? ' open' : '';
    const oznaczenie = r.oznaczenie ? `<span class="rozdzial-oznaczenie">${escapeHtml(r.oznaczenie)}</span> ` : '';
    const czasAkcji = r.czas_akcji ? ` · <span class="mono">${escapeHtml(r.czas_akcji)}</span>` : '';
    const dzielnice = (r.dzielnice ?? [])
      .map((d) => dane.strony[d]?.tytul)
      .filter(Boolean)
      .map(escapeHtml)
      .join(', ');

    const epizodyHtml = epizody.map((ep, idxE) => {
      const scenyEp = scenyEpizodu(ep.slug);
      const otwartyE = idxR === rozdzialy.length - 1 && idxE === epizody.length - 1 ? ' open' : '';
      const listaScen = scenyEp.length > 0
        ? `<ol class="chrono-sceny">
            ${scenyEp.map((sc) => {
              const czyOstatnia = ostatnia && sc.slug === ostatnia.slug;
              return `<li class="chrono-scena${czyOstatnia ? ' chrono-ostatnia' : ''}">
                <span class="scena-nr">${escapeHtml(sc.numer_sceny ?? String(sc.kolejnosc))}</span>
                <div class="chrono-scena-cialo">
                  <a class="chrono-scena-tytul" href="${hrefDlaSlug(sc.slug, 'scena')}">${escapeHtml(sc.tytul)}</a>
                  ${czyOstatnia ? '<span class="znaczek-granica">dotąd opowiedziane</span>' : ''}
                  ${sc.streszczenie ? `<p class="chrono-scena-opis">${escapeHtml(sc.streszczenie)}</p>` : ''}
                </div>
              </li>`;
            }).join('\n            ')}
          </ol>`
        : '<p class="pusto">W tym epizodzie nie wybrzmiała jeszcze żadna scena.</p>';

      return `<details class="chrono-epizod"${otwartyE}>
        <summary>
          <span class="chrono-epizod-tytul">${escapeHtml(ep.tytul)}</span>
          <span class="meta">${ep.rodzaj ? `${escapeHtml(nazwaRodzaju(ep.rodzaj))} · ` : ''}${scenyEp.length} ${odmiana(scenyEp.length, ['scena', 'sceny', 'scen'])} · <a href="${hrefDlaSlug(ep.slug, 'epizod')}">karta epizodu</a></span>
        </summary>
        ${listaScen}
      </details>`;
    }).join('\n      ');

    return `<details class="chrono-rozdzial boks"${otwartyR}>
      <summary>
        <span class="chrono-rozdzial-naglowek">${oznaczenie}<strong>${escapeHtml(r.tytul)}</strong></span>
        <span class="meta">${dzielnice ? `${dzielnice} · ` : ''}${epizody.length} ${odmiana(epizody.length, ['epizod', 'epizody', 'epizodów'])} · ${ileScen} ${odmiana(ileScen, ['scena', 'sceny', 'scen'])}${czasAkcji} · <a href="${hrefDlaSlug(r.slug, 'rozdzial')}">karta rozdziału</a></span>
      </summary>
      ${r.streszczenie ? `<p class="chrono-rozdzial-opis">${escapeHtml(r.streszczenie)}</p>` : ''}
      <div class="chrono-epizody">${epizodyHtml || '<p class="pusto">Brak epizodów.</p>'}</div>
    </details>`;
  }).join('\n');

  return `${naglowek}\n<div class="chrono-drzewo">${drzewo}</div>`;
}
