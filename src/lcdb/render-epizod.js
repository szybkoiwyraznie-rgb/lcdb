/**
 * Widoki rozdziałów i epizodów (`#/rozdzialy`, `#/rozdzial/:slug`, `#/epizod/:slug`).
 */

import { escapeHtml } from './markdown.js';
import { hrefDlaSlug } from './links.js';
import { dajDane, dajStrone, listaRozdzialow, epizodyRozdzialu, scenyEpizodu } from './data.js';
import {
  naglowekStrony, okruszki, stanPusty, ukladDwuKolumn, kolumnaBoczna,
  chipTypu, odmiana, nazwaRodzaju, historiaInterpretacjiHtml,
} from './render.js';
import { generatorIdBoksow, spisBoksowHtml } from './spis-boksow.js';

function listaScenEpizodu(sceny) {
  if (sceny.length === 0) {
    return '<p class="pusto">W tym epizodzie nie opowiedziano jeszcze żadnej sceny.</p>';
  }
  return `<ol class="lista-scen-zrodlowa">
    ${sceny.map((s) => `<li>
      <span class="scena-nr">${escapeHtml(s.numer_sceny ?? String(s.kolejnosc))}</span>
      <div>
        <a href="${hrefDlaSlug(s.slug, 'scena')}"><strong>${escapeHtml(s.tytul)}</strong></a>
        ${s.streszczenie ? `<p class="meta">${escapeHtml(s.streszczenie)}</p>` : ''}
      </div>
    </li>`).join('\n    ')}
  </ol>`;
}

function renderujBoksy(strona, dajId, spisPozycji) {
  const boksy = (strona.boksy ?? []);
  if (boksy.length === 0) return '';
  return boksy.map((b) => {
    const id = b.tytul ? dajId(b.tytul) : null;
    if (id && b.tytul) spisPozycji.push({ id, tytul: b.tytul });
    return `<section class="boks"${id ? ` id="${escapeHtml(id)}"` : ''}>
      ${b.tytul ? `<h2>${escapeHtml(b.tytul)}</h2>` : ''}
      ${b.html}
      ${b.tytul ? historiaInterpretacjiHtml(strona, b.tytul) : ''}
    </section>`;
  }).join('\n');
}

export function renderEpizod(slug) {
  const epizod = dajStrone(slug);
  const dane = dajDane();
  if (!epizod || epizod.typ !== 'epizod') {
    return stanPusty('Nie ma takiego epizodu.', '<a href="#/rozdzialy">Rozdziały</a>');
  }

  const rozdzial = epizod.rozdzial ? dane.strony[epizod.rozdzial] : null;
  const rodzenstwo = rozdzial ? epizodyRozdzialu(rozdzial.slug) : [];
  const idx = rodzenstwo.findIndex((z) => z.slug === epizod.slug);
  const nastepny = idx >= 0 ? rodzenstwo[idx + 1] : null;
  const sceny = scenyEpizodu(epizod.slug);
  const href = hrefDlaSlug(epizod.slug, 'epizod');

  const naglowek = naglowekStrony({
    tytul: epizod.tytul,
    opis: epizod.streszczenie ? escapeHtml(epizod.streszczenie) : '',
    meta: [
      rozdzial ? `Rozdział: <a href="${hrefDlaSlug(rozdzial.slug, 'rozdzial')}">${escapeHtml(rozdzial.tytul)}</a>` : '',
      epizod.tytul_kr ? `<span lang="ko">${escapeHtml(epizod.tytul_kr)}</span>` : '',
      epizod.tytul_en ? escapeHtml(epizod.tytul_en) : '',
      epizod.rodzaj ? nazwaRodzaju(epizod.rodzaj) : '',
      epizod.status ? nazwaRodzaju(epizod.status) : '',
    ].filter(Boolean).join(' · '),
    sciezka: okruszki([
      { etykieta: 'Chronologia', href: '#/chronologia' },
      ...(rozdzial ? [{ etykieta: rozdzial.tytul, href: hrefDlaSlug(rozdzial.slug, 'rozdzial') }] : []),
      { etykieta: epizod.tytul },
    ]),
  });

  const stopka = nastepny
    ? `<p class="sekcja-stopka">Dalej: <a href="${hrefDlaSlug(nastepny.slug, 'epizod')}">${escapeHtml(nastepny.tytul)}</a></p>`
    : '<p class="sekcja-stopka pusto">Dalsza część opowieści jeszcze przed nami.</p>';

  const dajId = generatorIdBoksow();
  const spisPozycji = [];
  const boksyHtml = renderujBoksy(epizod, dajId, spisPozycji);
  const idScen = dajId('Sceny po kolei');
  spisPozycji.push({ id: idScen, tytul: 'Sceny po kolei' });

  const tresc = `${boksyHtml}
<section class="boks" id="${escapeHtml(idScen)}">
  <h2>Sceny po kolei</h2>
  ${listaScenEpizodu(sceny)}
  ${stopka}
</section>`;

  const spis = spisBoksowHtml(spisPozycji, href);
  return `${naglowek}${ukladDwuKolumn(tresc, kolumnaBocznaEpizodu(epizod, rozdzial, spis))}`;
}

