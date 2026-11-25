/**
 * Widok karty sceny (ADR 0009, ADR 0015): układ dwukolumnowy 3:1, w lewej
 * kolumnie boksy treści sceny, analizy i ewentualnych hipotez, w prawej —
 * spis boksów i powiązane encje bez dublowania interpretacji.
 */

import { escapeHtml } from './markdown.js';
import { hrefDlaSlug } from './links.js';
import {
  dajStrone,
  epizodSceny,
  rozdzialSceny,
  listaScenChronologicznie,
} from './data.js';
import {
  naglowekStrony,
  nieZnalesc,
  okruszki,
  tytulOryginalu,
  grupaLinkow,
  grupaTagow,
} from './render.js';
import { spisBoksow } from './spis-boksow.js';

export function renderScena(slug) {
  const s = dajStrone(slug);
  if (!s || s.typ !== 'scena') return nieZnalesc(slug);

  const epizod = epizodSceny(s);
  const rozdzial = rozdzialSceny(s);
  const sciezkaElementy = [{ etykieta: 'Chronologia', href: '#/chronologia' }];
  if (rozdzial) sciezkaElementy.push({ etykieta: rozdzial.tytul, href: hrefDlaSlug(rozdzial.slug, 'rozdzial') });
  if (epizod) sciezkaElementy.push({ etykieta: epizod.tytul, href: hrefDlaSlug(epizod.slug, 'epizod') });
  sciezkaElementy.push({ etykieta: s.tytul });

  const metaCzesci = [];
  if (s.numer_sceny) metaCzesci.push(`scena ${s.numer_sceny}`);
  const oryg = tytulOryginalu(s);
  if (oryg) metaCzesci.push(oryg);

  const naglowek = naglowekStrony({
    tytul: s.tytul,
    opis: s.streszczenie ?? '',
    meta: metaCzesci.join(' · '),
    sciezka: okruszki(sciezkaElementy),
  });

  const sekcje = Array.isArray(s.sekcje) ? s.sekcje : [];
  const lewaKolumna = sekcje.length > 0
    ? sekcje.map((sekcja) => sekcja.html).join('\n')
    : (s.html ?? '');

  const boczna = [
    spisBoksow(sekcje),
    grupaLinkow('Miejsce', s.miejsca, 'miejsce'),
    grupaLinkow('Dzielnica', s.dzielnice, 'dzielnica'),
    grupaLinkow('Kto występuje', s.postacie, 'postac'),
    grupaLinkow('Organizacje', s.organizacje, 'organizacja'),
    grupaLinkow('Hasła', s.pojecia, 'pojecie'),
    grupaLinkow('Wątki', s.watki, 'watek'),
    grupaLinkow('Konteksty', s.konteksty, 'kontekst'),
    grupaTagow(s.tagi),
  ].filter(Boolean).join('');

  const chronologia = listaScenChronologicznie();
  const idx = chronologia.findIndex((x) => x.slug === s.slug);
  const poprzednia = idx > 0 ? chronologia[idx - 1] : null;
  const nastepna = idx >= 0 && idx < chronologia.length - 1 ? chronologia[idx + 1] : null;

  const nawigacjaDolna = (poprzednia || nastepna)
    ? `<nav class="nawigacja-scen" aria-label=" sąsiednie sceny">
        <div class="naw-poprzednia">
          ${poprzednia ? `<span class="meta">← Poprzednia scena</span><a href="${hrefDlaSlug(poprzednia.slug, 'scena')}">${escapeHtml(poprzednia.tytul)}</a>` : ''}
        </div>
        <div class="naw-nastepna">
          ${nastepna ? `<span class="meta">Następna scena →</span><a href="${hrefDlaSlug(nastepna.slug, 'scena')}">${escapeHtml(nastepna.tytul)}</a>` : ''}
        </div>
      </nav>`
    : '';

  return `${naglowek}
  <div class="uklad-karty">
    <div class="kolumna-glowna">${lewaKolumna}</div>
    <aside class="kolumna-boczna">${boczna}</aside>
  </div>
  ${nawigacjaDolna}`;
}
