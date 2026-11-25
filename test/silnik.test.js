import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { parseFrontmatter } from '../src/lcdb/frontmatter.js';
import { czyPoprawnaData, czyPoprawnaDataCzas } from '../src/lcdb/czas.js';
import { slugify, parseWikilinks, hrefDlaSlug, hrefListy, hrefKotwicy } from '../src/lcdb/links.js';
import {
  renderMarkdown,
  renderujHistorieInterpretacji,
  czyPewnosc,
  poziomPewnosci,
} from '../src/lcdb/markdown.js';
import { podzielScene, podzielNaBoksy, zaplanujScene, kotwiceSekcji } from '../src/lcdb/scena-sekcje.js';
import { wyciagnijHipotezy } from '../src/lcdb/hipotezy.js';
import {
  walidujStrone,
  sprawdzGraniceFabuly,
  sprawdzPorzadekEpizodow,
  sprawdzWiernoscSceny,
  zbudujRejestr,
  policzBacklinki,
} from '../src/lcdb/registry.js';
import { parsujHash } from '../src/lcdb/router.js';
import { naTekst, wyciagnijSkrotOpisu } from '../tools/build.mjs';

describe('frontmatter.js', () => {
  it('parsuje skalary, liczby ujemne, listy i zagnieżdżone obiekty interpretacji', () => {
    const wejscie = `---
typ: kontekst
slug: probny-mit
tytul: "Mit próbny"
rok: -450
tagi: [mit, podroz]
interpretacje:
  - data: 2026-11-25 18:00
    fragment: Opis
    zmiana: "Nowe odczytanie"
    pewnosc: 70
---

Treść karty.`;
    const { data, body } = parseFrontmatter(wejscie);
    assert.equal(data.typ, 'kontekst');
    assert.equal(data.rok, -450);
    assert.deepEqual(data.tagi, ['mit', 'podroz']);
    assert.equal(data.interpretacje.length, 1);
    assert.equal(data.interpretacje[0].pewnosc, 70);
    assert.equal(body.trim(), 'Treść karty.');
  });
});

describe('czas.js i links.js', () => {
  it('waliduje kalendarzowe daty i znaczniki czasu', () => {
    assert.equal(czyPoprawnaData('2026-11-25'), true);
    assert.equal(czyPoprawnaData('2024-02-29'), true);
    assert.equal(czyPoprawnaData('2026-02-29'), false);
    assert.equal(czyPoprawnaData('2026-13-01'), false);
    assert.equal(czyPoprawnaDataCzas('2026-11-25 18:30'), true);
    assert.equal(czyPoprawnaDataCzas('2026-11-25 25:00'), false);
  });

  it('transliteruje polskie znaki w slugify i buduje odsyłacze z kotwicami', () => {
    assert.equal(slugify('Złota Gałąź — Ścieżka Ćmy'), 'zlota-galaz-sciezka-cmy');
    assert.equal(hrefDlaSlug('jan', 'postac'), '#/postac/jan');
    assert.equal(hrefListy('dzielnica'), '#/dzielnice');
    assert.equal(hrefKotwicy('sc-1', 'scena', 'sc-rozmowa'), '#/scena/sc-1#sc-rozmowa');
    const linki = parseWikilinks('Spotkanie [[marek|Marka]] w [[peron]].');
    assert.equal(linki.length, 2);
    assert.equal(linki[0].slug, 'marek');
    assert.equal(linki[0].etykieta, 'Marka');
  });
});

