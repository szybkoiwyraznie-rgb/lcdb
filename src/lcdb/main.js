/**
 * Punkt wejścia witryny: ładuje indeks danych, uruchamia router i dociąga
 * ciała kart na żądanie (ADR 0001).
 */

import { uruchomRouter } from './router.js';
import { rama, tytulStrony, nieZnalesc, nazwaTypu } from './render.js';
import { czasStrony, coNowegoCzas, czasBazy } from './data.js';
import { renderGlowna } from './render-home.js';
import { renderChronologia } from './chronologia.js';
import { renderEncja } from './render-encja.js';
import { renderScena } from './render-scena.js';
import { renderEpizod, renderRozdzial, renderRozdzialy } from './render-epizod.js';
import { renderListe, renderHipotezy, renderTagi, renderTag } from './render-listy.js';
import { renderSzukanie } from './render-szukaj.js';
import { renderCoNowego, renderOBazie } from './render-o-bazie.js';
import {
  zaladujDane,
  dociagnijStrone,
  dociagnijTeksty,
  dociagnijCoNowego,
  czyTrybPlikow,
} from './ladowanie.js';

const LISTA_TRAS = {
  rozdzial: 'rozdzialy',
  epizod: 'epizody',
  scena: 'sceny',
  watek: 'watki',
  postac: 'postacie',
  organizacja: 'organizacje',
  dzielnica: 'dzielnice',
  miejsce: 'miejsca',
  pojecie: 'pojecia',
  kontekst: 'konteksty',
};

const TRASY_STRONY = new Set(Object.keys(LISTA_TRAS));

let tokenRender = 0;

export function zbudujWidok(trasa) {
  let aktywna = trasa.nazwa;
  let tytul = 'Kronika';
  let html;

  switch (trasa.nazwa) {
    case 'glowna':
      html = renderGlowna();
      tytul = 'Kronika';
      aktywna = 'glowna';
      break;
    case 'chronologia':
      html = renderChronologia();
      tytul = 'Chronologia';
      break;
    case 'rozdzial':
      html = renderRozdzial(trasa.param);
      tytul = 'Rozdział';
      aktywna = 'rozdzialy';
      break;
    case 'epizod':
      html = renderEpizod(trasa.param);
      tytul = 'Epizod';
      aktywna = 'chronologia';
      break;
    case 'scena':
      html = renderScena(trasa.param);
      tytul = 'Scena';
      aktywna = 'chronologia';
      break;
    case 'rozdzialy':
      html = renderRozdzialy();
      tytul = 'Rozdziały';
      break;
    case 'postac':
    case 'organizacja':
    case 'dzielnica':
    case 'miejsce':
    case 'pojecie':
    case 'kontekst':
    case 'watek':
      html = renderEncja(trasa.param);
      tytul = nazwaTypu(trasa.nazwa);
      aktywna = LISTA_TRAS[trasa.nazwa];
      break;
    case 'epizody':
    case 'sceny':
    case 'postacie':
    case 'organizacje':
    case 'dzielnice':
    case 'miejsca':
    case 'pojecia':
    case 'konteksty':
    case 'watki': {
      const typ = Object.keys(LISTA_TRAS).find((t) => LISTA_TRAS[t] === trasa.nazwa);
      html = renderListe(typ, trasa.query);
      tytul = nazwaTypu(typ, 'wiele');
      break;
    }
    case 'hipotezy':
      html = renderHipotezy(trasa.query);
      tytul = 'Interpretacje';
      break;
    case 'tagi':
      html = renderTagi();
      tytul = 'Motywy';
      break;
    case 'tag':
      html = renderTag(trasa.param);
      tytul = `Motyw: ${trasa.param ?? ''}`;
      aktywna = 'tagi';
      break;
    case 'szukaj':
      html = renderSzukanie(trasa.query?.q);
      tytul = 'Szukaj';
      break;
    case 'co-nowego':
      html = renderCoNowego();
      tytul = 'Co nowego';
      break;
    case 'o-bazie':
      html = renderOBazie();
      tytul = 'Jak czytać kronikę';
      break;
    default:
      html = nieZnalesc(trasa.param ?? 'strona');
      tytul = 'Nie znaleziono';
      break;
  }

  const czas = LISTA_TRAS[trasa.nazwa]
    ? czasStrony(trasa.param)
    : trasa.nazwa === 'co-nowego'
      ? coNowegoCzas()
      : czasBazy();

  const pelnyHtml = rama(aktywna, tytul, html, {
    szukaj: trasa.query?.q ?? '',
    stopka: czasStopki(czas),
  });
  return { aktywna, tytul, html, pelnyHtml };
}

