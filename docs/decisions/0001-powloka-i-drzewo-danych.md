# ADR 0001: Powłoka HTML i leniwe drzewo danych (`dist/index.html` + `dist/data/`)

- **Status:** przyjęta
- **Data:** 2026-11-25

## Kontekst

Kronika *Limbus Company* będzie rosła wraz z kolejnymi Pieśniami (*Canto*) i antraktami (*Intervalla*) do setek długich kart scen i postaci. Wstrzykiwanie pełnego wyrenderowanego HTML-a wszystkich kart do jednego pliku `index.html` sprawiłoby, że czytelnik wchodzący na jedną scenę na telefonie musiałby za każdym razem pobierać megabajty tekstu z całej kroniki. Jednocześnie właściciel potrzebuje także możliwości wygenerowania archiwalnego pliku jednostkowego działającego z `file://`.

## Decyzja

1. Domyślny build (`npm run build` w `tools/build.mjs`) wytwarza:
   - lekką **powłokę** `dist/index.html` zawierającą arkusz stylów `src/lcdb/style.css`, sklejone moduły `src/lcdb/*.js` oraz skompresowany gzip+base64 **indeks** (`LCDB_B64`, rozpakowywany w przeglądarce przez `DecompressionStream`),
   - katalog `dist/data/` zawierający osobny plik `<slug>.json` dla każdej karty, `teksty.json` dla wyszukiwarki pełnotekstowej oraz `co-nowego.json` dla dziennika.
2. Routing opiera się na `location.hash` (`#/…`), dzięki czemu GitHub Pages oraz lokalny serwer `tools/serve.mjs` nie wymagają przepisywania ścieżek po stronie serwera.
3. Flaga `--single` (`npm run build:single`) wytwarza pojedynczy samowystarczalny plik `dist/index.html` z pełnym obiektem `LCDB_DATA`, działający offline bezpośrednio z `file://`.
4. Artefakt `dist/` nie jest śledzony w Gicie — powstaje deterministycznie w CI oraz w workflowie publikacji `.github/workflows/pages.yml`.

## Konsekwencje

- Listy, chronologia i graf powiązań otwierają się natychmiast z indeksu w powłoce, a ciało wybranej karty dociąga się dopiero przy wejściu.
- Serwer `tools/serve.mjs` musi zwracać jawny kod `404` dla brakujących plików w `/data/*`, zamiast odsyłać powłokę HTML.
