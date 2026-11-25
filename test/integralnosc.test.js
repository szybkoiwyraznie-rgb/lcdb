import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { zbudujDane } from '../tools/build.mjs';
import { chodz } from '../tools/content-loader.mjs';
import { TYPY_STRON } from '../src/lcdb/registry.js';
import { LISTY } from '../src/lcdb/links.js';
import { zbudujWidok } from '../src/lcdb/main.js';

const ROOT = process.cwd();

function wytnijId(html) {
  const zbior = new Set();
  for (const m of html.matchAll(/\bid="([^"]+)"/g)) zbior.add(m[1]);
  return zbior;
}

function sprawdzKotwiceWewnetrzne(html, opisWidoku) {
  const idObecne = wytnijId(html);
  for (const m of html.matchAll(/\bhref="#(?!\/)([^"]+)"/g)) {
    const cel = decodeURIComponent(m[1]);
    assert.ok(idObecne.has(cel), `${opisWidoku}: martwa kotwica href="#${cel}"`);
  }
  for (const m of html.matchAll(/\bdata-cel="([^"]+)"/g)) {
    assert.ok(idObecne.has(m[1]), `${opisWidoku}: martwy data-cel="${m[1]}"`);
  }
}

describe('integralność danych, kodowania i wyrenderowanych widoków', () => {
  let dane;

  before(async () => {
    dane = await zbudujDane({ root: ROOT });
    globalThis.LCDB_DATA = dane;
  });

  it('wszystkie pliki tekstowe repozytorium mają czyste UTF-8 i brak znaczników konfliktu', () => {
    const katalogi = ['content', 'rozgrywka', 'docs', 'src', 'tools', 'test'];
    for (const kat of katalogi) {
      for (const pelna of chodz(path.join(ROOT, kat))) {
        if (!/\.(md|json|js|mjs|html|css)$/.test(pelna)) continue;
        const tekst = fs.readFileSync(pelna, 'utf8');
        const rel = path.relative(ROOT, pelna);
        assert.equal(tekst.includes('\uFFFD'), false, `${rel}: zawiera znak zastępczy U+FFFD`);
        assert.doesNotMatch(tekst, /^(<{7}|={7}|>{7}) /m, `${rel}: zawiera znacznik konfliktu git`);
      }
    }
  });

  it('obejmuje karty wszystkich 10 typów i ma poprawny wskaźnik postępu fabuły', () => {
    assert.ok(dane.postep?.ostatnia_scena, 'brak ostatnia_scena w postep.json');
    assert.ok(dane.strony[dane.postep.ostatnia_scena], 'ostatnia_scena nie istnieje wśród kart');
    for (const typ of TYPY_STRON) {
      assert.ok((dane.statystyki[typ] ?? 0) >= 1, `brak kart typu "${typ}"`);
    }
  });

  it('każda karta renderuje się bez surowych znaczników, martwych linków, powtórzeń leadu ani błędnych kotwic', () => {
    for (const s of Object.values(dane.strony)) {
      const { html, pelnyHtml } = zbudujWidok({ nazwa: s.typ, param: s.slug, query: {} });
      const opis = `${s.typ}/${s.slug}`;
      assert.ok(html.length > 40, `${opis}: podejrzanie krótki widok`);
      assert.doesNotMatch(html, /class="link-brak"/, `${opis}: nierozwiązany wikilink`);
      assert.doesNotMatch(html, /\{\{(?:dostawa|opracowanie|kwerenda|model|zrodlo)\b/, `${opis}: wyciek dyrektywy {{…}}`);
      assert.doesNotMatch(html, /\[\[[^\]]+\]\]/, `${opis}: wyciek surowego wikilinka [[…]]`);
      sprawdzKotwiceWewnetrzne(pelnyHtml, opis);

      const asideMatch = html.match(/<aside class="kolumna-boczna">([\s\S]*?)<\/aside>/);
      if (asideMatch) {
        assert.doesNotMatch(asideMatch[1], /rodzaj-interpretacja/, `${opis}: interpretacja zduplikowana w kolumnie bocznej`);
        assert.doesNotMatch(asideMatch[1], /[→←]/, `${opis}: strzałka kierunku w kolumnie bocznej`);
      }
    }
  });

  it('widok chronologii trzyma rozdziały domyślnie zwinięte, a wszystkie widoki zbiorcze mają poprawne kotwice', () => {
    const trasyZbiorcze = [
      { nazwa: 'glowna', param: null, query: {} },
      { nazwa: 'chronologia', param: null, query: {} },
      { nazwa: 'hipotezy', param: null, query: {} },
      { nazwa: 'tagi', param: null, query: {} },
      { nazwa: 'szukaj', param: null, query: { q: 'latarnia' } },
      { nazwa: 'co-nowego', param: null, query: {} },
      { nazwa: 'o-bazie', param: null, query: {} },
      ...TYPY_STRON.map((typ) => ({ nazwa: LISTY[typ], param: null, query: {} })),
    ];
    for (const trasa of trasyZbiorcze) {
      const { html, pelnyHtml } = zbudujWidok(trasa);
      assert.ok(html.length > 20, `pusty widok trasy ${trasa.nazwa}`);
      assert.doesNotMatch(html, /class="link-brak"/, `${trasa.nazwa}: nierozwiązany wikilink`);
      sprawdzKotwiceWewnetrzne(pelnyHtml, trasa.nazwa);
      if (trasa.nazwa === 'chronologia') {
        assert.doesNotMatch(html, /<details[^>]*\bopen\b/, 'chronologia ma domyślnie otwarty rozdział <details open>');
      }
    }
  });
});