async function renderuj(trasa) {
  const app = globalThis.document?.getElementById('app');
  if (!app) return;
  if (trasa.nazwa === 'kotwica') return;

  const moj = ++tokenRender;
  if (trasa.nazwa === 'szukaj' && trasa.query?.q) await dociagnijTeksty();
  if (trasa.nazwa === 'co-nowego') await dociagnijCoNowego();
  if (TRASY_STRONY.has(trasa.nazwa) && trasa.param) {
    try {
      await dociagnijStrone(trasa.param);
    } catch (blad) {
      if (moj !== tokenRender) return;
      app.innerHTML = rama(
        'glowna',
        'Nie udało się wczytać strony',
        `<p class="pusto">${blad.message}</p><p><a href="#/">Wróć na początek</a></p>`,
      );
      return;
    }
  }
  if (moj !== tokenRender) return;

  const { tytul, pelnyHtml } = zbudujWidok(trasa);
  app.innerHTML = pelnyHtml;
  tytulStrony(tytul);
  domknijInterakcje(app, trasa.kotwica);
}

function czasStopki(czas) {
  if (!czas?.zaktualizowano) return '';
  const czesci = [];
  if (czas.utworzono) czesci.push(`utworzono ${czas.utworzono}`);
  czesci.push(`ostatnia zmiana ${czas.zaktualizowano}`);
  return `<p class="stopka-czas">${czesci.join(' · ')}</p>`;
}

function podswietlCel(cel) {
  if (!cel) return;
  cel.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  cel.classList?.remove('podswietlenie');
  void cel.offsetWidth;
  cel.classList?.add('podswietlenie');
}

function domknijInterakcje(app, kotwica = null) {
  if (kotwica) {
    const cel = globalThis.document?.getElementById(kotwica);
    if (cel) {
      podswietlCel(cel);
      return;
    }
  }
  globalThis.scrollTo?.(0, 0);
  const tresc = app.querySelector?.('.tresc');
  if (tresc) tresc.scrollTop = 0;
}

function podepnijSkokiWStronie() {
  const d = globalThis.document;
  if (!d?.addEventListener) return;
  d.addEventListener('click', (e) => {
    const link = e.target?.closest?.('a[data-cel], a[href^="#"]:not([href^="#/"])');
    if (!link) return;
    const celId = link.dataset.cel ?? decodeURIComponent(link.getAttribute('href').slice(1));
    const cel = d.getElementById(celId);
    if (!cel) return;
    e.preventDefault();
    podswietlCel(cel);
  });
}

function podepnijFiltry() {
  globalThis.zmienFiltr = function (select) {
    const form = select.closest?.('.filtry');
    const lista = form?.dataset?.lista ?? 'sceny';
    const dane = new FormData(form);
    const query = new URLSearchParams();
    for (const [k, v] of dane.entries()) {
      if (String(v) !== '') query.set(k, String(v));
    }
    const zapytanie = query.toString();
    globalThis.location.hash = `#/${lista}${zapytanie ? `?${zapytanie}` : ''}`;
  };
}

async function start() {
  try {
    await zaladujDane();
  } catch (blad) {
    const app = globalThis.document?.getElementById('app');
    if (app) {
      app.innerHTML = `<div class="stan-pusty"><p class="stan-pusty-tytul">Nie udało się wczytać kroniki: ${blad.message}</p>
        <p class="stan-pusty-opis">Jeśli otwierasz plik bezpośrednio z dysku, potrzebny jest serwer — uruchom <code>npm run serve</code> (albo zbuduj wersję jednoplikową <code>npm run build:single</code>).</p></div>`;
    }
    return;
  }
  const stop = uruchomRouter(renderuj);
  if (globalThis.__LCDB_TEST__) globalThis.__LCDB_STOP__ = stop;
  if (czyTrybPlikow()) globalThis.document?.documentElement?.setAttribute('data-tryb', 'pliki');
}

if (globalThis.document) {
  podepnijSkokiWStronie();
  podepnijFiltry();
  start();
}
