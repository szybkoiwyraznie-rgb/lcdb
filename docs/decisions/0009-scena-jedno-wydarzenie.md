# ADR 0009: Scena to jedno wydarzenie i dosłowny dowód z zapisu (`:::zapis`)

- **Status:** przyjęta
- **Data:** 2026-11-25

## Kontekst

Streszczenie z pamięci łatwo zaciera dokładny ton rozmowy i niuanse wypowiedzi. Z kolei dzielenie scen 1:1 według technicznych numerów węzłów gry produkuje porozrywane, kilkuzdaniowe ułamki pozbawione sensu dramatycznego.

## Decyzja

1. Surowe zapisy rozgrywki leżą w niemodyfikowalnym archiwum `rozgrywka/zapisy/*.md`.
2. Karta `content/sceny/<slug>.md` obejmuje **jedno pełne wydarzenie** (wspólne miejsce, czas i rozmowę) i musi zawierać w `## Treść sceny` co najmniej jeden blok `:::zapis ... :::` z minimum 2 elementami dialogu lub narracji.
3. Funkcja `sprawdzWiernoscSceny` podczas budowania oraz skrypt `tools/sprawdz-zapis.mjs` (`npm run zapis`) sprawdzają, że każdy blok `:::zapis` jest dosłownym wycinkiem wskazanego archiwum.
4. Nagłówki techniczne `#..######` z archiwum zamieniają się wewnątrz `:::zapis` na separator `<hr>`, a każda podsekcja `###` w `## Analiza` jest powiązana z odpowiednim fragmentem treści w polu `sekcje_analizy`.

## Konsekwencje

- Czytelnik może przejść jednym kliknięciem (`↦`) od wniosku w analizie do dokładnych słów dialogu, na których ten wniosek się opiera.
