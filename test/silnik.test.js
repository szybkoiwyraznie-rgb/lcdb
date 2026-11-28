/**
 * Testy jednostkowe czystych modułów silnika kroniki Limbus Company (`src/lcdb/*`).
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { SLUG_RE, slugify, parseWikilinks, hrefDlaSlug, hrefListy } from '../src/lcdb/links.js';
import { parseFrontmatter } from '../src/lcdb/frontmatter.js';
import {
  renderMarkdown, POCHODZENIA, RODZAJE_TRESCI, POZIOMY_WYCOFANE, czyPewnosc,
} from '../src/lcdb/markdown.js';
import {
  policzElementySceny, walidujStrone, sprawdzGraniceFabuly, sprawdzWiernoscSceny, zbudujRejestr,
  niepokryteWierszeZapisu, czyArchiwumWskazowek, czyArchiwumAkt, rodzajArchiwum, sprawdzWiernoscCytatow,
} from '../src/lcdb/registry.js';
import { historiaInterpretacjiHtml } from '../src/lcdb/render.js';
import { generatorIdBoksow, spisBoksowHtml } from '../src/lcdb/spis-boksow.js';
import { czyPoprawnaData, czyPoprawnaDataCzas } from '../src/lcdb/czas.js';

test('slugify sprowadza polskie znaki do ASCII i pilnuje wzorca SLUG_RE', () => {
  assert.equal(slugify('Złota Gałąź'), 'zlota-galaz');
  assert.equal(slugify('  Dzielnica 4 — Zaułki!  '), 'dzielnica-4-zaulki');
  assert.equal(slugify('Pieśń I: Wyrzutek'), 'piesn-i-wyrzutek');
  for (const t of ['Złota Gałąź', 'Mężczyzna o Czerwonych Oczach', 'Dystrykt 4']) {
    assert.match(slugify(t), SLUG_RE);
  }
});

test('parseWikilinks oraz hrefDlaSlug obsługują wszystkie 10 typów stron lcdb', () => {
  assert.deepEqual(
    parseWikilinks('Tekst [[dante]] i [[mefistofeles|autobus]]').map(({ slug, etykieta }) => ({ slug, etykieta })),
    [{ slug: 'dante', etykieta: null }, { slug: 'mefistofeles', etykieta: 'autobus' }],
  );
  assert.equal(hrefDlaSlug('zwierzeta-mistrzyni', 'frakcja'), '#/frakcja/zwierzeta-mistrzyni');
  assert.equal(hrefDlaSlug('dystrykt-4', 'dzielnica'), '#/dzielnica/dystrykt-4');
  assert.equal(hrefListy('frakcja'), '#/frakcje');
  assert.equal(hrefListy('dzielnica'), '#/dzielnice');
});

test('czas.js sprawdza kalendarzowo daty RRRR-MM-DD i RRRR-MM-DD GG:MM', () => {
  assert.equal(czyPoprawnaData('2026-11-25'), true);
  assert.equal(czyPoprawnaData('2024-02-29'), true);
  assert.equal(czyPoprawnaData('2026-02-29'), false);
  assert.equal(czyPoprawnaDataCzas('2026-11-25 14:30'), true);
  assert.equal(czyPoprawnaDataCzas('2026-11-25 25:00'), false);
});

test('frontmatter czyta skalary, listy, skalar blokowy | oraz adresy http(s)', () => {
  const { data, body } = parseFrontmatter(`---
typ: postac
slug: przyklad
tytul: "Grzesznik: nr 10"
numer_grzesznika: 10
tagi: [a, b]
zrodla:
  - https://pl.wikipedia.org/wiki/Boska_komedia
interpretacje:
  - data: "2026-11-25 12:00"
    fragment: Opis
    zmiana: Doprecyzowanie po kolejnej scenie.
    poprzednio: |
      Pierwszy akapit dawnego wniosku.

      Drugi akapit z symbolem # w środku.
---

Treść
`);
  assert.equal(data.numer_grzesznika, 10);
  assert.deepEqual(data.zrodla, ['https://pl.wikipedia.org/wiki/Boska_komedia']);
  assert.equal(data.interpretacje.length, 1);
  assert.match(data.interpretacje[0].poprzednio, /Drugi akapit z symbolem #/);
  assert.equal(body.trim(), 'Treść');
});

test('frontmatter odrzuca błędną składnię i niezacytowany dwukropek', () => {
  assert.throws(() => parseFrontmatter('---\ntagi:\n  - a\n b\n---\n'), /frontmatter/);
  assert.throws(() => parseFrontmatter('---\ntytul: a: b\n---\n'), /cudzysłów/);
});

test('renderer pilnuje czterech warstw pochodzenia, kwerendy ze źródłem i pewności hipotez', () => {
  const bezPoziomu = renderMarkdown('Goły akapit', { wymagajPoziomu: true });
  assert.ok(bezPoziomu.problemy.some((p) => /bez pochodzenia/.test(p)));

  const kwerendaBez = renderMarkdown('{{kwerenda\nTwierdzenie bez przypisu.\n}}', { wymagajPoziomu: true });
  assert.ok(kwerendaBez.problemy.some((p) => /bez źródła/.test(p)));

  const kwerendaOk = renderMarkdown(
    '{{kwerenda\nTwierdzenie. {{zrodlo tytul="Boska komedia" adres="https://pl.wikipedia.org/wiki/Boska_komedia" data="2026-11-25"}}\n}}',
    { wymagajPoziomu: true },
  );
  assert.deepEqual(kwerendaOk.problemy, []);
  assert.match(kwerendaOk.html, /class="zrodla"/);

  const hipoteza = renderMarkdown('{{model pewnosc=75 pytanie="Czy zegar cofa czas?"\nWniosek.\n}}', { wymagajPoziomu: true });
  assert.deepEqual(hipoteza.problemy, []);
  assert.match(hipoteza.html, /rodzaj-interpretacja/);
  assert.match(hipoteza.html, /pewność 75%/);

  const blednaPewnosc = renderMarkdown('{{opracowanie pewnosc=50\nTekst.\n}}', { wymagajPoziomu: true });
  assert.ok(blednaPewnosc.problemy.some((p) => /przysługuje tylko/.test(p)));

  assert.deepEqual(POCHODZENIA, ['dostawa', 'opracowanie', 'kwerenda', 'model']);
  assert.ok(RODZAJE_TRESCI.includes('interpretacja'));
  assert.equal(czyPewnosc(100), true);
  assert.equal(czyPewnosc(101), false);

  for (const [stary, nowy] of Object.entries(POZIOMY_WYCOFANE)) {
    const r = renderMarkdown(`{{${stary}\nTekst\n}}`, { wymagajPoziomu: true });
    assert.ok(r.problemy.some((x) => x.includes(nowy)), `${stary} -> ${nowy}`);
  }
});

test('konwencje zapisu Limbus Company: etykiety z tytułem w nawiasie, mowa zegara \\<…> i komentarze <!-- S001B -->', () => {
  const md = `{{dostawa
:::zapis
<!-- S001B -->

Darkness. Utter darkness.

**Wolf** (*???*): Look at that.

\\<You dare…?!>

*— Przed walką —*

**Lion:** Quit yelling and get behind me.
:::
}}`;

  const elem = policzElementySceny(md);
  assert.equal(elem.kwestie, 3, 'dwie kwestie z etykietą mówcy + jedna kwestia zegara \\<…>');
  assert.equal(elem.narracja, 1, 'komentarz HTML i separator walki nie zawyżają narracji');
  assert.equal(elem.razem, 4);

  const out = renderMarkdown(md, { wymagajPoziomu: true });
  assert.deepEqual(out.problemy, []);
  assert.doesNotMatch(out.html, /S001B/, 'komentarz techniczny węzła nie wycieka do widoku');
  assert.doesNotMatch(out.html, /\\&lt;/, 'backslash sprzed nawiasu mowy zegara jest zdejmowany');
  assert.match(out.html, /&lt;You dare…\?!&gt;/, 'mowa zegara renderuje się w nawiasach ostrokątnych');
});

test('walidacja specyficznych pól Limbus Company oraz twardej granicy fabuły', () => {
  const { bySlug } = zbudujRejestr([]);
  const zlyGrzesznik = walidujStrone({
    typ: 'postac',
    slug: 'ktos',
    tytul: 'Ktoś',
    numer_grzesznika: 14,
    body: '## Opis\n\n{{opracowanie\nTekst.\n}}',
  }, { bySlug });
  assert.ok(zlyGrzesznik.some((p) => /numer_grzesznika/.test(p)));

  const zlaDzielnica = walidujStrone({
    typ: 'dzielnica',
    slug: 'd-27',
    tytul: 'Dzielnica 27',
    numer_dzielnicy: 27,
    body: '## Opis\n\n{{opracowanie\nTekst.\n}}',
  }, { bySlug });
  assert.ok(zlaDzielnica.some((p) => /numer_dzielnicy/.test(p)));

  const granicaProblemy = sprawdzGraniceFabuly(
    [
      { slug: 'scena-1', kolejnosc: 1 },
      { slug: 'scena-2', kolejnosc: 2 },
    ],
    { ostatnia_scena: 'scena-1' },
  );
  assert.ok(granicaProblemy.some((p) => /za granicą rozegranej fabuły/.test(p)));

  const wiernosc = sprawdzWiernoscSceny(
    { typ: 'scena', slug: 'scena-1', body: ':::zapis\nZmienione zdanie.\n:::' },
    'Oryginalne zdanie z archiwum.',
  );
  assert.ok(wiernosc.some((p) => /nie jest dosłownym fragmentem/.test(p)));
});

test('historiaInterpretacjiHtml oraz spisBoksowHtml renderują ślad rewizji i szybkie menu boksów', () => {
  const strona = {
    interpretacje: [
      {
        data: '2026-11-25 12:00',
        fragment: 'Opis',
        zmiana: 'Nowa scena zawęziła wniosek.',
        pewnosc_poprzedniego: 40,
        poprzednio: 'Stara treść przypuszczenia.',
      },
    ],
  };
  const html = historiaInterpretacjiHtml(strona, 'Opis');
  assert.match(html, /historia-interpretacji/);
  assert.match(html, /Poprzednia wersja/);
  assert.match(html, /Stara treść przypuszczenia\./);
  assert.equal(historiaInterpretacjiHtml(strona, 'Inna sekcja'), '');

  const dajId = generatorIdBoksow();
  const a = dajId('Opis');
  const b = dajId('Opis');
  assert.equal(a, 'boks-opis');
  assert.equal(b, 'boks-opis-2');
  assert.equal(spisBoksowHtml([{ id: a, tytul: 'Opis' }], '#/postac/dante'), '');
  assert.match(
    spisBoksowHtml([{ id: a, tytul: 'Opis' }, { id: b, tytul: 'W opowieści' }], '#/postac/dante'),
    /class="spis-boksow"/,
  );
});

test('zatarte słowa *** w zapisie nie są brane za pogrubienie ani kursywę, a ***słowo*** nadal jest formatowaniem', () => {
  const md = `{{dostawa
:::zapis
**Ja** (***): Jak śmiecie… w chwili, gdy ryję ***… Postradaliście zmysły…
**Ja:** Gdzie jest ***, tego nigdy…
*— Przed walką —*
:::
}}`;
  const out = renderMarkdown(md, { wymagajPoziomu: true });
  assert.deepEqual(out.problemy, []);
  assert.equal((out.html.match(/class="zatarte"/g) ?? []).length, 3, 'każde z trzech zatarć jest osobnym znacznikiem');
  assert.match(out.html, /<strong>Ja<\/strong> \(<span class="zatarte"[^>]*>\*\*\*<\/span>\): Jak śmiecie/);
  assert.doesNotMatch(out.html, /<strong>\): Jak/, 'zatarcie w nawiasie nie otwiera fałszywego pogrubienia');
  assert.match(out.html, /<em>— Przed walką —<\/em>/);
  assert.equal(policzElementySceny(md).kwestie, 2, 'etykieta mówcy z (***) nadal jest kwestią');

  const formatowanie = renderMarkdown('{{opracowanie\nTo ***ważne*** zdanie.\n}}', { wymagajPoziomu: true });
  assert.match(formatowanie.html, /<em><strong>ważne<\/strong><\/em>/);
  assert.doesNotMatch(formatowanie.html, /class="zatarte"/);
});

test('pokrycie archiwum zapisu liczone wierszami wskazuje dokładnie pominięte kwestie', () => {
  const archiwum = [
    '# Nagłówek czytanki',
    '<!-- S001B -->',
    '**Wilk** (*???*): Pierwsza kwestia.',
    '**Lew:** Druga kwestia.',
    '**Pantera:** Trzecia kwestia.',
    '',
    'Narracja po pustej linii.',
  ].join('\r\n');
  const bloki = ['**Wilk** (*???*): Pierwsza kwestia.\n**Lew:** Druga kwestia.', 'Narracja po pustej linii.'];
  assert.deepEqual(niepokryteWierszeZapisu(archiwum, bloki), ['**Pantera:** Trzecia kwestia.']);
  assert.deepEqual(niepokryteWierszeZapisu(archiwum, [...bloki, '**Pantera:** Trzecia kwestia.']), []);
});

test('archiwum wskazówek (ADR 0016) rozpoznaje się po nazwie i nie może być podstawą sceny', () => {
  assert.equal(czyArchiwumWskazowek('rozgrywka/zapisy/2026-11-27-002-prolog-etap-0-1-wskazowki.md'), true);
  assert.equal(czyArchiwumWskazowek('rozgrywka/zapisy/2026-11-27-001-prolog-etap-0-1.md'), false);
  const p = sprawdzWiernoscSceny(
    { typ: 'scena', slug: 'scena-x', zapis: 'rozgrywka/zapisy/2026-11-27-002-x-wskazowki.md', body: ':::zapis\nZdanie.\n:::' },
    'Zdanie.',
  );
  assert.ok(p.some((x) => /archiwum wskazówek/.test(x)));
});

test('archiwum akt (ADR 0017) rozpoznaje się po nazwie, nie może być podstawą sceny i musi być w całości zacytowane na kartach', () => {
  assert.equal(czyArchiwumAkt('rozgrywka/zapisy/2026-11-27-004-grzesznicy-introdukcje-akta.md'), true);
  assert.equal(czyArchiwumAkt('rozgrywka/zapisy/2026-11-27-003-prolog-etap-0-2.md'), false);
  assert.equal(rodzajArchiwum('rozgrywka/zapisy/x-akta.md'), 'akta');
  assert.equal(rodzajArchiwum('rozgrywka/zapisy/x-wskazowki.md'), 'wskazowki');
  assert.equal(rodzajArchiwum('rozgrywka/zapisy/x-etap-0-2.md'), 'fabula');

  const scena = sprawdzWiernoscSceny(
    { typ: 'scena', slug: 'scena-x', zapis: 'rozgrywka/zapisy/2026-11-27-004-x-akta.md', body: ':::zapis\nZdanie.\n:::' },
    'Zdanie.',
  );
  assert.ok(scena.some((x) => /archiwum akt/.test(x)));

  // Pokrycie akt: nagłówki pomijane, każdy wiersz cytatu musi trafić na którąś kartę.
  const akta = '### Grzesznik #1 — X\n\n> Pierwszy wiersz akt,\n> drugi wiersz akt.';
  assert.deepEqual(niepokryteWierszeZapisu(akta, ['> Pierwszy wiersz akt,\n> drugi wiersz akt.']), []);
  assert.deepEqual(niepokryteWierszeZapisu(akta, ['> Pierwszy wiersz akt,']), ['> drugi wiersz akt.']);
});

test('cytaty :::zapis na kartach encji muszą być dosłownym fragmentem któregoś archiwum (ADR 0017)', () => {
  const archiwa = ['> Grzesznica, która opracowała silnik.\n> Twierdzi, że nikt jej nie dorównuje.', '**Faust:** Dante.'];
  const karta = (body) => ({ typ: 'postac', slug: 'karta-x', body });
  assert.deepEqual(sprawdzWiernoscCytatow(karta(':::zapis\n> Grzesznica, która opracowała silnik.\n:::'), archiwa), []);
  // Różnice w białych znakach nie są przeredagowaniem.
  assert.deepEqual(sprawdzWiernoscCytatow(karta(':::zapis\n> Grzesznica,   która opracowała\n silnik.\n:::'), archiwa), []);
  const zle = sprawdzWiernoscCytatow(karta(':::zapis\n> Grzesznica, która zbudowała silnik.\n:::'), archiwa);
  assert.equal(zle.length, 1);
  assert.match(zle[0], /karta-x: cytat :::zapis 1 nie jest dosłownym fragmentem/);
  // Karta bez cytatów i sceny (sprawdzane osobno, ADR 0009) nie podlegają tej bramie.
  assert.deepEqual(sprawdzWiernoscCytatow(karta('Zwykły akapit.'), archiwa), []);
  assert.deepEqual(sprawdzWiernoscCytatow({ typ: 'scena', slug: 's', body: ':::zapis\nCoś innego.\n:::' }, archiwa), []);
});
