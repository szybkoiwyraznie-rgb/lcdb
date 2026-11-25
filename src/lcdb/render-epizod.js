/**
 * Widoki rozdziałów (Prolog, Pieśni, Intervalla), listy rozdziałów oraz epizodów.
 */

import { escapeHtml } from './markdown.js';
import { hrefDlaSlug } from './links.js';
import {
  dajStrone,
  listaRozdzialow,
  epizodyRozdzialu,
  scenyEpizodu,
} from './data.js';
import {
  naglowekStrony,
  stanPusty,
  nieZnalesc,
  okruszki,
  odmiana,
  nazwaRodzaju,
  tytulOryginalu,
  grupaLinkow,
} from './render.js';
import { spisBoksow } from './spis-boksow.js';

function odfiltrujWstep(boksy, maWstep) {
  const lista = Array.isArray(boksy) ? boksy : [];
  if (!maWstep) return lista;
  return lista.filter((b) => b.tytul !== 'Streszczenie' || b.maHistorie);
}

export function renderRozdzialy() {
  const rozdzialy = listaRozdzialow();
  const naglowek = naglowekStrony({
    tytul: 'Rozdziały',
    opis: 'Podróż przez Miasto podzielona na prolog, kolejne Pieśni i antrakty.',
    meta: `${rozdzialy.length} ${odmiana(rozdzialy.length, ['rozdział', 'rozdziały', 'rozdziałów'])}`,
    sciezka: okruszki([{ etykieta: 'Rozdziały' }]),
  });

  if (rozdzialy.length === 0) {
    return `${naglowek}${stanPusty('Nie ma jeszcze żadnego rozdziału.', 'Pierwszy rozdział pojawi się wraz z rozpoczęciem podróży.')}`;
  }

  const karty = rozdzialy.map((r) => {
    const epizody = epizodyRozdzialu(r.slug);
    const ileScen = epizody.reduce((n, ep) => n + scenyEpizodu(ep.slug).length, 0);
    const oznaczony = r.oznaczony || nazwaRodzaju(r.rodzaj_rozdzialu);
    const status = r.status ? nazwaRodzaju(r.status) : '';
    return `<li class="karta-rozdzialu">
      <div class="karta-rozdzialu-naglowek">
        <span class="rozdzial-oznaczenie">${escapeHtml(oznaczony)}</span>
        ${status ? `<span class="meta">${escapeHtml(status)}</span>` : ''}
      </div>
      <h2><a href="${hrefDlaSlug(r.slug, 'rozdzial')}">${escapeHtml(r.tytul)}</a></h2>
      ${r.tytul_oboczny ? `<p class="podtytul">${escapeHtml(r.tytul_oboczny)}</p>` : ''}
      ${r.streszczenie ? `<p class="karta-opis">${escapeHtml(r.streszczenie)}</p>` : ''}
      <p class="meta">
        ${epizody.length} ${odmiana(epizody.length, ['epizod', 'epizody', 'epizodów'])}
        · ${ileScen} ${odmiana(ileScen, ['scena', 'sceny', 'scen'])}
      </p>
    </li>`;
  }).join('');

  return `${naglowek}<ol class="lista-rozdzialow">${karty}</ol>`;
}

