/**
 * Graf modułów ESM i sklejarka do jednego zasięgu skryptu (ADR 0001, ADR 0002).
 *
 * Przeglądarka otwierająca pojedynczy plik HTML (`file://` dla `--single`)
 * oraz powłoka na GitHub Pages nie potrzebują bundlera npm: moduły `src/lcdb/*.js`
 * są sortowane topologicznie po statycznych importach, sprawdzane na brak cykli
 * oraz kolizji nazw najwyższego poziomu i sklejane w jeden `<script>`.
 */

import fs from 'node:fs';
import path from 'node:path';

const IMPORT_RE = /^\s*import\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]\s*;?/gm;

export function collectModules(entryRel, { rootDir = process.cwd() } = {}) {
  const odwiedzone = new Map();
  const wTrakcie = new Set();
  const wynik = [];

  function odwiedz(absPath, stos = []) {
    if (odwiedzone.has(absPath)) return;
    if (wTrakcie.has(absPath)) {
      const cykl = [...stos, absPath].map((p) => path.relative(rootDir, p)).join(' -> ');
      throw new Error(`Cykl zależności między modułami: ${cykl}`);
    }
    if (!fs.existsSync(absPath)) {
      throw new Error(`Nie znaleziono modułu: ${path.relative(rootDir, absPath)}`);
    }

    wTrakcie.add(absPath);
    const source = fs.readFileSync(absPath, 'utf8');
    IMPORT_RE.lastIndex = 0;
    const importy = [];
    for (const m of source.matchAll(IMPORT_RE)) {
      const spec = m[1];
      if (!spec.startsWith('.')) {
        throw new Error(
          `Zewnętrzny import "${spec}" w ${path.relative(rootDir, absPath)} — silnik przeglądarkowy nie używa zewnętrznych pakietów`,
        );
      }
      importy.push(path.resolve(path.dirname(absPath), spec));
    }
    for (const dep of importy) {
      odwiedz(dep, [...stos, absPath]);
    }
    wTrakcie.delete(absPath);
    odwiedzone.set(absPath, true);
    wynik.push({ abs: absPath, source });
  }

  odwiedz(path.resolve(rootDir, entryRel));
  return wynik;
}

export function stripModuleSyntax(source) {
  return source
    .replace(/^\s*import\s+[\s\S]*?\s+from\s+['"][^'"]+['"]\s*;?\s*$/gm, '')
    .replace(/^\s*import\s+['"][^'"]+['"]\s*;?\s*$/gm, '')
    .replace(/^\s*export\s+\{[^}]*\}\s*;?\s*$/gm, '')
    .replace(/^\s*export\s+default\s+/gm, '')
    .replace(/^\s*export\s+(?=(?:async\s+)?function\b|const\b|let\b|var\b|class\b)/gm, '');
}

/**
 * Wykrywa deklaracje na najwyższym poziomie zagnieżdżenia klamrowego `{ ... }`,
 * żeby dwa sklejane moduły nie nadpisały po cichu tej samej nazwy.
 */
export function topLevelBindings(source) {
  const bezKomentarzy = source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length))
    .replace(/\/\/.*$/gm, '');

  const nazwy = [];
  let glebokosc = 0;
  let wNapisie = null;
  const linie = bezKomentarzy.split('\n');

  for (const linia of linie) {
    if (glebokosc === 0 && !wNapisie) {
      const m = linia.match(/^\s*(?:export\s+)?(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/);
      if (m) nazwy.push(m[1]);
    }
    for (let i = 0; i < linia.length; i += 1) {
      const znak = linia[i];
      if (wNapisie) {
        if (znak === '\\') {
          i += 1;
          continue;
        }
        if (znak === wNapisie) wNapisie = null;
      } else if (znak === '"' || znak === "'" || znak === '`') {
        wNapisie = znak;
      } else if (znak === '{') {
        glebokosc += 1;
      } else if (znak === '}') {
        glebokosc = Math.max(0, glebokosc - 1);
      }
    }
  }
  return nazwy;
}

export function assertNoNameCollisions(modules, { rootDir = process.cwd() } = {}) {
  const widziane = new Map();
  const kolizje = [];

  for (const { abs, source } of modules) {
    const rel = path.relative(rootDir, abs).replaceAll('\\', '/');
    for (const nazwa of topLevelBindings(source)) {
      if (widziane.has(nazwa)) {
        kolizje.push(`"${nazwa}" zadeklarowano zarówno w ${widziane.get(nazwa)}, jak i w ${rel}`);
      } else {
        widziane.set(nazwa, rel);
      }
    }
  }

  if (kolizje.length > 0) {
    throw new Error(`Kolizja nazw na najwyższym poziomie sklejanych modułów:\n  - ${kolizje.join('\n  - ')}`);
  }
}
