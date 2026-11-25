/**
 * Widoki pomocnicze ze stopki (ADR 0013):
 *  - `#/co-nowego` — dziennik nowego pokrycia świata i opowieści,
 *  - `#/o-bazie`   — „Jak czytać kronikę”: jedyne miejsce objaśniające kolory
 *                    pochodzenia, pewność hipotez, historię zmian i granicę fabuły.
 */

import { escapeHtml, badgePewnosci } from './markdown.js';
import { hrefDlaSlug } from './links.js';
import { dajDane, dajPostep } from './data.js';
import { naglowekStrony, stanPusty, okruszki } from './render.js';

export function renderCoNowego() {
  const wpisy = dajDane().coNowego ?? [];
  const naglowek = naglowekStrony({
    tytul: 'Co nowego',
    opis: 'Kolejne odcinki podróży, postacie, organizacje i hasła dopisane wraz z postępem w opowieści.',
    sciezka: okruszki([{ etykieta: 'Co nowego' }]),
  });

  if (wpisy.length === 0) {
    return `${naglowek}${stanPusty('Dziennik jest jeszcze pusty.', 'Pierwszy wpis pojawi się wraz z otwarciem opowieści.')}`;
  }

  return `${naglowek}
  <div class="dziennik">
    ${wpisy.map((w) => `<article class="wpis-dziennika boks">
      <h2>${escapeHtml(w.data)}${w.czas ? ` <span class="meta">${escapeHtml(w.czas)}</span>` : ''}</h2>
      <div class="wpis-tresc">${w.html}</div>
    </article>`).join('')}
  </div>`;
}

export function renderOBazie() {
  const postep = dajPostep();
  const granicaHtml = postep.ostatnia
    ? `<p>Obecnie opowieść zatrzymuje się na scenie <a href="${hrefDlaSlug(postep.ostatnia.slug, 'scena')}">${escapeHtml(postep.ostatnia.tytul)}</a>. Nic, co wydarza się dalej, nie trafia na karty kroniki — ani wprost, ani pod postacią pozorowanych przypuszczeń.</p>`
    : '<p>Kronika obejmuje wyłącznie wydarzenia już przeżyte w opowieści.</p>';

  const naglowek = naglowekStrony({
    tytul: 'Jak czytać kronikę',
    opis: 'Przewodnik po oznaczeniach źródeł, pewności interpretacji i granicy opowieści.',
    sciezka: okruszki([{ etykieta: 'Jak czytać kronikę' }]),
  });

  return `${naglowek}
  <div class="przewodnik-czytania">
    <section class="boks">
      <h2>Skąd wiadomo to, co napisano</h2>
      <p>Każdy fragment na karcie ma wyraźną barwę i etykietę pochodzenia. Tytuł boksu mówi, czego fragment dotyczy; barwa wewnątrz boksu rozstrzyga, skąd ta wiedza pochodzi:</p>
      <div class="fragment poziom poziom-dostawa">
        <p class="poziom-nad-trescia"><span class="pochodzenie-etykieta pochodzenie-dostawa">z opowieści</span></p>
        <p>Dosłowne kwestie dialogów, opisy scen, akta i zapiski przytoczone bez przeredagowywania.</p>
      </div>
      <div class="fragment poziom poziom-opracowanie">
        <p class="poziom-nad-trescia"><span class="pochodzenie-etykieta pochodzenie-opracowanie">opracowanie</span></p>
        <p>Streszczenie i wnioski wynikające bezpośrednio z tego, co już padło lub wydarzyło się na ekranie.</p>
      </div>
      <div class="fragment poziom poziom-kwerenda">
        <p class="poziom-nad-trescia"><span class="pochodzenie-etykieta pochodzenie-kwerenda">źródła sprawdzone</span></p>
        <p>Kontekst literacki, historyczny lub językowy potwierdzony zewnętrznym źródłem — zawsze z tytułem, adresem i datą odczytu tuż pod twierdzeniem.</p>
      </div>
      <div class="fragment poziom poziom-model">
        <p class="poziom-nad-trescia"><span class="pochodzenie-etykieta pochodzenie-model">wiedza modelu</span></p>
        <p>Ogólne tło kulturowe lub literackie przywołane bez zewnętrznego przypisu — wyraźnie oddzielone od sprawdzonych źródeł.</p>
      </div>
    </section>

    <section class="boks">
      <h2>Interpretacje, pewność i wcześniejsze odczytania</h2>
      <p>Tam, gdzie opowieść zostawia niedopowiedzenie i pozwala na uzasadniony domysł, fragment przybiera fioletową barwę hipotezy wraz z oszacowaną pewnością w skali 0–100%:</p>
      <div class="fragment poziom poziom-model rodzaj-interpretacja">
        <p class="poziom-nad-trescia">
          <span class="pochodzenie-etykieta pochodzenie-model">wiedza modelu</span>
          ${badgePewnosci(85)} ${badgePewnosci(60)} ${badgePewnosci(30)}
        </p>
        <p>Wysoka pewność (80–100%) oznacza wniosek silnie wsparty przez kilka scen; średnia (50–79%) — prawdopodobny trop z lukami; niska (poniżej 50%) — otwarte przypuszczenie na wczesnym etapie.</p>
      </div>
      <p>Gdy późniejsza scena obala albo koryguje wcześniejszy domysł, dawne brzmienie nie znika bez śladu: zostaje zachowane pod zwijanym paskiem <strong>Wcześniejsze odczytanie</strong> dokładnie w tym boksie, którego dotyczyło, wraz z datą zmiany i wyjaśnieniem, co zmieniło obraz sprawy.</p>
    </section>

    <section class="boks">
      <h2>Granica opowiedzianej historii</h2>
      ${granicaHtml}
      <p>Również literackie pierwowzory postaci w dziale <a href="#/konteksty">Konteksty</a> omawiają wyłącznie te motywy dzieł, które zostały już uruchomione przez rozegrane sceny — zakończenia pierwowzorów nie służą do zdradzania przyszłych zwrotów akcji.</p>
    </section>
  </div>`;
}
