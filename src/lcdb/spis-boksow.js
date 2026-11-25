/**
 * Spis boksów kolumny głównej („Na tej stronie”) na górze kolumny bocznej (wzorzec SRW).
 *
 * Gdy kolumna główna strony ma co najmniej dwa boksy `##`, prawa kolumna pokazuje
 * szybki spis prowadzący do kotwic `boks-…` bez przeładowywania trasy routera.
 */

import { escapeHtml } from './markdown.js';
import { slugify } from './links.js';

/** Generator niepowtarzalnych identyfikatorów `boks-<slug>` w obrębie jednej strony. */
export function generatorIdBoksow() {
  const uzyte = new Map();
  return (tytul) => {
    const baza = `boks-${slugify(tytul ?? '') || 'bez-tytulu'}`;
    const n = (uzyte.get(baza) ?? 0) + 1;
    uzyte.set(baza, n);
    return n === 1 ? baza : `${baza}-${n}`;
  };
}

/** Zwraca HTML szybkiego spisu boksów (pusty string, gdy boksów jest mniej niż dwa). */
export function spisBoksowHtml(pozycje, hrefStrony = '#/') {
  const cel = (pozycje ?? []).filter((p) => p?.id && p?.tytul);
  if (cel.length < 2) return '';
  return `<ol class="spis-boksow">
    ${cel.map((p) => `<li><a href="${escapeHtml(hrefStrony)}#${escapeHtml(p.id)}" data-cel="${escapeHtml(p.id)}">${escapeHtml(p.tytul)}</a></li>`).join('\n    ')}
  </ol>`;
}
