#!/usr/bin/env node
/**
 * Build kroniki Limbus Company (`lcdb`).
 *
 * 1. Wczytuje `content/*`, `rozgrywka/zapisy/*`, `rozgrywka/postep.json` i `content/co-nowego.md`.
 * 2. Waliduje schemat, graf relacji, twardą granicę fabuły, ciągłość numeracji i wierność zapisu.
 * 3. Renderuje warstwy pochodzenia i wylicza kotwice hipotez, backlinki, tagi oraz indeks wyszukiwania.
 * 4. Emituje powłokę `dist/index.html` + `dist/data/*.json` (lub jeden plik przy `--single`).
 */

import fs from 'node:fs';
import path from 'node:path';
import { deflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import {
  wczytajStrony, wczytajZapisy, wczytajPostep, wczytajCoNowego, wczytajCzasyGit,
} from './content-loader.mjs';
import { collectModules, assertNoNameCollisions, stripModuleSyntax } from './module-graph.mjs';
import {
  zbudujRejestr, walidujStrone, sprawdzWiernoscSceny, sprawdzWiernoscCytatow, sprawdzGraniceFabuly,
  sprawdzPorzadekEpizodow, resolverLinkow, policzBacklinki, policzTagi, policzStatystyki,
} from '../src/lcdb/registry.js';
import { parseWikilinks } from '../src/lcdb/links.js';
import { renderMarkdown, parsujAtrybutyBloku, nazwaBlokuOtwarcia } from '../src/lcdb/markdown.js';
import { podzielNaBoksy, podzielScene, zaplanujScene, kotwiceSekcji } from '../src/lcdb/scena-sekcje.js';
import { wyciagnijHipotezy, planKotwicHipotezy } from '../src/lcdb/hipotezy.js';
import { hrefDlaSlug } from '../src/lcdb/links.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function czystTekstDoWyszukiwania(html) {
  return String(html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function wytnijStreszczenieZBlokow(boksy) {
  const boks = boksy.find((b) => /^streszczenie$|^opis$/i.test(String(b.tytul ?? '').trim()));
  if (!boks) return '';
  // Skrót na kafelku ma streszczać, a nie cytować: najpierw warstwy opracowania, a dosłowne
  // bloki :::zapis (wielowierszowe cytaty z dostawy) nigdy nie trafiają do jednolinijkowego opisu.
  const opracowanie = boks.bloki.filter((bl) => /^\{\{\s*opracowanie\b/.test(String(bl.otwarcie ?? '')));
  const zrodlowe = opracowanie.length > 0 ? opracowanie : boks.bloki;
  const czysty = zrodlowe
    .map((bl) => bl.tresc.replace(/^\s*:::zapis[\s\S]*?^\s*:::\s*$/gm, ''))
    .map((tresc) => tresc.replace(/\{\{zrodlo[^}]*\}\}/g, '').replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, s, e) => e || s))
    .join(' ')
    .replace(/[#*_`>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return czysty.length > 220 ? `${czysty.slice(0, 217).trim()}…` : czysty;
}

function skrotCoNowego(md) {
  const sekcje = String(md ?? '').split(/(?=^##\s+)/m).filter((s) => /^##\s+/m.test(s));
  if (sekcje.length === 0) return { skrotMd: md, wiecej: false };
  return { skrotMd: sekcje[0], wiecej: sekcje.length > 1 };
}

export function zbudujDane({ root = ROOT } = {}) {
  const suroweStrony = wczytajStrony({ root });
  const zapisy = wczytajZapisy({ root });
  const postep = wczytajPostep({ root });
  const coNowegoMd = wczytajCoNowego({ root });
  const czasyGit = wczytajCzasyGit({ root });

  const problemy = [];
  for (const s of suroweStrony) {
    if (s.problem) problemy.push(s.problem);
  }

  const { bySlug, duplikaty } = zbudujRejestr(suroweStrony);
  for (const d of duplikaty) problemy.push(`duplikat sluga: ${d}`);

  const resolveLink = resolverLinkow(bySlug);

  for (const s of suroweStrony) {
    if (s.problem) continue;
    problemy.push(...walidujStrone(s, { bySlug }));
  }

  const sceny = suroweStrony.filter((s) => s.typ === 'scena' && !s.problem);
  const epizody = suroweStrony.filter((s) => s.typ === 'epizod' && !s.problem);
  const rozdzialy = suroweStrony.filter((s) => s.typ === 'rozdzial' && !s.problem);

  if (sceny.length > 0 || postep !== null) {
    problemy.push(...sprawdzGraniceFabuly(sceny, postep));
  }
  problemy.push(...sprawdzPorzadekEpizodow(epizody, rozdzialy));

  for (const sc of sceny) {
    const sciezka = sc.zapis ? `rozgrywka/zapisy/${path.basename(sc.zapis)}` : null;
    const tekstZapisu = sciezka ? zapisy.get(sciezka) ?? null : null;
    problemy.push(...sprawdzWiernoscSceny(sc, tekstZapisu));
  }
  for (const s of suroweStrony) {
    if (s.problem || s.typ === 'scena') continue;
    problemy.push(...sprawdzWiernoscCytatow(s, zapisy.values()));
  }

  const stronyIndeks = {};
  const cialaStron = {};
  const tekstyStron = {};

  for (const s of suroweStrony) {
    if (s.problem) continue;
    const linki = [...new Set(parseWikilinks(s.body ?? '').map((w) => w.slug).filter((cel) => cel !== s.slug))];
    s.linki = linki;

    const licznikHip = new Map();
    const hipotezy = wyciagnijHipotezy(s.body ?? '', { licznik: licznikHip, tytulStrony: s.tytul });

    const licznikRender = new Map();
    const renderujWarstwe = (bl, dodatkowe = {}) => {
      let kotwicaInt = null;
      const m = bl.otwarcie ? nazwaBlokuOtwarcia(bl.otwarcie) : null;
      if (m && m[1] === 'model') {
        const at = parsujAtrybutyBloku(m[2]);
        if (at.has('pewnosc')) {
          const planK = planKotwicHipotezy(bl.tresc, licznikRender);
          kotwicaInt = planK.id;
        }
      }
      const wejscie = bl.otwarcie ? `${bl.otwarcie}\n${bl.tresc}\n}}` : bl.tresc;
      const w = renderMarkdown(wejscie, {
        resolveLink,
        wymagajPoziomu: true,
        kotwicaInterpretacji: kotwicaInt,
        ...dodatkowe,
      });
      for (const pr of w.problemy) problemy.push(`${s.slug}: ${pr}`);
      return w.html;
    };

    if (s.typ === 'scena') {
      const suroweSekcje = podzielScene(s.body ?? '');
      const plan = zaplanujScene(suroweSekcje, s.sekcje_analizy ?? []);
      for (const pr of plan.problemy) problemy.push(`${s.slug}: ${pr}`);
      const hrefStrony = hrefDlaSlug(s.slug, 'scena');
      const stanKotwic = {};

      const sekcje = suroweSekcje.map((sek) => {
        const atrybutyNaglowka = kotwiceSekcji(sek.tytul, plan, { hrefStrony, stan: stanKotwic });
        const htmlWarstw = sek.bloki.map((bl) => renderujWarstwe(bl, { atrybutyNaglowka })).join('\n');
        return { tytul: sek.tytul, warstwy: sek.warstwy, html: htmlWarstw };
      });

      cialaStron[s.slug] = { sekcje };
      tekstyStron[s.slug] = czystTekstDoWyszukiwania(sekcje.map((x) => x.html).join(' '));
    } else {
      const suroweBoksy = podzielNaBoksy(s.body ?? '');
      const boksy = suroweBoksy.map((b) => {
        const htmlWarstw = b.bloki.map((bl) => renderujWarstwe(bl)).join('\n');
        return { tytul: b.tytul, warstwy: b.warstwy, html: htmlWarstw };
      });
      if (!s.streszczenie) {
        const wyciete = wytnijStreszczenieZBlokow(suroweBoksy);
        if (wyciete) s.streszczenie = wyciete;
      }
      cialaStron[s.slug] = { boksy };
      tekstyStron[s.slug] = czystTekstDoWyszukiwania(boksy.map((x) => x.html).join(' '));
    }

    const meta = { ...s };
    delete meta.body;
    delete meta.surowy;
    delete meta.problem;
    meta.hipotezy = hipotezy;
    meta.czas = czasyGit.get(s.plik) ?? null;
    stronyIndeks[s.slug] = meta;
  }

  // Co nowego — markdown bez wymogu bloków pochodzenia, ale z walidacją wikilinków.
  const pelneCoNowego = coNowegoMd.trim()
    ? renderMarkdown(coNowegoMd, { resolveLink, wymagajPoziomu: false })
    : { html: '', problemy: [] };
  for (const pr of pelneCoNowego.problemy) problemy.push(`content/co-nowego.md: ${pr}`);

  const { skrotMd, wiecej } = skrotCoNowego(coNowegoMd);
  const skrotRender = skrotMd.trim()
    ? renderMarkdown(skrotMd, { resolveLink, wymagajPoziomu: false })
    : { html: '', problemy: [] };

  const listaMeta = Object.values(stronyIndeks);
  const backlinki = policzBacklinki(listaMeta);
  const tagi = policzTagi(listaMeta);
  const statystyki = policzStatystyki(listaMeta);
  const coNowegoCzas = czasyGit.get('content/co-nowego.md') ?? null;
  const wszystkieCzasy = [...czasyGit.values()].sort();
  const czasBazy = wszystkieCzasy.at(-1) ?? null;

  return {
    problemy,
    indeks: {
      strony: stronyIndeks,
      backlinki,
      tagi,
      statystyki,
      postep,
      coNowegoHtml: skrotRender.html,
      coNowegoWiecej: wiecej,
      coNowegoCzas,
      czasBazy,
    },
    cialaStron,
    tekstyStron,
    coNowegoPelneHtml: pelneCoNowego.html,
  };
}

function spakujB64(obiekt) {
  const json = JSON.stringify(obiekt);
  return deflateRawSync(Buffer.from(json, 'utf8'), { level: 9 }).toString('base64');
}

export function zbudujArtefakt({
  root = ROOT, outDir = path.join(root, 'dist'), single = false, outFile = null,
} = {}) {
  const wynik = zbudujDane({ root });
  if (wynik.problemy.length > 0) {
    const lista = wynik.problemy.map((p) => `  ✗ ${p}`).join('\n');
    throw new Error(`Build zatrzymany — naruszono niezmienniki kroniki (${wynik.problemy.length}):\n${lista}`);
  }

  const szablon = fs.readFileSync(path.join(root, 'src', 'lcdb', 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'src', 'lcdb', 'style.css'), 'utf8');
  const moduly = collectModules('src/lcdb/main.js', { rootDir: root });
  assertNoNameCollisions(moduly, { rootDir: root });
  const js = moduly.map((m) => stripModuleSyntax(m.source)).join('\n');

  if (single) {
    const pelneDane = structuredClone(wynik.indeks);
    for (const [slug, strona] of Object.entries(pelneDane.strony)) {
      Object.assign(strona, wynik.cialaStron[slug] ?? {});
      strona.tekst = wynik.tekstyStron[slug] ?? '';
    }
    pelneDane.coNowegoPelneHtml = wynik.coNowegoPelneHtml;

    const skryptDanych = `globalThis.LCDB_TRYB="calosc";globalThis.LCDB_B64=${JSON.stringify(spakujB64(pelneDane))};`;
    const html = szablon
      .replace('/* __LCDB_CSS__ */', () => css)
      .replace('/* __LCDB_DATA__ */', () => skryptDanych)
      .replace('/* __LCDB_JS__ */', () => js);

    const cel = outFile ? path.resolve(root, outFile) : path.join(outDir, 'index.html');
    fs.mkdirSync(path.dirname(cel), { recursive: true });
    fs.writeFileSync(cel, html, 'utf8');
    return { tryb: 'calosc', plik: cel, rozmiar: Buffer.byteLength(html), statystyki: wynik.indeks.statystyki };
  }

  const dataDir = path.join(outDir, 'data');
  fs.rmSync(dataDir, { recursive: true, force: true });
  fs.mkdirSync(dataDir, { recursive: true });

  for (const [slug, cialo] of Object.entries(wynik.cialaStron)) {
    fs.writeFileSync(path.join(dataDir, `${slug}.json`), JSON.stringify(cialo), 'utf8');
  }
  fs.writeFileSync(path.join(dataDir, 'teksty.json'), JSON.stringify(wynik.tekstyStron), 'utf8');
  fs.writeFileSync(path.join(dataDir, 'co-nowego.json'), JSON.stringify({ html: wynik.coNowegoPelneHtml }), 'utf8');

  const skryptDanych = `globalThis.LCDB_TRYB="powloka";globalThis.LCDB_B64=${JSON.stringify(spakujB64(wynik.indeks))};`;
  const html = szablon
    .replace('/* __LCDB_CSS__ */', () => css)
    .replace('/* __LCDB_DATA__ */', () => skryptDanych)
    .replace('/* __LCDB_JS__ */', () => js);

  const cel = outFile ? path.resolve(root, outFile) : path.join(outDir, 'index.html');
  fs.mkdirSync(path.dirname(cel), { recursive: true });
  fs.writeFileSync(cel, html, 'utf8');

  return {
    tryb: 'powloka',
    plik: cel,
    dataDir,
    rozmiar: Buffer.byteLength(html),
    statystyki: wynik.indeks.statystyki,
  };
}

const uruchomionyBezposrednio = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (uruchomionyBezposrednio) {
  const args = process.argv.slice(2);
  const single = args.includes('--single');
  const idxOut = args.indexOf('--out');
  const outFile = idxOut >= 0 ? args[idxOut + 1] : null;
  try {
    const r = zbudujArtefakt({ single, outFile });
    const kb = (r.rozmiar / 1024).toFixed(1);
    const st = r.statystyki;
    console.log(`[build] tryb=${r.tryb} plik=${path.relative(ROOT, r.plik)} (${kb} KB) · scen=${st.scena} postaci=${st.postac} powiązań=${st.powiazania}`);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
