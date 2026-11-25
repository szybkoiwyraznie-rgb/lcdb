# 0002. Własny parser frontmattera i markdownu, Node ≥ 22, zero zależności zewnętrznych

Status: przyjęta (2026-11-25)

## Kontekst

Nad repozytorium pracują kolejne, niezależne sesje agentów w izolowanych sandboksach. Zewnętrzne paczki z rejestru npm wydłużają start sesji, wprowadzają ryzyko rozjazdu wersji i utrudniają pełną kontrolę nad niestandardową składnią kroniki (warstwy pochodzenia `{{…}}`, przypisy `{{zrodlo …}}`, bloki `:::zapis`, wikilinki `[[slug|etykieta]]` wewnątrz tabel oraz specyficzne oznaczenia dialogów *Limbus Company*).

## Decyzja

1. Projekt wymaga wyłącznie **Node.js ≥ 22** w trybie czystego ESM (`"type": "module"`) i nie posiada **żadnych** zależności w `package.json`.
2. Własny parser `src/lcdb/frontmatter.js` obsługuje jawnie zdefiniowany, ścisły podzbiór YAML (skalary, tablice inline i blokowe, jednopoziomowe obiekty, listy obiektów oraz wielowierszowe skalary blokowe `|`), odrzucając nieznaną składnię czytelnym błędem.
3. Własny renderer `src/lcdb/markdown.js` obsługuje warstwy pochodzenia, waliduje wikilinki i źródła, a wewnątrz `:::zapis` respektuje konwencje zapisów *Limbus Company* (ukrywa komentarze węzłów `<!-- S001B -->` i bezpiecznie wyświetla mowę zegara Dantego zapisaną jako `\<…>`).

## Konsekwencje

- Testy i build uruchamiają się w ułamku sekundy tuż po sklonowaniu repozytorium.
- Żaden błąd składni we frontmatterze ani w blokach pochodzenia nie zostaje po cichu zignorowany.
