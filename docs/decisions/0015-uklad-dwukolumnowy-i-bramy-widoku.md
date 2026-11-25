# ADR 0015: Układ dwukolumnowy (3:1), spis boksów i bramy testowe na widoku

- **Status:** przyjęta
- **Data:** 2026-11-25

## Kontekst

Długie karty scen i postaci łączą narrację z rozbudowaną siecią powiązań. Jednocześnie praktyka pokazała, że walidacja samych obiektów JSON nie wychwytuje usterek powstających dopiero w wyrenderowanym HTML-u (martwe kotwice wewnętrzne `#…`, powtórzenie wstępu pod nagłówkiem, dublowanie interpretacji w kolumnie bocznej albo popsucie hasha przy skoku wewnątrz strony).

## Decyzja

1. Karty szczegółowe mają układ dwukolumnowy w proporcji **3:1**: lewa kolumna niesie boksy treści (`<section class="boks" id="boks-…">`), prawa kolumna (`<aside class="kolumna-boczna">`) zawiera szybki spis boksów **Na skróty** (`src/lcdb/spis-boksow.js`, gdy boksów jest co najmniej dwa), zwięzłą metrykę, dwukierunkowe **Powiązania** bez strzałek kierunkowych oraz **Motywy**.
2. Interpretacje (`rodzaj-interpretacja`) występują wyłącznie w głównej kolumnie treści i nie są dublowane na liście w `<aside>`.
3. Wewnętrzne skoki (`a[data-cel]` oraz gołe `#kotwica`) są przechwytywane w `src/lcdb/main.js` przez `scrollIntoView` bez zmiany trasy w `location.hash`.
4. `test/integralnosc.test.js` oraz `test/trasy.test.js` renderują rzeczywisty HTML wszystkich typów stron i sprawdzają kompletność celów `id="…"` dla każdej wewnętrznej kotwicy.

## Konsekwencje

- Regresje szablonów i kotwic są łapane automatycznie podczas `npm test`, zanim trafią do przeglądarki właściciela.
