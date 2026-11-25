/**
 * Strona startowa kroniki: punkt na osi opowieści, kafelki działów,
 * ostatnie sceny, otwarte interpretacje i najnowsze wpisy dziennika.
 */

import { escapeHtml, badgePewnosci } from './markdown.js';
import { hrefDlaSlug } from './links.js';
import {
  dajDane,
  dajPostep,
  listaScenChronologicznie,
  listaStronZHipotezami,
  liczbaHipotez,
} from './data.js';
import { odmiana } from './render.js';

const KAFELKI = [
  { href: '#/rozdzialy', klucz: 'rozdzial', etykieta: 'Rozdziały', opis: 'Prolog, Pieśni i antrakty' },
  { href: '#/postacie', klucz: 'postac', etykieta: 'Postacie', opis: 'Grzesznicy, przewodnik i mieszkańcy' },
  { href: '#/watki', klucz: 'watek', etykieta: 'Wątki', opis: 'Nici biegnące przez sceny' },
  { href: '#/organizacje', klucz: 'organizacja', etykieta: 'Organizacje', opis: 'Skrzydła, Zrzeszenia i Syndykaty' },
  { href: '#/dzielnice', klucz: 'dzielnica', etykieta: 'Dzielnice', opis: 'Gniazda, Zaułki i rubieże Miasta' },
  { href: '#/miejsca', klucz: 'miejsce', etykieta: 'Miejsca', opis: 'Pokład, stacje i ruiny' },
  { href: '#/pojecia', klucz: 'pojecie', etykieta: 'Hasła', opis: 'Zjawiska, istoty, technologie i lustra' },
  { href: '#/konteksty', klucz: 'kontekst', etykieta: 'Konteksty', opis: 'Literatura, poematy i mity' },
];

export function renderGlowna() {
  const dane = dajDane();
  const stat = dane.statystyki ?? {};
  const postep = dajPostep();
  const sceny = listaScenChronologicznie();
  const ostatnieSceny = sceny.slice(-4).reverse();
  const zHipotezami = listaStronZHipotezami().slice(0, 5);
  const razemHipotez = liczbaHipotez();
  const dziennik = (dane.coNowego ?? []).slice(0, 3);

  const granicaHtml = postep.ostatnia
    ? `<div class="hero-granica">
        <span class="hero-granica-etykieta">Miejsce w opowieści</span>
        <p class="hero-granica-tekst">
          ${postep.rozdzial ? `<a href="${hrefDlaSlug(postep.rozdzial.slug, 'rozdzial')}">${escapeHtml(postep.rozdzial.tytul)}</a> · ` : ''}
          ostatnia opowiedziana scena:
          <a href="${hrefDlaSlug(postep.ostatnia.slug, 'scena')}">${escapeHtml(postep.ostatnia.tytul)}</a>
          <span class="meta">(${postep.scen} ${odmiana(postep.scen, ['scena', 'sceny', 'scen'])})</span>
        </p>
      </div>`
    : '';

  const kafelkiHtml = KAFELKI.map((k) => {
    const ile = stat[k.klucz] ?? 0;
    return `<a class="kafelek" href="${k.href}">
      <span class="kafelek-liczba">${ile}</span>
      <span class="kafelek-tytul">${escapeHtml(k.etykieta)}</span>
      <span class="kafelek-opis">${escapeHtml(k.opis)}</span>
    </a>`;
  }).join('');

  const scenyHtml = ostatnieSceny.length > 0
    ? `<section class="sekcja-startowa">
        <div class="sekcja-naglowek">
          <h2>Ostatnie sceny</h2>
          <a class="link-wszystkie" href="#/chronologia">Cała chronologia →</a>
        </div>
        <ol class="lista-scen-start">
          ${ostatnieSceny.map((s) => `<li>
            <span class="scena-numer">${escapeHtml(String(s.numer_sceny ?? ''))}</span>
            <div>
              <a class="scena-tytul" href="${hrefDlaSlug(s.slug, 'scena')}">${escapeHtml(s.tytul)}</a>
              ${s.streszczenie ? `<p class="scena-streszczenie">${escapeHtml(s.streszczenie)}</p>` : ''}
            </div>
          </li>`).join('')}
        </ol>
      </section>`
    : '';

  const hipotezyHtml = zHipotezami.length > 0
    ? `<section class="sekcja-startowa">
        <div class="sekcja-naglowek">
          <h2>Otwarte pytania</h2>
          <a class="link-wszystkie" href="#/hipotezy">Wszystkie (${razemHipotez}) →</a>
        </div>
        <ul class="lista-hipotez-start">
          ${zHipotezami.flatMap((s) => (s.hipotezy ?? []).slice(0, 2).map((h) => `<li>
            <a class="chip-hipotezy" href="${hrefDlaSlug(s.slug, s.typ)}#${escapeHtml(h.kotwica)}">
              <span>${escapeHtml(h.pytanie ?? s.tytul)}</span>
              ${badgePewnosci(h.pewnosc)}
            </a>
            <span class="meta">${escapeHtml(s.tytul)}</span>
          </li>`)).slice(0, 6).join('')}
        </ul>
      </section>`
    : '';

  const dziennikHtml = dziennik.length > 0
    ? `<section class="sekcja-startowa">
        <div class="sekcja-naglowek">
          <h2>Ostatnio dopisane</h2>
          <a class="link-wszystkie" href="#/co-nowego">Pełny dziennik →</a>
        </div>
        <div class="dziennik-skrot">
          ${dziennik.map((wpis) => `<article class="wpis-dziennika-skrot">
            <h3>${escapeHtml(wpis.data)}${wpis.czas ? ` <span class="meta">${escapeHtml(wpis.czas)}</span>` : ''}</h3>
            <div class="wpis-tresc">${wpis.html}</div>
          </article>`).join('')}
        </div>
      </section>`
    : '';

  return `<section class="hero">
    <p class="hero-nadtytul">Kronika podróży przez Miasto</p>
    <h1>Limbus Company</h1>
    <p class="hero-opis">
      Opowieść prowadzona krok w krok za rozegranymi scenami — od słów, które padły na pokładzie
      i w zaułkach Miasta, przez powiązania osób, organizacji i wątków, po literackie echa.
      Nic tu nie wyprzedza miejsca, do którego dotarła historia.
    </p>
    ${granicaHtml}
    <div class="siatka-kafelkow">${kafelkiHtml}</div>
  </section>
  <div class="uklad-startowy">
    <div class="kolumna-startowa-glowna">${scenyHtml}${dziennikHtml}</div>
    <div class="kolumna-startowa-boczna">${hipotezyHtml}</div>
  </div>`;
}