export function renderRozdzial(slug) {
  const rozdzial = dajStrone(slug);
  if (!rozdzial || rozdzial.typ !== 'rozdzial') {
    return stanPusty('Nie ma takiego rozdziału.', '<a href="#/rozdzialy">Rozdziały</a>');
  }

  const epizody = epizodyRozdzialu(rozdzial.slug);
  const nastepny = rozdzial.nastepny ? dajStrone(rozdzial.nastepny) : null;
  const dzielnice = (rozdzial.dzielnice ?? []).map((k) => dajDane().strony[k]).filter(Boolean);
  const href = hrefDlaSlug(rozdzial.slug, 'rozdzial');

  const naglowek = naglowekStrony({
    tytul: rozdzial.oznaczenie ? `${rozdzial.oznaczenie}: ${rozdzial.tytul}` : rozdzial.tytul,
    opis: rozdzial.streszczenie ? escapeHtml(rozdzial.streszczenie) : '',
    meta: [
      rozdzial.tytul_kr ? `<span lang="ko">${escapeHtml(rozdzial.tytul_kr)}</span>` : '',
      rozdzial.tytul_en ? escapeHtml(rozdzial.tytul_en) : '',
      rozdzial.tytul_oboczny ? `<span class="tytul-oboczny">${escapeHtml(String(rozdzial.tytul_oboczny))}</span>` : '',
      rozdzial.rodzaj_rozdzialu ? nazwaRodzaju(rozdzial.rodzaj_rozdzialu) : '',
      rozdzial.czas_akcji ? `czas wydarzeń: ${escapeHtml(rozdzial.czas_akcji)}` : '',
      dzielnice.length > 0
        ? dzielnice.map((k) => `<a href="${hrefDlaSlug(k.slug, 'dzielnica')}">${escapeHtml(k.tytul)}</a>`).join(', ')
        : '',
      rozdzial.status ? nazwaRodzaju(rozdzial.status) : '',
    ].filter(Boolean).join(' · '),
    sciezka: okruszki([{ etykieta: 'Rozdziały', href: '#/rozdzialy' }, { etykieta: rozdzial.tytul }]),
  });

  const listaEpizodow = epizody.length > 0
    ? `<ol class="lista-epizodow">
        ${epizody.map((z) => {
          const sceny = scenyEpizodu(z.slug);
          return `<li class="epizod-wiersz">
            <a class="epizod-tytul" href="${hrefDlaSlug(z.slug, 'epizod')}">${escapeHtml(z.tytul)}</a>
            ${z.rodzaj ? `<span class="meta"> · ${escapeHtml(nazwaRodzaju(z.rodzaj))}</span>` : ''}
            <span class="epizod-sceny"> · ${sceny.length} ${odmiana(sceny.length, ['scena', 'sceny', 'scen'])}</span>
            ${z.streszczenie ? `<p class="epizod-streszczenie">${escapeHtml(z.streszczenie)}</p>` : ''}
          </li>`;
        }).join('\n        ')}
      </ol>`
    : '<p class="pusto">W tym rozdziale nie opowiedziano jeszcze żadnego epizodu.</p>';

  const stopka = nastepny
    ? `<p class="sekcja-stopka">Następny rozdział: <a href="${hrefDlaSlug(nastepny.slug, 'rozdzial')}">${escapeHtml(nastepny.tytul)}</a></p>`
    : '';

  const dajId = generatorIdBoksow();
  const spisPozycji = [];
  const boksyHtml = renderujBoksy(rozdzial, dajId, spisPozycji);
  const idEpizodow = dajId('Epizody');
  spisPozycji.push({ id: idEpizodow, tytul: 'Epizody' });

  const tresc = `${boksyHtml}
<section class="boks" id="${escapeHtml(idEpizodow)}">
  <h2>Epizody</h2>
  ${listaEpizodow}
  ${stopka}
</section>`;

  const spis = spisBoksowHtml(spisPozycji, href);
  return `${naglowek}${ukladDwuKolumn(tresc, kolumnaBocznaRozdzialu(rozdzial, spis))}`;
}