describe('markdown.js — warstwy pochodzenia, zapis i historia interpretacji', () => {
  it('renderuje wszystkie cztery warstwy pochodzenia, przypisy kwerendy i kwestie zegarowe <…>', () => {
    const md = `{{dostawa
:::zapis
Deszcz bębni po blasze.
## Węzeł 7

**Marek:** Słyszysz ten dzwon?
<Słyszę każdy jego uderzenie…>
:::
}}

{{opracowanie
Rozmowa odbywa się przed bramą [[peron|Peronu]].
}}

{{kwerenda
Nawiązanie do pierwszej pieśni poematu {{zrodlo tytul="Digital Dante" adres="https://digitaldante.columbia.edu/" data="2026-11-25"}}.
}}

{{model pewnosc=65 pytanie="Skąd rozbrzmiewa dzwon?"
Dźwięk może dochodzić z wieży sygnałowej za zwrotnicą.
}}`;
    const wynik = renderMarkdown(md, {
      wymagajPoziomu: true,
      resolveLink: (slug, etykieta) => ({
        href: `#/miejsce/${slug}`,
        tytul: etykieta ?? slug,
        istnieje: true,
      }),
    });
    assert.deepEqual(wynik.problemy, []);
    assert.match(wynik.html, /poziom-dostawa/);
    assert.match(wynik.html, /poziom-opracowanie/);
    assert.match(wynik.html, /poziom-kwerenda/);
    assert.match(wynik.html, /rodzaj-interpretacja/);
    assert.match(wynik.html, /pewność 65%/);
    assert.match(wynik.html, /class="zrodla"/);
    assert.match(wynik.html, /&lt;Słyszę każdy jego uderzenie…&gt;/);
    assert.match(wynik.html, /<hr/);
  });

  it('zgłasza luźny akapit poza blokiem pochodzenia przy wymagajPoziomu: true', () => {
    const wynik = renderMarkdown('Luźne zdanie bez bloku pochodzenia.', { wymagajPoziomu: true });
    assert.ok(wynik.problemy.length > 0);
  });

  it('ukrywa odznakę procentu przy pewnosc=0 i waliduje zakres 0–100', () => {
    assert.equal(czyPewnosc('0'), true);
    assert.equal(czyPewnosc('100'), true);
    assert.equal(czyPewnosc('101'), false);
    assert.equal(poziomPewnosci(85).id, 'wysoka');
    const wynik = renderMarkdown('{{model pewnosc=0 pytanie="Otwarte?"\nTylko pytanie.\n}}', { wymagajPoziomu: true });
    assert.doesNotMatch(wynik.html, /pewność 0%/);
  });

  it('dzieli wielowarstwową sekcję ## na pojedynczy boks i czyści dyrektywy z naTekst', () => {
    const body = `{{opracowanie\n\n## Opis\n\nPierwszy akapit.\n\n}}\n\n{{model\nTło kulturowe.\n}}`;
    const boksy = podzielNaBoksy(body);
    assert.equal(boksy.length, 1);
    assert.equal(boksy[0].tytul, 'Opis');
    assert.equal(boksy[0].bloki.length, 2);

    const czysty = naTekst('{{kwerenda\nZdanie {{zrodlo tytul="T" adres="https://example.org" data="2026-11-25"}}.\n}}');
    assert.doesNotMatch(czysty, /zrodlo|example\.org/);
    assert.match(czysty, /Zdanie/);
    assert.equal(wyciagnijSkrotOpisu(body, 200, 'Opis'), 'Pierwszy akapit.');
  });

  it('renderuje zwijalną historię interpretacji z odsyłaczami', () => {
    const html = renderujHistorieInterpretacji([
      {
        data: '2026-11-25 18:00',
        zmiana: 'Potwierdzono udział [[kalina|Kaliny]].',
        poprzednio: 'Udział był niepewny.',
        pewnosc_poprzedniego: 40,
        pewnosc: 85,
      },
    ], {
      resolveLink: (slug, etykieta) => ({ href: `#/postac/${slug}`, tytul: etykieta ?? slug, istnieje: true }),
    });
    assert.match(html, /historia-interpretacji/);
    assert.match(html, /wcześniej 40%\s*→\s*obecnie 85%/);
    assert.match(html, /href="#\/postac\/kalina"/);
  });
});

