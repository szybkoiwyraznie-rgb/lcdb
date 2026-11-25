/**
 * Budowanie kroniki Limbus Company (ADR 0001):
 *  1. Wczytuje karty z `content/` oraz archiwa z `rozgrywka/`.
 *  2. Sprawdza schematy, relacje, ciągłość numeracji, twardą granicę fabuły
 *     (`rozgrywka/postep.json`) oraz dosłowność bloków `:::zapis`.
 *  3. Renderuje boksy z warstwami pochodzenia, kotwicami analizy i zwijaną
 *     historią interpretacji (`interpretacje:`).
 *  4. Skleja moduły `src/lcdb/*.js` bez zewnętrznych narzędzi.
 *  5. Domyślnie wystawia powłokę `dist/index.html` ze skompresowanym indeksem
 *     (`LCDB_B64`) i osobne pliki ciał w `dist/data/*.json`; z flagą `--single`
 *     tworzy pojedynczy samowystarczalny plik HTML.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { collectModules, assertNoNameCollisions, stripModuleSyntax } from './module-graph.mjs';
import {
  wczytajStrony,
  wczytajZapisy,
  wczytajPostep,
  wczytajCoNowego,
} from './content-loader.mjs';
import {
  renderMarkdown,
  renderujHistorieInterpretacji,
  escapeHtml,
  BLOK_OTWARCIA_RE,
  parsujAtrybutyBloku,
  ZRODLO_RE,
} from '../src/lcdb/markdown.js';
import { podzielScene, podzielNaBoksy, zaplanujScene, kotwiceSekcji } from '../src/lcdb/scena-sekcje.js';
import { parseWikilinks } from '../src/lcdb/links.js';
import { wyciagnijHipotezy } from '../src/lcdb/hipotezy.js';
import {
  zbudujRejestr,
  resolverLinkow,
  walidujStrone,
  policzBacklinki,
  policzTagi,
  policzStatystyki,
  sprawdzGraniceFabuly,
  sprawdzPorzadekEpizodow,
  sprawdzWiernoscSceny,
  POLA_RELACJI,
} from '../src/lcdb/registry.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENTRY = 'src/lcdb/main.js';
const POLA_ODSYLACZY = Object.keys(POLA_RELACJI);

let ostrzezonoPlytki = false;
function ostrzezPlytkiKlon(root) {
  if (ostrzezonoPlytki) return;
  ostrzezonoPlytki = true;
  try {
    const shallow = execFileSync('git', ['rev-parse', '--is-shallow-repository'], {
      cwd: root,
      encoding: 'utf8',
    }).trim();
    if (shallow === 'true') {
      console.warn('UWAGA: płytki klon gita — daty zmian będą niepełne. Użyj git fetch --unshallow lub fetch-depth: 0.');
    }
  } catch {
    /* poza repozytorium — fallback na mtime */
  }
}

function policzCzasBazy(czasy) {
  const ok = czasy.filter((c) => c && c.utworzono && c.zaktualizowano);
  if (ok.length === 0) return null;
  const utw = ok.map((c) => c.utworzono).sort();
  const zakt = ok.map((c) => c.zaktualizowano).sort();
  return { utworzono: utw[0], zaktualizowano: zakt[zakt.length - 1] };
}

function datyGit(sciezka, root = ROOT) {
  ostrzezPlytkiKlon(root);
  try {
    const wyjscie = execFileSync(
      'git',
      ['log', '--format=%ad', '--date=format-local:%Y-%m-%d %H:%M', '--', sciezka],
      { cwd: root, encoding: 'utf8', env: { ...process.env, TZ: 'Europe/Warsaw' } },
    );
    const daty = wyjscie.split('\n').filter(Boolean);
    if (daty.length > 0) return { utworzono: daty[daty.length - 1], zaktualizowano: daty[0] };
  } catch {
    /* git niedostępny */
  }
  try {
    const st = fs.statSync(path.resolve(root, sciezka));
    const f = (d) => new Date(d).toLocaleString('sv-SE', { timeZone: 'Europe/Warsaw' }).slice(0, 16);
    return { utworzono: f(st.mtime), zaktualizowano: f(st.mtime) };
  } catch {
    return { utworzono: null, zaktualizowano: null };
  }
}