function kolumnaBocznaEpizodu(epizod, rozdzial, spisBoksow) {
  const dane = dajDane();
  const grupy = [];
  const dodaj = (tytul, pole) => {
    const wartosc = epizod[pole];
    const slugi = Array.isArray(wartosc) ? wartosc : (wartosc ? [wartosc] : []);
    const strony = slugi.map((s) => dane.strony[s]).filter(Boolean);
    if (strony.length === 0) return;
    grupy.push({
      tytul,
      html: `<ul class="chipy">${strony.map((s) => `<li>${chipTypu(s.slug, s.typ, s.tytul, '')}</li>`).join('')}</ul>`,
    });
  };
  if (rozdzial) {
    grupy.push({
      tytul: 'Rozdział',
      html: `<ul class="chipy"><li>${chipTypu(rozdzial.slug, 'rozdzial', rozdzial.tytul, '')}</li></ul>`,
    });
  }
  dodaj('Dzielnice', 'dzielnice');
  dodaj('Miejsca', 'miejsca');
  dodaj('Frakcje', 'frakcje');
  dodaj('Postacie', 'postacie');
  dodaj('Wątki', 'watki');
  dodaj('Konteksty', 'konteksty');
  dodaj('Pojęcia', 'pojecia');
  return kolumnaBoczna(grupy, 'Kontekst epizodu', { spisBoksow });
}

function kolumnaBocznaRozdzialu(rozdzial, spisBoksow) {
  const dane = dajDane();
  const grupy = [];
  const dodaj = (tytul, pole) => {
    const strony = (rozdzial[pole] ?? []).map((s) => dane.strony[s]).filter(Boolean);
    if (strony.length === 0) return;
    grupy.push({
      tytul,
      html: `<ul class="chipy">${strony.map((s) => `<li>${chipTypu(s.slug, s.typ, s.tytul, '')}</li>`).join('')}</ul>`,
    });
  };
  dodaj('Dzielnice', 'dzielnice');
  dodaj('Frakcje', 'frakcje');
  dodaj('Wątki', 'watki');
  dodaj('Postacie', 'postacie');
  return kolumnaBoczna(grupy, 'Kontekst rozdziału', { spisBoksow });
}

export function renderRozdzialy() {
  const rozdzialy = listaRozdzialow();
  const naglowek = naglowekStrony({
    tytul: 'Rozdziały podróży',
    opis: 'Prolog, kolejne Pieśni, interludia i krótkie opowieści w porządku, w jakim prowadzą przez Miasto.',
    meta: `${rozdzialy.length} ${odmiana(rozdzialy.length, ['rozdział', 'rozdziały', 'rozdziałów'])}`,
    sciezka: okruszki([{ etykieta: 'Rozdziały' }]),
  });

  if (rozdzialy.length === 0) {
    return `${naglowek}${stanPusty('Nie ma jeszcze żadnego rozdziału.', 'Pierwszy rozdział otwiera się wraz z pierwszą sceną.')}`;
  }

  return `${naglowek}<ol class="lista-rozdzialow-rozwinieta">
    ${rozdzialy.map((r) => {
      const epizody = epizodyRozdzialu(r.slug);
      const scen = epizody.reduce((n, z) => n + scenyEpizodu(z.slug).length, 0);
      const dzielnice = (r.dzielnice ?? []).map((k) => dajDane().strony[k]).filter(Boolean);
      return `<li class="rozdzial-karta boks">
        <a class="rozdzial-tytul" href="${hrefDlaSlug(r.slug, 'rozdzial')}">
          ${r.oznaczenie ? `<span class="rozdzial-oznaczenie">${escapeHtml(r.oznaczenie)}</span> ` : ''}${escapeHtml(r.tytul)}
        </a>
        ${r.tytul_oboczny ? `<span class="tytul-oboczny"> · ${escapeHtml(String(r.tytul_oboczny))}</span>` : ''}
        <p class="meta">${[
          r.rodzaj_rozdzialu ? nazwaRodzaju(r.rodzaj_rozdzialu) : '',
          r.czas_akcji ? escapeHtml(r.czas_akcji) : '',
          dzielnice.map((k) => escapeHtml(k.tytul)).join(' · '),
          `${epizody.length} ${odmiana(epizody.length, ['epizod', 'epizody', 'epizodów'])}`,
          `${scen} ${odmiana(scen, ['scena', 'sceny', 'scen'])}`,
        ].filter(Boolean).join(' · ')}</p>
        ${r.streszczenie ? `<p>${escapeHtml(r.streszczenie)}</p>` : ''}
      </li>`;
    }).join('\n    ')}
  </ol>`;
}