describe('scena-sekcje.js, hipotezy.js, registry.js i router.js', () => {
  it('łączy podsekcje Analizy ze skokami ↦ do Treści sceny', () => {
    const body = `{{dostawa\n## Treść sceny\n### Spotkanie przy bramie\n:::zapis\n**A:** Cześć.\n**B:** Witaj.\n:::\n}}\n\n## Analiza\n### Znaczenie powitania\n{{opracowanie\nWniosek.\n}}`;
    const czesci = podzielScene(body);
    const plan = zaplanujScene(czesci, ['Znaczenie powitania → Spotkanie przy bramie']);
    assert.deepEqual(plan.problemy, []);
    const stan = {};
    const atrTresc = kotwiceSekcji('Treść sceny', plan, { hrefStrony: '#/scena/s1', stan })(3, 'Spotkanie przy bramie');
    const atrAnaliza = kotwiceSekcji('Analiza', plan, { hrefStrony: '#/scena/s1', stan })(3, 'Znaczenie powitania');
    assert.match(atrTresc.id, /^sc-/);
    assert.ok(atrAnaliza.wewnetrzny.includes(`data-cel="${atrTresc.id}"`));
  });

  it('wyciąga hipotezy z bloków {{model pewnosc=…}} wraz z pytaniem i progiem pewności', () => {
    const md = `{{model pewnosc=75 pytanie="Kto otworzył zwrotnicę?"\nZapewne dróżnik.\n}}\n\n{{model\nZwykłe tło kulturowe bez pewnosc.\n}}`;
    const hip = wyciagnijHipotezy(md, { tytulStrony: 'Próba' });
    assert.equal(hip.length, 1);
    assert.equal(hip[0].pewnosc, 75);
    assert.equal(hip[0].pytanie, 'Kto otworzył zwrotnicę?');
  });

  it('pilnuje granicy fabuły, ciągłości epizodów, wierności zapisu i schematu kart', () => {
    const rozdzial = { typ: 'rozdzial', slug: 'r1', tytul: 'R1', numer: 1, body: '{{opracowanie\n## Streszczenie\nTekst.\n}}' };
    const epizod = { typ: 'epizod', slug: 'e1', tytul: 'E1', rozdzial: 'r1', kolejnosc: 1, body: '{{opracowanie\n## Streszczenie\nTekst.\n}}' };
    const scena1 = {
      typ: 'scena',
      slug: 's1',
      tytul: 'S1',
      epizod: 'e1',
      numer_sceny: '1-1',
      kolejnosc: 1,
      streszczenie: 'Skrót.',
      zapis: 'z1.md',
      body: '{{dostawa\n## Treść sceny\n:::zapis\n**A:** Raz.\n**B:** Dwa.\n:::\n}}\n{{opracowanie\n## Analiza\nWniosek.\n}}',
    };
    const { bySlug } = zbudujRejestr([rozdzial, epizod, scena1]);
    assert.deepEqual(walidujStrone(scena1, { bySlug }), []);
    assert.deepEqual(sprawdzGraniceFabuly([scena1], { ostatnia_scena: 's1' }), []);
    assert.ok(sprawdzGraniceFabuly([scena1, { ...scena1, slug: 's2', kolejnosc: 2 }], { ostatnia_scena: 's1' }).length > 0);
    assert.ok(sprawdzPorzadekEpizodow([{ ...epizod, kolejnosc: 2 }], [rozdzial]).length > 0);
    assert.deepEqual(sprawdzWiernoscSceny(scena1, 'Wstęp\n\n**A:** Raz.\n**B:** Dwa.\n'), []);
    assert.ok(sprawdzWiernoscSceny(scena1, '**A:** Zmieniono tekst.\n**B:** Dwa.\n').length > 0);

    const back = policzBacklinki([
      { slug: 's1', typ: 'scena', linki: ['e1'] },
      { slug: 'e1', typ: 'epizod', linki: [] },
    ]);
    assert.deepEqual(back.e1, [{ slug: 's1', typ: 'scena' }]);
  });

  it('rozróżnia w routerze gołe kotwice #… od tras #/… z opcjonalną kotwicą', () => {
    assert.deepEqual(parsujHash('#boks-analiza'), { nazwa: 'kotwica', param: 'boks-analiza', query: {} });
    const trasa = parsujHash('#/scena/zaslepka-sc01#sc-torowisko');
    assert.equal(trasa.nazwa, 'scena');
    assert.equal(trasa.param, 'zaslepka-sc01');
    assert.equal(trasa.kotwica, 'sc-torowisko');
  });
});
