/**
 * Punkt wejścia przeglądarki oraz czysty dyspozytor widoków dla testów i buildu.
 */

import { parsujHash } from './router.js';
import { zainicjujDane, zapewnijDaneWidoku } from './ladowanie.js';
import { MENU, nieZnalesc, tytulStrony, nazwaTypu, stopkaHtml } from './render.js';
import { dajStrone } from './data.js';
import { escapeHtml } from './markdown.js';
import { renderHome } from './render-home.js';
import { renderChronologia } from './chronologia.js';
import { renderRozdzialy, renderRozdzial, renderEpizod } from './render-epizod.js';
import { renderScena } from './render-scena.js';
import { renderEncja } from './render-encja.js';
import { renderLista, renderHipotezy, renderTagi, renderTag } from './render-listy.js';
import { renderSzukaj } from './render-szukaj.js';
import { renderCoNowego, renderOBazie } from './render-o-bazie.js';

export function wyrenderujWidok(dopasowanie) {
  const { nazwa, parametry, zapytanie } = dopasowanie;
  switch (nazwa) {
    case 'home':
      tytulStrony('Początek');
      return renderHome();
    case 'chronologia':
      tytulStrony('Chronologia podróży');
      return renderChronologia();
    case 'rozdzialy':
      tytulStrony('Rozdziały');
      return renderRozdzialy();
    case 'rozdzial': {
      const r = dajStrone(parametry.slug);
      tytulStrony(r?.tytul ?? 'Rozdział');
      return renderRozdzial(parametry.slug);
    }
    case 'epizod': {
      const ep = dajStrone(parametry.slug);
      tytulStrony(ep?.tytul ?? 'Epizod');
      return renderEpizod(parametry.slug);
    }
    case 'scena': {
      const sc = dajStrone(parametry.slug);
      tytulStrony(sc?.tytul ?? 'Scena');
      return renderScena(parametry.slug);
    }
    case 'encja': {
      const en = dajStrone(parametry.slug);
      tytulStrony(en?.tytul ?? nazwaTypu(parametry.typ));
      return renderEncja(parametry.typ, parametry.slug);
    }
    case 'lista':
      tytulStrony(nazwaTypu(parametry.typ, true));
      return renderLista(parametry.typ, zapytanie);
    case 'hipotezy':
      tytulStrony('Interpretacje');
      return renderHipotezy(zapytanie);
    case 'tagi':
      tytulStrony('Motywy');
      return renderTagi();
    case 'tag':
      tytulStrony(`#${parametry.tag}`);
      return renderTag(parametry.tag);
    case 'szukaj':
      tytulStrony('Szukaj');
      return renderSzukaj(zapytanie);
    case 'co-nowego':
      tytulStrony('Ostatnio opowiedziane');
      return renderCoNowego();
    case 'o-bazie':
      tytulStrony('Jak czytać kronikę');
      return renderOBazie();
    default:
      tytulStrony('Nie znaleziono');
      return nieZnalesc(parametry?.sciezka ?? '');
  }
}

function aktywnyKluczMenu(dopasowanie) {
  const { nazwa, parametry } = dopasowanie;
  if (nazwa === 'chronologia' || nazwa === 'scena' || nazwa === 'epizod') return 'chronologia';
  if (nazwa === 'rozdzialy' || nazwa === 'rozdzial') return 'rozdzial';
  if (nazwa === 'hipotezy') return 'hipotezy';
  if (nazwa === 'lista' || nazwa === 'encja') return parametry.typ;
  return '';
}

function nawigacjaHtml(aktywny) {
  return `<div class="pasek-gorny-wewn">
    <a class="marka" href="#/">
      <span class="marka-znak" aria-hidden="true">◈</span>
      <span class="marka-tekst">Limbus Company <small>kronika opowieści</small></span>
    </a>
    <nav class="menu-glowne" aria-label="Główne działy">
      ${MENU.map((m) => `<a href="${m.href}" class="${m.klucz === aktywny ? 'aktywny' : ''}">${escapeHtml(m.etykieta)}</a>`).join('')}
    </nav>
    <div class="pasek-akcje">
      <a class="przycisk-ikona" href="#/szukaj" title="Szukaj w kronice" aria-label="Szukaj w kronice">⌕</a>
      <button type="button" class="przycisk-ikona" id="przelacznik-motywu" title="Przełącz motyw jasny / ciemny" aria-label="Przełącz motyw">◐</button>
    </div>
  </div>`;
}

