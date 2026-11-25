/**
 * Daty kroniki: poprawność kalendarzowa `RRRR-MM-DD` i `RRRR-MM-DD GG:MM`.
 *
 * Wydzielone do osobnego modułu bez importów, żeby uniknąć cyklu zależności
 * między `markdown.js` a `registry.js` (sklejarka modułów odrzuca cykle).
 */

const DATA_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATA_CZAS_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

/** Poprawność kalendarzowa daty RRRR-MM-DD (z uwzględnieniem lat przestępnych). */
export function czyPoprawnaData(s) {
  if (typeof s !== 'string' || !DATA_RE.test(s)) return false;
  const [rok, miesiac, dzien] = s.split('-').map(Number);
  if (miesiac < 1 || miesiac > 12 || dzien < 1) return false;
  const dniWMiesiacu = new Date(Date.UTC(rok, miesiac, 0)).getUTCDate();
  return dzien <= dniWMiesiacu;
}

/** Poprawność RRRR-MM-DD GG:MM wraz z zakresem zegara. */
export function czyPoprawnaDataCzas(s) {
  if (typeof s !== 'string' || !DATA_CZAS_RE.test(s)) return false;
  const [data, czas] = s.split(' ');
  if (!czyPoprawnaData(data)) return false;
  const [godz, min] = czas.split(':').map(Number);
  return godz >= 0 && godz <= 23 && min >= 0 && min <= 59;
}
