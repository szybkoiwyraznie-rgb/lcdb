/**
 * Spis boksów („Na skróty”) w prawej kolumnie karty (ADR 0015).
 *
 * Pokazuje się tylko wtedy, gdy lewa kolumna ma co najmniej dwa boksy z tytułem.
 * Odsyłacze mają `href="#boks-…"` oraz `data-cel="boks-…"`: w testach Node
 * brama integralności weryfikuje obecność docelowego `id="boks-…"`, a w przeglądarce
 * nasłuch kliknięć przewija gładko bez psucia trasy w `location.hash`.
 */

import { escapeHtml } from './markdown.js';

export function spisBoksow(boksy) {
  const nazwane = (Array.isArray(boksy) ? boksy : []).filter((b) => b?.id && b?.tytul);
  if (nazwane.length < 2) return '';
  const pozycje = nazwane
    .map((b) => `<li><a class="skok-boks" href="#${escapeHtml(b.id)}" data-cel="${escapeHtml(b.id)}">${escapeHtml(b.tytul)}</a></li>`)
    .join('');
  return `<div class="grupa-boczna spis-boksow"><h3>Na skróty</h3><ul class="lista-zwarta">${pozycje}</ul></div>`;
}
