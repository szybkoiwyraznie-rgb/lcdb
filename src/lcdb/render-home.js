/**
 * Strona główna kroniki (`#/`).
 */

import { escapeHtml, badgePewnosci } from './markdown.js';
import { hrefDlaSlug, hrefListy, hrefKotwicy } from './links.js';
import {
  dajDane, listaRozdzialow, wszystkieSceny, ostatniaScena, wszystkieHipotezy,
} from './data.js';
import { odmiana, nazwaTypu } from './render.js';

const KAFLE_DZIALOW = [
  { typ: 'rozdzial', opis: 'Pieśni, interludia i krótkie opowieści z drogi przez Miasto' },
  { typ: 'epizod', opis: 'Kolejne przystanki i zamknięte etapy podróży' },
  { typ: 'scena', opis: 'Dosłowne rozmowy, zdarzenia i ich odczytanie' },
  { typ: 'watek', opis: 'Pytania, obietnice i tajemnice biegnące przez rozdziały' },
  { typ: 'postac', opis: 'Grzesznicy, przewodnicy i mieszkańcy Miasta' },
  { typ: 'frakcja', opis: 'Skrzydła, stowarzyszenia Fixerów, biura i syndykaty' },
  { typ: 'dzielnica', opis: 'Dzielnice Miasta, Gniazda, Zaułki i pogranicze' },
  { typ: 'miejsce', opis: 'Autobus, filie, warsztaty i zaułki poznane po drodze' },
  { typ: 'kontekst', opis: 'Dzieła literackie, mity i idee odbite w opowieści' },
  { typ: 'pojecie', opis: 'Zjawiska, anomalie, osobliwości i prawa rządzące Miastem' },
];

export function renderHome() {
  const dane = dajDane();
  const st = dane.statystyki ?? {};
  const ostatnia = ostatniaScena();
  const sceny = wszystkieSceny().slice(-5).reverse();
  const rozdzialy = listaRozdzialow();
  const hipotezy = wszystkieHipotezy().slice(0, 5);

  const granicaHtml = ostatnia
    ? `<p class="hero-granica">Dotąd opowiedziane: <a href="${hrefDlaSlug(ostatnia.slug, 'scena')}"><strong>${escapeHtml(ostatnia.tytul)}</strong></a> · <a href="#/chronologia">cała chronologia</a></p>`
    : '';

  const hero = `<section class="hero">
  <p class="hero-nadtytul">Dziennik podróży przez Miasto</p>
  <h1>Limbus Company — kronika opowieści</h1>
  <p class="hero-opis">Świat poznawany scena po scenie: postacie, nici fabularne, dzielnice Miasta oraz literackie echa, które zdążyły już wybrzmieć — bez zaglądania za zasłonę tego, co dopiero nadejdzie.</p>
  ${granicaHtml}
  <form class="hero-szukaj" data-szukaj-form action="#/szukaj">
    <label class="ukryty-etykieta" for="hero-q">Szukaj w kronice</label>
    <input id="hero-q" name="q" type="search" placeholder="Szukaj imienia, miejsca, motywu lub cytatu…" autocomplete="off">
    <button type="submit">Szukaj</button>
  </form>
</section>`;

  const kafle = `<section class="sekcja-home" aria-label="Działy kroniki">
  <div class="siatka-kafli">
    ${KAFLE_DZIALOW.map(({ typ, opis }) => {
      const ile = st[typ] ?? 0;
      const odm = nazwaTypu(typ, true);
      return `<a class="kafel kafel-${typ}" href="${hrefListy(typ)}">
        <span class="kafel-liczba">${ile}</span>
        <strong class="kafel-tytul">${escapeHtml(odm)}</strong>
        <span class="kafel-opis">${escapeHtml(opis)}</span>
      </a>`;
    }).join('\n    ')}
    <a class="kafel kafel-hipotezy" href="#/hipotezy">
      <span class="kafel-liczba">${wszystkieHipotezy().length}</span>
      <strong class="kafel-tytul">Interpretacje</strong>
      <span class="kafel-opis">Odczytania i przypuszczenia opatrzone miarą pewności</span>
    </a>
  </div>
</section>`;

  const coNowego = dane.coNowegoHtml
    ? `<section class="boks home-dziennik">
      <div class="boks-naglowek-wiersz">
        <h2>Ostatnio opowiedziane</h2>
        <a class="meta" href="#/co-nowego">pełny dziennik →</a>
      </div>
      <div class="dziennik-skrot">${dane.coNowegoHtml}</div>
    </section>`
    : '';

  const ostatnieScenyHtml = sceny.length > 0
    ? `<section class="boks">
      <div class="boks-naglowek-wiersz">
        <h2>Ostatnie wydarzenia</h2>
        <a class="meta" href="#/sceny">wszystkie sceny →</a>
      </div>
      <ol class="lista-scen-zrodlowa">
        ${sceny.map((s) => `<li>
          <span class="scena-nr">${escapeHtml(s.numer_sceny ?? String(s.kolejnosc))}</span>
          <div>
            <a href="${hrefDlaSlug(s.slug, 'scena')}"><strong>${escapeHtml(s.tytul)}</strong></a>
            ${s.streszczenie ? `<p class="meta">${escapeHtml(s.streszczenie)}</p>` : ''}
          </div>
        </li>`).join('\n        ')}
      </ol>
    </section>`
    : '';

  const rozdzialyHtml = rozdzialy.length > 0
    ? `<section class="boks">
      <div class="boks-naglowek-wiersz">
        <h2>Rozdziały podróży</h2>
        <a class="meta" href="#/rozdzialy">wszystkie (${rozdzialy.length}) →</a>
      </div>
      <ol class="lista-prosta">
        ${rozdzialy.map((r) => `<li>
          <a href="${hrefDlaSlug(r.slug, 'rozdzial')}">
            ${r.oznaczenie ? `<span class="rozdzial-oznaczenie">${escapeHtml(r.oznaczenie)}</span> ` : ''}<strong>${escapeHtml(r.tytul)}</strong>
          </a>
          ${r.czas_akcji ? `<span class="meta"> · ${escapeHtml(r.czas_akcji)}</span>` : ''}
        </li>`).join('\n        ')}
      </ol>
    </section>`
    : '';

  const hipotezyHtml = hipotezy.length > 0
    ? `<section class="boks">
      <div class="boks-naglowek-wiersz">
        <h2>Otwarte interpretacje</h2>
        <a class="meta" href="#/hipotezy">wszystkie →</a>
      </div>
      <ul class="lista-prosta">
        ${hipotezy.map((h) => `<li>
          <a href="${hrefKotwicy(h.slug, h.typ, h.kotwica)}">${escapeHtml(h.pytanie || h.sekcja)}</a>
          <span class="meta"> · ${escapeHtml(h.tytulStrony)}</span>
          ${badgePewnosci(h.pewnosc)}
        </li>`).join('\n        ')}
      </ul>
    </section>`
    : '';

  return `${hero}
${kafle}
<div class="siatka-home-dol">
  <div class="home-kolumna">${coNowego}${ostatnieScenyHtml}</div>
  <div class="home-kolumna">${rozdzialyHtml}${hipotezyHtml}</div>
</div>`;
}
