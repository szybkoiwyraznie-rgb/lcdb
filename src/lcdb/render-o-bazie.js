/**
 * Widoki pomocnicze: pełny dziennik pokrycia (`#/co-nowego`) oraz przewodnik czytelnika (`#/o-bazie`).
 */

import { escapeHtml } from './markdown.js';
import { dajDane, coNowegoCzas } from './data.js';
import { naglowekStrony, okruszki, stanPusty, legendaPoziomow } from './render.js';

export function renderCoNowego() {
  const dane = dajDane();
  const html = dane.coNowegoPelneHtml || dane.coNowegoHtml || '';
  const czas = coNowegoCzas();

  const naglowek = naglowekStrony({
    tytul: 'Ostatnio opowiedziane',
    opis: 'Kolejne odsłony podróży dopisywane w miarę poznawania historii.',
    meta: czas ? `ostatni wpis: ${escapeHtml(czas)}` : '',
    sciezka: okruszki([{ etykieta: 'Ostatnio opowiedziane' }]),
  });

  if (!html) {
    return `${naglowek}${stanPusty('Dziennik nie ma jeszcze żadnych wpisów.')}`;
  }

  return `${naglowek}<section class="boks dziennik-pelny">${html}</section>`;
}

export function renderOBazie() {
  const naglowek = naglowekStrony({
    tytul: 'Jak czytać kronikę',
    opis: 'Zasady porządkujące ten dziennik podróży przez świat Limbus Company.',
    sciezka: okruszki([{ etykieta: 'Jak czytać kronikę' }]),
  });

  return `${naglowek}
${legendaPoziomow()}
<section class="boks">
  <h2>Granica opowiedzianej historii</h2>
  <p>Kronika nigdy nie wyprzedza wydarzeń. Każda postać, dzielnica, frakcja i literackie echo są opisane wyłącznie w takim kształcie, w jakim zdążyły się już odsłonić w poznanych scenach. Nawet znajomość pierwowzorów literackich służy tu jedynie oświetleniu motywów, które już wybrzmiały — nigdy zdradzaniu przyszłych zwrotów losu.</p>
</section>
<section class="boks">
  <h2>Interpretacje i ślad wcześniejszych odczytań</h2>
  <p>Tam, gdzie opowieść zostawia niedopowiedzenie, fioletowe warstwy formułują ostrożne przypuszczenia z podaną w procentach pewnością. Gdy późniejsze sceny obalą albo zawężą dawny wniosek, wcześniejsze brzmienie nie znika bez śladu — zostaje zachowane pod sekcją jako zwijana <em>Poprzednia wersja</em>, dzięki czemu widać, jak zmieniało się rozumienie historii.</p>
</section>
<section class="boks">
  <h2>Świat przed rachunkami</h2>
  <p>Karty postaci, światów lustrzanych, anomalii i E.G.O zatrzymują to, co należy do opowieści: biografie, rozmowy, obserwacje, symbolikę i prawa rządzące Miastem — z pominięciem czysto liczbowych przeliczników walki.</p>
</section>`;
}
