# 0001. Powłoka HTML ze spakowanym indeksem i leniwe drzewo danych `dist/data/`

Status: przyjęta (2026-11-25)

## Kontekst

*Limbus Company* jest rozbudowaną, wieloletnią opowieścią obejmującą Prolog, kilkanaście Pieśni (*Canto*), liczne Interludia (*Intervallo*), logi Anomalii i opowieści ze Światów Lustrzanych. Osadzanie pełnych ciał wszystkich scen i kart w jednym pliku `index.html` sprawiłoby, że przy setkach scen każde pierwsze otwarcie strony na telefonie lub tablecie pobierałoby kilkanaście megabajtów tekstu. Z kolei czyste archiwum jednoplikowe nadal bywa przydatne jako samodzielna kopia offline.

## Decyzja

1. Domyślny `npm run build` buduje lekki plik powłoki `dist/index.html` (z CSS, sklejonym kodem SPA oraz skompresowanym `deflate-raw` w Base64 indeksem metadanych `LCDB_B64`) oraz katalog `dist/data/`:
   - `dist/data/<slug>.json` — wyrenderowane boksy i sekcje pojedynczej karty,
   - `dist/data/teksty.json` — czysty tekst kart dociągany przy wejściu w `#/szukaj`,
   - `dist/data/co-nowego.json` — pełna historia dziennika dla `#/co-nowego`.
2. Flaga `npm run build:single` (`node tools/build.mjs --single`) buduje jednoplikowy artefakt (`LCDB_TRYB="calosc"`), który osadza wszystkie ciała wewnątrz `index.html`.
3. Serwer podglądu `tools/serve.mjs` dla nieistniejących plików w `/data/*` zwraca twardy kod `404` zamiast powłoki SPA, aby brak buildu był natychmiast czytelny.

## Konsekwencje

- Nawigacja po stronie głównej, chronologii, listach i filtrach działa bez opóźnień sieciowych, a ciężkie transkrypty scen pobierają się tylko dla otwieranych kart.
- Zarówno GitHub Pages, jak i Live Preview serwują katalog `dist/` bez żadnego backendu bazodanowego.