function zastosujMotyw(motyw) {
  const d = globalThis.document;
  if (!d) return;
  d.documentElement.dataset.theme = motyw;
  try { globalThis.localStorage?.setItem('lcdb-motyw', motyw); } catch { /* brak storage */ }
}

function przewinDoKotwicy(kotwica) {
  const d = globalThis.document;
  if (!d) return;
  if (!kotwica) {
    globalThis.scrollTo?.(0, 0);
    return;
  }
  const el = d.getElementById(kotwica);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.add('podswietlony-cel');
    setTimeout(() => el.classList.remove('podswietlony-cel'), 1800);
  }
}

async function uruchomPrzegladarke() {
  const d = globalThis.document;
  if (!d) return;

  let zapisanyMotyw = null;
  try { zapisanyMotyw = globalThis.localStorage?.getItem('lcdb-motyw'); } catch { /* ignore */ }
  const preferujeCiemny = globalThis.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
  zastosujMotyw(zapisanyMotyw || (preferujeCiemny ? 'dark' : 'light'));

  const naglowekEl = d.getElementById('naglowek-witryny');
  const glownyEl = d.getElementById('tresc-glowna');
  const stopkaEl = d.getElementById('stopka-witryny');

  await zainicjujDane();
  if (stopkaEl) stopkaEl.innerHTML = stopkaHtml();

  let numerNawigacji = 0;

  async function odswiez() {
    const biezacy = ++numerNawigacji;
    const dopasowanie = parsujHash(globalThis.location.hash);
    if (naglowekEl) {
      naglowekEl.innerHTML = nawigacjaHtml(aktywnyKluczMenu(dopasowanie));
      naglowekEl.querySelector('#przelacznik-motywu')?.addEventListener('click', () => {
        const nastepny = d.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        zastosujMotyw(nastepny);
      });
    }
    try {
      await zapewnijDaneWidoku(dopasowanie);
      if (biezacy !== numerNawigacji) return;
      if (glownyEl) glownyEl.innerHTML = wyrenderujWidok(dopasowanie);
      przewinDoKotwicy(dopasowanie.kotwica);
    } catch (err) {
      if (biezacy !== numerNawigacji) return;
      if (glownyEl) {
        glownyEl.innerHTML = `<div class="stan-pusty"><p>Nie udało się wczytać tej karty.</p><p class="meta">${escapeHtml(err?.message ?? String(err))}</p></div>`;
      }
    }
  }

  d.addEventListener('submit', (ev) => {
    const form = ev.target?.closest?.('[data-szukaj-form]');
    if (!form) return;
    ev.preventDefault();
    const pole = form.querySelector('input[name="q"]');
    const q = String(pole?.value ?? '').trim();
    globalThis.location.hash = q ? `#/szukaj?q=${encodeURIComponent(q)}` : '#/szukaj';
  });

  d.addEventListener('click', (ev) => {
    const skok = ev.target?.closest?.('[data-cel]');
    if (!skok) return;
    const celId = skok.getAttribute('data-cel');
    const href = skok.getAttribute('href') ?? '';
    const biezacaSciezka = globalThis.location.hash.split('#').slice(0, 2).join('#');
    if (celId && href.startsWith(biezacaSciezka)) {
      const el = d.getElementById(celId);
      if (el) {
        ev.preventDefault();
        globalThis.history?.replaceState?.(null, '', href);
        przewinDoKotwicy(celId);
      }
    }
  });

  globalThis.addEventListener('hashchange', odswiez);
  await odswiez();
}

if (typeof globalThis.document !== 'undefined') {
  uruchomPrzegladarke();
}