export function naTekst(md, limit = 8000) {
  let wZapisie = false;
  const bezBlokow = String(md ?? '')
    .replace(ZRODLO_RE, ' ')
    .split(/\r?\n/)
    .filter((linia) => {
      const t = linia.trim();
      if (!wZapisie && /^:::/.test(t)) {
        wZapisie = true;
        return false;
      }
      if (wZapisie && t === ':::') {
        wZapisie = false;
        return false;
      }
      if (!wZapisie && (BLOK_OTWARCIA_RE.test(t) || t === '}}')) return false;
      return true;
    })
    .join('\n');
  ZRODLO_RE.lastIndex = 0;

  const t = bezBlokow
    .replace(/!\[[^\]]*\]\([^)\s]+\)/g, ' ')
    .replace(/\[\[([^\]|]+?)\|([^\]]+?)\]\]/g, '$2')
    .replace(/\[\[([^\]]+?)\]\]/g, '$1')
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1')
    .replace(/^:::.*$/gm, ' ')
    .replace(/^(?:-{3,}|\*{3,}|_{3,})[ \t]*$/gm, ' ')
    .replace(/^[ \t]*[-*][ \t]+/gm, ' ')
    .replace(/[#>*`|_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return t.length > limit ? t.slice(0, limit) : t;
}

const ABBR_RE = /\b(?:np|tzw|ok|dr|ds|ks|św|ul|al|im|inż|prof|mgr|hab|por|zob|ang|kor|pol|itd|itp|in)$/i;

export function wyciagnijSkrotOpisu(body, limit = 200, sekcja = 'Opis') {
  const m = String(body ?? '').match(
    new RegExp(`^##\\s+${sekcja}[ \\t]*\\r?\\n+([\\s\\S]*?)(?:\\r?\\n[ \\t]*\\r?\\n|\\r?\\n##\\s|\\r?\\n\\}\\}|(?![\\s\\S]))`, 'm'),
  );
  const akapit = naTekst(m ? m[1] : '', limit * 3);
  if (!akapit) return '';
  for (const koniec of akapit.matchAll(/[.!?](?=\s|$)/g)) {
    const idx = koniec.index + 1;
    if (ABBR_RE.test(akapit.slice(0, koniec.index))) continue;
    const zdanie = akapit.slice(0, idx).trim();
    if (zdanie.length <= limit) return zdanie;
    break;
  }
  if (akapit.length <= limit) return akapit;
  const uciete = akapit.slice(0, limit).replace(/\s+\S*$/, '').replace(/[,;:\s—–-]+$/, '');
  return `${uciete || akapit.slice(0, limit)}…`;
}

function dopasujWpisyHistorii(interpretacje, tytulBoksu, czyPierwszyBoks) {
  if (!Array.isArray(interpretacje) || interpretacje.length === 0) return [];
  return interpretacje.filter((wpis) => {
    if (!wpis || typeof wpis !== 'object') return false;
    if (wpis.fragment) return wpis.fragment === tytulBoksu;
    return Boolean(czyPierwszyBoks);
  });
}

export async function zbudujDane({ root = ROOT } = {}) {
  const problemy = [];

  const suroweStrony = wczytajStrony({ root });
  for (const s of suroweStrony) if (s.problem) problemy.push(s.problem);
  const strony = suroweStrony.filter((s) => !s.problem);

  const zapisy = wczytajZapisy({ root });
  const postep = wczytajPostep({ root });
  if (postep?.blad) problemy.push(postep.blad);
  const coNowegoSurowe = wczytajCoNowego({ root });

  const { bySlug, duplikaty } = zbudujRejestr(strony);
  for (const d of duplikaty) problemy.push(`zduplikowany slug: ${d}`);

  const ctx = { bySlug };
  for (const s of strony) problemy.push(...walidujStrone(s, ctx));

  const sceny = strony.filter((s) => s.typ === 'scena');
  problemy.push(...sprawdzGraniceFabuly(sceny, postep));
  problemy.push(
    ...sprawdzPorzadekEpizodow(
      strony.filter((s) => s.typ === 'epizod'),
      strony.filter((s) => s.typ === 'rozdzial'),
    ),
  );

  for (const s of sceny) {
    const tekst = typeof s.zapis === 'string' && s.zapis !== ''
      ? zapisy.get(`rozgrywka/zapisy/${path.basename(s.zapis)}`) ?? null
      : null;
    if (s.zapis !== undefined && tekst === null) {
      problemy.push(`${s.slug}: "zapis: ${s.zapis}" nie istnieje w rozgrywka/zapisy/`);
      continue;
    }
    problemy.push(...sprawdzWiernoscSceny(s, tekst));
  }

  const resolver = resolverLinkow(bySlug);
  const wyrenderowane = new Map();
  const licznikiHipotez = new Map();

  for (const s of strony) {
    const hipotezy = wyciagnijHipotezy(s.body, { licznik: licznikiHipotez, tytulStrony: s.tytul });
    let licznikInterpretacji = 0;
    const kotwicaDlaBloku = (otwarcie) => {
      const m = String(otwarcie ?? '').match(BLOK_OTWARCIA_RE);
      if (!m) return null;
      const atrybuty = parsujAtrybutyBloku(m[2]);
      const rodzaj = atrybuty.get('rodzaj')
        ?? (m[1] === 'model' && atrybuty.has('pewnosc') ? 'interpretacja' : null);
      if (rodzaj !== 'interpretacja') return null;
      const kotwica = hipotezy[licznikInterpretacji]?.kotwica ?? null;
      licznikInterpretacji += 1;
      return kotwica;
    };

    const pelnyRender = renderMarkdown(s.body, { resolveLink: resolver, wymagajPoziomu: true });
    for (const pr of pelnyRender.problemy) problemy.push(`${s.slug}: ${pr}`);

    const linki = new Set(parseWikilinks(s.body).map((w) => w.slug));
    if (Array.isArray(s.interpretacje)) {
      for (const wpis of s.interpretacje) {
        for (const w of parseWikilinks(wpis?.zmiana ?? '')) linki.add(w.slug);
        for (const w of parseWikilinks(wpis?.poprzednio ?? '')) linki.add(w.slug);
        for (const pr of renderMarkdown(String(wpis?.zmiana ?? ''), { resolveLink: resolver }).problemy) {
          problemy.push(`${s.slug} (historia): ${pr}`);
        }
        if (wpis?.poprzednio) {
          for (const pr of renderMarkdown(String(wpis.poprzednio), { resolveLink: resolver }).problemy) {
            problemy.push(`${s.slug} (historia): ${pr}`);
          }
        }
      }
    }

    for (const pole of POLA_ODSYLACZY) {
      if (pole === s.typ) continue;
      const wartosc = s[pole];
      if (Array.isArray(wartosc)) {
        for (const cel of wartosc) linki.add(cel);
      } else if (typeof wartosc === 'string' && wartosc !== '') {
        linki.add(wartosc);
      }
    }
    linki.delete(s.slug);

    let planSceny = null;
    const stanKotwic = {};
    if (s.typ === 'scena') {
      const czesci = podzielScene(s.body);
      planSceny = zaplanujScene(czesci, s.sekcje_analizy);
      for (const pr of planSceny.problemy) problemy.push(`${s.slug}: ${pr}`);
    }

    const suroweBoksy = podzielNaBoksy(s.body);
    const wyrenderowaneBoksy = suroweBoksy.map((b, indeksBoksu) => {
      const blokiHtml = b.bloki.map((bl) => {
        const opakowane = bl.otwarcie ? `${bl.otwarcie}\n\n${bl.tresc}\n\n}}` : bl.tresc;
        const wynik = renderMarkdown(opakowane, {
          resolveLink: resolver,
          wymagajPoziomu: true,
          atrybutyNaglowka: planSceny
            ? kotwiceSekcji(b.tytul, planSceny, {
              hrefStrony: `#/scena/${s.slug}`,
              stan: stanKotwic,
            })
            : null,
          kotwicaInterpretacji: kotwicaDlaBloku(bl.otwarcie),
        });
        return wynik.html;
      }).join('\n');

      const wpisyHistorii = dopasujWpisyHistorii(s.interpretacje, b.tytul, indeksBoksu === 0);
      const historiaHtml = renderujHistorieInterpretacji(wpisyHistorii, { resolveLink: resolver });

      const naglowekBoksu = b.tytul ? `<h2>${escapeHtml(b.tytul)}</h2>\n` : '';
      const htmlBoksu = [
        `<section class="boks" id="${escapeHtml(b.id)}">`,
        `${naglowekBoksu}${blokiHtml}`,
        ...(historiaHtml ? [historiaHtml] : []),
        '</section>',
      ].join('\n');

      return {
        id: b.id,
        tytul: b.tytul,
        html: htmlBoksu,
        warstwy: b.bloki.length,
        ...(wpisyHistorii.length > 0 ? { maHistorie: true } : {}),
      };
    });

    wyrenderowane.set(s.slug, {
      html: pelnyRender.html,
      linki: [...linki],
      sekcje: s.typ === 'scena' ? wyrenderowaneBoksy : null,
      boksy: s.typ !== 'scena' ? wyrenderowaneBoksy : null,
      hipotezy,
    });
  }

  const coNowego = coNowegoSurowe.map((w) => {
    const wynik = renderMarkdown(w.tekst, { resolveLink: resolver });
    for (const pr of wynik.problemy) problemy.push(`co-nowego (${w.data}): ${pr}`);
    return { data: w.data, czas: w.czas, tekst: naTekst(w.tekst, 400), html: wynik.html };
  });

  if (problemy.length > 0) {
    console.error('Budowanie przerwane — problemy integralności kroniki:');
    for (const p of problemy) console.error(`  - ${p}`);
    throw new Error(`Kronika ma ${problemy.length} problem(ów); artefakt nie został zbudowany.`);
  }

  const stronyDane = {};
  for (const s of strony) {
    const r = wyrenderowane.get(s.slug);
    const { problem, body, surowy, ...pola } = s;
    const maSekcje = Array.isArray(r.sekcje) && r.sekcje.length > 0;
    const maBoksy = Array.isArray(r.boksy) && r.boksy.length > 0;

    const maOpis = /^##\s+Opis[ \t]*$/m.test(body);
    const streszczenie = pola.streszczenie
      ?? (maOpis ? '' : wyciagnijSkrotOpisu(body, 260, 'Streszczenie'))
      ?? '';

    stronyDane[s.slug] = {
      ...pola,
      ...(streszczenie ? { streszczenie } : {}),
      ...(!maSekcje && !maBoksy ? { html: r.html } : {}),
      linki: r.linki,
      tekst: naTekst(body),
      czas: datyGit(s.plik, root),
      hipotezy: r.hipotezy,
      ...(maSekcje ? { sekcje: r.sekcje } : {}),
      ...(maBoksy ? { boksy: r.boksy } : {}),
    };
  }

  const dane = {
    zbudowano: new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Warsaw' }).slice(0, 16).replace('T', ' '),
    postep: postep && !postep.blad ? postep : null,
    strony: stronyDane,
    backlinki: policzBacklinki(strony.map((s) => ({ slug: s.slug, typ: s.typ, linki: wyrenderowane.get(s.slug).linki }))),
    tagi: policzTagi(strony),
    statystyki: policzStatystyki(strony.map((s) => ({ ...s, linki: wyrenderowane.get(s.slug).linki }))),
    coNowego,
    coNowegoCzas: datyGit('content/co-nowego.md', root),
    czasBazy: policzCzasBazy([
      ...Object.values(stronyDane).map((s) => s.czas),
      datyGit('content/co-nowego.md', root),
    ]),
  };

  const st = dane.statystyki;
  console.log(
    `Dane kroniki: ${Object.keys(stronyDane).length} kart — rozdziały: ${st.rozdzial}, epizody: ${st.epizod}, sceny: ${st.scena}, wątki: ${st.watek}, postacie: ${st.postac}, organizacje: ${st.organizacja}, dzielnice: ${st.dzielnica}, miejsca: ${st.miejsce}, hasła: ${st.pojecie}, konteksty: ${st.kontekst}`,
  );
  console.log(`  powiązania: ${st.powiazania}`);
  return dane;
}

export function podzielDane(dane) {
  const POLA_CIALA = ['html', 'boksy', 'sekcje'];
  const indeksStron = {};
  const ciala = {};
  const teksty = {};

  for (const [slug, strona] of Object.entries(dane.strony)) {
    const indeks = { ...strona };
    const cialo = {};
    for (const pole of POLA_CIALA) {
      if (indeks[pole] !== undefined) {
        cialo[pole] = indeks[pole];
        delete indeks[pole];
      }
    }
    if (strona.tekst !== undefined) {
      teksty[slug] = strona.tekst;
      delete indeks.tekst;
    }
    indeksStron[slug] = indeks;
    if (Object.keys(cialo).length > 0) ciala[slug] = cialo;
  }

  return {
    indeks: { ...dane, strony: indeksStron, coNowego: [] },
    ciala,
    teksty,
    coNowego: dane.coNowego ?? [],
  };
}

export async function zbuduj({ out, root = ROOT, single = false } = {}) {
  const cel = path.resolve(out ?? path.join(root, 'dist/index.html'));
  const dane = await zbudujDane({ root });

  const moduly = collectModules(ENTRY, { rootDir: ROOT });
  assertNoNameCollisions(moduly, { rootDir: ROOT });

  const kod = moduly
    .map(({ abs, source }) => {
      const rel = path.relative(ROOT, abs).replaceAll('\\', '/');
      return `// ===== ${rel} =====\n${stripModuleSyntax(source).trim()}`;
    })
    .join('\n\n');

  const podzial = single ? null : podzielDane(dane);
  const daneJs = single
    ? `// ===== LCDB_DATA (tryb jednoplikowy) =====\nglobalThis.LCDB_DATA = ${JSON.stringify(dane, null, 2)};`
    : `// ===== LCDB_TRYB + indeks (gzip/base64, ADR 0001) =====\n`
      + `globalThis.LCDB_TRYB = 'pliki';\n`
      + `globalThis.LCDB_B64 = ${JSON.stringify(zlib.gzipSync(JSON.stringify(podzial.indeks)).toString('base64'))};`;

  const shell = fs.readFileSync(path.join(ROOT, 'src/lcdb/index.html'), 'utf8');
  for (const znacznik of ['<!--STYL-->', '<!--BUNDLE-->']) {
    if (!shell.includes(znacznik)) throw new Error(`src/lcdb/index.html nie zawiera ${znacznik}`);
  }
  const css = fs.readFileSync(path.join(ROOT, 'src/lcdb/style.css'), 'utf8');
  const doSkryptu = (s) => s.replaceAll('</script', '<\\/script');

  const html = shell
    .replace('<!--STYL-->', () => `<style>\n${css}\n</style>`)
    .replace('<!--BUNDLE-->', () => `<script>\n${doSkryptu(daneJs)}\n\n${kod}\n</script>`);

  fs.mkdirSync(path.dirname(cel), { recursive: true });
  fs.writeFileSync(cel, html);

  if (!single) {
    const katalog = path.join(path.dirname(cel), 'data');
    fs.rmSync(katalog, { recursive: true, force: true });
    fs.mkdirSync(katalog, { recursive: true });
    const zapisz = (nazwa, wartosc) => fs.writeFileSync(path.join(katalog, nazwa), JSON.stringify(wartosc));
    for (const [slug, cialo] of Object.entries(podzial.ciala)) zapisz(`${slug}.json`, cialo);
    zapisz('teksty.json', podzial.teksty);
    zapisz('co-nowego.json', podzial.coNowego);
    const rozmiar = (p) => fs.statSync(p).size;
    const bajtyCial = Object.keys(podzial.ciala)
      .reduce((n, s) => n + rozmiar(path.join(katalog, `${s}.json`)), 0);
    console.log(`Zbudowano ${path.relative(ROOT, cel)} (powłoka ${(html.length / 1024).toFixed(1)} kB, ${moduly.length} modułów)`);
    console.log(
      `  data/: ${Object.keys(podzial.ciala).length} ciał kart (${(bajtyCial / 1024).toFixed(1)} kB), `
      + `teksty ${(rozmiar(path.join(katalog, 'teksty.json')) / 1024).toFixed(1)} kB, `
      + `dziennik ${(rozmiar(path.join(katalog, 'co-nowego.json')) / 1024).toFixed(1)} kB`,
    );
  } else {
    console.log(`Zbudowano ${path.relative(ROOT, cel)} (tryb jednoplikowy ${(html.length / 1024).toFixed(1)} kB, ${moduly.length} modułów)`);
  }
  return cel;
}

const jestMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (jestMain) {
  const i = process.argv.indexOf('--out');
  const out = i >= 0 ? process.argv[i + 1] : undefined;
  const single = process.argv.includes('--single');
  zbuduj({ out, single }).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
