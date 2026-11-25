/**
 * Wczytywanie źródeł z `content/` i `rozgrywka/` dla buildu i testów.
 *
 * Katalog w `content/` jednoznacznie wyznacza oczekiwany `typ` strony (ADR 0003).
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseFrontmatter } from '../src/lcdb/frontmatter.js';

export const KATALOGI = [
  ['rozdzialy', 'rozdzial'],
  ['epizody', 'epizod'],
  ['sceny', 'scena'],
  ['watki', 'watek'],
  ['postacie', 'postac'],
  ['frakcje', 'frakcja'],
  ['dzielnice', 'dzielnica'],
  ['miejsca', 'miejsce'],
  ['konteksty', 'kontekst'],
  ['pojecia', 'pojecie'],
];

/** Wczytuje wszystkie strony `.md` z katalogów `content/<dział>/`. */
export function wczytajStrony({ root = '.' } = {}) {
  const contentDir = path.join(root, 'content');
  const strony = [];

  for (const [katalog, oczekiwanyTyp] of KATALOGI) {
    const dir = path.join(contentDir, katalog);
    if (!fs.existsSync(dir)) continue;
    const pliki = fs.readdirSync(dir)
      .filter((f) => f.endsWith('.md') && f !== 'README.md')
      .sort();

    for (const nazwa of pliki) {
      const abs = path.join(dir, nazwa);
      const rel = path.relative(root, abs).replaceAll('\\', '/');
      const surowy = fs.readFileSync(abs, 'utf8');
      let fm;
      try {
        fm = parseFrontmatter(surowy);
      } catch (err) {
        strony.push({
          plik: rel,
          slug: path.basename(nazwa, '.md'),
          typ: oczekiwanyTyp,
          tytul: path.basename(nazwa, '.md'),
          body: '',
          problem: `${rel}: ${err.message}`,
        });
        continue;
      }

      if (!fm.data) {
        strony.push({
          plik: rel,
          slug: path.basename(nazwa, '.md'),
          typ: oczekiwanyTyp,
          tytul: path.basename(nazwa, '.md'),
          body: fm.body,
          problem: `${rel}: brak frontmattera YAML na początku pliku`,
        });
        continue;
      }

      const oczekiwanySlug = path.basename(nazwa, '.md');
      const problemyPliku = [];
      if (fm.data.typ !== oczekiwanyTyp) {
        problemyPliku.push(`${rel}: w katalogu content/${katalog}/ oczekiwano typ: ${oczekiwanyTyp}, jest "${fm.data.typ}" (ADR 0003)`);
      }
      if (fm.data.slug !== oczekiwanySlug) {
        problemyPliku.push(`${rel}: slug "${fm.data.slug}" musi zgadzać się z nazwą pliku "${oczekiwanySlug}.md"`);
      }

      strony.push({
        ...fm.data,
        plik: rel,
        body: fm.body,
        ...(problemyPliku.length > 0 ? { problem: problemyPliku.join('; ') } : {}),
      });
    }
  }

  return strony;
}

/** Wczytuje surowe zapisy rozgrywki z `rozgrywka/zapisy/*.md` → Map(relPath → treść). */
export function wczytajZapisy({ root = '.' } = {}) {
  const dir = path.join(root, 'rozgrywka', 'zapisy');
  const mapa = new Map();
  if (!fs.existsSync(dir)) return mapa;
  const pliki = fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .sort();
  for (const nazwa of pliki) {
    const abs = path.join(dir, nazwa);
    const rel = path.relative(root, abs).replaceAll('\\', '/');
    mapa.set(rel, fs.readFileSync(abs, 'utf8'));
  }
  return mapa;
}

/** Wczytuje `rozgrywka/postep.json`. */
export function wczytajPostep({ root = '.' } = {}) {
  const p = path.join(root, 'rozgrywka', 'postep.json');
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/** Wczytuje `content/co-nowego.md`. */
export function wczytajCoNowego({ root = '.' } = {}) {
  const p = path.join(root, 'content', 'co-nowego.md');
  if (!fs.existsSync(p)) return '';
  return fs.readFileSync(p, 'utf8');
}

/** Zwraca mapę `relPath → RRRR-MM-DD GG:MM` z historii Gita (UTC). */
export function wczytajCzasyGit({ root = '.' } = {}) {
  const czasy = new Map();
  try {
    const out = execFileSync(
      'git',
      ['log', '--format=__COMMIT__%cd', '--date=format-local:%Y-%m-%d %H:%M', '--name-only'],
      { cwd: root, env: { ...process.env, TZ: 'UTC' }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
    let biezacaData = null;
    for (const linia of out.split('\n')) {
      const t = linia.trim();
      if (!t) continue;
      if (t.startsWith('__COMMIT__')) {
        biezacaData = t.slice('__COMMIT__'.length).trim();
      } else if (biezacaData && !czasy.has(t)) {
        czasy.set(t, biezacaData);
      }
    }
  } catch {
    // Brak Gita (np. czysty katalog tymczasowy w teście) — daty pozostają puste.
  }
  return czasy;
}
