# ADR 0002: Zero zależności npm oraz własny parser frontmattera i markdownu

- **Status:** przyjęta
- **Data:** 2026-11-25

## Kontekst

Kolejne sesje agentowe uruchamiają się w izolowanych kontenerach z ograniczonym dostępem sieciowym i krótkim czasem startu. Zewnętrzne paczki npm wprowadzałyby koszt instalacji, ryzyko niezgodności wersji oraz utrudniałyby pełną kontrolę nad specyficznymi konstrukcjami kroniki: wikilinkami `[[slug|etykieta]]`, blokami pochodzenia `{{dostawa` … `}}`, przypisami `{{zrodlo …}}`, wycinkami `:::zapis` oraz kwestiami zegarowymi Dantego `<…>`.

## Decyzja

1. Projekt wymaga wyłącznie **Node.js ≥ 22** i ma zero `dependencies` oraz zero `devDependencies` w `package.json`.
2. Testy korzystają z wbudowanego `node:test` uruchamianego przez `tools/run-tests.mjs`.
3. Sklejanie modułów ESM dla przeglądarki realizuje `tools/module-graph.mjs` z kontrolą cykli i kolizji nazw najwyższego poziomu.
4. Frontmatter (`src/lcdb/frontmatter.js`) i Markdown (`src/lcdb/markdown.js`) są własnymi, przewidywalnymi parserami ucieczkowującymi `&`, `<`, `>`, `"` przed nałożeniem jakichkolwiek znaczników, co gwarantuje zachowanie kwestii `<…>`.

## Konsekwencje

- Natychmiastowy start w każdej sesji i w CI bez `npm install`.
- Pełna odpowiedzialność za pokrycie parserów testami jednostkowymi w `test/silnik.test.js`.