export function renderRozdzial(slug) {
  const r = dajStrone(slug);
  if (!r || r.typ !== 'rozdzial') return nieZnalesc(slug);

  const epizody = epizodyRozdzialu(r.slug);
  const metaCzesci = [];
  if (r.oznaczony) metaCzesci.push(r.oznaczony);
  else if (r.rodzaj_rozdzialu) metaCzesci.push(nazwaRodzaju(r.rodzaj_rozdzialu));
  if (r.status) metaCzesci.push(nazwaRodzaju(r.status));
  const oryg = tytulOryginalu(r);
  if (oryg) metaCzesci.push(oryg);

  const naglowek = naglowekStrony({
    tytul: r.tytul,
    podtytul: r.tytul_oboczny ?? '',
    opis: r.streszczenie ?? '',
    meta: metaCzesci.join(' · '),
    sciezka: okruszki([
      { etykieta: 'Rozdziały', href: '#/rozdzialy' },
      { etykieta: r.tytul },
    ]),
  });

  const widoczneBoksy = odfiltrujWstep(r.boksy, Boolean(r.streszczenie));
  const epizodyBoks = epizody.length > 0
    ? `<section class="boks" id="boks-epizody-rozdzialu">
        <h2>Przebieg rozdziału</h2>
        <ol class="lista-epizodow-rozdzialu">
          ${epizody.map((ep) => {
            const sceny = scenyEpizodu(ep.slug);
            return `<li class="epizod-blok">
              <h3><a href="${hrefDlaSlug(ep.slug, 'epizod')}">${escapeHtml(ep.tytul)}</a></h3>
              ${ep.streszczenie ? `<p class="epizod-opis">${escapeHtml(ep.streszczenie)}</p>` : ''}
              ${sceny.length > 0
                ? `<ol class="lista-scen-zwarty">
                    ${sceny.map((s) => `<li><span class="scena-numer">${escapeHtml(String(s.numer_sceny ?? ''))}</span> <a href="${hrefDlaSlug(s.slug, 'scena')}">${escapeHtml(s.tytul)}</a></li>`).join('')}
                  </ol>`
                : ''}
            </li>`;
          }).join('')}
        </ol>
      </section>`
    : '';

  const boksyDoSpisu = [
    ...(epizody.length > 0 ? [{ id: 'boks-epizody-rozdzialu', tytul: 'Przebieg rozdziału' }] : []),
    ...widoczneBoksy,
  ];

  const grzesznik = r.grzesznik ? dajStrone(r.grzesznik) : null;
  const nastepny = r.nastepny ? dajStrone(r.nastepny) : null;

  const boczna = [
    spisBoksow(boksyDoSpisu),
    grzesznik
      ? `<div class="grupa-boczna"><h3>W centrum opowieści</h3><p><a href="${hrefDlaSlug(grzesznik.slug, 'postac')}">${escapeHtml(grzesznik.tytul)}</a></p></div>`
      : '',
    grupaLinkow('Dzielnice', r.dzielnice, 'dzielnica'),
    grupaLinkow('Organizacje', r.organizacje, 'organizacja'),
    grupaLinkow('Postacie', r.postacie, 'postac'),
    grupaLinkow('Wątki', r.watki, 'watek'),
    nastepny
      ? `<div class="grupa-boczna"><h3>Dalej</h3><p><a href="${hrefDlaSlug(nastepny.slug, 'rozdzial')}">${escapeHtml(nastepny.tytul)} →</a></p></div>`
      : '',
  ].filter(Boolean).join('');

  return `${naglowek}
  <div class="uklad-karty">
    <div class="kolumna-glowna">${epizodyBoks}${widoczneBoksy.map((b) => b.html).join('\n')}</div>
    <aside class="kolumna-boczna">${boczna}</aside>
  </div>`;
}

export function renderEpizod(slug) {
  const z = dajStrone(slug);
  if (!z || z.typ !== 'epizod') return nieZnalesc(slug);

  const rozdzial = z.rozdzial ? dajStrone(z.rozdzial) : null;
  const sceny = scenyEpizodu(z.slug);

  const sciezkaElementy = [{ etykieta: 'Rozdziały', href: '#/rozdzialy' }];
  if (rozdzial) sciezkaElementy.push({ etykieta: rozdzial.tytul, href: hrefDlaSlug(rozdzial.slug, 'rozdzial') });
  sciezkaElementy.push({ etykieta: z.tytul });

  const metaCzesci = [];
  if (z.rodzaj) metaCzesci.push(nazwaRodzaju(z.rodzaj));
  if (z.status) metaCzesci.push(nazwaRodzaju(z.status));
  metaCzesci.push(`${sceny.length} ${odmiana(sceny.length, ['scena', 'sceny', 'scen'])}`);
  const oryg = tytulOryginalu(z);
  if (oryg) metaCzesci.push(oryg);

  const naglowek = naglowekStrony({
    tytul: z.tytul,
    opis: z.streszczenie ?? '',
    meta: metaCzesci.join(' · '),
    sciezka: okruszki(sciezkaElementy),
  });

  const widoczneBoksy = odfiltrujWstep(z.boksy, Boolean(z.streszczenie));
  const scenyBoks = sceny.length > 0
    ? `<section class="boks" id="boks-sceny-epizodu">
        <h2>Sceny epizodu</h2>
        <ol class="lista-scen-chronologia">
          ${sceny.map((s) => `<li class="scena-wiersz">
            <div class="scena-numer">${escapeHtml(String(s.numer_sceny ?? ''))}</div>
            <div class="scena-tresc">
              <a class="scena-tytul" href="${hrefDlaSlug(s.slug, 'scena')}">${escapeHtml(s.tytul)}</a>
              ${s.streszczenie ? `<p class="scena-streszczenie">${escapeHtml(s.streszczenie)}</p>` : ''}
            </div>
          </li>`).join('')}
        </ol>
      </section>`
    : '';

  const boksyDoSpisu = [
    ...(sceny.length > 0 ? [{ id: 'boks-sceny-epizodu', tytul: 'Sceny epizodu' }] : []),
    ...widoczneBoksy,
  ];

  const boczna = [
    spisBoksow(boksyDoSpisu),
    grupaLinkow('Miejsca', z.miejsca, 'miejsce'),
    grupaLinkow('Dzielnice', z.dzielnice, 'dzielnica'),
    grupaLinkow('Postacie', z.postacie, 'postac'),
    grupaLinkow('Organizacje', z.organizacje, 'organizacja'),
    grupaLinkow('Wątki', z.watki, 'watek'),
    grupaLinkow('Konteksty', z.konteksty, 'kontekst'),
  ].filter(Boolean).join('');

  return `${naglowek}
  <div class="uklad-karty">
    <div class="kolumna-glowna">${scenyBoks}${widoczneBoksy.map((b) => b.html).join('\n')}</div>
    <aside class="kolumna-boczna">${boczna}</aside>
  </div>`;
}
