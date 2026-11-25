import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

import { zbudujDane } from '../tools/build.mjs';
import { MENU } from '../src/lcdb/render.js';
import { parsujHash, TRASY_ZNANE } from '../src/lcdb/router.js';
import { TYPY_STRON } from '../src/lcdb/registry.js';
import { LISTY, hrefDlaSlug, hrefListy } from '../src/lcdb/links.js';
import { zbudujWidok } from '../src/lcdb/main.js';

const ROOT = process.cwd();

describe('spójność routera, menu, kafelków strony głównej i renderowania widoków', () => {
  let dane;

  before(async () => {
    dane = await zbudujDane({ root: ROOT });
    globalThis.LCDB_DATA = dane;
  });

  it('każda pozycja z MENU prowadzi do znanej trasy i nie wpada w „Nie znaleziono”', () => {
    for (const poz of MENU) {
      const trasa = parsujHash(poz.href);
      assert.ok(TRASY_ZNANE.includes(trasa.nazwa), `pozycja menu ${poz.href} poza TRASY_ZNANE`);
      const wynik = zbudujWidok(trasa);
      assert.notEqual(wynik.tytul, 'Nie znaleziono', `pozycja menu ${poz.href} zwraca „Nie znaleziono”`);
      assert.doesNotMatch(wynik.html, /Nie znaleziono/, `pozycja menu ${poz.href} renderuje komunikat błędu`);
    }
  });

  it('wszystkie 8 działów niebędących epizodem ani sceną jest obecnych zarówno w MENU, jak i na kafelkach strony głównej', () => {
    const dzialyMenu = new Set(MENU.map((m) => parsujHash(m.href).nazwa));
    const htmlGlownej = zbudujWidok({ nazwa: 'glowna', param: null, query: {} }).html;
    for (const typ of TYPY_STRON) {
      const trasaListy = LISTY[typ];
      const wynikListy = zbudujWidok(parsujHash(hrefListy(typ)));
      assert.notEqual(wynikListy.tytul, 'Nie znaleziono', `lista ${trasaListy} nie ma obsługi w zbudujWidok`);
      for (const s of Object.values(dane.strony).filter((x) => x.typ === typ)) {
        assert.ok(wynikListy.html.includes(s.tytul), `lista ${trasaListy} pomija kartę "${s.tytul}"`);
      }
      if (typ !== 'epizod' && typ !== 'scena') {
        assert.ok(dzialyMenu.has(trasaListy), `dział ${trasaListy} nie występuje w MENU`);
        assert.ok(htmlGlownej.includes(`href="#/${trasaListy}"`), `kafelek #/${trasaListy} nie występuje na stronie głównej`);
      }
    }
  });

  it('każdy wewnętrzny odsyłacz #/… wygenerowany na dowolnym widoku prowadzi do obsługiwanej trasy', () => {
    const htmlWszystkich = [
      zbudujWidok({ nazwa: 'glowna', param: null, query: {} }).pelnyHtml,
      zbudujWidok({ nazwa: 'chronologia', param: null, query: {} }).pelnyHtml,
      zbudujWidok({ nazwa: 'o-bazie', param: null, query: {} }).pelnyHtml,
      ...Object.values(dane.strony).map((s) => zbudujWidok(parsujHash(hrefDlaSlug(s.slug, s.typ))).pelnyHtml),
    ].join('\n');

    const odwiedzone = new Set();
    for (const m of htmlWszystkich.matchAll(/href="(#\/[^"]+)"/g)) {
      const hash = m[1];
      if (odwiedzone.has(hash)) continue;
      odwiedzone.add(hash);
      const trasa = parsujHash(hash);
      assert.notEqual(trasa.nazwa, 'nieznana', `odsyłacz ${hash} parsuje się jako nieznana trasa`);
      const wynik = zbudujWidok(trasa);
      assert.notEqual(wynik.tytul, 'Nie znaleziono', `odsyłacz ${hash} prowadzi do „Nie znaleziono”`);
    }
  });
});
