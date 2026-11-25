/**
 * Ładowanie plików treści z `content/` oraz archiwów rozgrywki z `rozgrywka/`.
 *
 * Jedyny moduł dotykający dysku przy wczytywaniu kart — używany wspólnie przez
 * `tools/build.mjs`, `tools/sprawdz-zapis.mjs` oraz testy integralności.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from '../src/lcdb/frontmatter.js';

export const KATALOGI = [
  { katalog: 'content/rozdzialy', typ: 'rozdzial' },
  { katalog: 'content/epizody', typ: 'epizod' },
  { katalog: 'content/sceny', typ: 'scena' },
  { katalog: 'content/watki', typ: 'watek' },
  { katalog: 'content/postacie', typ: 'postac' },
  { katalog: 'content/organizacje', typ: 'organizacja' },
  { katalog: 'content/dzielnice', typ: 'dzielnica' },
  { katalog: 'content/miejsca', typ: 'miejsce' },
  { katalog: 'content/pojecia', typ: 'pojecie' },
  { katalog: 'content/konteksty', typ: 'kontekst' },
];

export function wczytajPlikiMarkdown(katalog, { root = '.' } = {}) {
  const abs = path.resolve(root, katalog);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .sort()
    .map((f) => {
      const pelna = path.join(abs, f);
      const surowy = fs.readFileSync(pelna, 'utf8');
      const { data, body } = parseFrontmatter(surowy);
      return { plik: f, sciezka: pelna, fm: data, body };
    });
}

export function wczytajStrony({ root = '.' } = {}) {
  const strony = [];
  for (const { katalog, typ } of KATALOGI) {
    for (const plik of wczytajPlikiMarkdown(katalog, { root })) {
      const fm = plik.fm ?? {};
      if (fm.typ !== typ) {
        strony.push({
          problem: `${katalog}/${plik.plik}: frontmatter.typ = "${fm.typ}", a katalog wymaga "${typ}"`,
        });
        continue;
      }
      const oczekiwanaNazwa = `${fm.slug ?? ''}.md`;
      if (fm.slug && oczekiwanaNazwa !== plik.plik) {
        strony.push({
          problem: `${katalog}/${plik.plik}: slug "${fm.slug}" nie zgadza się z nazwą pliku "${plik.plik}"`,
        });
        continue;
      }
      strony.push({
        ...fm,
        typ: fm.typ,
        slug: fm.slug,
        tytul: fm.tytul ?? null,
        body: plik.body,
        surowy: plik.body,
        plik: `${katalog}/${plik.plik}`,
      });
    }
  }
  return strony;
}

export function chodz(katalog) {
  const wyn = [];
  if (!fs.existsSync(katalog)) return wyn;
  for (const e of fs.readdirSync(katalog, { withFileTypes: true })) {
    const pelna = path.join(katalog, e.name);
    if (e.isDirectory()) wyn.push(...chodz(pelna));
    else wyn.push(pelna);
  }
  return wyn.sort();
}

export function wczytajZapisy({ root = '.' } = {}) {
  const mapa = new Map();
  const baza = path.resolve(root, 'rozgrywka/zapisy');
  if (!fs.existsSync(baza)) return mapa;
  for (const pelna of chodz(baza)) {
    if (!pelna.endsWith('.md') || path.basename(pelna) === 'README.md') continue;
    const rel = path.relative(root, pelna).split(path.sep).join('/');
    mapa.set(rel, fs.readFileSync(pelna, 'utf8'));
  }
  return mapa;
}

export function wczytajPostep({ root = '.' } = {}) {
  const p = path.resolve(root, 'rozgrywka/postep.json');
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return { blad: `rozgrywka/postep.json: niepoprawny JSON — ${e.message}` };
  }
}

export function wczytajCoNowego({ root = '.' } = {}) {
  const p = path.resolve(root, 'content/co-nowego.md');
  if (!fs.existsSync(p)) return [];
  const surowy = fs.readFileSync(p, 'utf8');
  const { body } = parseFrontmatter(surowy);
  const wpisy = [];
  let data = null;
  let czas = null;
  let bufor = [];
  const zamknij = () => {
    if (data && bufor.length > 0) wpisy.push({ data, czas, tekst: bufor.join('\n') });
    bufor = [];
  };
  for (const linia of String(body ?? surowy).split(/\r?\n/)) {
    const naglowek = linia.match(/^##\s+(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}))?\s*$/);
    if (naglowek) {
      zamknij();
      data = naglowek[1];
      czas = naglowek[2] ?? null;
      continue;
    }
    if (/^##\s+/.test(linia)) continue;
    if (data && linia.trim() !== '') bufor.push(linia);
  }
  zamknij();
  return wpisy.sort((a, b) => `${b.data} ${b.czas ?? '00:00'}`.localeCompare(`${a.data} ${a.czas ?? '00:00'}`));
}
