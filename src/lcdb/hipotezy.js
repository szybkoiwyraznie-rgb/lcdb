/**
 * Inwentarz hipotez / interpretacji (ADR 0006).
 *
 * Widok „Interpretacje” zbiera wszystkie fioletowe warstwy `{{model pewnosc=NN}}`
 * z całej kroniki, a każda z nich dostaje jednoznaczną kotwicę `#hip-…` na swojej stronie.
 */

import { nazwaBlokuOtwarcia, parsujAtrybutyBloku, sekcjeBloku } from './markdown.js';
import { slugify } from './links.js';

/** Kotwica hipotezy: `Rola przewodnika` → `hip-rola-przewodnika`, duplikaty dostają numer. */
export function kotwicaHipotezy(tytul, licznik = null) {
  const baza = slugify(String(tytul ?? '').trim()) || 'hipoteza';
  if (!licznik) return `hip-${baza}`;
  const ile = (licznik.get(baza) ?? 0) + 1;
  licznik.set(baza, ile);
  return ile === 1 ? `hip-${baza}` : `hip-${baza}-${ile}`;
}

export function planKotwicHipotezy(tresc, licznik = null) {
  const sekcje = sekcjeBloku(tresc);
  if (sekcje.length === 0) return { id: kotwicaHipotezy('Hipoteza', licznik), naglowki: new Map() };
  const id = kotwicaHipotezy(sekcje[0], licznik);
  const naglowki = new Map();
  for (const sekcja of sekcje.slice(1)) naglowki.set(sekcja, kotwicaHipotezy(sekcja, licznik));
  return { id, naglowki };
}

/**
 * Wyciąga interpretacje z ciała strony → `[{ sekcja, pytanie?, pewnosc, kotwica, sekcje }]`.
 * Pomija bloki surowe (`:::zapis`).
 */
export function wyciagnijHipotezy(md, { licznik = null, tytulStrony = '' } = {}) {
  const linie = String(md ?? '').split(/\r\n?|\n/);
  const wynik = [];
  let i = 0;
  let wZapisie = false;

  while (i < linie.length) {
    const t0 = linie[i].trim();

    if (!wZapisie && /^:::/.test(t0)) { wZapisie = true; i += 1; continue; }
    if (wZapisie) {
      if (/^:::$/.test(t0)) wZapisie = false;
      i += 1;
      continue;
    }

    const m = nazwaBlokuOtwarcia(t0);
    if (!m) { i += 1; continue; }

    const pochodzenie = m[1];
    const atrybuty = parsujAtrybutyBloku(m[2]);
    const tresc = [];
    i += 1;
    let wZapisieBloku = false;
    while (i < linie.length) {
      const t = linie[i].trim();
      if (!wZapisieBloku && /^:::/.test(t)) { wZapisieBloku = true; tresc.push(linie[i]); i += 1; continue; }
      if (wZapisieBloku) {
        if (/^:::$/.test(t)) wZapisieBloku = false;
        tresc.push(linie[i]);
        i += 1;
        continue;
      }
      if (t === '}}') break;
      tresc.push(linie[i]);
      i += 1;
    }
    i += 1;

    if (pochodzenie !== 'model' || !atrybuty.has('pewnosc')) continue;
    const pewnosc = Number(atrybuty.get('pewnosc'));
    if (!Number.isInteger(pewnosc) || pewnosc < 0 || pewnosc > 100) continue;

    const cialo = tresc.join('\n');
    const sekcje = sekcjeBloku(cialo);
    const plan = planKotwicHipotezy(cialo, licznik);
    const pierwszyTytul = sekcje[0] ?? (tytulStrony || 'Hipoteza');
    const pytanie = atrybuty.get('pytanie') ? String(atrybuty.get('pytanie')) : null;
    wynik.push({
      sekcja: pierwszyTytul,
      ...(pytanie ? { pytanie } : {}),
      pewnosc,
      kotwica: plan.id,
      sekcje: sekcje.slice(1),
    });
  }

  return wynik;
}
